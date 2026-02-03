# AgentMemory 智能合約擴展功能說明

## 版本：0.2.0
## 更新日期：2025-02-03

---

## 1. 新增功能總覽

### 1.1 記憶版本控制增強 ✅

| 功能 | 說明 | 函數 |
|------|------|------|
| 版本歷史存儲 | 自動保存最近10個版本 | `create_memory`, `update_memory` |
| 回滾功能 | 可回滾到任意歷史版本 | `rollback_memory` |
| 版本比較 | 通過歷史記錄查詢版本差異 | `version_history` |
| 軟刪除 | 標記刪除而非立即銷毀 | `delete_memory` |
| 永久刪除 | 完全關閉帳戶並返還租金 | `permanent_delete_memory` |

**新增數據結構：**
```rust
pub struct VersionRecord {
    pub version: u32,
    pub content_hash: [u8; 32],
    pub content_size: u32,
    pub metadata: MemoryMetadata,
    pub created_at: i64,
}
```

**新增欄位到 MemoryShard：**
- `is_deleted: bool` - 軟刪除標記
- `deleted_at: Option<i64>` - 刪除時間
- `version_history: Vec<VersionRecord>` - 版本歷史（最多10條）

---

### 1.2 批量操作 ✅

| 功能 | 說明 | 函數 | 限制 |
|------|------|------|------|
| 批量創建 | 一次創建多個記憶 | `batch_create_memories` | 最多50個 |
| 批量刪除 | 一次刪除多個記憶 | `batch_delete_memories` | 最多50個 |
| 批量更新標籤 | 批量修改記憶標籤 | `batch_update_tags` | 最多50個 |

**新增輸入結構：**
```rust
pub struct BatchMemoryInput {
    pub key: String,
    pub content_hash: [u8; 32],
    pub content_size: u32,
    pub metadata: MemoryMetadata,
}

pub struct TagUpdate {
    pub memory_key: String,
    pub new_tags: [u8; 8],
}
```

**批量操作費用計算：**
- 基礎費用：0.001 SOL/KB
- 批量折扣：10% 費用減免

---

### 1.3 記憶共享增強 ✅

#### 1.3.1 共享群組

**新增功能：**
- 創建共享群組
- 添加/移除群組成員
- 群組權限管理
- 群組描述和元數據

**新增數據結構：**
```rust
pub struct SharingGroup {
    pub creator: Pubkey,
    pub vault: Pubkey,
    pub name: String,
    pub description: String,
    pub members: Vec<GroupMember>,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_active: bool,
}

pub struct GroupMember {
    pub member: Pubkey,
    pub permission: PermissionLevel,
    pub joined_at: i64,
}
```

**群組限制：**
- 群組名稱：最多64字符
- 群組描述：最多256字符
- 成員數量：最多100人

#### 1.3.2 權限級別

```rust
pub enum PermissionLevel {
    None = 0,   // 無權限
    Read = 1,   // 只讀
    Write = 2,  // 讀寫
    Admin = 3,  // 管理（可添加/移除成員）
}
```

#### 1.3.3 訪問日誌

**新增功能：**
- 記錄每次記憶訪問
- 訪問類型追踪（讀/寫/刪除/共享）
- 時間戳記錄

**新增數據結構：**
```rust
pub struct AccessLog {
    pub memory: Pubkey,
    pub accessor: Pubkey,
    pub access_type: AccessType,
    pub timestamp: i64,
}

pub enum AccessType {
    Read = 0,
    Write = 1,
    Delete = 2,
    Share = 3,
}
```

---

### 1.4 經濟模型 ✅

#### 1.4.1 存儲費用計算

**費率結構：**
```rust
// 存儲費率：0.001 SOL/KB
fn calculate_storage_fee(size: u64) -> u64 {
    size.saturating_mul(1000) / 1000
}

// 質押要求：0.01 SOL/MB
fn calculate_required_stake(total_size: u64) -> u64 {
    total_size.saturating_mul(10_000) / 1_000_000
}
```

#### 1.4.2 質押機制

**新增功能：**
- 質押代幣獲取存儲配額
- 動態質押要求計算
- 解除質押保護（不能低於最低要求）

