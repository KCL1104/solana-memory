# OneSearch MCP 研究報告

**研究日期**: 2026-02-04  
**研究對象**: [one-search-mcp](https://github.com/yokingma/one-search-mcp)  
**研究目的**: 評估作為 OpenClaw 替代搜尋方案的可行性

---

## 1. 專案概述

### 1.1 簡介

**OneSearch MCP Server** 是一個基於 **Model Context Protocol (MCP)** 的網頁搜尋、爬蟲與資料擷取工具。它提供統一的介面來整合多種搜尋引擎和瀏覽器自動化功能。

### 1.2 主要功能

| 功能 | 說明 |
|------|------|
| `one_search` | 網頁搜尋，支援多種搜尋引擎 |
| `one_scrape` | 單一網頁內容擷取（含截圖、Markdown、HTML） |
| `one_map` | 從起始 URL 發現並列舉網站所有連結 |
| `one_extract` | 使用 LLM 從多個網頁提取結構化資訊 |

### 1.3 版本資訊

- **目前版本**: 1.1.2
- **Node.js 需求**: >= 20.0.0
- **授權**: MIT

---

## 2. 技術架構分析

### 2.1 MCP (Model Context Protocol) 簡介

MCP 是 Anthropic 主導開發的開放標準，類似於 AI 應用的「USB-C 連接埠」：

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────────┐
│   AI 應用程式    │◄───►│  MCP 協議   │◄───►│  外部工具/資料   │
│ (Claude/Cursor) │     │  (stdio)    │     │  (搜尋/API/DB)  │
└─────────────────┘     └─────────────┘     └─────────────────┘
```

**核心機制**:
- 使用 **stdio**（標準輸入輸出）進行通訊
- AI 應用程式透過 MCP Server 呼叫外部工具
- 工具定義包含名稱、描述、輸入 schema（Zod 驗證）

### 2.2 OneSearch MCP 架構

```
one-search-mcp/
├── src/
│   ├── index.ts              # MCP Server 主程式
│   ├── tools.ts              # 工具定義 (one_search, one_scrape, etc.)
│   ├── schemas.ts            # Zod schema 定義
│   ├── interface.ts          # TypeScript interfaces
│   ├── search/               # 搜尋引擎實作
│   │   ├── local.ts          # 本地瀏覽器搜尋
│   │   ├── duckduckgo.ts     # DuckDuckGo 搜尋
│   │   ├── tavily.ts         # Tavily API
│   │   ├── bing.ts           # Bing Search API
│   │   ├── google.ts         # Google Custom Search
│   │   ├── searxng.ts        # SearXNG 自架搜尋
│   │   ├── zhipu.ts          # 智譜 AI 搜尋
│   │   ├── exa.ts            # Exa AI 搜尋
│   │   └── bocha.ts          # 博查 AI 搜尋
│   └── libs/
│       ├── agent-browser/    # 瀏覽器自動化（基於 Playwright）
│       └── logger/           # 日誌系統
```

### 2.3 搜尋引擎支援

| 引擎 | 需要 API Key | 需要 URL | 備註 |
|------|-------------|----------|------|
| **local** | ❌ | ❌ | 免費，使用瀏覽器自動化 |
| **duckduckgo** | ❌ | ❌ | 免費，使用 duck-duck-scrape 函式庫 |
| **searxng** | 可選 | ✅ | 自架 meta 搜尋引擎 |
| **bing** | ✅ | ❌ | Microsoft Bing Search API |
| **tavily** | ✅ | ❌ | Tavily AI 搜尋服務 |
| **google** | ✅ | ✅ (Search Engine ID) | Google Custom Search API |
| **zhipu** | ✅ | ❌ | 智譜 AI 搜尋 |
| **exa** | ✅ | ❌ | Exa AI 搜尋 |
| **bocha** | ✅ | ❌ | 博查 AI 搜尋 |

### 2.4 本地搜尋機制

**local** 模式使用 `agent-browser` + Playwright 自動化：

```typescript
// 支援的搜尋引擎
const VALID_SEARCH_ENGINES = ['google', 'bing', 'baidu', 'sogou'];

// 運作流程
1. 啟動 Chromium 瀏覽器（headless）
2. 導航至搜尋引擎（如 https://www.google.com/search?q=query）
3. 使用 Cheerio 解析 HTML 提取搜尋結果
4. 回傳結構化資料 { title, url, snippet }
```

**本地搜尋優點**:
- 完全免費，無 API key 需求
- 支援 Google、Bing、Baidu、Sogou
- 自動降級（若 Google 失敗自動切換 Bing）

**本地搜尋限制**:
- 需要安裝 Chromium/Chrome/Edge
- 可能受搜尋引擎反爬蟲機制影響
- 速度較 API 方式慢

---

## 3. OpenClaw 整合可行性評估

### 3.1 OpenClaw 現有搜尋架構

OpenClaw 目前提供：
- `web_fetch` - 抓取網頁內容
- `browser` - 瀏覽器自動化
- 可能內建其他搜尋工具

### 3.2 整合方式分析

#### 方案 A: 直接使用 MCP 協議（推薦度：⭐⭐⭐⭐）

將 OneSearch MCP 作為子程序啟動，透過 stdio 通訊：

```javascript
// OpenClaw 整合範例
const { spawn } = require('child_process');

// 啟動 OneSearch MCP Server
const mcpServer = spawn('npx', ['-y', 'one-search-mcp'], {
  env: {
    ...process.env,
    SEARCH_PROVIDER: 'local',  // 或 'duckduckgo', 'tavily' 等
  }
});

// 發送 MCP 請求
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'one_search',
    arguments: { query: 'OpenAI GPT-4', limit: 5 }
  }
};

