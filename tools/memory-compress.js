#!/usr/bin/env node
/**
 * Memory Compression Tool
 * 
 * Compresses conversations and long-form content into condensed memories.
 * Reduces token usage by extracting only the key facts.
 * 
 * Usage:
 *   node memory-compress.js --file conversation.md
 *   node memory-compress.js --text "User: ...\nAssistant: ..."
 *   node memory-compress.js --input large-memory.md --output compressed.md
 */

const fs = require('fs');

// Compression templates for different memory types
const COMPRESSION_TEMPLATES = {
    conversation: `
You are a memory compression AI. Extract the essential information from this conversation 
and create a condensed memory. Focus on persistent facts, not transient chat.

CONVERSATION:
{{content}}

INSTRUCTIONS:
1. Identify key facts about the user (preferences, identity, goals)
2. Note any decisions made or important conclusions
3. Extract specific details (names, dates, numbers, locations)
4. IGNORE: greetings, small talk, pleasantries
5. IGNORE: temporary context that won't matter later

OUTPUT FORMAT (JSON):
{
    "summary": "One-sentence overview of what happened",
    "facts": ["List of key facts extracted"],
    "preferences": ["User preferences revealed"],
    "goals": ["Goals, plans, or intentions stated"],
    "decisions": ["Decisions made"],
    "entities": {
        "people": ["Names mentioned"],
        "places": ["Locations mentioned"],
        "things": ["Objects, technologies, concepts"]
    },
    "tokens_saved": "estimated percentage"
}

RULES:
- Be extremely concise (aim for <100 tokens vs original)
- Preserve specific details (dates, names, numbers)
- Use third person ("User..." not "You...")
- Focus on what should be remembered long-term
`,

    session: `
Summarize this session into key takeaways. What should be remembered?

SESSION LOG:
{{content}}

OUTPUT:
- What was accomplished?
- What was learned?
- What decisions were made?
- What should carry forward?

Keep it under 5 bullet points, 1 sentence each.
`,

    notes: `
Compress these notes into the essential information.

NOTES:
{{content}}

Extract:
1. Core concepts
2. Key takeaways
3. Action items (if any)
4. References to explore further

Be concise. Remove redundancy.
`,
};

/**
 * Simple rule-based compression (no LLM required)
 * Falls back when LLM not available
 */
function ruleBasedCompress(content, type = 'conversation') {
    const lines = content.split('\n').filter(l => l.trim());
    const facts = [];
    const preferences = [];
    const goals = [];
    
    // Patterns to extract
    const patterns = {
        preference: /\b(prefer|like|dislike|favorite|hate|love|enjoy)\b/gi,
        goal: /\b(goal|want|plan|aim|need to|should|will|going to)\b/gi,
        decision: /\b(decided|chose|picked|selected|going with)\b/gi,
        identity: /\b(my name is|i am|i work|i live|call me)\b/gi,
        location: /\b(in|at|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
        date: /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,
    };
    
    // Extract sentences with key patterns
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        // Skip greetings and pleasantries
        if (/^(hi|hello|hey|thanks|thank you|bye|goodbye|ok|okay|great|nice)/i.test(line)) {
            continue;
        }
        
        // Skip questions (usually transient)
        if (line.trim().endsWith('?')) {
            continue;
        }
        
        // Extract preference statements
        if (patterns.preference.test(line)) {
            const cleaned = line.replace(/^(user|assistant|ai|bot):\s*/i, '').trim();
            if (cleaned.length > 10 && !cleaned.match(/^(hi|hello|hey)\b/i)) {
                preferences.push(cleaned);
            }
        }
        
        // Extract goal statements
        if (patterns.goal.test(line)) {
            const cleaned = line.replace(/^(user|assistant|ai|bot):\s*/i, '').trim();
            if (cleaned.length > 10 && cleaned.length < 200) {
                goals.push(cleaned);
            }
        }
        
        // Extract identity statements
        if (patterns.identity.test(line)) {
            const cleaned = line.replace(/^(user|assistant|ai|bot):\s*/i, '').trim();
            if (cleaned.length > 5) {
                facts.push(cleaned);
            }
        }
    }
    
    // Build compressed output
    const parts = [];
    
    if (facts.length > 0) {
        parts.push('Facts:', ...facts.map(f => `• ${f}`));
    }
    
    if (preferences.length > 0) {
        parts.push('', 'Preferences:', ...preferences.map(p => `• ${p}`));
    }
    
    if (goals.length > 0) {
        parts.push('', 'Goals:', ...goals.map(g => `• ${g}`));
    }
    
    const originalTokens = estimateTokens(content);
    const compressedTokens = estimateTokens(parts.join('\n'));
    const tokensSaved = originalTokens - compressedTokens;
    const savingsPercent = originalTokens > 0 ? Math.round((tokensSaved / originalTokens) * 100) : 0;
    
    return {
        compressed: parts.join('\n'),
        originalTokens,
        compressedTokens,
        tokensSaved,
        savingsPercent,
        method: 'rule-based',
    };
}

/**
 * Rough token estimation (1 token ≈ 4 characters for English)
 */
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

/**
 * Create LLM compression prompt
 */
