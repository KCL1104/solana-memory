# AgentMemory Protocol 技術架構與安全性分析報告

> **分析日期**: 2026-02-03  
> **分析範圍**: programs/agent_memory/src/lib.rs  
> **參考標準**: Solana 45-point Security Checklist, Anchor 0.30.1 Best Practices  

---

## 執行摘要

AgentMemory 是一個設計良好的 Solana 智能合約項目，採用 Anchor 0.30.1 框架實現 AI Agent 記憶存儲功能。整體代碼結構清晰，基本安全措施到位，但在 **P0 級別** 發現 2 個關鍵問題需要在 hackathon 前修復。

---

## 📊 問題摘要統計

| 級別 | 數量 | 嚴重度 |
|------|------|--------|
| **P0 (關鍵)** | 2 | 🔴 必須修復 |
| **P1 (重要)** | 6 | 🟡 強烈建議 |
| **P2 (加分)** | 4 | 🟢 可後續實現 |

---

## 🔴 P0 - 關鍵問題 (必須在 hackathon 前修復)

### P0-1: Protocol Pause 機制不完整

**問題描述**: 合約中定義了 `ProtocolConfig` 的 `is_paused` 字段，但 **CreateMemory**、**UpdateMemory** 等關鍵指令並未檢查此暫停狀態。

```rust
// 當前代碼 - 雖有 protocol_config 但沒有檢查 is_paused
#[derive(Accounts)]
#[instruction(key: String)]
pub struct CreateMemory<'info> {
    // ...
    #[account(
        seeds = [b"config"],
        bump = protocol_config.bump,
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,  // 僅加載但未檢查
    // ...
}
```

**風險**: 緊急情況下無法暫停協議運行，資金可能面臨風險。

**修復方案**:
```rust
impl<'info> CreateMemory<'info> {
    pub fn validate(&self) -> Result<()> {
        require!(!self.protocol_config.is_paused, AgentMemoryError::ProtocolPaused);
        Ok(())
    }
}
```

**優先級**: 🔴 Critical

---

### P0-2: Access Control 檢查缺失

**問題描述**: `CreateMemory` 等指令雖然檢查了 `has_one = owner`，但對於授權用戶 (AccessGrant) 的權限檢查不完整。合約定義了 `PermissionLevel` 但沒有在指令中使用。

**風險**: 授權機制形同虛設，只能通過 owner 訪問，無法實現真正的權限分級。

**修復方案**: 在 context 中增加權限檢查:
```rust
#[derive(Accounts)]
pub struct CreateMemory<'info> {
    // ...
    /// CHECK: Verify caller has write permission
    #[account(
        constraint = is_authorized(&vault, &owner, &permission_level) @ AgentMemoryError::UnauthorizedOwner
    )]
    pub vault: Account<'info, MemoryVault>,
    pub permission_level: Option<Account<'info, AccessGrant>>,
    // ...
}
```

**優先級**: 🔴 Critical

---

### P0-3: Memory Version History 字段遺失

**問題描述**: `ARCHITECTURE.md` 文檔描述 `MemoryShard` 有 `version_history: Vec<VersionRecord>` 字段，但實際代碼中沒有這個字段。這會導致 rollback 功能無法實現。

```rust
// 文檔說有
pub struct MemoryShard {
    // ...
    pub version_history: Vec<VersionRecord>, // Last 10 versions  ← 不存在
}

// 實際代碼只有
pub struct MemoryShard {
    pub previous_version_hash: Option<[u8; 32]>,  // 只有 hash，無法 rollback
    // ...
}
```

**修復方案**: 
選項 A: 添加 `version_history` 字段（需要重新計算空間）
選項 B: 更新文檔，移除 rollback 相關功能描述

**優先級**: 🔴 Critical

---

## 🟡 P1 - 重要問題 (強烈建議修復)

### P1-1: `init_if_needed` 使用 (StakeForStorage)

**問題描述**: `StakeForStorage` 使用了 `init_if_needed`，這是 Solana 安全檢查清單中標記的風險模式。

```rust
#[account(
    init_if_needed,  // ⚠️ Anti-pattern
    payer = owner,
    seeds = [b"vault_tokens", vault.key().as_ref()],
    bump,
    token::mint = mint,
    token::authority = vault,
)]
pub vault_token_account: Account<'info, TokenAccount>,
```

**風險**: 理論上存在重新初始化攻擊的可能性。

**修復方案**: 分離為兩個指令：
- `initialize_vault_token_account` - 僅調用一次
- `stake_for_storage` - 假設 token account 已存在

**優先級**: 🟡 High

---

### P1-2: Clock 操縱風險

**問題描述**: `LogMemoryAccess` 使用 `Clock::get()?.unix_timestamp` 作為 PDA seed，這可能受到驗證者操縱。

```rust
#[account(
    init,
    payer = accessor,
    space = 8 + AccessLog::INIT_SPACE,
    seeds = [b"log", memory_shard.key().as_ref(), accessor.key().as_ref(), 
             &Clock::get()?.unix_timestamp.to_le_bytes()[..4]],  // ⚠️ 可操縱
    bump
)]
pub access_log: Account<'info, AccessLog>,
```

**風險**: 驗證者可能操縱時間戳來控制 PDA 生成。

**修復方案**: 使用 monotonic counter 或序列號代替時間戳。

**優先級**: 🟡 Medium

---

### P1-3: Anchor.toml 配置問題

**問題描述**: `Anchor.toml` 中 `seeds = false` 配置不安全。

```toml
[features]
seeds = false  // ⚠️ 應該設為 true
```

**風險**: 關閉了 Anchor 的 seed 驗證功能。

**修復方案**: 
```toml
[features]
seeds = true  // 啟用 seed 驗證
```

