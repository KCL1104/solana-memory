# AgentMemory Protocol 快速開始指南

歡迎使用 AgentMemory Protocol！本指南將帶你在 5 分鐘內完成首次記憶儲存與檢索。

---

## 📦 安裝

### 使用 npm

```bash
npm install agentmemory
```

### 使用 yarn

```bash
yarn add agentmemory
```

### 使用 pnpm

```bash
pnpm add agentmemory
```

---

## 🔧 環境準備

### 1. 取得 Solana RPC 端點

**開發環境（推薦）**：
```bash
# 免費使用 Solana Devnet
RPC_URL=https://api.devnet.solana.com
```

**生產環境**：
```bash
# 推薦使用 Helius 或 QuickNode
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### 2. 設定加密金鑰

```bash
# 生成安全的加密金鑰
openssl rand -hex 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

將金鑰添加到環境變數：

```bash
# .env 文件
AGENT_MEMORY_KEY=your-generated-32-byte-hex-key
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 3. 準備 Solana 錢包

```typescript
// 使用現有錢包或生成新錢包
import { Keypair } from '@solana/web3.js';

// 從私鑰載入（推薦：使用環境變數）
const secretKey = Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY));
const wallet = Keypair.fromSecretKey(secretKey);

// 或在開發環境生成新錢包
const wallet = Keypair.generate();
console.log('錢包地址:', wallet.publicKey.toString());
```

**獲取 Devnet SOL**：
```bash
# 使用 Solana CLI
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet

# 或使用網頁水龍頭
# https://faucet.solana.com/
```

---

## 🚀 基礎使用

### 初始化 AgentMemory

```typescript
import { AgentMemory } from 'agentmemory';
import { Keypair } from '@solana/web3.js';

// 初始化（最簡配置）
const memory = new AgentMemory({
  agentId: 'my-first-agent',  // 唯一識別你的 Agent
  wallet: wallet,             // Solana 錢包
  encryptionKey: process.env.AGENT_MEMORY_KEY,
  network: 'devnet'           // 或 'mainnet'
});

// 等待初始化完成
await memory.initialize();
console.log('AgentMemory 已就緒！');
```

### 儲存第一筆記憶

```typescript
// 儲存簡單記憶
const memoryId = await memory.store({
  content: 'User prefers dark mode interface',
  importance: 'medium',  // 'low' | 'medium' | 'high'
  tags: ['preference', 'ui', 'settings']
});

console.log('記憶已儲存，ID:', memoryId);
// 輸出: 記憶已儲存，ID: mem_abc123xyz
```

### 儲存結構化記憶

```typescript
// 儲存更複雜的結構化資料
await memory.store({
  content: JSON.stringify({
    event: 'user_onboarding',
    preferences: {
      theme: 'dark',
      language: 'zh-TW',
      notifications: true
    },
    source: 'web_signup'
  }),
  importance: 'high',
  tags: ['onboarding', 'user_profile', 'preferences'],
  metadata: {
    category: 'user_data',
    userId: 'user_12345',
    sessionId: 'sess_67890'
  }
});
```

### 搜尋記憶

```typescript
// 基於語義的搜尋
const results = await memory.search({
  query: 'user interface preferences',  // 自然語言查詢
  limit: 5,                              // 最多返回 5 條
  threshold: 0.7                         // 相似度閾值 (0-1)
});

console.log(`找到 ${results.length} 條相關記憶:`);
results.forEach((memory, index) => {
  console.log(`${index + 1}. ${memory.content} (相似度: ${memory.score})`);
});
```

### 按標籤過濾

```typescript
// 只搜尋特定標籤的記憶
const preferences = await memory.search({
  query: 'theme and display settings',
  tags: ['preference'],      // 必須包含這些標籤
  limit: 10
});
```

---

## 📚 完整範例

### 個人助理 Agent

```typescript
import { AgentMemory } from 'agentmemory';
import { Keypair } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

class PersonalAssistant {
  private memory: AgentMemory;
  
