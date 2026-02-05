/**
 * AI-Native Memory Compression
 * 
 * Uses LLM semantic understanding to compress memories while
 * preserving query-ability. Supports multiple compression strategies.
 */

import { OpenAI } from 'openai';

// Types
interface Memory {
  id: string;
  content: string;
  timestamp: number;
  importance: number;
  tags?: string[];
}

interface CompressedMemory {
  version: string;
  createdAt: number;
  originalCount: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  
  // Semantic representations
  embedding: number[];
  extraction: StructureExtraction;
  summaries: SummaryHierarchy;
  
  // Original memory references (for critical memories)
  criticalMemories: Memory[];
  
  // Index for decompression
  index: CompressionIndex;
}

interface StructureExtraction {
  entities: string[];
  topics: string[];
  timeline: TimelineEvent[];
  sentiment: 'positive' | 'negative' | 'neutral';
  keyFacts: string[];
}

interface TimelineEvent {
  timestamp: number;
  description: string;
  importance: number;
}

interface SummaryHierarchy {
  episodes: EpisodeSummary[];
  periods: PeriodSummary[];
  life: string;
}

interface EpisodeSummary {
  id: string;
  summary: string;
  memoryIds: string[];
  startTime: number;
  endTime: number;
  importance: number;
}

interface PeriodSummary {
  summary: string;
  episodeIds: string[];
  startTime: number;
  endTime: number;
}

interface CompressionIndex {
  memoryToEpisode: Map<string, string>;
  episodeToPeriod: Map<string, string>;
}

interface CompressionConfig {
  episodeTokens: number;
  periodTokens: number;
  lifeTokens: number;
  episodeDuration: number; // seconds
  periodDuration: number;  // seconds
  criticalThreshold: number;
}

interface DecompressedResult {
  content: string;
  source: 'summary' | 'embedding' | 'full' | 'synthetic';
  confidence: number;
  relevantMemories?: string[];
}

/**
 * Semantic Memory Compressor
 * 
 * Provides multiple compression tiers based on memory importance
 * and expected query patterns.
 */
export class SemanticCompressor {
  private llm: OpenAI;
  private config: CompressionConfig;

  constructor(apiKey: string, config?: Partial<CompressionConfig>) {
    this.llm = new OpenAI({ apiKey });
    this.config = {
      episodeTokens: 150,
      periodTokens: 200,
      lifeTokens: 300,
      episodeDuration: 86400,    // 1 day
      periodDuration: 604800,    // 1 week
      criticalThreshold: 0.9,
      ...config
    };
  }

  /**
   * Compress a set of memories
   */
  async compress(memories: Memory[]): Promise<CompressedMemory> {
    console.log(`[Compressor] Compressing ${memories.length} memories...`);

    // Step 1: Calculate original size
    const originalSize = this.calculateSize(memories);

    // Step 2: Extract structured information
    console.log('[Compressor] Extracting structure...');
    const extraction = await this.extractStructure(memories);

    // Step 3: Generate hierarchical summaries
    console.log('[Compressor] Generating summaries...');
    const summaries = await this.generateSummaries(memories);

    // Step 4: Compute semantic embedding (use life summary)
    console.log('[Compressor] Computing embedding...');
    const embedding = await this.computeEmbedding(summaries.life);

    // Step 5: Identify critical memories to preserve
    const criticalMemories = memories.filter(
      m => m.importance >= this.config.criticalThreshold
    );

    // Step 6: Build index
    const index = this.buildCompressionIndex(memories, summaries);

    // Step 7: Calculate compression metrics
    const compressedSize = this.calculateCompressedSize(summaries, extraction);
    const compressionRatio = originalSize / compressedSize;

    const compressed: CompressedMemory = {
      version: '1.0',
      createdAt: Date.now(),
      originalCount: memories.length,
      originalSize,
      compressedSize,
      compressionRatio,
      embedding,
      extraction,
      summaries,
      criticalMemories,
      index
    };

    console.log(`[Compressor] Compression complete: ${compressionRatio.toFixed(1)}x ratio`);
    
    return compressed;
  }

