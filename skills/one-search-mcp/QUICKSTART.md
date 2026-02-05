# OneSearch MCP for OpenClaw - Quick Start

## 快速安裝

### 1. 複製到 OpenClaw 設定

編輯 `~/.openclaw/openclaw.json`，在 `agents.defaults.cliBackends` 加入：

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

### 2. 選擇搜尋引擎

在 `env` 中設定：

| 引擎 | 環境變數 |
|------|----------|
| DuckDuckGo (推薦) | `SEARCH_PROVIDER: "duckduckgo"` |
| Local Browser | `SEARCH_PROVIDER: "local"` |
| Tavily | `SEARCH_PROVIDER: "tavily"` + `SEARCH_API_KEY: "xxx"` |

### 3. 使用方法

```javascript
// 搜尋 (預設)
const results = await context.callTool('one-search-mcp', 'OpenAI GPT-4');

// 指定工具
const results = await context.callTool('one-search-mcp', JSON.stringify({
  tool: 'one_search',
  args: { query: 'OpenAI', limit: 5 }
}));

// 網頁擷取
const content = await context.callTool('one-search-mcp', JSON.stringify({
  tool: 'one_scrape',
  args: { url: 'https://example.com' }
}));
```

### 4. 測試

```bash
cd /home/node/.openclaw/workspace/skills/one-search-mcp
echo "OpenAI" | node scripts/one-search-wrapper-simple.js --stdin
```

## 檔案說明

| 檔案 | 說明 |
|------|------|
| `scripts/one-search-wrapper-simple.js` | 簡化版 wrapper（推薦） |
| `scripts/one-search-mcp-wrapper.js` | 完整功能 wrapper |
| `test-mcp.js` | MCP 協議測試腳本 |

## 疑難排解

**瀏覽器未找到**: 改用 DuckDuckGo 模式或安裝 Chrome
```bash
npx agent-browser install
```

**Timeout**: 網路慢時正常，可重試

**無結果**: 檢查 `SEARCH_PROVIDER` 設定
