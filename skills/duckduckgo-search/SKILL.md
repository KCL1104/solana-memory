---
name: duckduckgo-search
description: Web search using DuckDuckGo via duck-duck-scrape npm package. Supports text search, image search, video search, news search, stocks, currency conversion, dictionary definitions, weather forecast, and time lookups. Use when performing web searches without API keys, when Brave API quota is exhausted, or when multiple search types (images, videos, news) are needed in a single query.
---

# DuckDuckGo Search

Web search without API keys using the `duck-duck-scrape` npm package.

## Quick Start

```typescript
import { search, SafeSearchType } from 'duck-duck-scrape';

// Basic search
const results = await search('node.js', {
  safeSearch: SafeSearchType.STRICT
});

// Results structure:
// {
//   noResults: boolean,
//   vqd: string,          // DuckDuckGo query token
//   results: Array<{
//     title: string,
//     description: string,
//     url: string,
//     icon?: string,
//     bang?: { prefix, title, domain }
//   }>
// }
```

## Search Types

### 1. Text Search (`search`)
Regular web search with customizable options.

```typescript
import { search, SafeSearchType } from 'duck-duck-scrape';

const results = await search('query', {
  safeSearch: SafeSearchType.STRICT,  // STRICT | MODERATE | OFF
  locale: 'en-us',
  region: 'us',
  marketRegion: 'us',
  offset: 0,        // Pagination offset
  limit: 20         // Max results (default varies)
});
```

### 2. Image Search (`searchImages`)

```typescript
import { searchImages, SafeSearchType } from 'duck-duck-scrape';

const images = await searchImages('cute cats', {
  safeSearch: SafeSearchType.MODERATE,
  offset: 0
});
// Returns: { noResults, vqd, results: [{ title, url, image, thumbnail, height, width, source }] }
```

### 3. Video Search (`searchVideos`)

```typescript
import { searchVideos } from 'duck-duck-scrape';

const videos = await searchVideos('tutorial', {
  safeSearch: SafeSearchType.STRICT
});
// Returns: { noResults, vqd, results: [{ title, url, image, duration, published, publisher, viewCount }] }
```

### 4. News Search (`searchNews`)

```typescript
import { searchNews } from 'duck-duck-scrape';

const news = await searchNews('technology', {
  safeSearch: SafeSearchType.STRICT,
  locale: 'en-us'
});
// Returns: { noResults, vqd, results: [{ title, url, image, excerpt, relativeTime, published }] }
```

## Utility APIs

### Stocks (`stocks`)
Get stock information via Xignite.

```typescript
import { stocks } from 'duck-duck-scrape';

const aapl = await stocks('AAPL');
// Returns stock quote data
```

### Currency Conversion (`currency`)
Convert between currencies via XE.

```typescript
import { currency } from 'duck-duck-scrape';

const conversion = await currency('USD', 'EUR', 100);
// Convert 100 USD to EUR
```

### Dictionary (`dictionaryDefinition`)
Get word definitions, pronunciation, audio.

```typescript
import { dictionaryDefinition } from 'duck-duck-scrape';

const def = await dictionaryDefinition('serendipity');
// Returns: { word, pronunciation, audio, hyphenation, definitions: [] }
```

### Weather Forecast (`forecast`)
Get weather via Dark Sky.

```typescript
import { forecast } from 'duck-duck-scrape';

const weather = await forecast('New York');
// Returns forecast data
```

### Time Lookup (`time`)
Get current time for a location.

```typescript
import { time } from 'duck-duck-scrape';

const timeInfo = await time('Tokyo');
// Returns time data via timeanddate.com
```

## Error Handling

All functions can throw errors. Wrap in try-catch:

```typescript
try {
  const results = await search('query');
} catch (error) {
  // Handle network errors, rate limits, etc.
}
```

## SafeSearch Options

```typescript
enum SafeSearchType {
  STRICT = 0,   // Strict safe search
  MODERATE = 1, // Moderate (default)
  OFF = 2       // Off
}
```

## OpenClaw Integration

This skill includes a CLI wrapper script that integrates with OpenClaw as a custom search backend.

### Configuration

The CLI backend is configured in `openclaw.json`:

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
        }
      }
    }
  }
}
```

### Usage in OpenClaw

To use DuckDuckGo search instead of the native Brave/Perplexity providers:

1. **Direct script execution**:
   ```bash
   node scripts/ddg-search.js "your search query"
   ```

2. **Via CLI backend** (configured in openclaw.json):
   The backend accepts queries via stdin and returns JSON results.

3. **From agent code**:
   ```typescript
   // Execute the CLI backend
   const result = await exec('ddg-search', { 
     input: 'search query',
     json: true 
   });
   ```

### Output Format

The CLI outputs JSON compatible with OpenClaw's web search expectations:

```json
{
  "query": "original query",
  "results": [
    {
      "title": "Result title",
      "url": "https://example.com",
      "snippet": "Result description..."
    }
  ],
  "total": 10
}
```

### Notes

- DuckDuckGo has rate limiting; avoid rapid consecutive searches
- No API key required
- Supports text, image, video, and news search types
- SafeSearch enabled by default (moderate level)

## Full API Reference

See [references/api-reference.md](references/api-reference.md) for complete documentation.