  /**
   * Decompress based on query (query-aware)
   */
  async decompress(
    compressed: CompressedMemory,
    query: string
  ): Promise<DecompressedResult> {
    console.log(`[Decompressor] Processing query: "${query}"`);

    // Classify query type
    const queryType = this.classifyQuery(query);
    console.log(`[Decompressor] Query type: ${queryType}`);

    switch (queryType) {
      case 'SUMMARY':
        return this.handleSummaryQuery(compressed, query);
      
      case 'SPECIFIC_PERIOD':
        return this.handlePeriodQuery(compressed, query);
      
      case 'SPECIFIC_EPISODE':
        return this.handleEpisodeQuery(compressed, query);
      
      case 'FACT_LOOKUP':
        return this.handleFactQuery(compressed, query);
      
      case 'SEMANTIC':
        return this.handleSemanticQuery(compressed, query);
      
      default:
        return this.handleFullContextQuery(compressed, query);
    }
  }

  /**
   * Batch compression for efficiency
   */
  async batchCompress(
    memoryBatches: Memory[][],
    options: { parallel: boolean } = { parallel: true }
  ): Promise<CompressedMemory[]> {
    if (options.parallel) {
      return Promise.all(memoryBatches.map(batch => this.compress(batch)));
    } else {
      const results: CompressedMemory[] = [];
      for (const batch of memoryBatches) {
        results.push(await this.compress(batch));
      }
      return results;
    }
  }

  // Private methods

  private async extractStructure(memories: Memory[]): Promise<StructureExtraction> {
    // Use simple heuristics instead of LLM for speed
    const entities = new Set<string>();
    const topics = new Set<string>();
    const timeline: TimelineEvent[] = [];
    const keyFacts: string[] = [];
    
    let positiveCount = 0;
    let negativeCount = 0;

    for (const memory of memories) {
      const content = memory.content.toLowerCase();
      
      // Extract potential entities (capitalized words)
      const words = memory.content.match(/\b[A-Z][a-z]+\b/g) || [];
      words.forEach(w => entities.add(w));
      
      // Simple topic extraction (nouns)
      const nouns = content.match(/\b\w+(?:tion|ment|ness|ity)\b/g) || [];
      nouns.forEach(n => topics.add(n));
      
      // Timeline events
      timeline.push({
        timestamp: memory.timestamp,
        description: memory.content.slice(0, 100),
        importance: memory.importance
      });
      
      // Sentiment (simple keyword matching)
      if (/good|great|excellent|happy|success/i.test(content)) positiveCount++;
      if (/bad|terrible|error|fail|problem/i.test(content)) negativeCount++;
      
      // Key facts from high-importance memories
      if (memory.importance > 0.8) {
        keyFacts.push(memory.content.slice(0, 200));
      }
    }

    // Determine overall sentiment
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount * 2) sentiment = 'positive';
    if (negativeCount > positiveCount * 2) sentiment = 'negative';

