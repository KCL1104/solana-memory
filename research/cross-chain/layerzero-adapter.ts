/**
 * LayerZero Bridge Adapter for AgentMemory
 * 
 * LayerZero uses a dual validation approach:
 * - Oracle confirms block header on source chain
 * - Relayer confirms transaction proof
 * Both must agree for message to be valid.
 */

import { ethers } from 'ethers';

// LayerZero types
type ChainId = number;
type Address = string;
type Bytes = string;

interface Memory {
  id: string;
  content: string;
  timestamp: number;
  importance: number;
  metadata?: Record<string, any>;
}

interface BridgeReceipt {
  memoryId: string;
  sourceChain: ChainId;
  targetChain: ChainId;
  nonce: number;
  txHash: string;
  blockNumber: number;
}

interface LayerZeroConfig {
  endpoint: Address;
  chainId: ChainId;
  oracle: Address;
  relayer: Address;
  defaultAdapterParams: Bytes;
}

interface AdapterParams {
  version: number;
  gasLimit: number;
  airdropAmount?: bigint;
  airdropAddress?: Address;
}

/**
 * LayerZero Memory Bridge Adapter
 * 
 * Key differences from Wormhole:
 * - Configurable trust assumptions (choose your oracle/relayer)
 * - Non-blocking execution (failed messages can be retried)
 * - Pay in native token or ZRO
 */
export class LayerZeroMemoryAdapter {
  private config: LayerZeroConfig;
  private provider: ethers.providers.Provider;
  private wallet?: ethers.Wallet;
  
  // Failed messages storage (non-blocking pattern)
  private failedMessages: Array<{
    srcChainId: ChainId;
    srcAddress: Bytes;
    nonce: number;
    payload: Bytes;
    reason: string;
  }> = [];

  constructor(
    config: LayerZeroConfig,
    provider: ethers.providers.Provider,
    wallet?: ethers.Wallet
  ) {
    this.config = config;
    this.provider = provider;
    this.wallet = wallet;
  }

