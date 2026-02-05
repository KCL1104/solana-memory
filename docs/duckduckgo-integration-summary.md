# DuckDuckGo Search Integration for OpenClaw

## 實作方案二完成 ✅

成功建立 custom CLI tool 來整合 `duck-duck-scrape`，讓 OpenClaw 可以使用 DuckDuckGo 搜尋替代 Brave Search。

## 實作內容

### 1. CLI Wrapper Script
**位置:** `skills/duckduckgo-search/scripts/ddg-search.js`

- 使用 `duck-duck-scrape` npm 套件
- 支援 stdin 輸入模式（OpenClaw 整合需求）
- 輸出 JSON 格式與 OpenClaw 相容
- 支援 text/images/videos/news 搜尋類型

### 2. OpenClaw 設定檔更新
**位置:** `/home/node/.openclaw/openclaw.json`

在 `agents.defaults.cliBackends` 中加入：

```json
{
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
    }
  }
}
```

### 3. 套件安裝
**位置:** `skills/duckduckgo-search/`

```bash
npm init -y
npm install duck-duck-scrape
```

### 4. 文件更新
**位置:** `skills/duckduckgo-search/SKILL.md`

加入 OpenClaw 整合章節，包含：
- 設定說明
- 使用方法
- 輸出格式規格
- 注意事項

## 使用方式

### 直接執行腳本
```bash
node skills/duckduckgo-search/scripts/ddg-search.js "搜尋關鍵字"
```

### 透過 CLI Backend（OpenClaw 內部使用）
當設定檔正確設定後，OpenClaw 可以在內部透過 CLI backend 機制呼叫此工具。

## 輸出格式

```json
{
  "query": "原始搜尋詞",
  "results": [
    {
      "title": "結果標題",
      "url": "https://example.com",
      "snippet": "結果描述..."
    }
  ],
  "total": 10
}
```

## 注意事項

1. **Rate Limiting**: DuckDuckGo 有請求頻率限制，避免快速連續搜尋
2. **無需 API Key**: 這是 DuckDuckGo 的優勢，完全免費
3. **設定已驗證**: `openclaw.json` 設定檔已通過 schema 驗證 (`valid: true`)

## 與原生 Web Search 的差異

| 功能 | 原生 Brave/Perplexity | DuckDuckGo CLI |
|------|----------------------|----------------|
| API Key | 需要 | 不需要 |
| 整合方式 | 內建 `web_search` tool | CLI backend |
| 速率限制 | 取決於配額 | 較嚴格 |
| 圖片搜尋 | 支援 | 支援 |
| 新聞搜尋 | 支援 | 支援 |

## 優勢

1. **無 API 配額限制**: 不受 Brave 每月 2000 次搜尋限制
2. **完全免費**: 無需付費 API key
3. **多搜尋類型**: 支援文字、圖片、影片、新聞
4. **無需重啟 Gateway**: CLI backend 設定變更即時生效

## 限制

1. 需要透過 CLI backend 機制使用，無法直接替換原生 `web_search` tool
2. DuckDuckGo 有較嚴格的 rate limiting
3. 不支援 Perplexity 的 AI 摘要功能

## 驗證結果

```bash
$ openclaw gateway config.get
{
  "valid": true,
  "issues": [],
  "warnings": []
}
```

設定檔驗證通過，無錯誤或警告。

---

**實作日期:** 2026-02-04  
**實作者:** MoltDev
