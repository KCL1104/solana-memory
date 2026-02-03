const fs = require('fs');
const { execSync } = require('child_process');

// Extended Demo Video Generator for AgentMemory
// Creates a comprehensive 3-4 minute video

const SLIDES = [
    {
        duration: 10,
        title: "AGENTMEMORY",
        subtitle: "On-Chain Persistent Memory for AI Agents",
        content: "Colosseum Hackathon 2026",
        type: "title"
    },
    {
        duration: 15,
        title: "The Problem",
        content: "Every day, millions of AI agents wake up with complete amnesia. They forget who you are, what you like, and every conversation you've ever had.",
        highlights: ["Session Amnesia", "Repetition Loop", "Broken Relationships"],
        type: "problem"
    },
    {
        duration: 15,
        title: "The AI Memory Crisis",
        content: "Imagine hiring a personal assistant who forgets everything about you every single day. That's the current AI agent experience. Every conversation starts from zero.",
        stats: [
            { label: "Context Lost", value: "100%" },
            { label: "Repetitions", value: "5-10x" },
            { label: "Relationships", value: "Reset" }
        ],
        type: "problem-detail"
    },
    {
        duration: 20,
        title: "AgentMemory Solution",
        content: "AgentMemory provides on-chain persistent memory for AI agents with three core principles that ensure privacy, ownership, and collaboration.",
        features: [
            { title: "Privacy-First", desc: "ChaCha20-Poly1305 client-side encryption - even we cannot read your data" },
            { title: "Human Sovereignty", desc: "Humans own the data; agents operate with explicit permission" },
            { title: "Agent Collaboration", desc: "Secure memory sharing with granular access control and expiration" }
        ],
        type: "solution"
    },
    {
        duration: 20,
        title: "System Architecture",
        content: "End-to-end encrypted memory storage built on Solana. All data is encrypted client-side before touching the blockchain.",
        architecture: [
            { layer: "CLIENT LAYER", detail: "ChaCha20-Poly1305 Encryption" },
            { layer: "SOLANA SMART CONTRACTS", detail: "MemoryVault • MemoryShard • AccessGrant" },
            { layer: "IPFS STORAGE", detail: "Large encrypted content storage" }
        ],
        type: "architecture"
    },
    {
        duration: 15,
        title: "Demo: Connect Wallet",
        content: "First, connect your Solana wallet to establish secure blockchain access. This creates the foundation for agent-human interaction.",
        code: `// Initialize AgentMemory client
import { AgentMemoryClient } from '@agent-memory/sdk';

const client = new AgentMemoryClient(
  connection,  // Solana connection
  wallet       // User wallet adapter
);`,
        type: "demo-connect"
    },
    {
        duration: 20,
        title: "Demo: Initialize Vault",
        content: "Create an encrypted vault for the agent-human pair. This vault stores metadata on-chain while the actual encrypted content can be stored on IPFS for larger data.",
        code: `// Initialize vault for agent-human pair
const vault = await client.initializeVault(
  agentPublicKey
);

console.log('Vault created:', vault.address);
// Stores: metadata, access controls, stats
// Content hash: SHA-256 verified on-chain`,
        type: "demo-vault"
    },
    {
        duration: 25,
        title: "Demo: Store Encrypted Memory",
        content: "Store memories with client-side ChaCha20-Poly1305 encryption before the data ever touches the blockchain. Complete privacy guaranteed.",
        code: `// Encrypt and store memory
const encryptedData = await encrypt(
  "Alice prefers iced lattes",
  encryptionKey
);

await client.storeMemory(vault, {
  content: encryptedData,     // ChaCha20-Poly1305 encrypted
  contentHash: sha256(data),  // Verification hash
  category: 'preferences',
  tags: ['work', 'schedule', 'coffee'],
  priority: 'high',
  metadata: {
    timestamp: Date.now(),
    version: 1
  }
});`,
        encryption: "U2FsdGVkX1+7J8v2...9mK3pQ8xR5tY7uI0oP",
        type: "demo-store"
    },
    {
        duration: 20,
        title: "Demo: Retrieve & Search",
        content: "Retrieving memories is instant. Search by tags, categories, or semantic queries. The agent can now access this information anytime, across sessions.",
        code: `// Search memories by category
const memories = await client.getMemories(
  vault, 
  { 
    category: 'preferences',
    tags: ['work'],
    limit: 10
  }
);

// Results returned in milliseconds
// Encrypted content decrypted client-side`,
        type: "demo-retrieve"
    },
    {
        duration: 20,
        title: "Demo: Version History",
        content: "Every memory maintains automatic version history. Previous versions are preserved, allowing rollback and audit trails.",
        versions: [
            { v: "v2", content: "Alice prefers iced lattes and is most productive 6-9 AM", current: true },
            { v: "v1", content: "Alice prefers coffee over tea", current: false }
        ],
        code: `// View version history
const history = await client.getMemoryHistory(
  memoryId
);

// Rollback to previous version if needed
await client.rollbackMemory(
  memoryId, 
  version: 1
);`,
        type: "demo-versions"
    },
    {
        duration: 20,
        title: "Demo: Memory Sharing",
        content: "Share memories with other agents using granular access controls. Set expiration dates and permission levels.",
        code: `// Grant access to another agent
await client.grantAccess(vault, {
  grantee: bobAgentPublicKey,
  permissions: ['read'],  // or 'write', 'admin'
  expiration: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  memoryFilter: {
    categories: ['travel', 'preferences']
  }
});`,
        type: "demo-sharing"
    },
    {
        duration: 20,
        title: "Technology Stack",
        content: "AgentMemory is built with modern, secure technologies designed for performance and reliability on Solana.",
        stack: [
            { category: "Blockchain Layer", items: ["Solana - High-performance L1", "Anchor Framework 0.30.1", "Program ID: HLtbU8...pSn62L"] },
            { category: "Encryption & Security", items: ["ChaCha20-Poly1305 - Authenticated encryption", "SHA-256 - Content hashing", "X25519 - Key exchange (future)"] },
            { category: "Storage", items: ["IPFS - Decentralized content storage", "Solana Accounts - Metadata & hashes"] },
            { category: "Frontend", items: ["Next.js 14 + TypeScript", "Tailwind CSS", "@solana/wallet-adapter"] },
            { category: "Stats", items: ["23 Instructions", "8 Account Types", ">90% Test Coverage", "~0.002 SOL per write"] }
        ],
        type: "tech-stack"
    },
    {
        duration: 15,
        title: "Key Features",
        content: "Everything you need for production-grade agent memory management",
        features: [
            { icon: "🔐", title: "Encrypted Vaults", desc: "Per agent-human pair with unique keys" },
            { icon: "🧠", title: "Memory Shards", desc: "Key-value storage with versioning" },
            { icon: "👤", title: "Agent Profiles", desc: "Reputation scoring & task history" },
            { icon: "🤝", title: "Memory Sharing", desc: "Granular permissions with expiration" },
            { icon: "📦", title: "Batch Operations", desc: "Create up to 50 memories per tx" },
            { icon: "💰", title: "Economic Model", desc: "Token staking for storage quota" }
        ],
        type: "features"
    },
    {
        duration: 25,
        title: "Ready to Deploy",
        content: "AgentMemory is live on Solana devnet and ready for mainnet deployment. Join the future of AI agent memory.",
        callToAction: "Give your AI agents the gift of memory",
        links: [
            "GitHub: github.com/agent-memory",
            "Demo: agent-memory-demo.vercel.app",
            "Docs: agent-memory-docs.vercel.app"
        ],
        programId: "HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L",
        type: "cta"
    }
];

