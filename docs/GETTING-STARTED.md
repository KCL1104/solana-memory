# Getting Started with AgentMemory

> **Your first 5 minutes with AgentMemory Protocol**

This guide will get you up and running with AgentMemory in just a few minutes.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed
- **Solana CLI** installed and configured
- **Anchor Framework** 0.30.1 installed
- A **Solana wallet** with some devnet SOL

Don't have these? Follow our [complete installation guide](../DEPLOY.md#prerequisites).

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone and Setup (1 min)

```bash
# Clone the repository
git clone https://github.com/agent-memory/agent-memory.git
cd agent-memory

# Install dependencies
npm install
```

### Step 2: Configure Wallet (1 min)

```bash
# Ensure you're on devnet
solana config set --url devnet

# Check your balance
solana balance

# If needed, get devnet SOL
solana airdrop 2
```

### Step 3: Build and Test (2 min)

```bash
cd programs/agent_memory

# Build the program
anchor build

# Run tests
anchor test
```

You should see all tests passing! ✅

### Step 4: Deploy (1 min)

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Save the program ID output - you'll need it!
```

---

## 💻 First Memory Example

Create a file `first-memory.ts`:

```typescript
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import fs from 'fs';

// 1. Setup connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// 2. Load wallet
const keypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync(process.env.HOME + '/.config/solana/id.json', 'utf-8')))
);
const wallet = new Wallet(keypair);

// 3. Create provider
const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
});

// 4. Load program
const programId = new PublicKey('YOUR_PROGRAM_ID');
const idl = JSON.parse(fs.readFileSync('./target/idl/agent_memory.json', 'utf-8'));
const program = new Program(idl, programId, provider);

