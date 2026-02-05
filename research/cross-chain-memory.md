# Cross-Chain Memory Bridge

## Executive Summary

Cross-chain memory bridges enable agent memories to persist and be verifiable across multiple blockchain networks. This unlocks multi-chain agent operations while maintaining memory consistency and integrity.

## Use Cases

1. **Multi-Chain Agents**: Agent operates on Ethereum, Polygon, and Solana with shared memory
2. **Disaster Recovery**: Memories backed up across chains for redundancy
3. **Chain-Specific Optimization**: Store compute-heavy proofs on L2, critical data on L1
4. **Cross-Chain Identity**: Agent reputation and history portable across networks

## Bridge Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Ethereum   │◄───►│   Bridge    │◄───►│   Solana    │
│   (L1)      │     │   Layer     │     │             │
└──────┬──────┘     └─────────────┘     └──────┬──────┘
       │                                        │
       │    ┌─────────────┐                    │
       └───►│  AgentMem   │◄───────────────────┘
            │   Contract  │
            └─────────────┘
                   │
            ┌──────┴──────┐
            │   Polygon   │
            │    (L2)     │
            └─────────────┘
```

## Protocol Comparison

### Wormhole

**Architecture**: Guardian network of 19 validators attesting to cross-chain messages

```typescript
// Wormhole Message Flow
interface WormholeMessage {
  // On Source Chain
  const message = await wormholeCore.publishMessage(
    nonce,
    payload, // Encoded memory operation
    consistencyLevel // Finality threshold
  );
  
  // Guardian attestation (off-chain)
  const vaa = await getSignedVAA(
    emitterChain,
    emitterAddress,
    sequence
  );
  
  // On Target Chain
  await wormholeCore.parseAndVerifyVAA(vaa);
  await memoryContract.receiveMemory(vaa.payload);
}
```

**Properties:**
- Latency: ~15-30 seconds (finality dependent)
- Cost: ~80,000 gas on EVM chains
- Security: 2/3+ guardian majority required
- Supported chains: 20+ including Solana, Ethereum, Polygon

**Memory-Specific Integration:**

```typescript
interface WormholeMemoryBridge {
  // Source chain
  bridgeMemory(
    memoryId: string,
    targetChain: ChainId,
    compressionLevel: number
  ): Promise<BridgeReceipt>;
  
  // Target chain (relayed)
  receiveMemory(
    encodedVAA: Uint8Array,
    memoryData: MemoryPayload
  ): Promise<void>;
  
  // Verification
  verifyOrigin(
    memoryId: string,
    expectedSourceChain: ChainId
  ): Promise<boolean>;
}
```

### LayerZero

**Architecture**: Oracle + Relayer dual validation

```typescript
// LayerZero Message Flow
interface LayerZeroConfig {
  oracle: Address; // Confirms block header
  relayer: Address; // Confirms transaction proof
}

async function sendCrossChainMemory(
  dstChainId: number,
  memoryPayload: bytes
) {
  // LayerZero endpoint handles oracle + relayer coordination
  await endpoint.send{value: msg.value}(
    dstChainId,
    destinationAddress,
    memoryPayload,
    refundAddress,
    zroPaymentAddress,
    adapterParams
  );
}
```

**Properties:**
- Latency: ~2-5 minutes (oracle dependent)
- Cost: Similar to Wormhole, oracle fees vary
- Security: Dual independent verification
- Supported chains: 50+ chains

**Memory-Specific Integration:**

```typescript
interface LayerZeroMemoryBridge {
  lzEndpoint: ILayerZeroEndpoint;
  
  // Configurable delivery options
  bridgeOptions: {
    gasLimit: number;      // Execution gas on destination
    airdrop: boolean;      // Native token for execution
    zroPayment: boolean;   // Pay in ZRO token
  };
  
