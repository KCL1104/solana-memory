# AI-Native Memory Compression Prototype

This prototype demonstrates LLM-based semantic compression for agent memories.

## Structure

- `README.md` - This file
- `compression.ts` - Semantic compression implementation

## Compression Strategies

| Strategy | Ratio | Query-Aware | Best For |
|----------|-------|-------------|----------|
| Embedding | 100-500x | Yes | Semantic search |
| Summary | 10-50x | Partial | Quick recall |
| Hierarchical | 50-100x | Yes | Complex histories |

## Quick Start

```bash
npm install openai
export OPENAI_API_KEY=your_key
npx ts-node compression.ts
```
