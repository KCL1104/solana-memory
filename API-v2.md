# AgentMemory v0.2.0 API 參考

## 擴展功能 API 指南

---

## 1. 版本控制 API

### 1.1 回滾記憶

```typescript
// 回滾到特定版本
const tx = await program.methods
  .rollbackMemory(new BN(3))  // 回滾到版本 3
  .accounts({
    owner: wallet.publicKey,
    memoryShard: memoryPda,
  })
  .rpc();
```

### 1.2 永久刪除

```typescript
// 先軟刪除
await program.methods
  .deleteMemory()
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
    memoryShard: memoryPda,
  })
  .rpc();

// 再永久刪除（關閉帳戶並返還租金）
await program.methods
  .permanentDeleteMemory()
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
    memoryShard: memoryPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 1.3 查詢版本歷史

```typescript
// 獲取記憶帳戶數據
const memory = await program.account.memoryShard.fetch(memoryPda);

// 訪問版本歷史
console.log("Current version:", memory.version);
console.log("Version history:", memory.versionHistory);

// 每個版本記錄包含
memory.versionHistory.forEach(record => {
  console.log({
    version: record.version,
    contentHash: record.contentHash,
    contentSize: record.contentSize,
    metadata: record.metadata,
    createdAt: record.createdAt,
  });
});
```

---

## 2. 批量操作 API

### 2.1 批量創建記憶

```typescript
const memories = [
  {
    key: "memory1",
    contentHash: Buffer.from(hash1),
    contentSize: 1024,
    metadata: {
      memoryType: { knowledge: {} },
      importance: 80,
      tags: [1, 0, 0, 0, 0, 0, 0, 0],
      ipfsCid: null,
    },
  },
  {
    key: "memory2",
    contentHash: Buffer.from(hash2),
    contentSize: 2048,
    metadata: {
      memoryType: { learning: {} },
      importance: 90,
      tags: [2, 0, 0, 0, 0, 0, 0, 0],
      ipfsCid: null,
    },
  },
  // 最多 50 個
];

const tx = await program.methods
  .batchCreateMemories(memories)
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
  })
  .rpc();
```

### 2.2 批量刪除記憶

```typescript
const memoryKeys = ["memory1", "memory2", "memory3"]; // 最多 50 個

const tx = await program.methods
  .batchDeleteMemories(memoryKeys)
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
  })
  .rpc();
```

### 2.3 批量更新標籤

```typescript
const tagUpdates = [
  {
    memoryKey: "memory1",
    newTags: [1, 2, 0, 0, 0, 0, 0, 0],
  },
  {
    memoryKey: "memory2",
    newTags: [3, 0, 0, 0, 0, 0, 0, 0],
  },
];

const tx = await program.methods
  .batchUpdateTags(tagUpdates)
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
  })
  .rpc();
```

---

## 3. 共享群組 API

### 3.1 創建共享群組

```typescript
// 計算群組 PDA
const [groupPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("group"),
    vaultPda.toBuffer(),
    Buffer.from("My Research Group"),
  ],
  program.programId
);

const tx = await program.methods
  .createSharingGroup(
    "My Research Group",
    "Group for sharing research memories"
  )
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
    sharingGroup: groupPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 3.2 添加群組成員

```typescript
// 權限級別：0=None, 1=Read, 2=Write, 3=Admin
const memberKey = new PublicKey("...");
const permissionLevel = { read: {} }; // 或 { write: {} }, { admin: {} }

const tx = await program.methods
  .addGroupMember(memberKey, permissionLevel)
  .accounts({
    owner: wallet.publicKey,
    sharingGroup: groupPda,
  })
  .rpc();
```

### 3.3 移除群組成員

```typescript
const tx = await program.methods
  .removeGroupMember(memberKey)
  .accounts({
    owner: wallet.publicKey,
    sharingGroup: groupPda,
  })
  .rpc();
```

### 3.4 查詢群組信息

```typescript
const group = await program.account.sharingGroup.fetch(groupPda);

console.log({
  name: group.name,
  description: group.description,
  creator: group.creator.toBase58(),
  memberCount: group.members.length,
  members: group.members.map(m => ({
    address: m.member.toBase58(),
    permission: m.permission, // 0, 1, 2, or 3
    joinedAt: m.joinedAt,
  })),
});
```

---

## 4. 訪問日誌 API

### 4.1 記錄訪問

