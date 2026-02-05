# DuckDuckGo Scrape - API Reference

Complete API documentation for `duck-duck-scrape` npm package.

## Installation

```bash
npm install duck-duck-scrape
# or
yarn add duck-duck-scrape
```

## Module Exports

```typescript
// ES Modules
import { 
  search, 
  searchImages, 
  searchVideos, 
  searchNews,
  stocks,
  currency,
  dictionaryDefinition,
  forecast,
  time,
  SafeSearchType 
} from 'duck-duck-scrape';

// CommonJS
const DDG = require('duck-duck-scrape');
```

## Search Functions

### `search(query, options?)`

Performs a regular web search.

**Parameters:**
- `query` (string): Search query
- `options` (SearchOptions): Optional configuration

**SearchOptions Interface:**
```typescript
interface SearchOptions {
  safeSearch?: SafeSearchType;  // Default: MODERATE
  locale?: string;              // Default: 'en-us'
  region?: string;              // Default: 'us'
  marketRegion?: string;        // Default: 'us'
  offset?: number;              // Default: 0
  limit?: number;               // Default: varies
}
```

**Returns:** `Promise<SearchResults>`
```typescript
interface SearchResults {
  noResults: boolean;
  vqd: string;              // DuckDuckGo validation token
  results: SearchResult[];
}

interface SearchResult {
  title: string;
  description: string;
  url: string;
  icon?: string;
  bang?: {
    prefix: string;
    title: string;
    domain: string;
  };
}
```

---

### `searchImages(query, options?)`

Performs an image search.

**Parameters:**
- `query` (string): Search query
- `options` (ImageSearchOptions): Optional configuration

**ImageSearchOptions Interface:**
```typescript
interface ImageSearchOptions {
  safeSearch?: SafeSearchType;
  offset?: number;
}
```

**Returns:** `Promise<ImageResults>`
```typescript
interface ImageResults {
  noResults: boolean;
  vqd: string;
  results: ImageResult[];
}

interface ImageResult {
  title: string;
  url: string;           // Source page URL
  image: string;         // Direct image URL
  thumbnail: string;     // Thumbnail URL
  height: number;
  width: number;
  source: string;        // Domain name
}
```

---

### `searchVideos(query, options?)`

Performs a video search.

**Parameters:**
- `query` (string): Search query
- `options` (VideoSearchOptions): Optional configuration

**VideoSearchOptions Interface:**
```typescript
interface VideoSearchOptions {
  safeSearch?: SafeSearchType;
  offset?: number;
}
```

**Returns:** `Promise<VideoResults>`
```typescript
interface VideoResults {
  noResults: boolean;
  vqd: string;
  results: VideoResult[];
}

interface VideoResult {
  title: string;
  url: string;
  image: string;         // Thumbnail URL
  duration: string;      // e.g., "10:30"
  published: string;     // Relative time, e.g., "2 days ago"
  publisher: string;
  viewCount?: number;
}
```

---

### `searchNews(query, options?)`

Performs a news search.

**Parameters:**
- `query` (string): Search query
- `options` (NewsSearchOptions): Optional configuration

**NewsSearchOptions Interface:**
```typescript
interface NewsSearchOptions {
  safeSearch?: SafeSearchType;
  locale?: string;
  offset?: number;
}
```

**Returns:** `Promise<NewsResults>`
```typescript
interface NewsResults {
  noResults: boolean;
  vqd: string;
  results: NewsResult[];
}

interface NewsResult {
  title: string;
  url: string;
  image?: string;
  excerpt: string;
  relativeTime: string;  // e.g., "3 hours ago"
  published: string;     // ISO date string
}
```

---

## Utility Functions

### `stocks(ticker)`

Get stock information via Xignite.

**Parameters:**
- `ticker` (string): Stock ticker symbol (e.g., 'AAPL', 'GOOGL')

**Returns:** `Promise<StockData>`
```typescript
interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  // ... additional fields
}
```

---

### `currency(from, to, amount)`

Convert currency via XE.

**Parameters:**
- `from` (string): Source currency code (e.g., 'USD')
- `to` (string): Target currency code (e.g., 'EUR')
- `amount` (number): Amount to convert

**Returns:** `Promise<CurrencyConversion>`
```typescript
interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  converted: number;
  rate: number;
  // ... additional fields
}
```

---

### `dictionaryDefinition(word)`

Get dictionary definition via DuckDuckGo.

**Parameters:**
- `word` (string): Word to look up

**Returns:** `Promise<DictionaryResult | null>`
```typescript
interface DictionaryResult {
  word: string;
  pronunciation?: string;
  audio?: string;          // URL to pronunciation audio
  hyphenation?: string[];  // Syllable breakdown
  definitions: Definition[];
}

interface Definition {
  partOfSpeech: string;    // e.g., "noun", "verb"
  definition: string;
  example?: string;
}
```

---

### `forecast(location)`

Get weather forecast via Dark Sky.

**Parameters:**
- `location` (string): Location name (e.g., 'New York', 'Tokyo')

**Returns:** `Promise<ForecastData | null>`
```typescript
interface ForecastData {
  location: string;
  current: {
    temp: number;
    condition: string;
    humidity: number;
    // ... additional fields
  };
  daily: DailyForecast[];
}

interface DailyForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
}
```

---

### `time(location)`

Get current time for a location via timeanddate.com.

**Parameters:**
- `location` (string): Location name (e.g., 'Tokyo', 'London')

**Returns:** `Promise<TimeData | null>`
```typescript
interface TimeData {
  location: string;
  time: string;
  date: string;
  timezone: string;
  // ... additional fields
}
```

---

## Enums

### `SafeSearchType`

```typescript
enum SafeSearchType {
  STRICT = 0,   // Maximum filtering
  MODERATE = 1, // Default filtering
  OFF = 2       // No filtering
}
```

---

## Error Handling

All functions return Promises and can throw:
- Network errors (connection issues)
- HTTP errors (rate limiting, server errors)
- Parse errors (unexpected response format)

**Recommended pattern:**
```typescript
try {
  const results = await search('query', options);
  if (results.noResults) {
    console.log('No results found');
  } else {
    console.log(`Found ${results.results.length} results`);
  }
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limiting
  } else {
    // Handle other errors
  }
}
```

---

## Rate Limiting

DuckDuckGo may rate-limit requests. Best practices:
- Add delays between requests (1-2 seconds)
- Cache results when possible
- Handle errors gracefully with retry logic

---

## TypeScript Support

Full TypeScript definitions are included. No additional @types package needed.

```typescript
import type { 
  SearchOptions, 
  SearchResults,
  ImageResult,
  VideoResult,
  NewsResult 
} from 'duck-duck-scrape';
```