  /**
   * Bridge memory to target chain
   */
  async bridgeMemory(
    memory: Memory,
    targetChain: ChainId,
    options: {
      adapterParams?: AdapterParams;
      zroPaymentAddress?: Address;
      refundAddress?: Address;
    } = {}
  ): Promise<BridgeReceipt> {
    if (!this.wallet) {
      throw new Error('Wallet required for bridging');
    }

    console.log(`[LayerZero] Bridging memory ${memory.id} to chain ${targetChain}...`);

    // Step 1: Encode memory
    const payload = this.encodeMemory(memory);
    console.log(`[LayerZero] Payload size: ${payload.length / 2 - 1} bytes`);

    // Step 2: Build adapter params
    const adapterParams = this.buildAdapterParams(options.adapterParams);

    // Step 3: Estimate fees
    const fees = await this.estimateFees(
      targetChain,
      payload,
      adapterParams,
      options.zroPaymentAddress
    );
    console.log(`[LayerZero] Estimated fees: ${ethers.utils.formatEther(fees.nativeFee)} ETH`);

    // Step 4: Send message
    const endpoint = new ethers.Contract(
      this.config.endpoint,
      [
        'function send(uint16 _dstChainId, bytes calldata _destination, bytes calldata _payload, address payable _refundAddress, address _zroPaymentAddress, bytes calldata _adapterParams) external payable',
        'function estimateFees(uint16 _dstChainId, address _userApplication, bytes calldata _payload, bool _payInZRO, bytes calldata _adapterParams) external view returns (uint nativeFee, uint zroFee)'
      ],
      this.wallet
    );

    const destination = this.padAddress(await this.wallet.getAddress());
    const refundAddress = options.refundAddress || await this.wallet.getAddress();

    const tx = await endpoint.send(
      targetChain,
      destination,
      payload,
      refundAddress,
      options.zroPaymentAddress || ethers.constants.AddressZero,
      adapterParams,
      { value: fees.nativeFee }
    );

    console.log(`[LayerZero] Sent message, tx: ${tx.hash}`);
    const receipt = await tx.wait();

    // Step 5: Extract nonce
    const nonce = await this.extractNonce(receipt);

    return {
      memoryId: memory.id,
      sourceChain: this.config.chainId,
      targetChain,
      nonce,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
  }

  /**
   * Receive memory (called by LayerZero endpoint)
   */
  async lzReceive(
    srcChainId: ChainId,
    srcAddress: Bytes,
    nonce: number,
    payload: Bytes
  ): Promise<Memory> {
    console.log(`[LayerZero] Receiving message from chain ${srcChainId}, nonce ${nonce}...`);

    try {
      // Step 1: Verify source
      if (!this.isTrustedSource(srcChainId, srcAddress)) {
        throw new Error('Untrusted source');
      }

      // Step 2: Decode memory
      const memory = this.decodeMemory(payload);
      console.log(`[LayerZero] Received memory: ${memory.id}`);

      return memory;

    } catch (err) {
      // Non-blocking: store failed message for retry
      console.error(`[LayerZero] Receive failed: ${err.message}`);
      this.storeFailedMessage(srcChainId, srcAddress, nonce, payload, err.message);
      throw err;
    }
  }

  /**
   * Retry a failed message
   */
  async retryFailedMessage(nonce: number): Promise<Memory> {
    const failed = this.failedMessages.find(m => m.nonce === nonce);
    if (!failed) {
      throw new Error('Failed message not found');
    }

    console.log(`[LayerZero] Retrying message ${nonce}...`);
    
    // Retry receive
    return this.lzReceive(
      failed.srcChainId,
      failed.srcAddress,
      failed.nonce,
      failed.payload
    );
  }

  /**
   * Batch bridge multiple memories
   */
  async batchBridgeMemories(
    memories: Memory[],
    targetChain: ChainId,
    options?: {
      adapterParams?: AdapterParams;
    }
  ): Promise<BridgeReceipt> {
    // Encode batch
    const batchPayload = this.encodeBatch(memories);
    
    const dummyMemory: Memory = {
      id: `batch-${Date.now()}`,
      content: batchPayload,
      timestamp: Date.now(),
      importance: 0.5
    };

    return this.bridgeMemory(dummyMemory, targetChain, options);
  }

  /**
   * Compress memory before bridging (gas optimization)
   */
  async compressAndBridge(
    memory: Memory,
    targetChain: ChainId
  ): Promise<BridgeReceipt> {
    // Simple compression: truncate if too long
    const maxSize = 10000;
    let compressed = memory.content;
    
    if (memory.content.length > maxSize) {
      compressed = memory.content.slice(0, maxSize) + '... [truncated]';
      console.log(`[LayerZero] Compressed memory from ${memory.content.length} to ${compressed.length} bytes`);
    }

    const compressedMemory = { ...memory, content: compressed };
    return this.bridgeMemory(compressedMemory, targetChain);
  }

  // Private helpers

  private encodeMemory(memory: Memory): string {
    const encoder = new ethers.utils.AbiCoder();
    return encoder.encode(
      ['tuple(bytes32 id, uint64 timestamp, uint32 importance, string content, bytes metadata)'],
      [{
        id: ethers.utils.formatBytes32String(memory.id.slice(0, 32)),
        timestamp: memory.timestamp,
        importance: Math.floor(memory.importance * 10000),
        content: memory.content,
        metadata: ethers.utils.defaultAbiCoder.encode(
          ['string'],
          [JSON.stringify(memory.metadata || {})]
        )
      }]
    );
  }

  private decodeMemory(payload: string): Memory {
    const decoder = new ethers.utils.AbiCoder();
    const decoded = decoder.decode(
      ['tuple(bytes32 id, uint64 timestamp, uint32 importance, string content, bytes metadata)'],
      payload
    );

    const metadata = JSON.parse(
      ethers.utils.defaultAbiCoder.decode(['string'], decoded[0].metadata)[0]
    );

    return {
      id: ethers.utils.parseBytes32String(decoded[0].id),
      timestamp: decoded[0].timestamp.toNumber(),
      importance: decoded[0].importance.toNumber() / 10000,
      content: decoded[0].content,
      metadata
    };
  }

  private encodeBatch(memories: Memory[]): string {
    const encoder = new ethers.utils.AbiCoder();
    const encoded = memories.map(m => this.encodeMemory(m));
    return encoder.encode(['bytes[]'], [encoded]);
  }

  private buildAdapterParams(params?: AdapterParams): string {
    if (!params) {
      // Default: version 1, 200k gas
      return '0x00010000000000000000000000000000000000000000000000000000000000030d40';
    }

    const version = params.version || 1;
    const gasLimit = params.gasLimit || 200000;

    if (params.airdropAmount && params.airdropAddress) {
      // Version 2 with airdrop
      return ethers.utils.defaultAbiCoder.encode(
        ['uint16', 'uint256', 'uint256', 'address'],
        [version, gasLimit, params.airdropAmount, params.airdropAddress]
      );
    }

    // Version 1
    return ethers.utils.defaultAbiCoder.encode(
      ['uint16', 'uint256'],
      [version, gasLimit]
    );
  }

  private async estimateFees(
    targetChain: ChainId,
    payload: string,
    adapterParams: string,
    zroPaymentAddress?: Address
  ): Promise<{ nativeFee: bigint; zroFee: bigint }> {
    // Mock implementation - in production query endpoint contract
    const payloadSize = payload.length / 2;
    const baseFee = ethers.utils.parseEther('0.001');
    const sizeFee = ethers.utils.parseEther((payloadSize * 0.00001).toString());
    
    return {
      nativeFee: baseFee.add(sizeFee).toBigInt(),
      zroFee: 0n
    };
  }

  private async extractNonce(receipt: any): Promise<number> {
    // In production, parse from LayerZero events
    return Date.now() % 1000000;
  }

  private padAddress(address: string): string {
    return ethers.utils.hexZeroPad(address, 32);
  }

  private isTrustedSource(srcChainId: ChainId, srcAddress: Bytes): boolean {
    // In production, check against whitelist
    return true;
  }

  private storeFailedMessage(
    srcChainId: ChainId,
    srcAddress: Bytes,
    nonce: number,
    payload: Bytes,
    reason: string
  ): void {
    this.failedMessages.push({
      srcChainId,
      srcAddress,
      nonce,
      payload,
      reason
    });
    console.log(`[LayerZero] Stored failed message ${nonce} for retry`);
  }
}

/**
 * Demo / Test
 */
async function main() {
  console.log('=== LayerZero Bridge Adapter Demo ===\n');

  // Mock setup
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  const wallet = ethers.Wallet.createRandom().connect(provider);

  const adapter = new LayerZeroMemoryAdapter(
    {
      endpoint: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
      chainId: 1, // Ethereum
      oracle: '0x0000000000000000000000000000000000000000',
      relayer: '0x0000000000000000000000000000000000000000',
      defaultAdapterParams: '0x'
    },
    provider,
    wallet
  );

  const memory: Memory = {
    id: 'mem-lz-test-001',
    content: 'Agent executed cross-chain swap via LayerZero messaging',
    timestamp: Date.now(),
    importance: 0.9,
    metadata: { protocol: 'LayerZero', version: '1.0' }
  };

  console.log('Memory to bridge:');
  console.log(JSON.stringify(memory, null, 2));
  console.log();

  try {
    // Bridge to BSC (chain 56)
    const receipt = await adapter.bridgeMemory(memory, 56, {
      adapterParams: {
        version: 1,
        gasLimit: 200000
      }
    });

    console.log('\nBridge Receipt:');
    console.log(JSON.stringify(receipt, null, 2));

    // Simulate receiving on destination
    console.log('\nSimulating receive on destination chain...');
    const received = await adapter.lzReceive(
      receipt.sourceChain,
      adapter.padAddress(wallet.address),
      receipt.nonce,
      adapter['encodeMemory'](memory) // Access private method for demo
    );

    console.log('\nReceived memory:');
    console.log(JSON.stringify(received, null, 2));

  } catch (err) {
    console.error('Bridge failed:', err.message);
    console.log('\nNote: This demo uses mock data. For production:');
    console.log('1. Connect to real LayerZero endpoint');
    console.log('2. Configure oracle and relayer addresses');
    console.log('3. Fund wallet for gas fees');
  }

  console.log('\n=== Demo Complete ===');
}

if (require.main === module) {
  main().catch(console.error);
}

export { LayerZeroMemoryAdapter, main };