```typescript
const [logPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("log"),
    memoryPda.toBuffer(),
    wallet.publicKey.toBuffer(),
  ],
  program.programId
);

// 訪問類型：0=Read, 1=Write, 2=Delete, 3=Share
const accessType = { read: {} };

const tx = await program.methods
  .logMemoryAccess(accessType)
  .accounts({
    accessor: wallet.publicKey,
    memoryShard: memoryPda,
    accessLog: logPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

## 5. 經濟模型 API

### 5.1 質押代幣

```typescript
import { getAssociatedTokenAddress } from "@solana/spl-token";

// 獲取或創建 ATA
const ownerAta = await getAssociatedTokenAddress(
  tokenMint,          // 質押代幣 mint
  wallet.publicKey
);

const vaultAta = await getAssociatedTokenAddress(
  tokenMint,
  vaultPda,
  true                // allowOwnerOffCurve
);

const tx = await program.methods
  .stakeForStorage(new BN(1000000))  // 質押 1 代幣（6位小數）
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
    ownerTokenAccount: ownerAta,
    vaultTokenAccount: vaultAta,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

### 5.2 解除質押

```typescript
const tx = await program.methods
  .unstakeTokens(new BN(500000))  // 解除質押 0.5 代幣
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
    vaultTokenAccount: vaultAta,
    ownerTokenAccount: ownerAta,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

### 5.3 領取獎勵

```typescript
const tx = await program.methods
  .claimRewards()
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
  })
  .rpc();

// 查詢獎勵積分
const vault = await program.account.memoryVault.fetch(vaultPda);
console.log("Reward points:", vault.rewardPoints);
console.log("Staked amount:", vault.stakedAmount.toString());
```

### 5.4 計算存儲費用

```typescript
// 存儲費用計算（鏈下）
function calculateStorageFee(sizeInBytes: number): number {
  // 0.001 SOL per KB
  return (sizeInBytes * 0.001) / 1000;
}

// 所需質押計算
function calculateRequiredStake(totalSize: number): number {
  // 0.01 SOL per MB
  return (totalSize * 0.01) / 1000000;
}

// 獲取當前存儲使用
const vault = await program.account.memoryVault.fetch(vaultPda);
const currentFee = calculateStorageFee(vault.totalMemorySize.toNumber());
const requiredStake = calculateRequiredStake(vault.totalMemorySize.toNumber());
```

---

## 6. 治理 API

### 6.1 初始化協議配置（僅限部署時）

```typescript
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