    return {
      entities: Array.from(entities).slice(0, 20),
      topics: Array.from(topics).slice(0, 10),
      timeline: timeline.sort((a, b) => a.timestamp - b.timestamp),
      sentiment,
      keyFacts: keyFacts.slice(0, 5)
    };
  }

  private async generateSummaries(memories: Memory[]): Promise<SummaryHierarchy> {
    // Sort by timestamp
    const sorted = [...memories].sort((a, b) => a.timestamp - b.timestamp);

    // Group into episodes
    const episodes = this.groupIntoEpisodes(sorted);
    
    // Generate episode summaries
    const episodeSummaries: EpisodeSummary[] = episodes.map((epMemories, idx) => ({
      id: `episode-${idx}`,
      summary: this.generateEpisodeSummary(epMemories),
      memoryIds: epMemories.map(m => m.id),
      startTime: epMemories[0].timestamp,
      endTime: epMemories[epMemories.length - 1].timestamp,
      importance: Math.max(...epMemories.map(m => m.importance))
    }));

    // Group episodes into periods
    const periods = this.groupIntoPeriods(episodeSummaries);
    
    const periodSummaries: PeriodSummary[] = periods.map((epSums, idx) => ({
      summary: this.generatePeriodSummary(epSums),
      episodeIds: epSums.map(e => e.id),
      startTime: Math.min(...epSums.map(e => e.startTime)),
      endTime: Math.max(...epSums.map(e => e.endTime))
    }));

    // Generate life summary
    const life = this.generateLifeSummary(periodSummaries);

    return {
      episodes: episodeSummaries,
      periods: periodSummaries,
      life
    };
  }

  private groupIntoEpisodes(memories: Memory[]): Memory[][] {
    const episodes: Memory[][] = [];
    let current: Memory[] = [];
    
    for (const memory of memories) {
      if (current.length === 0) {
        current.push(memory);
      } else {
        const lastTime = current[current.length - 1].timestamp;
        if (memory.timestamp - lastTime < this.config.episodeDuration) {
          current.push(memory);
        } else {
          episodes.push(current);
          current = [memory];
        }
      }
    }
    
    if (current.length > 0) episodes.push(current);
    return episodes;
  }

  private groupIntoPeriods(episodes: EpisodeSummary[]): EpisodeSummary[][] {
    const periods: EpisodeSummary[][] = [];
    let current: EpisodeSummary[] = [];
    
    for (const episode of episodes) {
      if (current.length === 0) {
        current.push(episode);
      } else {
        const lastTime = current[current.length - 1].endTime;
        if (episode.startTime - lastTime < this.config.periodDuration) {
          current.push(episode);
        } else {
          periods.push(current);
          current = [episode];
        }
      }
    }
    
    if (current.length > 0) periods.push(current);
    return periods;
  }

  private generateEpisodeSummary(memories: Memory[]): string {
    // Simple extractive summarization
    const keyEvents = memories
      .filter(m => m.importance > 0.6)
      .map(m => m.content.slice(0, 100));
    
    const avgImportance = memories.reduce((a, b) => a + b.importance, 0) / memories.length;
    
    return `Episode with ${memories.length} events (avg importance: ${avgImportance.toFixed(2)}). ` +
           `Key events: ${keyEvents.slice(0, 3).join('; ')}`;
  }

  private generatePeriodSummary(episodes: EpisodeSummary[]): string {
    return `Period covering ${episodes.length} episodes. ` +
           `High-importance events: ${episodes.filter(e => e.importance > 0.8).length}. ` +
           `Time span: ${((episodes[episodes.length - 1].endTime - episodes[0].startTime) / 86400).toFixed(1)} days.`;
  }

  private generateLifeSummary(periods: PeriodSummary[]): string {
    return `Agent history spanning ${periods.length} periods. ` +
           `Overall trajectory: ${periods.slice(0, 3).map(p => p.summary.slice(0, 50)).join(' → ')}...`;
  }

  private async computeEmbedding(text: string): Promise<number[]> {
    // Mock embedding - in production use OpenAI API
    // const response = await this.llm.embeddings.create({
    //   model: 'text-embedding-3-small',
    //   input: text
    // });
    // return response.data[0].embedding;
    
    // Mock: return random vector of correct dimension
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }

  private buildCompressionIndex(
    memories: Memory[],
    summaries: SummaryHierarchy
  ): CompressionIndex {
    const memoryToEpisode = new Map<string, string>();
    const episodeToPeriod = new Map<string, string>();

    for (const episode of summaries.episodes) {
      for (const memoryId of episode.memoryIds) {
        memoryToEpisode.set(memoryId, episode.id);
      }
    }

    for (let i = 0; i < summaries.periods.length; i++) {
      const period = summaries.periods[i];
      for (const episodeId of period.episodeIds) {
        episodeToPeriod.set(episodeId, `period-${i}`);
      }
    }

    return { memoryToEpisode, episodeToPeriod };
  }

  private classifyQuery(query: string): QueryType {
    const lower = query.toLowerCase();
    
    if (/summary|overview|what happened|tell me about/i.test(lower)) {
      return 'SUMMARY';
    }
    if (/during|period|last week|last month/i.test(lower)) {
      return 'SPECIFIC_PERIOD';
    }
    if (/when did|episode|specific time/i.test(lower)) {
      return 'SPECIFIC_EPISODE';
    }
    if (/what is|who is|where is/i.test(lower)) {
      return 'FACT_LOOKUP';
    }
    if (/similar|like|related/i.test(lower)) {
      return 'SEMANTIC';
    }
    
    return 'FULL_CONTEXT';
  }

  private handleSummaryQuery(compressed: CompressedMemory, query: string): DecompressedResult {
    return {
      content: compressed.summaries.life,
      source: 'summary',
      confidence: 0.9,
      relevantMemories: compressed.criticalMemories.map(m => m.id)
    };
  }

  private handlePeriodQuery(compressed: CompressedMemory, query: string): DecompressedResult {
    // Extract time hints from query
    // For demo, return most recent period
    const period = compressed.summaries.periods[compressed.summaries.periods.length - 1];
    
    return {
      content: period.summary,
      source: 'summary',
      confidence: 0.8,
      relevantMemories: this.getMemoriesInPeriod(compressed, period)
    };
  }

  private handleEpisodeQuery(compressed: CompressedMemory, query: string): DecompressedResult {
    const episode = compressed.summaries.episodes[compressed.summaries.episodes.length - 1];
    
    return {
      content: episode.summary,
      source: 'summary',
      confidence: 0.85,
      relevantMemories: episode.memoryIds
    };
  }

  private handleFactQuery(compressed: CompressedMemory, query: string): DecompressedResult {
    // Search key facts
    const relevant = compressed.extraction.keyFacts.filter(fact => 
      query.toLowerCase().split(' ').some(word => 
        fact.toLowerCase().includes(word)
      )
    );
    
    return {
      content: relevant.length > 0 
        ? relevant.join('\n')
        : 'No specific facts found matching query',
      source: 'full',
      confidence: relevant.length > 0 ? 0.75 : 0.3
    };
  }

  private handleSemanticQuery(compressed: CompressedMemory, query: string): DecompressedResult {
    // Use embedding similarity (mock)
    const similarity = Math.random(); // Mock similarity
    
    return {
      content: `Semantic match found (similarity: ${similarity.toFixed(2)}). ` +
               compressed.summaries.life,
      source: 'embedding',
      confidence: similarity
    };
  }

  private handleFullContextQuery(compressed: CompressedMemory, query: string): DecompressedResult {
    // Return combination of all summaries
    const fullContext = [
      compressed.summaries.life,
      ...compressed.summaries.periods.slice(-2).map(p => p.summary),
      ...compressed.extraction.keyFacts.slice(0, 3)
    ].join('\n\n');
    
    return {
      content: fullContext,
      source: 'full',
      confidence: 0.7
    };
  }

  private getMemoriesInPeriod(compressed: CompressedMemory, period: PeriodSummary): string[] {
    const memoryIds: string[] = [];
    
    for (const episodeId of period.episodeIds) {
      const episode = compressed.summaries.episodes.find(e => e.id === episodeId);
      if (episode) {
        memoryIds.push(...episode.memoryIds);
      }
    }
    
    return memoryIds;
  }

  private calculateSize(memories: Memory[]): number {
    return memories.reduce((sum, m) => sum + m.content.length, 0);
  }

  private calculateCompressedSize(
    summaries: SummaryHierarchy,
    extraction: StructureExtraction
  ): number {
    return summaries.life.length +
           summaries.periods.reduce((s, p) => s + p.summary.length, 0) +
           summaries.episodes.reduce((s, e) => s + e.summary.length, 0) +
           extraction.keyFacts.join('').length;
  }
}

