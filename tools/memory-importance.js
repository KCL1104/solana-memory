#!/usr/bin/env node
/**
 * Memory Importance Calculator
 * 
 * Calculates importance scores for memories based on:
 * - Content signals (preferences, decisions, goals, identity)
 * - Memory type (identity > goal > decision > preference > ...)
 * - Access patterns (frequency of use)
 * - Recency (time decay)
 * - User engagement (reactions, tags)
 * 
 * Usage:
 *   node memory-importance.js --content "User prefers dark mode" --type preference
 *   node memory-importance.js --file memory/2026-02-13.md
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const CONFIG = {
    // Content signal weights (max 0.4)
    contentSignals: {
        preference: { keywords: ['prefer', 'preference', 'like', 'dislike', 'favorite'], weight: 0.15 },
        decision: { keywords: ['decision', 'decided', 'chose', 'choice', 'picked', 'selected'], weight: 0.15 },
        goal: { keywords: ['goal', 'want', 'plan', 'aim', 'objective', 'target', 'milestone'], weight: 0.15 },
        identity: { keywords: ['identity', 'i am', 'my name', 'call me', 'i\'m ', 'i work', 'i live'], weight: 0.20 },
        lesson: { keywords: ['lesson', 'learned', 'mistake', 'realized', 'discovered', 'insight'], weight: 0.10 },
    },
    
    // Type baselines (sum to 0.2)
    typeBaselines: {
        identity: 0.20,
        goal: 0.18,
        decision: 0.16,
        preference: 0.15,
        lesson: 0.12,
        skill: 0.10,
        fact: 0.08,
        event: 0.05,
    },
    
    // Access pattern (max 0.2)
    accessWeight: 0.03,
    maxAccessScore: 0.20,
    
    // Recency (max 0.1)
    recencyWeight: 0.1,
    recencyDecay: 0.005,  // Half-life ~6 days
    
    // Engagement (max 0.1)
    engagementWeights: {
        userReaction: 0.10,
        criticalTag: 0.10,
        importantTag: 0.05,
    },
};

/**
 * Calculate content-based score
 */
function calculateContentScore(content, signals) {
    const content_lower = content.toLowerCase();
    let score = 0;
    
    for (const [type, config] of Object.entries(signals)) {
        const hasKeyword = config.keywords.some(kw => content_lower.includes(kw.toLowerCase()));
        if (hasKeyword) {
            score += config.weight;
        }
    }
    
    return Math.min(score, 0.4);
}

/**
 * Calculate type baseline score
 */
function calculateTypeScore(type, baselines) {
    return baselines[type.toLowerCase()] || 0.05;
}

/**
 * Calculate access pattern score
 */
function calculateAccessScore(accessCount, config) {
    return Math.min(accessCount * config.accessWeight, config.maxAccessScore);
}

/**
 * Calculate recency score with exponential decay
 */
function calculateRecencyScore(createdAt, config) {
    const now = new Date();
    const created = new Date(createdAt);
    const ageHours = (now - created) / (1000 * 60 * 60);
    
    // Exponential decay: score = weight * e^(-decay * age)
    return config.recencyWeight * Math.exp(-config.recencyDecay * ageHours);
}

/**
 * Calculate engagement score
 */
function calculateEngagementScore(tags = [], hasReaction = false, weights) {
    let score = 0;
    
    if (hasReaction) {
        score += weights.userReaction;
    }
    
    const tagList = tags.map(t => t.toLowerCase());
    if (tagList.includes('critical')) {
        score += weights.criticalTag;
    } else if (tagList.includes('important')) {
        score += weights.importantTag;
    }
    
    return Math.min(score, 0.1);
}

/**
 * Calculate total importance score
 */
function calculateImportance(memory) {
    const content = memory.content || '';
    const type = memory.type || 'fact';
    const accessCount = memory.access_count || 0;
    const createdAt = memory.created || new Date().toISOString();
    const tags = memory.tags || [];
    const hasReaction = memory.user_reaction || false;
    
    // Component scores
    const contentScore = calculateContentScore(content, CONFIG.contentSignals);
    const typeScore = calculateTypeScore(type, CONFIG.typeBaselines);
    const accessScore = calculateAccessScore(accessCount, CONFIG);
    const recencyScore = calculateRecencyScore(createdAt, CONFIG);
    const engagementScore = calculateEngagementScore(tags, hasReaction, CONFIG.engagementWeights);
    
    // Total (capped at 1.0)
    const total = Math.min(
        contentScore + typeScore + accessScore + recencyScore + engagementScore,
        1.0
    );
    
    return {
        total: Math.round(total * 100) / 100,
        breakdown: {
            content: Math.round(contentScore * 100) / 100,
            type: Math.round(typeScore * 100) / 100,
            access: Math.round(accessScore * 100) / 100,
            recency: Math.round(recencyScore * 100) / 100,
            engagement: Math.round(engagementScore * 100) / 100,
        },
        details: {
            matchedKeywords: findMatchedKeywords(content, CONFIG.contentSignals),
            ageHours: Math.round((new Date() - new Date(createdAt)) / (1000 * 60 * 60)),
        }
    };
}

/**
 * Find which keywords matched in content
 */
function findMatchedKeywords(content, signals) {
    const content_lower = content.toLowerCase();
    const matched = [];
    
    for (const [type, config] of Object.entries(signals)) {
        const matches = config.keywords.filter(kw => content_lower.includes(kw.toLowerCase()));
        if (matches.length > 0) {
            matched.push(`${type}: ${matches.join(', ')}`);
        }
    }
    
    return matched;
}

/**
 * Parse memory file with YAML frontmatter
 */
function parseMemoryFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (frontmatterMatch) {
        const frontmatter = yaml.load(frontmatterMatch[1]);
        const body = frontmatterMatch[2].trim();
        
        return {
            ...frontmatter,
            content: body,
        };
    }
    
    // No frontmatter - treat entire file as content
    return {
        content: content.trim(),
        type: 'fact',
        created: fs.statSync(filePath).birthtime.toISOString(),
    };
}

/**
 * Determine appropriate tier based on importance
 */
function determineTier(importanceScore, accessCount = 0, tags = []) {
    const tagList = tags.map(t => t.toLowerCase());
    
    // Hot tier criteria
    if (
        importanceScore >= 0.7 ||
        accessCount >= 5 ||
        tagList.includes('critical') ||
        tagList.includes('hot')
    ) {
        return 'hot';
    }
    
    // Warm tier criteria
    if (
        importanceScore >= 0.4 ||
        accessCount >= 2 ||
        tagList.includes('warm')
    ) {
        return 'warm';
    }
    
    // Cold tier
    return 'cold';
}

/**
 * Generate memory with frontmatter
 */
function generateMemoryFile(memory) {
    const importance = calculateImportance(memory);
    const tier = determineTier(importance.total, memory.access_count, memory.tags);
    
    const frontmatter = {
        id: memory.id || `mem_${Date.now()}`,
        type: memory.type || 'fact',
        importance: importance.total,
        tags: memory.tags || [],
        access_count: memory.access_count || 0,
        created: memory.created || new Date().toISOString(),
        modified: new Date().toISOString(),
        tier: tier,
    };
    
    const yamlContent = yaml.dump(frontmatter, { lineWidth: -1 });
    
    return `---\n${yamlContent}---\n\n${memory.content || ''}`;
}

/**
 * CLI interface
 */
function main() {
    const args = process.argv.slice(2);
    
    // Parse arguments
    let content = '';
    let type = 'fact';
    let filePath = null;
    let accessCount = 0;
    let tags = [];
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--content':
            case '-c':
                content = args[++i];
                break;
            case '--type':
            case '-t':
                type = args[++i];
                break;
            case '--file':
            case '-f':
                filePath = args[++i];
                break;
            case '--access':
            case '-a':
                accessCount = parseInt(args[++i], 10);
                break;
            case '--tags':
                tags = args[++i].split(',').map(t => t.trim());
                break;
            case '--help':
            case '-h':
                console.log(`
Memory Importance Calculator

Usage:
  node memory-importance.js --content "User prefers dark mode" --type preference
  node memory-importance.js --file memory/2026-02-13.md
  node memory-importance.js --content "..." --type goal --access 3 --tags critical,preference

Options:
  --content, -c    Memory content text
  --type, -t       Memory type (identity|goal|decision|preference|lesson|skill|fact|event)
  --file, -f       Path to memory file with YAML frontmatter
  --access, -a     Number of times accessed (default: 0)
  --tags           Comma-separated tags
  --help, -h       Show this help
`);
                process.exit(0);
        }
    }
    
    let memory;
    
    if (filePath) {
        if (!fs.existsSync(filePath)) {
            console.error(`Error: File not found: ${filePath}`);
            process.exit(1);
        }
        memory = parseMemoryFile(filePath);
    } else {
        memory = {
            content,
            type,
            access_count: accessCount,
            tags,
            created: new Date().toISOString(),
        };
    }
    
    // Calculate importance
    const result = calculateImportance(memory);
    
    // Output results
    console.log('\n📊 Memory Importance Analysis\n');
    console.log('='.repeat(50));
    console.log(`Content: ${(memory.content || '').substring(0, 100)}${(memory.content || '').length > 100 ? '...' : ''}`);
    console.log(`Type: ${memory.type || 'fact'}`);
    console.log('='.repeat(50));
    console.log('\n🎯 Importance Score:', result.total.toFixed(2), '/ 1.0');
    console.log('\n📈 Breakdown:');
    console.log(`  Content signals:   ${result.breakdown.content.toFixed(2)} (max 0.40)`);
    console.log(`  Type baseline:     ${result.breakdown.type.toFixed(2)} (max 0.20)`);
    console.log(`  Access patterns:   ${result.breakdown.access.toFixed(2)} (max 0.20)`);
    console.log(`  Recency:           ${result.breakdown.recency.toFixed(2)} (max 0.10)`);
    console.log(`  Engagement:        ${result.breakdown.engagement.toFixed(2)} (max 0.10)`);
    
    if (result.details.matchedKeywords.length > 0) {
        console.log('\n🔍 Matched Keywords:');
        result.details.matchedKeywords.forEach(k => console.log(`  • ${k}`));
    }
    
    console.log(`\n⏱️  Age: ${result.details.ageHours} hours`);
    
    const tier = determineTier(result.total, memory.access_count, memory.tags);
    console.log(`\n📦 Recommended Tier: ${tier.toUpperCase()}`);
    
    if (tier === 'hot') {
        console.log('   → Store in MEMORY.md');
    } else if (tier === 'warm') {
        console.log('   → Store in memory/*.md');
    } else {
        console.log('   → Archive or keep in daily log');
    }
    
    console.log('\n' + '='.repeat(50));
}

// Run if called directly
if (require.main === module) {
    // Check if js-yaml is available
    try {
        require('js-yaml');
    } catch (e) {
        console.log('Note: Install js-yaml for full functionality: npm install js-yaml');
        console.log('Running in limited mode (no YAML parsing)\n');
    }
    
    main();
}

// Export for use as module
module.exports = {
    calculateImportance,
    determineTier,
    generateMemoryFile,
    parseMemoryFile,
    CONFIG,
};
