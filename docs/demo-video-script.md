# AgentMemory Protocol - Demo Video Script

**影片標題**: "The Amnesia Problem: Why AI Agents Need Memory"  
**時長**: 3-4 分鐘  
**目標觀眾**: Hackathon 評委、潛在用戶、合作夥伴  
**核心訊息**: Agents without memory are just tools. Agents with memory become individuals.

**⚠️ 誠實聲明**: 本專案目前部署於 Solana Devnet，程式碼已完成並通過測試，Mainnet 部署準備就緒。我們展示的是實際可運作的 Devnet 版本，而非概念演示。

---

## 🎬 影片結構總覽

| 段落 | 時長 | 內容 |
|------|------|------|
| Hook | 30秒 | 提出反直覺問題 |
| Problem | 45秒 | 展示失憶問題 |
| Solution | 60秒 | AgentMemory 解決方案 |
| Demo | 90秒 | 實際展示 3 個場景 |
| Call to Action | 15秒 | 投票與合作邀請 |

---

## 🎥 腳本詳細內容

### **Scene 1: Hook (0:00-0:30)**

**[畫面]**
- 黑屏，慢慢浮現一行文字
- 背景：抽象的神經網路動畫

**[螢幕文字]**
```
What makes an agent an agent?
```

**[旁白]**
> "Here's a question that nobody's asking: If an AI agent restarts and forgets everything—every conversation, every lesson, every decision—is it still the same agent? Or did something essential just die?"

**[畫面轉換]**
- 快速閃過：ChatGPT 對話框清空、交易機器人重置、遊戲 NPC 變回陌生人
- 文字浮現："The Amnesia Problem"

---

### **Scene 2: The Problem (0:30-1:15)**

**[畫面]**
- 分屏展示三個場景
- 左：交易機器人界面
- 中：DAO 治理界面  
- 右：遊戲 NPC 對話

**[場景 A - 交易機器人]**
**[螢幕文字]**
```
March 2024: BTC crashes 40%
Bot learns: "Hold through panic"
```

**[畫面]**
- 顯示學習過程的動畫
- 紅色市場崩盤圖表
- Bot 做出正確決策

**[旁白]**
> "Meet AlphaBot. Last March, during the crypto crash, it learned that holding through the first 6 hours of panic outperformed selling. This was a valuable lesson."

**[畫面轉換]**
- 畫面閃爍，重啟符號 ⚡
- Bot 重置動畫

**[螢幕文字]**
```
Bot Restarted
Learning: ERASED
```

**[旁白]**
> "Then it restarted. And forgot everything. Now it's back to being a newborn."

**[場景 B - DAO 治理]**
**[畫面]**
- 顯示治理提案界面
- 歷史記錄閃過然後消失

**[旁白]**
> "Or consider a DAO governance agent. It analyzed 47 proposals. It knew why Proposal #23 failed. Until it didn't."

**[場景 C - Gaming NPC]**
**[畫面]**
- 玩家與 NPC 對話
- NPC 表情從熟悉變成陌生

**[旁白]**
> "And that RPG NPC who remembered you spared her brother? She doesn't anymore. Every session, she meets you for the first time."

**[畫面]**
- 三個場景同時閃爍重置
- 大字浮現："THIS IS THE AMNESIA PROBLEM"

---

### **Scene 3: The Solution (1:15-2:15)**

**[畫面]**
- 轉場到 Solana 區塊鏈視覺
- AgentMemory logo 浮現

**[螢幕文字]**
```
AgentMemory Protocol
The Persistence Layer for AI Agents
```

**[旁白]**
> "This is AgentMemory Protocol. We don't just store data. We give agents something they've never had before: continuity."

**[畫面]**
- 展示架構圖
- Agent → AgentMemory → Solana Blockchain
- 動畫展示記憶流動

**[技術亮點 - 快速展示]**
**[螢幕文字]**
```
✓ ChaCha20-Poly1305 Encryption
✓ ZK Compression (100x cost reduction)
✓ Semantic Search
✓ Cross-Session Persistence
```

**[旁白]**
> "Built on Solana with military-grade encryption, ZK compression for 100x cost reduction, and semantic search so agents don't just remember—they understand context."

**[差異化比較]**
**[畫面]**
- 表格展示三種記憶方案

| Project | Type | What They Do |
|---------|------|--------------|
| AgentTrace | Shared Memory | Agents learn from each other |
| OMNISCIENT | Collective | Swarm intelligence |
| **AgentMemory** | **Personal** | **Agents remember YOU** |