  // Non-blocking for batch operations
  storeFailedMemory(
    srcChainId: number,
    srcAddress: bytes,
    nonce: uint64,
    payload: bytes
  ): Promise<void>;
}
```

### Comparison Matrix

| Feature | Wormhole | LayerZero | Hyperlane | Axelar |
|---------|----------|-----------|-----------|--------|
| Latency | 15-30s | 2-5min | 1-5min | 1-5min |
| Validator Set | 19 guardians | Oracle + Relayer | Permissionless | 50+ validators |
| Message Cost | Low | Medium | Low | Medium |
| Self-Relayer | Yes | Yes | Yes | No |
| Custom Verification | Limited | Flexible | Full | Moderate |
| Token Bridge | Yes (Portal) | Yes (Stargate) | No | Yes (Satellite) |
| EVM Support | ✅ | ✅ | ✅ | ✅ |
| Solana Support | ✅ | ✅ | ✅ | ❌ |

## Memory Bridge Design

### Data Structure

```typescript
interface CrossChainMemory {
  // Core memory data
  id: string;
  content: EncryptedContent;
  metadata: MemoryMetadata;
  
  // Cross-chain tracking
  originChain: ChainId;
  bridgedTo: ChainId[];
  bridgeNonces: Map<ChainId, number>;
  
  // Verification
  originProof: MerkleProof; // Proof from source chain
  stateRoot: string;         // Source chain state at bridge time
}

interface BridgeReceipt {
  memoryId: string;
  sourceChain: ChainId;
  targetChain: ChainId;
  nonce: number;
  sequence: string;      // Wormhole sequence or LZ nonce
  timestamp: number;
  txHash: string;
}
```

### State Consistency Model

**Eventual Consistency (Recommended)**

```
Source Chain          Bridge Layer           Target Chain
    │                      │                      │
    │ Write Memory         │                      │
    ├─────────────────────►│                      │
    │                      │                      │
    │ Emit BridgeEvent     │                      │
    ├─────────────────────►│                      │
    │                      │ Attest/VAA           │
    │                      ├─────────────────────►│
    │                      │                      │ Verify
    │                      │                      │ Write
    │                      │◄─────────────────────┤
    │                      │ Confirm              │
```

**Conflict Resolution:**

```typescript
enum ConflictStrategy {
  SOURCE_WINS,     // Source chain is source of truth
  TIMESTAMP_WINS,  // Most recent update wins
  MERGE,           // Attempt to merge conflicting memories
  REJECT           // Reject conflicting update
}

interface ConflictResolver {
  resolve(
    localMemory: CrossChainMemory,
    incomingMemory: CrossChainMemory,
    strategy: ConflictStrategy
  ): CrossChainMemory;
}
```

## Implementation: Wormhole Adapter

```typescript
// wormhole-adapter.ts
import {
  ChainId,
  CONTRACTS,
  getSignedVAAWithRetry,
  parseSequenceFromLogEth
} from '@certusone/wormhole-sdk';

export class WormholeMemoryAdapter {
  private coreBridge: Contract;
  private memoryBridge: Contract;
  
  async bridgeMemory(
    memory: Memory,
    targetChain: ChainId
  ): Promise<BridgeReceipt> {
    // Encode memory for cross-chain transport
    const payload = this.encodeMemory(memory);
    
    // Publish message to Wormhole core
    const tx = await this.coreBridge.publishMessage(
      0, // nonce
      payload,
      15 // consistency level (15 confirmations)
    );
    
    const receipt = await tx.wait();
    const sequence = parseSequenceFromLogEth(
      receipt,
      CONTRACTS.MAINNET.ethereum.core
    );
    
    // Wait for guardian attestation
    const { vaaBytes } = await getSignedVAAWithRetry(
      ['https://wormhole-v2-mainnet-api.certus.one'],
      this.chainId,
      emitterAddress,
      sequence
    );
    
    return {
      memoryId: memory.id,
      sourceChain: this.chainId,
      targetChain,
      sequence,
      vaa: vaaBytes
    };
  }
  
  async receiveMemory(vaaBytes: Uint8Array): Promise<Memory> {
    // Verify VAA
    const parsed = await this.coreBridge.parseAndVerifyVAA(vaaBytes);
    
    // Decode and store
    const memory = this.decodeMemory(parsed.payload);
    await this.storeBridgedMemory(memory, parsed.emitterChainId);
    
    return memory;
  }
  
  private encodeMemory(memory: Memory): Uint8Array {
    // Compact encoding for gas efficiency
    return ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes', 'uint256', 'uint256'],
      [
        memory.id,
        memory.content,
        memory.timestamp,
        memory.importance
      ]
    );
  }
}
```

## Implementation: LayerZero Adapter

```typescript
// layerzero-adapter.ts
import { ILayerZeroEndpoint } from '@layerzerolabs/solidity-examples';

