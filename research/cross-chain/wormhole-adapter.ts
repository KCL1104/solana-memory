/**
 * Wormhole Bridge Adapter for AgentMemory
 * 
 * Wormhole uses a guardian network to attest cross-chain messages.
 * Messages are published on source chain, attested by guardians,
 * then delivered to target chain.
 */

import { ethers } from 'ethers';

// Simplified types (in production, use @certusone/wormhole-sdk)
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
  sequence: string;
  emitterAddress: Address;
  vaa?: Uint8Array; // Verified Action Approval
}

interface WormholeConfig {
  coreBridge: Address;
  tokenBridge?: Address;
  guardianRpcUrls: string[];
  consistencyLevel: number; // Finality threshold (15 for Ethereum)
}

/**
 * Wormhole Memory Bridge Adapter
 * 
 * Architecture:
 * 1. Encode memory into Wormhole payload
 * 2. Publish message to Wormhole core
 * 3. Wait for guardian attestation (off-chain)
 * 4. Deliver VAA to target chain
 */
export class WormholeMemoryAdapter {
  private config: WormholeConfig;
  private provider: ethers.providers.Provider;
  private wallet?: ethers.Wallet;
  
  // Track pending bridges
  private pendingBridges: Map<string, BridgeReceipt> = new Map();
  
  // Track processed sequences (replay protection)
  private processedSequences: Set<string> = new Set();

  constructor(
    config: WormholeConfig,
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
      gasLimit?: number;
      value?: bigint;
    } = {}
  ): Promise<BridgeReceipt> {
    if (!this.wallet) {
      throw new Error('Wallet required for bridging');
    }

    console.log(`[Wormhole] Bridging memory ${memory.id} to chain ${targetChain}...`);

    // Step 1: Encode memory for transport
    const payload = this.encodeMemory(memory);
    console.log(`[Wormhole] Payload size: ${payload.length} bytes`);

    // Step 2: Publish message to Wormhole core
    const nonce = this.generateNonce();
    const coreBridge = new ethers.Contract(
      this.config.coreBridge,
      ['function publishMessage(uint32 nonce, bytes memory payload, uint8 consistencyLevel) payable returns (uint64 sequence)'],
      this.wallet
    );

    const tx = await coreBridge.publishMessage(
      nonce,
      payload,
      this.config.consistencyLevel,
      { value: options.value || 0 }
    );

    console.log(`[Wormhole] Published message, tx: ${tx.hash}`);
    const receipt = await tx.wait();

    // Step 3: Parse sequence from logs
    const sequence = this.parseSequenceFromLogs(receipt.logs);
    console.log(`[Wormhole] Sequence: ${sequence}`);

    // Step 4: Create receipt
    const bridgeReceipt: BridgeReceipt = {
      memoryId: memory.id,
      sourceChain: await this.getChainId(),
      targetChain,
      sequence,
      emitterAddress: await this.wallet.getAddress()
    };

    this.pendingBridges.set(memory.id, bridgeReceipt);

    // Step 5: Wait for and fetch VAA (off-chain)
    console.log(`[Wormhole] Waiting for guardian attestation...`);
    const vaa = await this.fetchVAA(
      bridgeReceipt.sourceChain,
      bridgeReceipt.emitterAddress,
      sequence
    );

    bridgeReceipt.vaa = vaa;
    console.log(`[Wormhole] VAA received, size: ${vaa.length} bytes`);

    return bridgeReceipt;
  }

  /**
   * Receive bridged memory on target chain
   */
  async receiveMemory(vaa: Uint8Array): Promise<Memory> {
    console.log(`[Wormhole] Receiving memory from VAA...`);

    // Step 1: Parse and verify VAA
    const parsed = await this.parseAndVerifyVAA(vaa);
    
    // Step 2: Check for replay
    const sequenceKey = `${parsed.emitterChain}-${parsed.emitterAddress}-${parsed.sequence}`;
    if (this.processedSequences.has(sequenceKey)) {
      throw new Error('Memory already processed (replay protection)');
    }

    // Step 3: Decode memory
    const memory = this.decodeMemory(parsed.payload);
    console.log(`[Wormhole] Received memory: ${memory.id}`);

    // Step 4: Mark as processed
    this.processedSequences.add(sequenceKey);

    return memory;
  }

  /**
   * Verify a bridged memory's origin
   */
  async verifyOrigin(
    memoryId: string,
    expectedSourceChain: ChainId,
    receipt: BridgeReceipt
  ): Promise<boolean> {
    return (
      receipt.memoryId === memoryId &&
      receipt.sourceChain === expectedSourceChain
    );
  }

  /**
   * Batch bridge multiple memories
   */
  async batchBridgeMemories(
    memories: Memory[],
    targetChain: ChainId
  ): Promise<BridgeReceipt> {
    // Encode multiple memories in single payload
    const batchPayload = this.encodeBatchMemories(memories);
    
    // Bridge as single message
    const dummyMemory: Memory = {
      id: `batch-${Date.now()}`,
      content: batchPayload,
      timestamp: Date.now(),
      importance: 0.5
    };

    return this.bridgeMemory(dummyMemory, targetChain);
  }

  // Private helpers

  private encodeMemory(memory: Memory): string {
    // Compact encoding: id (32) + timestamp (8) + importance (4) + content (variable)
    const encoder = new ethers.utils.AbiCoder();
    return encoder.encode(
      ['bytes32', 'uint64', 'uint32', 'bytes'],
      [
        ethers.utils.formatBytes32String(memory.id.slice(0, 32)),
        memory.timestamp,
        Math.floor(memory.importance * 10000),
        ethers.utils.toUtf8Bytes(memory.content)
      ]
    );
  }

  private decodeMemory(payload: string): Memory {
    const decoder = new ethers.utils.AbiCoder();
    const decoded = decoder.decode(
      ['bytes32', 'uint64', 'uint32', 'bytes'],
      payload
    );

    return {
      id: ethers.utils.parseBytes32String(decoded[0]),
      timestamp: decoded[1].toNumber(),
      importance: decoded[2].toNumber() / 10000,
      content: ethers.utils.toUtf8String(decoded[3])
    };
  }

  private encodeBatchMemories(memories: Memory[]): string {
    const encoder = new ethers.utils.AbiCoder();
    const encodedMemories = memories.map(m => this.encodeMemory(m));
    
    return encoder.encode(
      ['bytes[]'],
      [encodedMemories]
    );
  }

  private generateNonce(): number {
    return Math.floor(Math.random() * 2**32);
  }

  private parseSequenceFromLogs(logs: any[]): string {
    // Simplified - in production use wormhole-sdk helper
    const eventSignature = ethers.utils.id('LogMessagePublished(address,uint64,uint32,bytes)');
    const log = logs.find(l => l.topics[0] === eventSignature);
    if (!log) throw new Error('Message published event not found');
    
    const decoded = ethers.utils.defaultAbiCoder.decode(
      ['uint64'],
      log.data
    );
    return decoded[0].toString();
  }

  private async fetchVAA(
    emitterChain: ChainId,
    emitterAddress: Address,
    sequence: string
  ): Promise<Uint8Array> {
    // In production, query guardian RPC or wormhole-explorer
    // This is a mock implementation
    const mockVAA = new Uint8Array(100);
    mockVAA[0] = 1; // Version
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 2000));
    
    return mockVAA;
  }

  private async parseAndVerifyVAA(vaa: Uint8Array): Promise<{
    version: number;
    guardianSetIndex: number;
    signatures: any[];
    timestamp: number;
    nonce: number;
    emitterChain: ChainId;
    emitterAddress: Address;
    sequence: string;
    consistencyLevel: number;
    payload: string;
  }> {
    // In production, use wormhole-sdk to parse and verify signatures
    // This is a simplified mock
    return {
      version: vaa[0],
      guardianSetIndex: 0,
      signatures: [],
      timestamp: Date.now(),
      nonce: 0,
      emitterChain: 1,
      emitterAddress: '0x' + '0'.repeat(40),
      sequence: '1',
      consistencyLevel: 15,
      payload: '0x' // Would be extracted from VAA
    };
  }

  private async getChainId(): Promise<ChainId> {
    return (await this.provider.getNetwork()).chainId;
  }
}