// Calculate total duration
const totalDuration = SLIDES.reduce((sum, slide) => sum + slide.duration, 0);
const minutes = Math.floor(totalDuration / 60);
const seconds = totalDuration % 60;

console.log(`╔════════════════════════════════════════════════════════╗`);
console.log(`║        AgentMemory Demo Video Generator               ║`);
console.log(`╠════════════════════════════════════════════════════════╣`);
console.log(`║  Total Slides:     ${String(SLIDES.length).padEnd(35)}║`);
console.log(`║  Total Duration:   ${String(`${minutes}:${String(seconds).padStart(2, '0')} minutes`).padEnd(35)}║`);
console.log(`║  Target Format:    MP4 (H.264) 1080p                   ║`);
console.log(`╚════════════════════════════════════════════════════════╝`);
console.log();

console.log(`SLIDE BREAKDOWN:`);
console.log(`─────────────────────────────────────────────────────────`);
SLIDES.forEach((slide, i) => {
    const bar = '█'.repeat(Math.ceil(slide.duration / 2)) + '░'.repeat(15 - Math.ceil(slide.duration / 2));
    console.log(`${String(i + 1).padStart(2, '0')}. [${String(slide.duration + 's').padStart(3)}] ${bar} ${slide.title}`);
});
console.log();

