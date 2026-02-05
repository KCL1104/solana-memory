# AgentMemory Protocol 使用場景

AgentMemory Protocol 的設計適用於各種 AI Agent 應用場景，從金融交易到遊戲娛樂，都能為 Agent 提供持久、安全的記憶能力。

---

## 🚀 場景 A：交易機器人（Trading Bot）

### 問題描述

交易機器人需要不斷學習市場模式、調整策略，但傳統實現中：
- 每次重啟都會遺失學習到的模式
- 無法記住特定用戶的風險偏好
- 策略優化歷史無法追蹤

### AgentMemory 解決方案

```typescript
// 儲存交易策略學習
await memory.store({
  content: JSON.stringify({
    pattern: 'ETH breaks $3k with volume >100M',
    action: 'long with 2x leverage',
    successRate: 0.78,
    avgReturn: 0.12
  }),
  importance: 'high',
  tags: ['strategy', 'ETH', 'breakout'],
  metadata: { category: 'learned_patterns' }
});

// 記錄用戶風險偏好
await memory.store({
  content: 'User prefers conservative strategy, max drawdown 5%',
  importance: 'high',
  tags: ['risk_profile', 'user_preference'],
  metadata: { userId: 'user-123' }
});

// 搜尋適用的策略
const strategies = await memory.search({
  query: 'ETH breakout high volume',
  tags: ['strategy'],
  limit: 3
});
```

### 具體應用

| 功能 | 說明 |
|------|------|
| **策略庫** | 自動累積並分類有效的交易策略 |
| **市場學習** | 記錄市場模式與結果的關聯 |
| **風險管理** | 記住用戶的風險偏好和限制 |
| **績效追蹤** | 追蹤每個策略的歷史表現 |

### 實際案例

```typescript
// 交易決策流程
async function makeTradeDecision(marketData) {
  // 1. 檢索類似情境的歷史決策
  const similarTrades = await memory.search({
    query: `${marketData.symbol} ${marketData.pattern}`,
    tags: ['trade_history'],
    limit: 5
  });
  
  // 2. 檢索用戶風險偏好
  const riskProfile = await memory.search({
    query: 'risk preference max drawdown',
    tags: ['risk_profile']
  });
  
  // 3. 綜合決策
  const decision = analyzeWithContext(marketData, similarTrades, riskProfile);
  
  // 4. 記錄本次決策供未來學習
  await memory.store({
    content: JSON.stringify({ marketData, decision, timestamp: Date.now() }),
    importance: 'high',
    tags: ['trade_history', marketData.symbol]
  });
  
  return decision;
}
```

---

## 🏛️ 場景 B：DAO 治理 Agent

### 問題描述

DAO 治理參與複雜且資訊量大，Agent 需要：
- 追蹤大量提案的細節和投票歷史
- 學習社區的偏好和價值觀
- 記住過去投票的理由和結果

### AgentMemory 解決方案

```typescript
// 記錄提案分析
await memory.store({
  content: JSON.stringify({
    proposalId: 'PIP-45',
    summary: 'Increase treasury diversification to 30% stablecoins',
    analysis: 'Aligns with risk management goals, community generally favors stability',
    recommendation: 'FOR'
  }),
  importance: 'high',
  tags: ['proposal', 'treasury', 'PIP-45'],
  metadata: { proposalId: 'PIP-45', category: 'analysis' }
});

// 記錄投票結果學習
await memory.store({
  content: 'Community rejected proposal PIP-42 due to lack of implementation details, 
            preferring proposals with clear execution plans',
  importance: 'medium',
  tags: ['learning', 'voting_pattern'],
  metadata: { lesson: 'execution_details_matter' }
});
```

### 治理記憶類型

```typescript
// 提案追蹤
interface ProposalMemory {
  proposalId: string;
  title: string;
  category: string;
  analysis: string;
  voteDecision: 'FOR' | 'AGAINST' | 'ABSTAIN';
  reasoning: string;
  outcome?: 'PASSED' | 'REJECTED';
}

// 社區學習
interface CommunityLearning {
  pattern: string;
  evidence: string[];
  confidence: number;
  lastUpdated: number;
}
```

### 治理 Agent 工作流程