/**
 * Demo / Test
 */
async function main() {
  console.log('=== Wormhole Bridge Adapter Demo ===\n');

  // Mock provider and wallet (in production, use real connections)
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  const wallet = ethers.Wallet.createRandom().connect(provider);

  const adapter = new WormholeMemoryAdapter(
    {
      coreBridge: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
      guardianRpcUrls: ['https://wormhole-v2-mainnet-api.certus.one'],
      consistencyLevel: 15
    },
    provider,
    wallet
  );

  // Create a memory to bridge
  const memory: Memory = {
    id: 'mem-cross-chain-001',
    content: 'Critical agent decision: approved cross-chain transfer of 1000 USDC',
    timestamp: Date.now(),
    importance: 0.95,
    metadata: { chain: 'ethereum', value: 1000 }
  };

  console.log('Memory to bridge:');
  console.log(JSON.stringify(memory, null, 2));
  console.log();

  try {
    // Bridge to another chain (e.g., Solana = chain 1)
    const receipt = await adapter.bridgeMemory(memory, 1);
    
    console.log('\nBridge Receipt:');
    console.log(JSON.stringify({
      memoryId: receipt.memoryId,
      sourceChain: receipt.sourceChain,
      targetChain: receipt.targetChain,
      sequence: receipt.sequence,
      vaaPresent: !!receipt.vaa
    }, null, 2));

    // Verify origin
    const isValid = await adapter.verifyOrigin(
      memory.id,
      receipt.sourceChain,
      receipt
    );
    console.log(`\nOrigin verified: ${isValid}`);

  } catch (err) {
    console.error('Bridge failed:', err.message);
    console.log('\nNote: This demo uses mock data. For production:');
    console.log('1. Connect to real Ethereum/Solana RPC');
    console.log('2. Fund wallet with gas tokens');
    console.log('3. Use actual Wormhole contracts');
  }

  console.log('\n=== Demo Complete ===');
}

if (require.main === module) {
  main().catch(console.error);
}

export { WormholeMemoryAdapter, main };