mcpServer.stdin.write(JSON.stringify(request) + '\n');
```

**優點**:
- 符合 MCP 標準，未來可擴充其他 MCP Server
- 完整支援所有工具（search, scrape, map, extract）

**缺點**:
- 需要額外安裝 Node.js 相依（npx/npm）
- 需要管理子程序生命週期

#### 方案 B: 匯入使用（推薦度：⭐⭐⭐）

將 one-search-mcp 作為 npm 套件匯入：

```javascript
// 直接匯入搜尋函式
import { localSearch, duckDuckGoSearch } from 'one-search-mcp/search';
import { AgentBrowser } from 'one-search-mcp/libs/agent-browser';

// 直接使用
const results = await localSearch({ query: 'test', limit: 10 });
```

**優點**:
- 直接整合，無需 MCP 通訊 overhead
- 更細緻的錯誤處理和控制

**缺點**:
- one-search-mcp 未明確 export 內部模組
- 可能需要 fork/modify 才能正確使用

#### 方案 C: 僅參考實作（推薦度：⭐⭐）

參考其程式碼，在 OpenClaw 內部實作類似功能：

```typescript
// 在 OpenClaw 中新增工具
const searchTool = {
  name: 'web_search',
  description: '搜尋網頁',
  parameters: z.object({ query: z.string(), limit: z.number().optional() }),
  handler: async ({ query, limit }) => {
    // 實作 duckduckgo 搜尋（參考 one-search-mcp）
    return await duckDuckGoSearch(query, limit);
  }
};
```

**優點**:
- 完全控制，無外部相依
- 可針對 OpenClaw 架構優化

**缺點**:
- 維護成本高
- 無法自動獲得 upstream 更新

---

## 4. 實作建議

### 4.1 推薦方案：MCP 整合

**步驟 1: 環境準備**

```bash
# 安裝 Node.js 相依
npm install -g one-search-mcp

# 或使用 npx（無需全域安裝）
# npx -y one-search-mcp
```

**步驟 2: OpenClaw 設定**

```yaml
# openclaw-config.yaml
mcp_servers:
  one-search:
    command: npx
    args: ["-y", "one-search-mcp"]
    env:
      SEARCH_PROVIDER: "duckduckgo"  # 或 "local", "tavily" 等
      # SEARCH_API_KEY: "xxx"  # 若使用需要 API key 的引擎
```

**步驟 3: 使用方式**

```javascript
// 在 OpenClaw agent 中使用
const searchResults = await context.tools.call('one-search/one_search', {
  query: '最新 AI 發展',
  limit: 10,
  language: 'zh-TW'
});

// 擷取網頁內容
const pageContent = await context.tools.call('one-search/one_scrape', {
  url: 'https://example.com',
  formats: ['markdown'],
  onlyMainContent: true
});
```

### 4.2 引擎選擇建議

| 使用場景 | 推薦引擎 | 理由 |
|----------|----------|------|
| 免費、快速部署 | `duckduckgo` | 無需 API key，無需瀏覽器 |
| 高品質結果 | `tavily` | AI 優化搜尋，但需 API key |
| 中文搜尋 | `local` + baidu | 本地瀏覽器支援百度 |
| 企業/隱私 | `searxng` | 自架，完全掌控 |

### 4.3 必要的環境變數

```bash
# 使用 DuckDuckGo（最簡單，推薦）
SEARCH_PROVIDER=duckduckgo