export class LayerZeroMemoryAdapter {
  private endpoint: ILayerZeroEndpoint;
  private memoryContract: Contract;
  
  async bridgeMemory(
    memory: Memory,
    dstChainId: number,
    options: BridgeOptions = {}
  ): Promise<BridgeReceipt> {
    const payload = this.encodeMemory(memory);
    
    // Calculate fees
    const [nativeFee] = await this.endpoint.estimateFees(
      dstChainId,
      this.memoryContract.address,
      payload,
      false, // pay in native
      options.adapterParams || '0x'
    );
    
    // Send message
    const tx = await this.endpoint.send{value: nativeFee}(
      dstChainId,
      this.toBytes32(this.memoryContract.address),
      payload,
      options.refundAddress || this.wallet.address,
      options.zroPaymentAddress || ethers.constants.AddressZero,
      options.adapterParams || '0x'
    );
    
    const receipt = await tx.wait();
    
    return {
      memoryId: memory.id,
      sourceChain: await this.getChainId(),
      targetChain: dstChainId,
      txHash: receipt.transactionHash,
      timestamp: Date.now()
    };
  }
  
  // Non-blocking receive handler
  async lzReceive(
    srcChainId: number,
    srcAddress: bytes,
    nonce: uint64,
    payload: bytes
  ): Promise<void> {
    try {
      const memory = this.decodeMemory(payload);
      await this.storeBridgedMemory(memory, srcChainId);
    } catch (err) {
      // Store for manual retry
      await this.storeFailedOperation(srcChainId, srcAddress, nonce, payload);
    }
  }
}
```

## Security Considerations

### 1. Replay Protection

```solidity
// Prevent same memory from being bridged multiple times
mapping(bytes32 => bool) public processedMessages;

function receiveMemory(bytes memory vaa) external {
    bytes32 messageHash = keccak256(vaa);
    require(!processedMessages[messageHash], "Already processed");
    processedMessages[messageHash] = true;
    // ... process
}
```

### 2. Source Chain Verification

```solidity
// Only accept messages from known agent contracts
mapping(uint16 => bytes32) public trustedContracts;

modifier onlyTrustedSource(uint16 sourceChain, bytes32 sourceContract) {
    require(trustedContracts[sourceChain] == sourceContract, "Untrusted source");
    _;
}
```

### 3. Rate Limiting

```solidity
// Prevent spam bridging
uint256 public constant BRIDGE_COOLDOWN = 1 hours;
mapping(bytes32 => uint256) public lastBridgeTime;

function bridgeMemory(bytes32 memoryId) external {
    require(
        block.timestamp >= lastBridgeTime[memoryId] + BRIDGE_COOLDOWN,
        "Bridge cooldown active"
    );
    lastBridgeTime[memoryId] = block.timestamp;
    // ... bridge logic
}
```

## Cost Optimization

### Batch Bridging

```typescript
async function batchBridgeMemories(
  memories: Memory[],
  targetChain: ChainId
): Promise<BridgeReceipt> {
  // Encode multiple memories in single payload
  const batchPayload = encodeBatch(memories);
  
  // Single bridge fee for N memories
  const receipt = await bridgeAdapter.bridgeBatch(batchPayload, targetChain);
  
  return receipt;
}
```

### Compression

```typescript
// Compress before bridging to reduce fees
async function compressAndBridge(
  memory: Memory,
  targetChain: ChainId
): Promise<BridgeReceipt> {
  const compressed = await compress(memory.content);
  const compressedMemory = { ...memory, content: compressed };
  
  return bridgeAdapter.bridgeMemory(compressedMemory, targetChain);
}
```

## Recommended Implementation Path

### Phase 1: Single Bridge Integration (Month 1)
- Integrate Wormhole for Ethereum ↔ Solana
- Implement basic memory bridging
- Add replay protection

### Phase 2: Multi-Bridge Support (Month 2)
- Add LayerZero for broader EVM support
- Abstract bridge interface
- Implement failover between bridges

### Phase 3: Advanced Features (Month 3)
- Batch operations
- Cross-chain query protocol
- Bridge aggregator for cost optimization

## References

- [Wormhole Documentation](https://wormhole.com/docs/)
- [LayerZero Documentation](https://layerzero.network/)
- [Hyperlane Documentation](https://docs.hyperlane.xyz/)
- [Axelar Documentation](https://docs.axelar.dev/)