  constructor(agentId: string, wallet: Keypair) {
    this.memory = new AgentMemory({
      agentId,
      wallet,
      encryptionKey: process.env.AGENT_MEMORY_KEY!,
      network: 'devnet'
    });
  }
  
  async initialize() {
    await this.memory.initialize();
    console.log('✅ 個人助理已啟動');
  }
  
  // 記錄對話
  async rememberConversation(userMessage: string, assistantResponse: string) {
    await this.memory.store({
      content: `User: ${userMessage}\nAssistant: ${assistantResponse}`,
      importance: 'medium',
      tags: ['conversation', 'dialogue'],
      metadata: { timestamp: Date.now() }
    });
  }
  
  // 記錄用戶偏好
  async learnPreference(preference: string, category: string) {
    await this.memory.store({
      content: preference,
      importance: 'high',
      tags: ['preference', category],
      metadata: { learnedAt: Date.now() }
    });
    console.log(`📝 已學習偏好: ${preference}`);
  }
  
  // 獲取相關上下文
  async getContext(query: string): Promise<string[]> {
    const memories = await this.memory.search({
      query,
      limit: 3
    });
    return memories.map(m => m.content);
  }
  
  // 生成回應（模擬）
  async respond(userMessage: string): Promise<string> {
    // 1. 檢索相關記憶
    const context = await this.getContext(userMessage);
    
    // 2. 基於上下文生成回應（這裡簡化處理）
    let response: string;
    
    if (context.length > 0) {
      response = `根據我對您的了解：${context.join(', ')}。關於您的問題「${userMessage}」...`;
    } else {
      response = `關於「${userMessage}」，我會記住您的這個問題以便未來更好地協助您。`;
    }
    
    // 3. 記錄這次對話
    await this.rememberConversation(userMessage, response);
    
    return response;
  }
}

// 使用範例
async function main() {
  // 載入錢包
  const wallet = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY!))
  );
  
  // 創建助理
  const assistant = new PersonalAssistant('my-assistant-v1', wallet);
  await assistant.initialize();
  
  // 學習偏好
  await assistant.learnPreference('User wakes up at 7 AM', 'schedule');
  await assistant.learnPreference('User prefers concise answers', 'communication');
  
  // 對話
  console.log('\n🗣️ 對話開始:\n');
  
  const response1 = await assistant.respond('What time should I wake up tomorrow?');
  console.log('Assistant:', response1);
  
  const response2 = await assistant.respond('Can you keep your answers brief?');
  console.log('Assistant:', response2);
}

main().catch(console.error);
```

---

## 🛠️ 進階功能

### 批量操作

```typescript
// 批量儲存（更高效）
const memories = [
  { content: 'Memory 1', importance: 'low', tags: ['batch'] },
  { content: 'Memory 2', importance: 'medium', tags: ['batch'] },
  { content: 'Memory 3', importance: 'high', tags: ['batch'] }
];

const ids = await memory.storeBatch(memories);
console.log('批量儲存完成:', ids);
```

### 更新記憶

```typescript
// 更新現有記憶
await memory.update(memoryId, {
  importance: 'high',
  tags: ['updated', 'priority']
});
```

### 刪除記憶

```typescript
// 刪除單條記憶
await memory.delete(memoryId);

// 按標籤刪除（謹慎使用！）
await memory.deleteByTag('temporary');