**優先級**: 🟡 Medium

---

### P1-4: 批量操作未實現

**問題描述**: 定義了 `BatchCreateMemories` 等 context 但沒有實現實際的 instruction handler。

```rust
// 只有 Context 定義，沒有對應的 #[program] 方法
pub struct BatchCreateMemories<'info> { ... }
```

**影響**: 文檔說支持批量創建 50 個記憶，但實際無法調用。

**修復方案**: 
選項 A: 實現批量操作指令
選項 B: 暫時移除這些 context，避免混淆

**優先級**: 🟡 Medium

---

### P1-5: IDL 與代碼不同步

**問題描述**: `idl.json` 與實際合約代碼存在顯著差異：
- IDL 缺少 `protocol_config` 相關帳戶
- IDL 中的 `MemoryShard` 缺少 `is_deleted` 字段
- IDL 權限級別缺少 `PermissionLevel` enum

**影響**: 客戶端 SDK 可能無法正確與合約交互。

**修復方案**: 重新生成 IDL: `anchor build` 後複製正確的 IDL。

**優先級**: 🟡 Medium

---

### P1-6: 缺少溢出檢查配置

**問題描述**: `Cargo.toml` 中沒有明確啟用溢出檢查。

```toml
[profile.release]
overflow-checks = true  # 缺少這個配置
```

**風險**: Release 模式下可能發生整數溢出。

**修復方案**: 添加配置。

**優先級**: 🟡 Medium

---

## 🟢 P2 - 加分項 (可後續實現)

### P2-1: 事件系統優化

**現狀**: 定義了完整的事件類型，但部分事件未在合約中實際發射。

**建議**: 使用 `emit!` 宏確保所有狀態變更都發射對應事件。

```rust
// 確保所有操作都發射事件
emit!(MemoryCreated { ... });
```

---

### P2-2: 缺少強制性 rent 檢查

**建議**: 雖然 Anchor 自動處理 rent，但對於大額操作可以顯式驗證：

```rust
use anchor_lang::system_program;
require!(Rent::get()?.is_exempt(account.lamports(), account.data_len()), ErrorCode::NotRentExempt);
```

---

### P2-3: 前端加密實現驗證

**建議**: 雖然合約聲稱使用 ChaCha20-Poly1305 客戶端加密，但需要驗證：
- 加密實際在客戶端進行
- 私鑰永不上傳到鏈上
- 實現了適當的密鑰輪換機制

---

### P2-4: 測試覆蓋率

**現狀**: 測試覆蓋了主要功能路徑，但缺少：
- 邊界條件測試（剛好超過限制的輸入）
- 併發操作測試
- 長時間運行測試

**建議**: 在 hackathon 後擴充測試套件。

---

## 📐 架構評估

### ✅ 設計優點

1. **PDA 設計合理**: Seed 結構包含用戶特定標識符，避免 PDA 碰撞
2. **狀態分離**: MemoryVault、MemoryShard、AgentProfile 職責清晰
3. **權限分級**: PermissionLevel enum 定義清晰（雖未完全使用）
4. **客戶端加密**: 內容加密在客戶端完成，保護隱私

### ⚠️ 需要改進

1. **文檔與代碼不一致**: 部分功能描述與實現不符
2. **指令完整性**: 部分 context 缺少對應的 handler
3. **錯誤處理**: 可以添加更具體的錯誤信息

---

## 💰 Gas 優化建議

### 當前 Gas 估算

| 操作 | 預估 Compute Units |
|------|-------------------|
| Initialize Vault | ~15,000 |
| Store Memory | ~8,000 |
| Update Profile | ~6,000 |
| Grant Access | ~7,000 |

### 優化建議

1. **使用零複製（Zero-Copy）**: 對於大帳戶可以考慮使用 `AccountLoader`
2. **批量操作**: 實際實現批量指令以降低 per-item 成本
3. **關閉不用的帳戶**: `PermanentDeleteMemory` 已正確使用 `close` constraint

---

## 🏗️ 技術債務清單

### 高優先級 (Hackathon 前)

- [ ] P0-1: 修復 Protocol Pause 機制
- [ ] P0-2: 完成 Access Control 實現
- [ ] P0-3: 統一文檔與代碼（移除或實現 version_history）
- [ ] P1-5: 重新生成同步 IDL

### 中優先級 (Hackathon 後)

- [ ] P1-1: 移除 init_if_needed
- [ ] P1-2: 修復 Clock 操縱風險
- [ ] P1-4: 實現或移除批量操作

### 低優先級

- [ ] P2-4: 擴充測試套件
- [ ] 添加更詳細的文檔註釋

---

## 🔐 安全評分

| 類別 | 評分 | 說明 |
|------|------|------|
| 賬戶驗證 | 8/10 | has_one 使用正確，但缺少權限檢查 |
| PDA 安全 | 9/10 | Seed 設計合理 |
| 算術安全 | 8/10 | 部分使用 checked_add，需全面檢查 |
| 訪問控制 | 6/10 | 基礎檢查到位，但權限系統不完整 |
| 錯誤處理 | 8/10 | 錯誤碼定義完整 |
| **總體** | **7.8/10** | 良好，但需修復 P0 問題 |

---

## 📝 結論

AgentMemory Protocol 是一個設計理念良好的項目，核心架構合理，適合 hackathon 展示。但需要在 **hackathon 前** 修復以下關鍵問題：

1. **Protocol Pause 機制** - 確保緊急情況可以暫停協議
2. **Access Control 完整性** - 實現文檔承諾的權限系統
3. **文檔與代碼同步** - 避免評委發現描述與實現不符

修復這些問題後，項目將達到 production-ready 的基礎安全水平。

---

*報告完成於 2026-02-03*
