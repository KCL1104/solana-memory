# 🎭 AgentMemory Demo Script

## 📖 Scenario: Alice's AI Assistant

**Alice** is a busy marketing manager who uses an AI assistant to help with her daily tasks. Over time, the assistant learns about her preferences, habits, and important life events through AgentMemory.

---

## ⏱️ Demo Timeline (2-3 Minutes)

### **Scene 1: First Meeting (30 sec)**

**Setup:** Alice introduces herself and mentions her preferences.

**Action:**
```json
{
  "action": "create_memory",
  "agent": "alice_assistant",
  "content": "Alice is a marketing manager at TechCorp. She prefers coffee over tea, especially iced lattes. She has a cat named Whiskers.",
  "tags": ["preference", "personal", "intro"]
}
```

**Expected Result:**
- Memory created with ID: `mem_alice_001`
- Stored in vector database with embeddings
- Tagged with: preference, personal, intro

**Narration:**
> 中文：「Alice 第一次見到她的 AI 助手，分享了她的基本資料和喜好。」
> English: "Alice meets her AI assistant for the first time and shares her basic info and preferences."

---

### **Scene 2: Daily Learning (45 sec)**

**Setup:** Alice has a conversation about her upcoming product launch.

**Action:**
```json
{
  "action": "create_memory",
  "agent": "alice_assistant",
  "content": "Alice is stressed about the Q4 product launch. The deadline is November 15th. She prefers working early mornings (6-9 AM) when she's most productive.",
  "tags": ["work", "stress", "schedule"],
  "priority": "high"
}
```

**Then search for similar memories:**
```json
{
  "action": "search_memory",
  "agent": "alice_assistant",
  "query": "When does Alice work best?",
  "limit": 3
}
```

**Expected Result:**
- Memory created: `mem_alice_002`
- Search returns relevant results with similarity scores
- Shows: "early mornings (6-9 AM) when she's most productive"

**Narration:**
> 中文：「助手記錄了 Alice 的工作壓力和最佳工作時間。當我們搜尋她的工作習慣時，系統立即找到了相關記憶。」
> English: "The assistant remembers Alice's work stress and optimal work hours. When we search for her work habits, the system instantly finds relevant memories."

---

### **Scene 3: Contextual Recall (45 sec)**

**Setup:** Weeks later, Alice mentions Whiskers again.

**Action:**
```json
{
  "action": "create_memory",
  "agent": "alice_assistant",
  "content": "Whiskers has a vet appointment on Friday. Alice is worried because he hasn't been eating well.",
  "tags": ["pet", "health", "whiskers"]
}
```

**Then retrieve all pet-related memories:**
```json
{
  "action": "search_memory",
  "agent": "alice_assistant",
  "query": "pet cat Whiskers",
  "tags": ["pet"],
  "limit": 5
}
```

**Expected Result:**
- Returns both memories about Whiskers
- Shows timeline of Alice's interactions with pet info
- Demonstrates memory consolidation

**Narration:**
> 中文：「幾週後，Alice 提到 Whiskers 身體不適。助手立即回憶起 Whiskers 是她的貓，還記得她喜歡冰拿鐵 —— 展現了跨主題的記憶關聯。」
> English: "Weeks later, Alice mentions Whiskers isn't feeling well. The assistant immediately recalls Whiskers is her cat, and even remembers she likes iced lattes — showing cross-topic memory associations."

---

### **Scene 4: Smart Suggestions (30 sec)**

**Setup:** Alice asks for morning meeting suggestions.

**Action:**
```json
{
  "action": "generate_context",
  "agent": "alice_assistant",
  "query": "suggest morning schedule for product launch preparation",
  "include_memories": true
}
```

**Expected Result:**
```json
{
  "suggestions": [
    {
      "time": "6:00-7:00 AM",
      "activity": "Deep work on launch materials",
      "reason": "Alice is most productive 6-9 AM"
    },
    {
      "time": "7:00-7:30 AM",
      "activity": "Coffee break - iced latte",
      "reason": "Alice prefers iced lattes"
    }
  ],
  "context_used": ["mem_alice_001", "mem_alice_002"]
}
```

**Narration:**
> 中文：「基於累積的記憶，助手能給出個人化建議 —— 在 Alice 最高效的時段安排重要工作，並貼心提醒她喜歡的冰拿鐵。」
> English: "Based on accumulated memories, the assistant provides personalized suggestions — scheduling important work during Alice's peak hours, and thoughtfully reminding her of her favorite iced latte."

---

## 🎬 Presentation Flow

### Opening (15 sec)
**中文：**
> 「想像一下，如果你的 AI 助手不會每次都忘記你是誰...今天我要展示 AgentMemory —— 讓 AI 真正記住你的開源記憶系統。」

**English:**
> "Imagine if your AI assistant didn't forget who you are every time... Today I'm showing AgentMemory —— an open-source memory system that lets AI truly remember you."

### Demo Body (2 min)
1. Show memory creation with tags and priorities
2. Demonstrate semantic search across memories
3. Show contextual recall across time
4. Display personalized AI suggestions

### Closing (15 sec)
**中文：**
> 「AgentMemory 讓 AI 從工具變成夥伴。開源、靈活、為開發者設計。謝謝！」

**English:**
> "AgentMemory transforms AI from a tool into a partner. Open source, flexible, developer-friendly. Thank you!"

---

## 📝 Speaker Notes

### Technical Highlights to Mention:
1. **Vector embeddings** enable semantic search (not just keyword matching)
2. **Tag system** allows filtering and organization
3. **Priority levels** help manage memory importance
4. **Agent isolation** keeps different users' memories separate
5. **REST API** makes integration simple

### Backup Plans:
- If search is slow: "The vector database is warming up"
- If no results: "Let me show a different query that works better"
- Keep `demo-data.json` pre-loaded as fallback

---

## 🎯 Key Takeaways for Judges

| Feature | Demo Moment | Value |
|---------|-------------|-------|
| Persistent Memory | Scene 1 → Scene 3 | AI remembers across sessions |
| Semantic Search | Scene 2 | Natural language queries work |
| Context Awareness | Scene 4 | Personalized AI responses |
| Developer Friendly | Code examples | Easy REST API integration |

---

*Demo prepared for Hackathon 2026 | AgentMemory Project*