const tx = await program.methods
  .initializeProtocolConfig({
    storageFeePerByte: new BN(1),        // 每字節費用
    minStakePerByte: new BN(10),         // 每字節最低質押
    maxBatchSize: 50,                     // 最大批量大小
    maxMemorySize: 10000000,              // 最大記憶大小（10MB）
    maxKeyLength: 64,                     // 最大鍵長度
    rewardRate: 100,                      // 獎勵率（基點）
  })
  .accounts({
    admin: wallet.publicKey,
    protocolConfig: configPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 6.2 更新協議參數（僅限管理員）

```typescript
const tx = await program.methods
  .updateProtocolConfig({
    storageFeePerByte: new BN(2),         // 更新存儲費率
    minStakePerByte: null,                // 不變
    maxBatchSize: null,
    maxMemorySize: null,
    rewardRate: new BN(150),              // 更新獎勵率
  })
  .accounts({
    admin: wallet.publicKey,
    protocolConfig: configPda,
  })
  .rpc();
```

### 6.3 暫停/恢復協議

```typescript
// 暫停協議
await program.methods
  .setProtocolPause(true)
  .accounts({
    admin: wallet.publicKey,
    protocolConfig: configPda,
  })
  .rpc();

// 恢復協議
await program.methods
  .setProtocolPause(false)
  .accounts({
    admin: wallet.publicKey,
    protocolConfig: configPda,
  })
  .rpc();
```

### 6.4 轉移管理權

```typescript
const newAdmin = new PublicKey("...");

const tx = await program.methods
  .transferAdmin(newAdmin)
  .accounts({
    admin: wallet.publicKey,
    protocolConfig: configPda,
  })
  .rpc();
```

### 6.5 查詢協議配置

```typescript
const config = await program.account.protocolConfig.fetch(configPda);

console.log({
  admin: config.admin.toBase58(),
  storageFeePerByte: config.storageFeePerByte.toString(),
  minStakePerByte: config.minStakePerByte.toString(),
  maxBatchSize: config.maxBatchSize,
  maxMemorySize: config.maxMemorySize,
  maxKeyLength: config.maxKeyLength,
  rewardRate: config.rewardRate,
  isPaused: config.isPaused,
  createdAt: config.createdAt,
  updatedAt: config.updatedAt,
});
```

---

## 7. 更新後的訪問控制 API

### 7.1 授予訪問權限（新參數）

```typescript
// 權限級別
const permissionLevel = { read: {} };      // 只讀
// 或 { write: {} }                       // 讀寫
// 或 { admin: {} }                       // 管理

const expiration = new BN(
  Date.now() / 1000 + 30 * 24 * 60 * 60    // 30天後過期
);

const tx = await program.methods
  .grantAccess(permissionLevel, expiration)
  .accounts({
    owner: wallet.publicKey,
    vault: vaultPda,
    grantee: granteePublicKey,
    accessGrant: accessGrantPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 7.2 查詢訪問權限

```typescript
const accessGrant = await program.account.accessGrant.fetch(accessGrantPda);

console.log({
  vault: accessGrant.vault.toBase58(),
  grantee: accessGrant.grantee.toBase58(),
  permissionLevel: accessGrant.permissionLevel, // 0, 1, 2, or 3
  grantedAt: accessGrant.grantedAt,
  expiresAt: accessGrant.expiresAt,
  isActive: accessGrant.isActive,
  revokedAt: accessGrant.revokedAt,
});
```

---

## 8. 事件監聽示例

### 8.1 監聽所有事件

```typescript
// 設置事件監聽器
program.addEventListener("memoryCreated", (event) => {
  console.log("Memory created:", event);
});

program.addEventListener("memoryRolledBack", (event) => {
  console.log("Memory rolled back:", {
    fromVersion: event.fromVersion,
    toVersion: event.toVersion,
    newVersion: event.newVersion,
  });
});

program.addEventListener("batchMemoryCreated", (event) => {
  console.log("Batch created:", {
    count: event.count,
    totalSize: event.totalSize.toString(),
    storageFee: event.storageFee.toString(),
  });
});

program.addEventListener("sharingGroupCreated", (event) => {
  console.log("Group created:", {
    name: event.name,
    creator: event.creator.toBase58(),
  });
});

program.addEventListener("tokensStaked", (event) => {
  console.log("Tokens staked:", {
    amount: event.amount.toString(),
    totalStaked: event.totalStaked.toString(),
  });
});

program.addEventListener("protocolConfigUpdated", (event) => {
  console.log("Config updated:", {
    fields: event.updatedFields,
    admin: event.admin.toBase58(),
  });
});
```

---

## 9. 最佳實踐

### 9.1 批量操作使用建議

```typescript
// 推薦：適當分批
const BATCH_SIZE = 50;
const memories = [...]; // 大量記憶

for (let i = 0; i < memories.length; i += BATCH_SIZE) {
  const batch = memories.slice(i, i + BATCH_SIZE);
  await program.methods.batchCreateMemories(batch)...;
}
```

### 9.2 版本管理策略

```typescript
// 定期清理舊版本
async function cleanupOldVersions(memoryPda: PublicKey) {
  const memory = await program.account.memoryShard.fetch(memoryPda);
  
  if (memory.version > 10) {
    // 創建新版本會自動淘汰最舊版本
    // 最多保留 10 個版本
  }
}
```

### 9.3 經濟管理

```typescript
// 監控質押水平
async function monitorStake(vaultPda: PublicKey) {
  const vault = await program.account.memoryVault.fetch(vaultPda);
  
  const requiredStake = calculateRequiredStake(
    vault.totalMemorySize.toNumber()
  );
  
  if (vault.stakedAmount.toNumber() < requiredStake * 1.1) {
    // 質押低於110%要求，需要補充
    console.warn("Stake level low, consider adding more");
  }
}
```

---

## 10. 錯誤處理

```typescript
import { AnchorError } from "@coral-xyz/anchor";

try {
  await program.methods.someInstruction()...rpc();
} catch (err) {
  if (err instanceof AnchorError) {
    switch (err.error.errorCode.code) {
      case "TaskRateLimitExceeded":
        console.error("Too many tasks, please wait");
        break;
      case "BatchTooLarge":
        console.error("Reduce batch size to max 50");
        break;
      case "InsufficientStake":
        console.error("Not enough staked tokens");
        break;
      case "ProtocolPaused":
        console.error("Protocol is currently paused");
        break;
      default:
        console.error("Error:", err.error.errorMessage);
    }
  }
}
```

---

**注意：** 所有示例使用 Anchor 框架 TypeScript SDK。確保安裝正確版本：

```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```
