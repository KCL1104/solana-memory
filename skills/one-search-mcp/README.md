# OneSearch MCP for OpenClaw

🚀 將 OneSearch MCP Server 整合進 OpenClaw 的 CLI Backend 方案

## 簡介

這個 wrapper 將 [one-search-mcp](https://github.com/yokingma/one-search-mcp) 封裝成 OpenClaw 可用的 CLI Backend 工具，提供：

- 🔍 **網頁搜尋** (one_search) - 支援多種搜尋引擎
- 🕷️ **網頁擷取** (one_scrape) - 抓取網頁內容
- 🗺️ **連結發現** (one_map) - 發現網站所有連結
- 📊 **結構化提取** (one_extract) - 使用 LLM 提取結構化資料

## 支援的搜尋引擎

| 引擎 | 需要 API Key | 說明 |
|------|-------------|------|
| `duckduckgo` | ❌ | 免費，推薦預設 |
| `local` | ❌ | 使用瀏覽器自動化 |
| `searxng` | 可選 | 自架搜尋引擎 |
| `tavily` | ✅ | 高品質 AI 搜尋 |
| `bing` | ✅ | Microsoft Bing API |
| `google` | ✅ | Google Custom Search |

## 安裝步驟

### 1. 環境需求

- Node.js 20+ (已安裝於 OpenClaw 環境)
- (選項) Chromium/Chrome/Edge - 若使用 `local` 搜尋模式

### 2. 複製 Skill

```bash
# Skill 目錄已建立於:
# /home/node/.openclaw/workspace/skills/one-search-mcp/
```

### 3. OpenClaw 設定

編輯 `/home/node/.openclaw/openclaw.json`，在 `agents.defaults.cliBackends` 新增：

```json
{
  "agents": {
    "defaults": {
      "cliBackends": {
        "ddg-search": {
          "command": "node",
          "args": [
            "/home/node/.openclaw/workspace/skills/duckduckgo-search/scripts/ddg-search.js",
            "--stdin",
            "-l",
            "10"
          ],
          "output": "json",
          "input": "stdin"
        },
        "one-search-mcp": {
          "command": "node",
          "args": [
            "/home/node/.openclaw/workspace/skills/one-search-mcp/scripts/one-search-mcp-wrapper.js",
            "--stdin"
          ],
          "output": "json",
          "input": "stdin"
        }
      }
    }
  }
}
```

### 4. 環境變數 (可選)

若要使用特定搜尋引擎，設定環境變數：

```bash
# 使用 DuckDuckGo (預設)
export SEARCH_PROVIDER=duckduckgo

# 或使用 Tavily (需 API key)
export SEARCH_PROVIDER=tavily
export SEARCH_API_KEY=your_tavily_key
```

或在 OpenClaw 設定中指定 env：

```json
{
  "one-search-mcp": {
    "command": "node",
    "args": ["...", "--stdin"],
    "output": "json",
    "input": "stdin",
    "env": {
      "SEARCH_PROVIDER": "duckduckgo"
    }
  }
}
```

## 使用方法

### 搜尋 (one_search)

```javascript
// 基本搜尋
const results = await context.callTool('one-search-mcp', 'OpenAI GPT-4');

// 進階搜尋 (JSON 格式)
const results = await context.callTool('one-search-mcp', JSON.stringify({
  tool: 'one_search',
  args: {
    query: 'OpenAI GPT-4',
    limit: 10,
    language: 'zh-TW'
  }
}));
```

### 網頁擷取 (one_scrape)

```javascript
const content = await context.callTool('one-search-mcp', JSON.stringify({
  tool: 'one_scrape',
  args: {
    url: 'https://example.com',
    formats: ['markdown'],
    onlyMainContent: true
  }
}));
```

### 連結發現 (one_map)

```javascript
const links = await context.callTool('one-search-mcp', JSON.stringify({
  tool: 'one_map',
  args: {
    url: 'https://example.com'
  }
}));
```

## 輸出格式

### 搜尋結果

```json
{
  "query": "OpenAI GPT-4",
  "results": [
    {
      "title": "OpenAI GPT-4",
      "url": "https://openai.com/gpt-4",
      "snippet": "GPT-4 is OpenAI's most advanced system..."
    }
  ],
  "total": 10
}
```

### 網頁擷取

```json
{
  "url": "https://example.com",
  "content": "# Markdown content...",
  "type": "scrape"
}
```

## 故障排除

### 瀏覽器未找到

若使用 `local` 模式時出現錯誤：

```bash
# 安裝 Chromium
npx agent-browser install

# 或安裝 Google Chrome
# https://www.google.com/chrome/
```

### MCP Server 啟動失敗

```bash
# 測試直接執行
npx -y one-search-mcp

# 檢查 Node.js 版本
node --version  # 需 >= 20.0.0
```

### Timeout 錯誤

搜尋請求預設 60 秒 timeout，若網路較慢可修改 wrapper script 中的 timeout 值。

## 架構說明

```
┌─────────────┐     stdin      ┌─────────────────────┐     JSON-RPC     ┌─────────────────┐
│   OpenClaw  │────────────────►│  one-search-mcp-    │─────────────────►│  one-search-mcp │
│             │   (OpenClaw    │     wrapper.js      │     (MCP         │     server      │
│             │    format)     │  (MCP 客戶端)        │    protocol)     │                 │
│             │◄───────────────│                     │◄─────────────────│                 │
│             │    stdout      │                     │                  │                 │
│             │   (JSON)       │                     │                  │                 │
└─────────────┘                └─────────────────────┘                  └─────────────────┘
```

## 與 DuckDuckGo Skill 比較

| 功能 | ddg-search | one-search-mcp |
|------|------------|----------------|
| 搜尋 | ✅ DuckDuckGo | ✅ 多引擎支援 |
| 網頁擷取 | ❌ | ✅ |
| 連結發現 | ❌ | ✅ |
| 結構化提取 | ❌ | ✅ |
| 瀏覽器自動化 | ❌ | ✅ |
| 相依性 | 單一 npm | Node.js + 可選瀏覽器 |

## 授權

MIT License - 與 one-search-mcp 相同