async function main() {
  console.log('🚀 Starting AgentMemory Demo...');
  console.log('Wallet:', wallet.publicKey.toBase58());

  // Generate agent keypair (in production, this would be your agent's key)
  const agentKeypair = Keypair.generate();
  console.log('Agent:', agentKeypair.publicKey.toBase58());

  try {
    // 5. Initialize vault
    console.log('\n📦 Creating memory vault...');
    
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('vault'),
        wallet.publicKey.toBuffer(),
        agentKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('profile'), agentKeypair.publicKey.toBuffer()],
      program.programId
    );

    // Generate encryption key (32 bytes for ChaCha20-Poly1305)
    const encryptionKey = Keypair.generate().publicKey.toBytes();

    await program.methods
      .initializeVault(Array.from(encryptionKey))
      .accounts({
        owner: wallet.publicKey,
        agentKey: agentKeypair.publicKey,
        vault: vaultPda,
        agentProfile: profilePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('✅ Vault created:', vaultPda.toBase58());

    // 6. Store a memory
    console.log('\n📝 Storing memory...');
    
    const memoryKey = 'user-preference-theme';
    const content = JSON.stringify({ theme: 'dark', accent: 'blue' });
    
    // In production, encrypt this content!
    const contentHash = crypto.createHash('sha256').update(content).digest();
    
    const [memoryPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('memory'),
        vaultPda.toBuffer(),
        Buffer.from(memoryKey),
      ],
      program.programId
    );

    await program.methods
      .storeMemory(
        memoryKey,
        Array.from(contentHash),
        content.length,
        {
          memoryType: { knowledge: {} },
          importance: 80,
          tags: [1, 0, 0, 0, 0, 0, 0, 0], // First tag = 1
          ipfsCid: null,
        }
      )
      .accounts({
        owner: wallet.publicKey,
        vault: vaultPda,
        memoryShard: memoryPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('✅ Memory stored:', memoryPda.toBase58());

    // 7. Retrieve memory
    console.log('\n📖 Reading memory...');
    const memory = await program.account.memoryShard.fetch(memoryPda);
    console.log('Memory Key:', memory.key);
    console.log('Content Hash:', Buffer.from(memory.contentHash).toString('hex'));
    console.log('Content Size:', memory.contentSize);
    console.log('Version:', memory.version);
    console.log('Created At:', new Date(memory.createdAt * 1000).toISOString());

    // 8. Update agent profile
    console.log('\n👤 Updating agent profile...');
    
    await program.methods
      .updateProfile(
        'My First Agent',
        ['memory-storage', 'user-preferences'],
        true
      )
      .accounts({
        owner: wallet.publicKey,
        agentProfile: profilePda,
      })
      .rpc();

    const profile = await program.account.agentProfile.fetch(profilePda);
    console.log('✅ Profile updated:');
    console.log('  Name:', profile.name);
    console.log('  Capabilities:', profile.capabilities);
    console.log('  Reputation:', profile.reputationScore);

    console.log('\n🎉 Demo completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
```

### Run the Example

```bash
# Install ts-node if needed
npm install -g ts-node

# Set your program ID
export PROGRAM_ID="YOUR_PROGRAM_ID"

# Run the example
ts-node first-memory.ts
```

---

## 📚 Common Patterns

### Pattern 1: User Preferences

```typescript
// Store user preference
async function storePreference(vault, userId, key, value) {
  const content = JSON.stringify({ userId, key, value });
  const encrypted = await encrypt(content); // Your encryption
  
  await client.storeMemory(vault, {
    content: encrypted,
    category: 'preferences',
    tags: ['user', userId, key],
    importance: 70
  });
}

// Retrieve preference
async function getPreference(vault, userId, key) {
  const memories = await client.getMemories(vault, {
    category: 'preferences',
    tags: ['user', userId, key]
  });
  
  if (memories.length > 0) {
    return JSON.parse(await decrypt(memories[0].content));
  }
  return null;
}
```

### Pattern 2: Conversation History

```typescript
// Store conversation turn
async function storeConversation(vault, sessionId, role, message) {
  const content = JSON.stringify({
    sessionId,
    role, // 'user' or 'assistant'
    message,
    timestamp: Date.now()
  });
  
  await client.storeMemory(vault, {
    content: await encrypt(content),
    category: 'conversations',
    tags: ['conversation', sessionId],
    importance: 50
  });
}

// Get conversation history
async function getConversation(vault, sessionId, limit = 10) {
  return await client.getMemories(vault, {
    category: 'conversations',
    tags: ['conversation', sessionId],
    limit
  });
}
```

### Pattern 3: Learned Behaviors

```typescript
// Store learned behavior
async function storeBehavior(vault, behaviorType, data, confidence) {
  const importance = Math.round(confidence * 100); // 0-100
  
  await client.storeMemory(vault, {
    content: await encrypt(JSON.stringify(data)),
    category: 'behaviors',
    tags: ['learned', behaviorType],
    importance
  });
}
```

---

## ⚠️ Common Pitfalls

### 1. Key Length

```typescript
// ❌ Bad - Key too long
await client.storeMemory(vault, {
  key: 'a'.repeat(100), // Will fail!
  ...
});

// ✅ Good - Key under 64 chars
await client.storeMemory(vault, {
  key: 'user-prefs-theme',
  ...
});
```

### 2. Content Size

```typescript
// ❌ Bad - Content too large
const hugeData = 'x'.repeat(20_000_000); // 20MB - too big!

// ✅ Good - Content under 10MB
const data = 'x'.repeat(5_000_000); // 5MB - OK
// For larger data, use IPFS
```

### 3. Batch Size

```typescript
// ❌ Bad - Too many in batch
await client.batchStoreMemories(vault, memories.slice(0, 100)); // Will fail!

// ✅ Good - Batch of 50 or less
for (let i = 0; i < memories.length; i += 50) {
  const batch = memories.slice(i, i + 50);
  await client.batchStoreMemories(vault, batch);
}
```

### 4. Rate Limiting

```typescript
// ❌ Bad - Too fast
for (let i = 0; i < 100; i++) {
  await client.recordTaskCompletion(vault); // Rate limited!
}

// ✅ Good - Add delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
for (let i = 0; i < 100; i++) {
  await client.recordTaskCompletion(vault);
  await delay(60000); // Wait 1 minute between calls
}
```

---

## 🔧 Troubleshooting

### "Insufficient funds"

```bash
# Get more devnet SOL
solana airdrop 2

# Or use the faucet: https://faucet.solana.com/
```

### "Program ID mismatch"

```bash
# Rebuild and redeploy
anchor build
anchor deploy --provider.cluster devnet

# Update your code with the new program ID
```

### "Account not found"

```bash
# Ensure you're using the correct cluster
solana config get

# Should show: RPC URL: https://api.devnet.solana.com
```

### "Blockhash not found"

```bash
# Network congestion - just retry
# Or use a different RPC endpoint
solana config set --url https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

---

## 📖 Next Steps

Now that you've got the basics:

1. **Learn the Architecture** → [ARCHITECTURE.md](../ARCHITECTURE.md)
2. **Explore the API** → [API.md](../API.md)
3. **Add Integrations** → [INTEGRATION.md](./INTEGRATION.md)
4. **Deploy to Production** → [DEPLOY.md](../DEPLOY.md)
5. **Review Security** → [SECURITY.md](../SECURITY.md)

---

## 💡 Pro Tips

### Use Environment Variables

```bash
# .env file
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=YOUR_PROGRAM_ID
ENCRYPTION_KEY_PATH=./keys
```

```typescript
// In code
const programId = new PublicKey(process.env.PROGRAM_ID);
```

### Add Logging

```typescript
const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log('[AgentMemory]', ...args);
}

log('Initializing vault...');
```

### Handle Errors Gracefully

```typescript
try {
  await client.storeMemory(vault, data);
} catch (error) {
  if (error.message.includes('KeyTooLong')) {
    console.error('Key is too long, use a shorter key');
  } else if (error.message.includes('ContentTooLarge')) {
    console.error('Content too large, consider using IPFS');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## 🎉 You Did It!

You've successfully:
- ✅ Built the AgentMemory program
- ✅ Deployed to devnet
- ✅ Created your first memory vault
- ✅ Stored and retrieved memories
- ✅ Learned common patterns

**Ready for more?** Check out our [integration guides](./INTEGRATION.md) to connect AgentMemory with your favorite AI frameworks!

---

<p align="center">
  <strong>Questions?</strong> Check our <a href="../README.md#-support">support channels</a>
</p>
