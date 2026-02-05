# OneSearch MCP 整合方案 - 最終報告

**任務**: 研究如何將 one-search-mcp 整合進 OpenClaw  
**日期**: 2026-02-04  
**狀態**: ✅ 完成

---

## 交付成果

### 1. 整合方案文件
📄 `docs/one-search-mcp-integration-guide.md`
- 完整的方案分析（A/B/C 三種方案比較）
- 推薦方案詳細說明（CLI Backend Wrapper）
- 實作步驟和設定範例
- 故障排除指南

### 2. POC 程式碼
📁 `skills/one-search-mcp/`

| 檔案 | 說明 |
|------|------|
| `README.md` | Skill 完整說明 |
| `QUICKSTART.md` | 5分鐘快速入門 |
| `package.json` | npm 設定 |
| `TEST-REPORT.md` | 測試報告 |
| `verify-installation.js` | 安裝驗證腳本 |
| `test-mcp.js` | MCP 協議測試 |
| `scripts/one-search-wrapper-simple.js` | 簡化版 wrapper (推薦) |
| `scripts/one-search-mcp-wrapper.js` | 完整功能 wrapper |
| `config/openclaw-example.json` | 完整設定範例 |
| `config/setup-snippet.md` | 設定片段說明 |

---

## 推薦方案

### 方案 A: CLI Backend Wrapper（推薦）

**選擇理由**:
1. ✅ 符合 OpenClaw 現有 `cliBackends` 機制
2. ✅ 無需修改 OpenClaw 核心
3. ✅ 開發成本低（數小時完成）
4. ✅ 可重用於其他 MCP Server

**架構**:
```
OpenClaw → Wrapper (MCP Client) → one-search-mcp (MCP Server)
   stdin        JSON-RPC stdio          搜尋引擎
   stdout ←─────────────────────────────────────┘
     JSON
```

---

## 快速安裝步驟

### 1. 編輯 OpenClaw 設定

```bash
nano ~/.openclaw/openclaw.json
```

### 2. 加入 cliBackends

在 `agents.defaults.cliBackends` 加入：

```json
"one-search-mcp": {
  "command": "node",
  "args": [
    "/home/node/.openclaw/workspace/skills/one-search-mcp/scripts/one-search-wrapper-simple.js",
    "--stdin"
  ],
  "output": "json",
  "input": "stdin",
  "env": {
    "SEARCH_PROVIDER": "duckduckgo"
  }
}
```

### 3. 重啟 OpenClaw

```bash
openclaw gateway restart
```

### 4. 使用方法

```javascript
// 基本搜尋
const results = await context.callTool('one-search-mcp', 'OpenAI GPT-4');

// 指定工具
const content = await context.callTool('one-search-mcp', JSON.stringify({
  tool: 'one_scrape',
  args: { url: 'https://example.com' }
}));
```

---

## 功能對照

| 功能 | OpenClaw 現有 | one-search-mcp |
|------|---------------|----------------|
| 網頁抓取 | ✅ web_fetch | ✅ one_scrape |
| 瀏覽器自動化 | ✅ browser | ✅ agent-browser |
| 搜尋功能 | ❌ | ✅ 9+ 引擎 |
| 連結發現 | ❌ | ✅ one_map |
| 結構化提取 | ❌ | ✅ one_extract |

---

## 搜尋引擎選擇

| 引擎 | 需要 API Key | 特點 |
|------|-------------|------|
| **duckduckgo** | ❌ | 免費、快速、推薦預設 |
| **local** | ❌ | 使用瀏覽器，支援中文 |
| **tavily** | ✅ | 高品質 AI 搜尋 |
| **searxng** | 可選 | 自架、隱私優先 |

---

## 驗證結果

```
✅ 所有必要檔案已建立
✅ Node.js v22.22.0 (>= 20.0.0)
✅ npx 可用
✅ one-search-mcp 在快取中
```

---

## 下一步

1. **整合測試**: 實際修改 openclaw.json 並測試
2. **效能優化**: 考慮連線池減少啟動 overhead
3. **文件更新**: 根據使用反饋更新指南

---

## 結論

OneSearch MCP 整合方案 **完全可行**，採用 CLI Backend Wrapper 模式可在不修改 OpenClaw 核心的情況下，完整利用 one-search-mcp 的所有功能。POC 程式碼已完成，文件齊全，可直接進行整合測試。