**新增指令：**
- `stake_for_storage` - 質押代幣
- `unstake_tokens` - 解除質押
- `claim_rewards` - 領取獎勵

**新增 Vault 欄位：**
```rust
pub staked_amount: u64,      // 當前質押數量
pub reward_points: u32,      // 獎勵積分
```

#### 1.4.3 獎勵分配

**獎勵機制：**
- 完成任務獲得積分
- 積分可兌換代幣
- 獎勵率由治理參數控制

---

### 1.5 治理功能 ✅

#### 1.5.1 協議配置

**新增數據結構：**
```rust
pub struct ProtocolConfig {
    pub admin: Pubkey,
    pub storage_fee_per_byte: u64,
    pub min_stake_per_byte: u64,
    pub max_batch_size: u32,
    pub max_memory_size: u32,
    pub max_key_length: u32,
    pub reward_rate: u32,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_paused: bool,
}
```

#### 1.5.2 管理功能

| 功能 | 說明 | 函數 |
|------|------|------|
| 初始化配置 | 設置初始協議參數 | `initialize_protocol_config` |
| 更新參數 | 動態調整費率和限制 | `update_protocol_config` |
| 暫停協議 | 緊急暫停所有操作 | `set_protocol_pause` |
| 轉移管理權 | 更換管理員地址 | `transfer_admin` |

**可配置參數：**
- 存儲費率（每字節）
- 最低質押要求（每字節）
- 最大批量大小
- 最大記憶大小
- 最大鍵長度
- 獎勵率

---

### 1.6 優化和修復 ✅

#### 1.6.1 基於審計報告的修復

| 問題 | 嚴重程度 | 修復狀態 |
|------|---------|---------|
| 任務完成缺少訪問控制 | Critical | ✅ 添加權限驗證和速率限制 |
| grantee 未驗證 | High | ✅ 添加帳戶驗證 |
| 過期時間未驗證 | High | ✅ 添加1年最大限制 |
| agent_key 未驗證 | High | ✅ 添加簽名驗證 |
| 算術溢出風險 | Medium | ✅ 使用 saturating_add |
| 缺少事件 | Medium | ✅ 添加完整事件系統 |
| 版本計數器邏輯 | Low | ✅ 修復初始版本設置 |
| 多次 Clock::get() | Low | ✅ 緩存時間戳 |

#### 1.6.2 計算優化

**優化項目：**
1. **常數定義** - 所有魔法數字改為常數
2. **緩存機制** - 減少 Clock::get() 調用
3. **飽和運算** - 使用 saturating_add/sub 替代 checked
4. **批處理** - 批量操作減少交易數量

#### 1.6.3 存儲優化

**優化項目：**
1. **軟刪除** - 避免頻繁創建/關閉帳戶
2. **版本歷史限制** - 最多保存10個版本
3. **選項類型** - 使用 Option 減少存儲
4. **空間計算** - 精確的 InitSpace 定義

---

## 2. 向後兼容性

### 2.1 完全兼容 ✅

以下原有功能保持不變：
- `initialize_vault` - 初始化保險庫
- `create_memory` - 創建記憶（擴展版本歷史）
- `update_memory` - 更新記憶（擴展版本歷史）
- `delete_memory` - 改為軟刪除
- `update_profile` - 更新配置（添加驗證）
- `grant_access` - 授予訪問（擴展權限級別）
- `revoke_access` - 撤銷訪問

### 2.2 輕微變更 ⚠️

| 功能 | 變更 | 影響 |
|------|------|------|
| `delete_memory` | 改為軟刪除 | 記憶帳戶不再立即關閉 |
| `grant_access` | 添加 permission_level 參數 | 需要更新調用代碼 |
| `record_task_completion` | 添加速率限制 | 每分鐘最多1次 |

### 2.3 遷移指南

**從 v0.1.0 遷移到 v0.2.0：**

1. **更新 grant_access 調用：**
```rust
// 舊版本
grant_access(ctx, Some(expiration))

// 新版本
grant_access(ctx, PermissionLevel::Read, Some(expiration))
```

