# 🚀 AgentMemory Demo Quick Guide

快速開始 AgentMemory Hackathon 演示。

---

## 📋 環境準備

### 1. 系統需求

- Node.js 18+ (建議使用 20 LTS)
- PostgreSQL 14+ (搭配 pgvector 擴展)
- 至少 2GB 可用 RAM
- 網路連接（用於下載 embedding 模型）

### 2. 快速啟動

```bash
# 1. 進入專案目錄
cd /home/node/.openclaw/workspace/agent-memory

# 2. 安裝依賴
npm install

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env 檔案，設定資料庫連線

# 4. 初始化資料庫
npm run db:migrate
npm run db:seed

# 5. 啟動開發伺服器
npm run dev

# 服務將在 http://localhost:3000 啟動
```

### 3. 預載演示資料

```bash
# 使用提供的演示資料
npm run demo:load

# 或手動載入
curl -X POST http://localhost:3000/api/demo/load \
  -H "Content-Type: application/json" \
  -d @demo/demo-data.json
```

---

## 🎬 演示步驟

### 步驟 1: 確認系統狀態

```bash
# 檢查 API 狀態
curl http://localhost:3000/api/health

# 預期回應
{"status": "ok", "version": "1.0.0", "vector_db": "connected"}
```

### 步驟 2: 建立 Alice 的助手

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "id": "alice_assistant",
    "name": "Alice Personal Assistant",
    "metadata": {
      "user_name": "Alice Chen",
      "user_role": "Marketing Manager"
    }
  }'
```

### 步驟 3: 創建記憶（場景 1）

```bash
curl -X POST http://localhost:3000/api/agents/alice_assistant/memories \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Alice is a marketing manager at TechCorp. She prefers coffee over tea, especially iced lattes. She has a cat named Whiskers.",
    "tags": ["preference", "personal", "intro"]
  }'
```

### 步驟 4: 搜尋記憶（場景 2-3）

```bash
# 語意搜尋
curl "http://localhost:3000/api/agents/alice_assistant/memories/search?q=What%20does%20Alice%20like%20to%20drink"

# 帶標籤過濾的搜尋
curl "http://localhost:3000/api/agents/alice_assistant/memories/search?q=work&tags=schedule"
```

### 步驟 5: 取得所有記憶

```bash
# 列出所有記憶
curl http://localhost:3000/api/agents/alice_assistant/memories

# 按標籤過濾
curl "http://localhost:3000/api/agents/alice_assistant/memories?tags=pet,health"
```

---

## 🎯 演示腳本速查

| 時間 | 動作 | API 端點 | 預期結果 |
|------|------|----------|----------|
| 0:00 | 開場介紹 | - | 引起興趣 |
| 0:15 | 建立 Agent | `POST /api/agents` | alice_assistant 創建 |
| 0:30 | 創建記憶 | `POST /api/agents/{id}/memories` | 記憶 ID 返回 |
| 1:00 | 搜尋記憶 | `GET /api/agents/{id}/memories/search` | 相關結果列表 |
| 1:30 | 展示關聯 | 多輪搜尋 | 跨主題記憶 |
| 2:00 | 個人化建議 | 整合展示 | 智能推薦 |
| 2:30 | 結語 | - | 強調價值 |

---

## 🆘 常見問題

### Q1: 資料庫連線失敗

**錯誤訊息：**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解決方案：**
```bash
# 檢查 PostgreSQL 服務
sudo systemctl status postgresql

# 啟動服務
sudo systemctl start postgresql

# 確認 pgvector 擴展已安裝
psql -d agentmemory -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Q2: Embedding 模型下載失敗

**錯誤訊息：**
```
Error: Failed to fetch embedding model
```

**解決方案：**
```bash
# 手動下載模型
npm run model:download

# 或使用離線模式（演示模式）
DEMO_MODE=true npm run dev
```

### Q3: 搜尋結果為空

**可能原因：**
1. 記憶尚未建立 - 確認 `POST` 請求成功
2. 資料庫未初始化 - 執行 `npm run db:migrate`
3. embedding 未生成 - 檢查日誌中的錯誤

**快速修復：**
```bash
# 重新載入演示資料
npm run demo:reset && npm run demo:load
```

### Q4: API 回應緩慢

**優化建議：**
- 第一次搜尋會載入模型，較慢屬正常
- 可預先執行一次 warm-up：
```bash
curl "http://localhost:3000/api/agents/alice_assistant/memories/search?q=test"
```

### Q5: 演示資料衝突

**如果已有同名 agent：**
```bash
# 刪除現有演示資料
curl -X DELETE http://localhost:3000/api/agents/alice_assistant

# 或使用重置命令
npm run demo:clean
```

---

## 🔧 故障排除

### 檢查日誌

```bash
# 開發模式日誌
npm run dev 2>&1 | tee dev.log

# 檢查特定錯誤
grep "ERROR" dev.log
```

### 資料庫檢查

```bash
# 連接資料庫
psql -d agentmemory

# 常用查詢
\dt                          # 列出表格
SELECT COUNT(*) FROM memories;  # 記憶數量
SELECT * FROM agents;        # 查看 agents
```

### 快速重置

```bash
# 完全重置（謹慎使用！）
npm run db:reset

# 重新初始化
npm run db:migrate
npm run demo:load
```

---

## 📊 演示檢查清單

演示前確認：

- [ ] 伺服器已啟動 (`curl http://localhost:3000/api/health`)
- [ ] 演示資料已載入 (`npm run demo:load`)
- [ ] 資料庫連線正常
- [ ] 瀏覽器/Postman 準備就緒
- [ ] 備份計劃就緒（預載資料的 JSON 檔案）

---

## 🎭 演示技巧

1. **開場**: 先問觀眾「你們的 AI 助手記得你嗎？」
2. **互動**: 邀請觀眾提供一個「記憶」現場測試
3. **對比**: 展示傳統關鍵字搜尋 vs 語意搜尋的差異
4. **備案**: 如果 live demo 失敗，展示預錄的截圖或影片

---

## 📁 相關檔案

- `demo-scenario.md` - 詳細演示腳本和講稿
- `demo-data.json` - 預載的演示資料
- `DEMO.md` - 本檔案（快速指南）

---

## 🆘 緊急聯繫

演示遇到問題？

1. 檢查 `TROUBLESHOOTING.md`（如果存在）
2. 查看專案 README
3. 詢問團隊成員

---

**祝演示順利！🎉**

*AgentMemory Team | Hackathon 2026*
