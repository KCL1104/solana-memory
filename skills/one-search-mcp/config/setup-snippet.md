# 設定片段 - 加入 OpenClaw

## 步驟 1: 開啟設定檔

編輯 `~/.openclaw/openclaw.json`

## 步驟 2: 找到 cliBackends

找到 `agents.defaults.cliBackends` 區塊

## 步驟 3: 加入 OneSearch MCP

在 `cliBackends` 中加入以下內容：

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

完整範例：

```json
{
  "agents": {
    "defaults": {
      "cliBackends": {
        "ddg-search": {
          "command": "node",
          "args": [...],
          "output": "json",
          "input": "stdin"
        },
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
      }
    }
  }
}
```

## 步驟 4: 重啟 OpenClaw

```bash
openclaw gateway restart
```

## 多引擎設定

可以設定多個 backend 使用不同引擎：

```json
"cliBackends": {
  "search-ddg": {
    "command": "node",
    "args": [".../one-search-wrapper-simple.js", "--stdin"],
    "output": "json",
    "input": "stdin",
    "env": { "SEARCH_PROVIDER": "duckduckgo" }
  },
  "search-tavily": {
    "command": "node",
    "args": [".../one-search-wrapper-simple.js", "--stdin"],
    "output": "json",
    "input": "stdin",
    "env": { 
      "SEARCH_PROVIDER": "tavily",
      "SEARCH_API_KEY": "your-key"
    }
  }
}
```