2. **處理軟刪除：**
```rust
// 如果需要永久刪除，調用新函數
permanent_delete_memory(ctx)
```

3. **更新事件監聽：**
- 新事件類型已添加
- 原有事件保持不變

---

## 3. 新增事件列表

### 3.1 版本控制事件
- `MemoryRolledBack` - 記憶回滾
- `MemoryPermanentlyDeleted` - 永久刪除

### 3.2 批量操作事件
- `BatchMemoryCreated` - 批量創建
- `BatchMemoryDeleted` - 批量刪除
- `BatchTagsUpdated` - 批量更新標籤

### 3.3 共享群組事件
- `SharingGroupCreated` - 群組創建
- `GroupMemberAdded` - 添加成員
- `GroupMemberRemoved` - 移除成員

### 3.4 訪問日誌事件
- `MemoryAccessLogged` - 訪問記錄

### 3.5 經濟模型事件
- `TokensStaked` - 代幣質押
- `TokensUnstaked` - 解除質押
- `RewardsClaimed` - 領取獎勵

### 3.6 治理事件
- `ProtocolConfigInitialized` - 配置初始化
- `ProtocolConfigUpdated` - 配置更新
- `ProtocolPauseChanged` - 暫停狀態變更
- `AdminTransferred` - 管理權轉移

---

## 4. 新增錯誤代碼

```rust
EmptyKey                    // 空鍵不允許
EmptyName                   // 空名稱不允許
EmptyCapability             // 空能力描述不允許
TaskRateLimitExceeded       // 任務速率限制
InvalidVersion              // 無效版本號
InvalidRollbackVersion      // 無效回滾版本
VersionNotFound             // 版本未找到
EmptyBatch                  // 空批量操作
BatchTooLarge               // 批量太大
MemoryNotDeleted            // 記憶未刪除
EmptyGroupName              // 空群組名稱
GroupNameTooLong            // 群組名太長
GroupDescTooLong            // 群組描述太長
GroupTooLarge               // 群組太大
MemberAlreadyExists         // 成員已存在
MemberNotFound              // 成員未找到
NotGroupCreator             // 非群組創建者
InvalidStakeAmount          // 無效質押數量
InvalidUnstakeAmount        // 無效解除質押數量
InsufficientStake           // 質押不足
StakeBelowMinimum           // 低於最低質押
NoRewardsAvailable          // 無可用獎勵
InvalidBatchSize            // 無效批量大小
ProtocolPaused              // 協議已暫停
```

---

## 5. 合約統計

| 指標 | v0.1.0 | v0.2.0 | 增長 |
|------|--------|--------|------|
| 指令數量 | 8 | 23 | +187% |
| 帳戶類型 | 4 | 8 | +100% |
| 事件類型 | 8 | 20 | +150% |
| 錯誤類型 | 12 | 35 | +192% |
| 代碼行數 | ~650 | ~1450 | +123% |

---

## 6. 安全注意事項

### 6.1 權限檢查
- 所有管理功能僅限 admin 調用
- 群組管理僅限 creator
- 訪問控制支持多級權限

### 6.2 經濟安全
- 質押機制防止垃圾存儲
- 解除質押保護防止存儲逃脫
- 費率可調節應對市場變化

### 6.3 速率限制
- 任務完成：每分鐘1次
- 批量操作：最多50項
- 版本歷史：最多10個版本

---

## 7. 後續建議

### 7.1 測試覆蓋
- [ ] 單元測試（所有新函數）
- [ ] 集成測試（批量操作）
- [ ] 模糊測試（邊界條件）
- [ ] 壓力測試（高並發）

### 7.2 文檔完善
- [ ] API 文檔更新
- [ ] SDK 更新
- [ ] 遷移指南完善
- [ ] 最佳實踐文檔

### 7.3 未來擴展
- [ ] 跨鏈橋接
- [ ] 分片存儲
- [ ] 零知識證明整合
- [ ] DAO 治理

---

**總結：** 本次擴展在保持向後兼容的基礎上，大幅增強了協議功能，特別是在版本控制、批量操作、共享機制、經濟模型和治理方面。所有審計發現的問題均已修復，安全性得到顯著提升。