```
新提案發布
    ↓
檢索類似歷史提案 → 分析投票模式
    ↓
檢索社區價值觀 → 評估提案契合度
    ↓
生成投票建議 → 記錄決策理由
    ↓
追蹤投票結果 → 更新學習模型
```

---

## 🎮 場景 C：遊戲 NPC（AI 角色）

### 問題描述

傳統遊戲 NPC 行為呆板，無法建立真正的情感連結：
- 每次對話都從頭開始
- 不記得玩家的選擇和承諾
- 世界狀態無法持久保存

### AgentMemory 解決方案

```typescript
// 記錄玩家互動
await memory.store({
  content: 'Player chose to spare the wolf pack in the northern forest, 
            promised to help find their lost pup',
  importance: 'high',
  tags: ['quest', 'player_choice', 'northern_forest'],
  metadata: { 
    playerId: 'player-789',
    questId: 'wolf_quest_01',
    choiceType: 'moral_decision'
  }
});

// 記錄世界狀態
await memory.store({
  content: JSON.stringify({
    location: 'northern_forest',
    state: 'wolf_pack_friendly',
    consequences: ['wolves_guard_forest', 'hunters_avoid_area']
  }),
  importance: 'medium',
  tags: ['world_state', 'northern_forest'],
  metadata: { lastUpdate: Date.now() }
});
```

### NPC 記憶系統

| 記憶類型 | 說明 | 範例 |
|---------|------|------|
| **玩家互動** | 對話歷史和選擇 | 「玩家上次選擇幫助而不是攻擊」 |
| **任務進度** | 任務狀態和里程碑 | 「任務 3 完成 70%，等待交付物品」 |
| **世界狀態** | 環境變化和事件 | 「村莊已被重建，鐵匠鋪升級完成」 |
| **關係追蹤** | NPC 與玩家的關係值 | 「玩家與此 NPC 關係：友好（+15）」 |

### 沉浸式對話範例

```typescript
// NPC 生成回應前檢索記憶
async function generateNPCResponse(player, message) {
  // 檢索與此玩家的歷史
  const playerHistory = await memory.search({
    query: message,
    tags: ['player_interaction'],
    metadata: { playerId: player.id },
    limit: 5
  });
  
  // 檢索相關世界狀態
  const worldContext = await memory.search({
    query: message,
    tags: ['world_state'],
    limit: 3
  });
  
  // 檢索活躍的任務
  const activeQuests = await memory.search({
    query: 'active quest progress',
    tags: ['quest'],
    metadata: { playerId: player.id, status: 'active' }
  });
  
  // 生成有上下文的回應
  const context = { playerHistory, worldContext, activeQuests };
  return llm.generateResponse(message, context);
}
```

### 跨遊戲會話連續性

```typescript
// 玩家下次登入時恢復完整上下文
async function loadPlayerContext(playerId) {
  const memories = await memory.search({
    query: '*',  // 檢索所有相關記憶
    metadata: { playerId },
    limit: 100
  });
  
  return {
    relationshipHistory: memories.filter(m => m.tags.includes('relationship')),
    questProgress: memories.filter(m => m.tags.includes('quest')),
    worldImpact: memories.filter(m => m.tags.includes('world_state')),
    choices: memories.filter(m => m.tags.includes('player_choice'))
  };
}
```

---

## 👤 場景 D：個人助理

### 問題描述

現有 AI 助理缺乏真正的個人化：
- 每次對話都是新的開始
- 不記得用戶的習慣和偏好
- 無法跨裝置同步上下文

### AgentMemory 解決方案

```typescript
// 學習用戶偏好
await memory.store({
  content: 'User prefers meeting notifications 15 minutes before, 
            dislikes last-minute schedule changes',
  importance: 'high',
  tags: ['preference', 'calendar', 'notification'],
  metadata: { category: 'behavioral_pattern' }
});

// 記錄對話上下文
await memory.store({
  content: 'User mentioned upcoming product launch next Tuesday, 
            expressed stress about the deadline',
  importance: 'medium',
  tags: ['conversation', 'work', 'stress_indicator'],
  metadata: { 
    date: Date.now(),
    followUp: 'check_launch_status'
  }
});

// 跨裝置同步
await memory.store({
  content: JSON.stringify({
    device: 'mobile',
    action: 'set_reminder',
    details: 'Buy groceries on way home',
    location: 'near_supermarket'
  }),
  importance: 'medium',
  tags: ['reminder', 'location_based'],
  metadata: { syncTo: ['desktop', 'smart_home'] }
});
```