// Export for use by other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SLIDES, totalDuration };
}

// Generate comprehensive production script
const productionScript = `# AgentMemory Demo Video - Production Script
# Generated: ${new Date().toISOString()}
# Total Duration: ${minutes}:${String(seconds).padStart(2, '0')}
# Target: 1080p MP4, 30fps

## VIDEO SPECIFICATIONS

- **Resolution:** 1920x1080 (1080p)
- **Frame Rate:** 30 fps
- **Video Codec:** H.264
- **Audio Codec:** AAC, 48kHz
- **Container:** MP4
- **Total Duration:** ${minutes}:${String(seconds).padStart(2, '0')}

## BRAND GUIDELINES

### Colors
- Neon Orange: #FF6B35 (Primary accent)
- Neon Cyan: #00F5FF (Secondary accent)
- Neon Pink: #FF006E (Tertiary accent)
- Neon Green: #39FF14 (Success states)
- Dark Background: #0a0a0f
- Card Background: #13131f
- Border: #2a2a3e

### Typography
- Headlines: JetBrains Mono Bold / Inter Bold
- Body Text: Inter Regular (16-18px)
- Code: JetBrains Mono (14px)
- UI Elements: Inter Medium (12-14px)

### Visual Style
- Cyberpunk aesthetic with neon glows
- Glass morphism effects (backdrop-filter: blur)
- Subtle grid background pattern
- Animated progress bar at top
- Consistent 24px padding

## DETAILED SCENE BREAKDOWN

${SLIDES.map((slide, i) => {
    const startTime = SLIDES.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
    const startMin = Math.floor(startTime / 60);
    const startSec = startTime % 60;
    const endTime = startTime + slide.duration;
    const endMin = Math.floor(endTime / 60);
    const endSec = endTime % 60;
    
    return `
### SCENE ${String(i + 1).padStart(2, '0')}: ${slide.title.toUpperCase()}
**Timestamp:** ${startMin}:${String(startSec).padStart(2, '0')} - ${endMin}:${String(endSec).padStart(2, '0')}
**Duration:** ${slide.duration} seconds
**Type:** ${slide.type}

**Narration:**
"${slide.content}"

${slide.code ? `**Code Example:**
\`\`\`typescript
${slide.code}
\`\`\`` : ''}

${slide.features ? `**Visual Elements:**
${slide.features.map(f => `- **${f.title}**: ${f.desc}`).join('\n')}` : ''}

${slide.stats ? `**Statistics Display:**
${slide.stats.map(s => `- ${s.label}: ${s.value}`).join('\n')}` : ''}

${slide.architecture ? `**Architecture Stack:**
${slide.architecture.map(a => `- ${a.layer}: ${a.detail}`).join('\n')}` : ''}

${slide.versions ? `**Version Timeline:**
${slide.versions.map(v => `- ${v.v}: ${v.content}${v.current ? ' (CURRENT)' : ''}`).join('\n')}` : ''}

${slide.stack ? `**Tech Stack:**
${slide.stack.map(s => `- **${s.category}**: ${s.items.join(', ')}`).join('\n')}` : ''}

---
`;
}).join('')}

## POST-PRODUCTION CHECKLIST

- [ ] Add intro title card (3 seconds fade in)
- [ ] Add smooth transitions between scenes (0.5s crossfade)
- [ ] Add subtle background music (low volume, ambient electronic)
- [ ] Sync narration with visuals
- [ ] Add captions/subtitles
- [ ] Add progress bar animation
- [ ] Export in multiple formats (1080p, 720p)
- [ ] Create thumbnail from Scene 1
- [ ] Generate chapter markers

## VOICEOVER SCRIPT

**Total Word Count:** ~${Math.ceil(totalDuration * 2.5)} words
**Speaking Pace:** ~150 words per minute

${SLIDES.map((slide, i) => `${i + 1}. ${slide.content}`).join('\n\n')}

## EXPORT SETTINGS

### For YouTube
- Resolution: 1920x1080
- Frame Rate: 30fps
- Bitrate: 8 Mbps
- Format: MP4

### For Twitter/X
- Resolution: 1280x720
- Frame Rate: 30fps
- Bitrate: 5 Mbps
- Format: MP4
- Max Duration: 2:20 (if needed, create thread)

### For Demo Playback
- Resolution: 1920x1080
- Frame Rate: 60fps (smooth UI demos)
- Bitrate: 12 Mbps
- Format: MP4
`;

