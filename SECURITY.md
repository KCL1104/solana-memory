# Security Considerations

## Encryption

AgentMemory uses **client-side encryption** with ChaCha20-Poly1305:

- Content is encrypted before reaching Solana
- Only the agent and human owner can decrypt
- Content hashes are stored on-chain for integrity verification
- Encryption keys are never stored on-chain

## Key Management

- Each vault has a unique encryption keypair
- Keys are generated client-side using `window.crypto` or Node.js `crypto`
- Private keys are stored in the human's wallet or secure storage
- Rotation: generate new keys and re-encrypt when needed

## Access Control

- Memory vaults are owned by the human (not the agent)
- Agent acts on behalf of the owner
- Access grants can be time-limited
- Revocation is immediate

## Smart Contract Security

- All accounts validated with Anchor constraints
- PDA seeds verified on every operation
- No unchecked account types
- Rate limiting at client level

## Known Limitations

1. **Front-running**: Memory metadata is public (type, size, timestamps)
2. **Key compromise**: If encryption keys leak, memory is exposed
3. **Storage costs**: Solana rent for each memory shard
4. **Max content size**: 10MB per shard (use IPFS for larger)

## Audit Checklist

- [ ] Encryption implementation reviewed
- [ ] PDA seeds canonical
- [ ] Access control logic verified
- [ ] Error handling comprehensive
- [ ] No reentrancy vulnerabilities
- [ ] No arithmetic overflows

## Reporting Issues

If you find a security issue, please report privately before disclosing publicly.