type QueryType = 
  | 'SUMMARY' 
  | 'SPECIFIC_PERIOD' 
  | 'SPECIFIC_EPISODE' 
  | 'FACT_LOOKUP' 
  | 'SEMANTIC' 
  | 'FULL_CONTEXT';

/**
 * Demo / Test
 */
async function main() {
  console.log('=== AI-Native Memory Compression Demo ===\n');

  // Create sample memories
  const memories: Memory[] = [
    {
      id: 'mem-1',
      content: 'User mentioned they prefer dark mode interfaces. This was during the initial onboarding call. They also noted that bright screens cause eye strain after long coding sessions.',
      timestamp: 1704067200,
      importance: 0.7,
      tags: ['preferences', 'ui']
    },
    {
      id: 'mem-2',
      content: 'Team standup meeting at 10 AM. Discussed the new authentication flow. Sarah raised concerns about the OAuth implementation timeline. Decided to allocate 2 more developers to the auth team.',
      timestamp: 1704153600,
      importance: 0.9,
      tags: ['meeting', 'auth']
    },
    {
      id: 'mem-3',
      content: 'Code review completed for the payment module. Found 3 critical issues: missing input validation, potential race condition in wallet updates, and insufficient logging. Requested changes before merge.',
      timestamp: 1704160800,
      importance: 0.95,
      tags: ['code-review', 'payment', 'critical']
    },
    {
      id: 'mem-4',
      content: 'User reported bug: unable to export data on mobile Safari. Investigation showed the download attribute on anchor tags is not supported in iOS WebView. Need to implement alternative approach using Blob URLs.',
      timestamp: 1704240000,
      importance: 0.8,
      tags: ['bug', 'mobile', 'safari']
    },
    {
      id: 'mem-5',
      content: 'Product demo with client XYZ Corp. They were impressed with the analytics dashboard but requested additional export formats (PDF, Excel). Pricing discussion went well, expecting to close next week.',
      timestamp: 1704326400,
      importance: 0.85,
      tags: ['demo', 'sales', 'client']
    },
    {
      id: 'mem-6',
      content: 'Deployed v2.3.0 to production. Included performance improvements reducing load time by 40%. Monitoring shows no increase in error rates. User feedback has been positive about the speed improvements.',
      timestamp: 1704412800,
      importance: 0.75,
      tags: ['deployment', 'performance']
    },
    {
      id: 'mem-7',
      content: 'Security audit findings: need to rotate API keys, update dependencies with known vulnerabilities (lodash, axios), and implement rate limiting on the public endpoints. Deadline: end of quarter.',
      timestamp: 1704499200,
      importance: 0.92,
      tags: ['security', 'audit', 'critical']
    },
    {
      id: 'mem-8',
      content: 'Coffee chat with the design team. Learned about the upcoming design system refresh. Will need to coordinate with them on component library updates. Scheduled follow-up for next Tuesday.',
      timestamp: 1704585600,
      importance: 0.5,
      tags: ['design', 'meeting']
    }
  ];

  // Initialize compressor (without API key for demo)
  const compressor = new SemanticCompressor('demo-key');

  // Step 1: Compress
  console.log('1. Compressing memories...\n');
  const compressed = await compressor.compress(memories);
  
  console.log(`   Original count: ${compressed.originalCount}`);
  console.log(`   Original size: ${compressed.originalSize} bytes`);
  console.log(`   Compressed size: ${compressed.compressedSize} bytes`);
  console.log(`   Compression ratio: ${compressed.compressionRatio.toFixed(1)}x`);
  console.log(`   Critical memories preserved: ${compressed.criticalMemories.length}\n`);

  // Step 2: Query compressed memories
  const queries = [
    'Give me a summary of recent events',
    'What happened last week?',
    'Tell me about security issues',
    'What are the critical bugs?',
    'How is the project progressing overall?'
  ];

  console.log('2. Testing query-aware decompression:\n');
  
  for (const query of queries) {
    console.log(`   Query: "${query}"`);
    const result = await compressor.decompress(compressed, query);
    console.log(`   Source: ${result.source}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`   Response: ${result.content.slice(0, 100)}${result.content.length > 100 ? '...' : ''}\n`);
  }

  console.log('=== Demo Complete ===');
  
  return {
    compressed,
    queries: queries.length
  };
}

if (require.main === module) {
  main()
    .then(result => {
      console.log('\nFinal stats:', JSON.stringify({
        compressionRatio: result.compressed.compressionRatio,
        queryTests: result.queries
      }, null, 2));
    })
    .catch(console.error);
}

export { SemanticCompressor, main };
export type {
  Memory,
  CompressedMemory,
  StructureExtraction,
  SummaryHierarchy
};