// 清空所有記憶（極度謹慎！）
await memory.clear();
```

### 時間範圍搜尋

```typescript
// 搜尋特定時間段的記憶
const lastWeekMemories = await memory.search({
  query: 'project discussion',
  timeRange: {
    start: Date.now() - 7 * 24 * 60 * 60 * 1000,  // 7 天前
    end: Date.now()
  }
});
```

---

## 🔌 ElizaOS 整合

如果你使用 ElizaOS 框架，整合更加簡單：

### 安裝插件

```bash
npm install @agentmemory/eliza-plugin
```

### 配置 Character

```typescript
// character.ts
export const character: Character = {
  name: 'MyAgent',
  plugins: ['@agentmemory/eliza-plugin'],
  
  settings: {
    agentMemory: {
      enabled: true,
      agentId: 'eliza-agent-001',
      encryptionKey: process.env.AGENT_MEMORY_KEY,
      network: 'devnet',
      rpcUrl: process.env.SOLANA_RPC_URL
    }
  },
  
  // 其他配置...
};
```

### 自動記憶

ElizaOS 插件會自動：
- ✅ 儲存所有對話歷史
- ✅ 在回應前檢索相關記憶
- ✅ 管理記憶的重要性評分
- ✅ 處理長期記憶和短期記憶

---

## 🐛 故障排除

### 常見問題

#### 1. "Insufficient funds"

```
錯誤: Insufficient funds for transaction
```

**解決方案：**
```bash
# Devnet 環境 - 領取免費 SOL
solana airdrop 2 YOUR_ADDRESS --url devnet

# 確認餘額
solana balance YOUR_ADDRESS --url devnet
```

#### 2. "Invalid encryption key"

```
錯誤: Encryption key must be 32 bytes
```

**解決方案：**
```bash
# 生成正確格式的金鑰
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3. "RPC connection failed"

```
錯誤: Failed to connect to RPC
```

**解決方案：**
```typescript
// 使用備用 RPC
const memory = new AgentMemory({
  // ...
  rpcUrl: 'https://api.devnet.solana.com',  // 官方節點
  // 或
  rpcUrl: 'https://devnet.helius-rpc.com/?api-key=YOUR_KEY',  // Helius
  commitment: 'confirmed'
});
```

#### 4. "Memory not found"

```
錯誤: No memories found for query
```

**解決方案：**
```typescript
// 降低相似度閾值
const results = await memory.search({
  query: 'your query',
  threshold: 0.5  // 從 0.7 降低到 0.5
});

// 或移除標籤限制
const results = await memory.search({
  query: 'your query'
  // 不指定 tags
});
```

---

## 📊 監控和調試

### 啟用日誌

```typescript
const memory = new AgentMemory({
  agentId: 'my-agent',
  wallet,
  encryptionKey: process.env.AGENT_MEMORY_KEY!,
  logLevel: 'debug'  // 'error' | 'warn' | 'info' | 'debug'
});
```

### 獲取統計資訊

```typescript
// 獲取記憶統計
const stats = await memory.getStats();
console.log(stats);
// {
//   totalMemories: 150,
//   storageUsed: '2.5 MB',
//   lastUpdate: 1704067200000,
//   network: 'devnet'
// }
```

---

## 🚀 部署到生產環境

### 檢查清單

- [ ] 使用 Mainnet RPC（Helius/QuickNode）
- [ ] 確保錢包有足夠 SOL（建議 0.1+ SOL）
- [ ] 設置安全的加密金鑰（使用 KMS 或環境變數）
- [ ] 啟用錯誤監控（Sentry 等）
- [ ] 配置日誌記錄
- [ ] 測試備份和恢復流程

### 生產環境配置

```typescript
const memory = new AgentMemory({
  agentId: process.env.AGENT_ID!,
  wallet: loadWalletFromKMS(),  // 從 KMS 載入
  encryptionKey: process.env.AGENT_MEMORY_KEY!,
  network: 'mainnet',
  rpcUrl: process.env.HELIUS_RPC_URL!,  // 生產級 RPC
  commitment: 'finalized',  // 更高確認級別
  logLevel: 'warn'  // 減少日誌噪音
});
```

---

## 📖 下一步

- [核心功能詳情](./features.md)
- [使用場景](./use-cases.md)
- [產品介紹](./product-introduction.md)
- [API 參考文件](https://docs.agentmemory.io/api)

---

## 💬 獲取幫助

- **Discord**: [加入社群](https://discord.gg/agentmemory)
- **GitHub Issues**: [提交問題](https://github.com/your-org/agentmemory/issues)
- **Twitter**: [@AgentMemory](https://twitter.com/agentmemory)

---

*準備好讓你的 Agent 擁有永久記憶了嗎？開始構建吧！ 🚀*