function createCompressionPrompt(content, type = 'conversation') {
    const template = COMPRESSION_TEMPLATES[type] || COMPRESSION_TEMPLATES.conversation;
    return template.replace('{{content}}', content);
}

/**
 * Calculate compression metrics
 */
function analyzeCompression(original, compressed) {
    const originalTokens = estimateTokens(original);
    const compressedTokens = estimateTokens(compressed);
    const savings = originalTokens - compressedTokens;
    const ratio = originalTokens > 0 ? (compressedTokens / originalTokens).toFixed(2) : '0.00';
    
    return {
        originalTokens,
        compressedTokens,
        tokensSaved: Math.max(0, savings),
        savingsPercent: originalTokens > 0 ? Math.max(0, Math.round((savings / originalTokens) * 100)) : 0,
        compressionRatio: ratio,
    };
}

/**
 * Compress a memory file
 */
function compressMemoryFile(inputPath, options = {}) {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`File not found: ${inputPath}`);
    }
    
    const content = fs.readFileSync(inputPath, 'utf8');
    const type = options.type || detectType(content);
    
    // Try to compress
    const result = ruleBasedCompress(content, type);
    
    // Add metadata
    result.inputFile = inputPath;
    result.type = type;
    result.timestamp = new Date().toISOString();
    
    return result;
}

/**
 * Detect content type from structure
 */
function detectType(content) {
    const lines = content.split('\n');
    
    // Check for conversation markers
    const hasSpeakers = lines.some(l => /^(user|assistant|ai|bot|human):/i.test(l));
    if (hasSpeakers) {
        return 'conversation';
    }
    
    // Check for list structure
    const hasLists = lines.filter(l => /^[\s]*[-•*]\s/.test(l)).length > 5;
    if (hasLists) {
        return 'notes';
    }
    
    return 'session';
}

/**
 * Batch compress multiple files
 */
function batchCompress(pattern, outputDir) {
    const glob = require('glob');
    const files = glob.sync(pattern);
    
    const results = [];
    
    for (const file of files) {
        try {
            const result = compressMemoryFile(file);
            
            if (outputDir) {
                const basename = path.basename(file);
                const outputPath = path.join(outputDir, `compressed_${basename}`);
                fs.writeFileSync(outputPath, result.compressed);
                result.outputFile = outputPath;
            }
            
            results.push(result);
        } catch (error) {
            results.push({
                inputFile: file,
                error: error.message,
            });
        }
    }
    
    return results;
}

/**
 * CLI interface
 */
function main() {
    const args = process.argv.slice(2);
    
    // Parse arguments
    let inputFile = null;
    let outputFile = null;
    let text = null;
    let type = 'conversation';
    let showStats = true;
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--file':
            case '-f':
                inputFile = args[++i];
                break;
            case '--output':
            case '-o':
                outputFile = args[++i];
                break;
            case '--text':
            case '-t':
                text = args[++i];
                break;
            case '--type':
                type = args[++i];
                break;
            case '--no-stats':
                showStats = false;
                break;
            case '--help':
            case '-h':
                console.log(`
Memory Compression Tool

Usage:
  node memory-compress.js --file conversation.md
  node memory-compress.js --text "User: ...\nAssistant: ..." --type conversation
  node memory-compress.js --file large.md --output compressed.md

Options:
  --file, -f       Input file to compress
  --text, -t       Direct text input
  --output, -o     Output file (default: stdout)
  --type           Content type: conversation|session|notes
  --no-stats       Don't show compression statistics
  --help, -h       Show this help

Examples:
  # Compress a conversation log
  node memory-compress.js --file chat-log.md

  # Compress and save to file
  node memory-compress.js --file notes.md --output compressed-notes.md

  # Compress text directly
  node memory-compress.js --text "User: I prefer dark mode..." --type conversation
`);
                process.exit(0);
        }
    }
    
    let result;
    
    if (inputFile) {
        result = compressMemoryFile(inputFile, { type });
    } else if (text) {
        result = ruleBasedCompress(text, type);
        result.inputFile = '<stdin>';
    } else {
        console.error('Error: Provide --file or --text');
        process.exit(1);
    }
    
    if (result.error) {
        console.error('Error:', result.error);
        process.exit(1);
    }
    
    // Output compressed content
    if (outputFile) {
        fs.writeFileSync(outputFile, result.compressed);
        console.log(`✓ Compressed saved to: ${outputFile}`);
    } else {
        console.log('\n=== COMPRESSED MEMORY ===\n');
        console.log(result.compressed);
    }
    
    // Show stats
    if (showStats) {
        console.log('\n=== COMPRESSION STATS ===');
        console.log(`Original tokens:    ${result.originalTokens}`);
        console.log(`Compressed tokens:  ${result.compressedTokens}`);
        console.log(`Tokens saved:       ${result.tokensSaved} (${result.savingsPercent}%)`);
        console.log(`Method:             ${result.method}`);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

// Export for use as module
module.exports = {
    ruleBasedCompress,
    compressMemoryFile,
    batchCompress,
    createCompressionPrompt,
    analyzeCompression,
    estimateTokens,
    detectType,
};