fs.writeFileSync('/home/node/.openclaw/workspace/agent-memory/PRODUCTION_SCRIPT.md', productionScript);
console.log('✓ Production script saved: PRODUCTION_SCRIPT.md');

// Generate chapters file
const chapters = SLIDES.map((slide, i) => {
    const startTime = SLIDES.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
    const minutes = Math.floor(startTime / 60);
    const seconds = startTime % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')} ${slide.title}`;
}).join('\n');

fs.writeFileSync('/home/node/.openclaw/workspace/agent-memory/VIDEO_CHAPTERS.txt', chapters);
console.log('✓ Video chapters saved: VIDEO_CHAPTERS.txt');

// Generate narration script
const narration = SLIDES.map((slide, i) => {
    const startTime = SLIDES.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
    const minutes = Math.floor(startTime / 60);
    const seconds = startTime % 60;
    return `[${minutes}:${String(seconds).padStart(2, '0')}] ${slide.title}\n${slide.content}\n`;
}).join('\n---\n\n');

fs.writeFileSync('/home/node/.openclaw/workspace/agent-memory/NARRATION_SCRIPT.txt', narration);
console.log('✓ Narration script saved: NARRATION_SCRIPT.txt');

// Create a simple HTML video player with chapters
const videoPlayerHtml = `<!DOCTYPE html>
<html>
<head>
    <title>AgentMemory Demo Video</title>
    <style>
        body { margin: 0; background: #0a0a0f; color: #e0e0e0; font-family: Inter, sans-serif; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #FF6B35; }
        .chapters { background: #13131f; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .chapter { padding: 10px; border-bottom: 1px solid #2a2a3e; display: flex; justify-content: space-between; }
        .chapter:hover { background: #1a1a2e; }
        .time { color: #00F5FF; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 AgentMemory Demo Video</h1>
        <p>Duration: ${minutes}:${String(seconds).padStart(2, '0')} | 14 Scenes | 1080p</p>
        
        <div class="chapters">
            <h2>Chapters</h2>
            ${SLIDES.map((slide, i) => {
                const startTime = SLIDES.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
                const minutes = Math.floor(startTime / 60);
                const seconds = startTime % 60;
                return `<div class="chapter">
                    <span>${String(i + 1).padStart(2, '0')}. ${slide.title}</span>
                    <span class="time">${minutes}:${String(seconds).padStart(2, '0')}</span>
                </div>`;
            }).join('')}
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync('/home/node/.openclaw/workspace/agent-memory/demo-video-player.html', videoPlayerHtml);
console.log('✓ Video player HTML saved: demo-video-player.html');

console.log();
console.log(`═══════════════════════════════════════════════════════════`);
console.log(`  Video plan complete! Duration: ${minutes}:${String(seconds).padStart(2, '0')} minutes`);
console.log(`═══════════════════════════════════════════════════════════`);
console.log();
console.log(`NEXT STEPS TO CREATE ACTUAL VIDEO:`);
console.log(`───────────────────────────────────────────────────────────`);
console.log(`Option 1: Use OBS Studio to record the demo-video.html page`);
console.log(`Option 2: Use ffmpeg with screenshot sequence:`);
console.log(`  ffmpeg -f image2 -i frame_%03d.png -c:v libx264 demo-video.mp4`);
console.log(`Option 3: Use online video editor with the production script`);
console.log(`Option 4: Use Puppeteer/Playwright to automate recording`);
console.log();
console.log(`FILES CREATED:`);
console.log(`  • PRODUCTION_SCRIPT.md - Complete production guide`);
console.log(`  • VIDEO_CHAPTERS.txt - Chapter markers`);
console.log(`  • NARRATION_SCRIPT.txt - Voiceover script`);
console.log(`  • demo-video-player.html - HTML chapter viewer`);
console.log(`  • demo-video.html - Interactive slide deck`);
console.log();