### 個人助理記憶類型

```typescript
// 用戶檔案
interface UserProfile {
  preferences: {
    communicationStyle: string;
    notificationTiming: number;
    workHours: { start: string; end: string };
  };
  habits: string[];
  importantDates: Record<string, string>;
  relationships: Record<string, string>;
}

// 對話連續性
interface ConversationMemory {
  sessionId: string;
  topics: string[];
  unresolved: string[];
  followUps: string[];
  emotionalContext: string;
}
```

### 主動協助範例

```typescript
// 基於記憶的主動建議
async function proactiveAssistance(userId) {
  // 檢索最近的對話和未完成的任務
  const recentContext = await memory.search({
    query: 'follow up pending task',
    tags: ['conversation', 'task'],
    limit: 10
  });
  
  // 檢索用戶的日程模式
  const schedulePattern = await memory.search({
    query: 'usual wake up work start time',
    tags: ['preference', 'schedule'],
    limit: 5
  });
  
  // 生成主動建議
  const suggestions = [];
  
  // 如果明天有重要會議且用戶通常晚睡
  if (hasImportantMeetingTomorrow(recentContext) && 
      isLateSleeper(schedulePattern)) {
    suggestions.push({
      type: 'sleep_reminder',
      message: '明天早上 9 點有重要會議，建議提早休息'
    });
  }
  
  // 如果有待追蹤的項目
  const pendingItems = recentContext.filter(m => 
    m.metadata.followUp && m.metadata.followUpDate < Date.now()
  );
  
  pendingItems.forEach(item => {
    suggestions.push({
      type: 'follow_up',
      message: `記得跟進：${item.content}`
    });
  });
  
  return suggestions;
}
```

### 跨裝置連續性

```typescript
// 裝置切換時恢復上下文
class PersonalAssistant {
  async switchDevice(newDevice) {
    // 檢索最近的互動
    const recentMemories = await memory.search({
      query: 'recent conversation task',
      limit: 20,
      timeRange: { 
        start: Date.now() - 24 * 60 * 60 * 1000, // 24 小時內
        end: Date.now() 
      }
    });
    
    // 在新裝置上恢復上下文
    return {
      activeConversations: this.extractConversations(recentMemories),
      pendingTasks: this.extractTasks(recentMemories),
      currentContext: this.summarizeContext(recentMemories)
    };
  }
}
```

---

## 🔮 更多潛在場景

### 醫療健康助理
- 追蹤症狀歷史和用藥記錄
- 記住醫生的建議和警告
- 個人化健康提醒

### 教育輔導 Agent
- 記錄學生的學習進度
- 追蹤薄弱知識點
- 個人化教學策略

### 客戶服務 Agent
- 記住客戶的歷史問題
- 追蹤解決方案和滿意度
- 建立長期客戶關係

### 創作助理
- 記住創作者的風格偏好
- 追蹤專案進度和版本
- 儲存靈感和參考資料

---

## 📊 場景比較

| 場景 | 記憶重點 | 檢索頻率 | 隱私要求 |
|------|---------|---------|---------|
| 交易機器人 | 策略、風險 | 高（每次決策）| 極高 |
| DAO 治理 | 提案、投票 | 中（每次提案）| 高 |
| 遊戲 NPC | 互動、世界 | 極高（每次對話）| 中 |
| 個人助理 | 偏好、對話 | 極高（持續）| 極高 |

---

## 🚀 開始使用

無論哪個場景，整合 AgentMemory 都只需要幾行程式碼：

```typescript
import { AgentMemory } from 'agentmemory';

const memory = new AgentMemory({ agentId: 'your-agent' });

// 儲存
await memory.store({ content: '...', importance: 'high' });

// 檢索
const memories = await memory.search({ query: '...' });
```

詳細整合指南請參考 [快速開始指南](./quickstart.md)。