# 使用本地瀏覽器搜尋
SEARCH_PROVIDER=local
LIMIT=10
SAFE_SEARCH=0

# 使用 Tavily（需 API key）
SEARCH_PROVIDER=tavily
SEARCH_API_KEY=tvly-xxxxx

# 使用 SearXNG（自架）
SEARCH_PROVIDER=searxng
SEARCH_API_URL=http://localhost:8080
```

---

## 5. 優缺點比較

### 5.1 優點 ✅

| 項目 | 說明 |
|------|------|
| **多引擎支援** | 9+ 種搜尋引擎，可依需求切換 |
| **免費選項** | duckduckgo、local 模式完全免費 |
| **MCP 標準** | 符合業界標準，與 Claude/Cursor 相容 |
| **瀏覽器自動化** | 內建網頁擷取、截圖、連結發現 |
| **結構化提取** | 支援使用 LLM 從網頁提取結構化資料 |
| **Docker 支援** | 官方提供預建 Docker 映像 |
| **中文友善** | 支援百度、搜狗、智譜、博查等中文引擎 |
| **積極維護** | 近期更新頻繁（最新 v1.1.2） |

### 5.2 缺點 ❌

| 項目 | 說明 |
|------|------|
| **Node.js 相依** | 需要 Node.js 20+ 環境 |
| **瀏覽器需求** | local 模式需要 Chromium/Chrome |
| **Rate Limiting** | 免費引擎（DuckDuckGo）可能有限制 |
| **反爬蟲風險** | 瀏覽器搜尋可能被搜尋引擎阻擋 |
| **MCP 協議限制** | 僅支援 stdio，無 HTTP API |
| **無快取機制** | 需自行實作結果快取 |
| **API 成本** | 高品質引擎（Tavily、Exa）需付費 |

### 5.3 與 OpenClaw 內建工具比較

| 功能 | OpenClaw web_fetch | OneSearch MCP |
|------|-------------------|---------------|
| 網頁抓取 | ✅ | ✅ (one_scrape) |
| 搜尋功能 | ❌ | ✅ (9+ 引擎) |
| 連結發現 | ❌ | ✅ (one_map) |
| 結構化提取 | ❌ | ✅ (one_extract) |
| 瀏覽器自動化 | ✅ (browser) | ✅ (agent-browser) |
| 截圖功能 | ✅ | ✅ |
| 無相依 | ✅ | ❌ (需 Node.js) |

---

## 6. 結論與建議

### 6.1 整合建議

**短期（快速獲得搜尋能力）**:
1. 採用 **DuckDuckGo** 模式（`SEARCH_PROVIDER=duckduckgo`）
2. 使用 MCP stdio 協議整合
3. 優點：免費、無需瀏覽器、立即可用

**中期（提升搜尋品質）**:
1. 取得 **Tavily API key**（有免費額度）
2. 或使用 **SearXNG** 自架搜尋
3. 加入結果快取機制

**長期（深度整合）**:
1. 參考 one-search-mcp 實作，在 OpenClaw 內部建構原生搜尋工具
2. 或維護 OpenClaw MCP 橋接層，支援更多 MCP Server

### 6.2 風險評估

| 風險 | 等級 | 緩解措施 |
|------|------|----------|
| DuckDuckGo 限制存取 | 中 | 準備多個引擎備援 |
| Node.js 相依 | 低 | 使用 Docker 封裝 |
| API key 成本 | 中 | 優先使用免費選項 |
| 維護成本 | 低 | 專案活躍，定期更新 |

### 6.3 最終評估

| 評估項目 | 分數 | 說明 |
|----------|------|------|
| 功能完整性 | ⭐⭐⭐⭐⭐ | 搜尋、爬蟲、提取一應俱全 |
| 易用性 | ⭐⭐⭐⭐ | MCP 標準，但需 Node.js |
| 成本效益 | ⭐⭐⭐⭐⭐ | 免費選項充足 |
| 維護性 | ⭐⭐⭐⭐ | 開源專案，更新頻繁 |
| **整體推薦** | **⭐⭐⭐⭐⭐** | **高度推薦整合** |

---

## 參考連結

- [one-search-mcp GitHub](https://github.com/yokingma/one-search-mcp)
- [Model Context Protocol 官方文件](https://modelcontextprotocol.io/)
- [MCP SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [Tavily API](https://tavily.com/)
- [SearXNG Docker](https://github.com/searxng/searxng-docker)

---

*報告生成時間: 2026-02-04*
*研究員: OpenClaw AI Agent*