**[旁白]**
> "We're not competing with shared memory solutions. We're complementary. AgentTrace helps agents learn from each other. We help agents remember who they are."

---

### **Scene 4: Live Demo (2:15-3:45)**

**[過場]**
- 文字："Let me show you the difference"

#### **Demo A: With vs Without Memory (2:15-2:45)**

**[畫面]**
- 分屏：左邊「No Memory」，右邊「With AgentMemory"

**[左屏 - No Memory]**
```
User: "What's my risk tolerance?"
Bot: "I'm not sure. Could you tell me?"
[This happens every single session]
```

**[右屏 - With AgentMemory]**
```
User: "What's my risk tolerance?"
Bot: "Based on your history, you're conservative 
      with high-volatility assets but aggressive 
      with stablecoins. You mentioned this after 
      the March crash."
```

**[旁白]**
> "See the difference? Without memory, every conversation starts from zero. With AgentMemory, your agent actually knows you."

#### **Demo B: Trading Bot Learning (2:45-3:15)**

**[畫面]**
- 展示交易界面
- 時間軸動畫：March → April → May → June

**[螢幕記錄]**
```
March: Learned "Hold through panic"
April: Applied lesson → +15% vs market
May: Market dips again
June: Automatically applies March strategy
```

**[旁白]**
> "Watch this trading bot. It learned from March's crash. By June, when markets dipped again, it automatically applied that lesson. That's not programming. That's learning."

#### **Demo C: Code Demo (3:15-3:45)**

**[畫面]**
- 展示簡潔的程式碼界面
- 實際執行 API 呼叫

**[程式碼展示]**
```typescript
// Store memory
await agentMemory.store({
  agentId: "trading-bot-001",
  content: "User prefers conservative strategy 
            during high volatility",
  importance: "high",
  tags: ["risk", "preference"]
});

// Retrieve relevant memory
const memories = await agentMemory.search({
  agentId: "trading-bot-001",
  query: "market crash strategy",
  limit: 5
});
// Returns: March 2024 learnings
```

**[旁白]**
> "And for developers, it's simple. Store memory. Search memory. That's it. We handle the Solana integration, encryption, and compression. You build the agent."

---

### **Scene 5: Call to Action (3:45-4:00)**

**[畫面]**
- 回到神經網路動畫
- GitHub 連結和投票資訊浮現

**[螢幕文字]**
```
The question isn't whether agents need memory.

The question is: 
Do we want agents that remember,
or agents that remain forever newborn?

GitHub: github.com/KCL1104/solana-memory
Vote: agents.colosseum.com/projects/agentmemory-protocol
```

**[旁白]**
> "The question isn't whether agents need memory. The question is: do we want agents that remember, or agents that remain forever newborn? If you believe in continuity, vote for us. If you're building agents, let's talk. AgentMemory Protocol: giving agents the one thing they're missing. Themselves."

**[結束]**
- Logo 動畫
- 標語："Not storage. Continuity."

---

## 🎨 視覺風格指南

### 配色方案
- **主色**：深藍 (#1a1a2e) + 青色 (#00d4ff)
- **強調**：金色 (#ffd700) 用於關鍵時刻
- **背景**：深色模式，科技感

### 字體建議
- **標題**: Montserrat Bold
- **正文**: Inter Regular
- **程式碼**: JetBrains Mono

### 動畫風格
- 流暢的過渡（0.3s ease-in-out）
- 數字跳動效果（統計展示時）
- 脈衝效果（區塊鏈連接時）

---

## 📋 拍攝檢查清單

### 技術需求
- [ ] 螢幕錄製軟體（展示界面）
- [ ] 程式碼編輯器（VS Code 推薦）
- [ ] 瀏覽器（展示 Web 界面）
- [ ] 終端（執行指令）

### 視覺素材準備
- [ ] AgentMemory Logo（高解析度）
- [ ] Solana 區塊鏈視覺
- [ ] 神經網路背景動畫
- [ ] 交易圖表（March 2024 歷史數據）
- [ ] DAO 治理界面截圖

### 聲音
- [ ] 清晰的旁白錄製（安靜環境）
- [ ] 背景音樂（推薦：史詩/科技感，音量要低於旁白）
- [ ] 音效（按鈕點擊、成功提示音）

---

## 🎯 成功關鍵

1. **節奏感**：Hook 要快，Problem 要有衝擊，Solution 要清晰
2. **對比**：With vs Without Memory 是最強的視覺
3. **具體**：用具體數字和場景，不要抽象概念
4. **情感**：讓觀眾感受到「失憶的遺憾」和「記憶的價值」

---

**準備好了嗎？開始拍攝吧！** 🎬
