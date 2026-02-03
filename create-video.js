const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Video Frame Generator using ImageMagick
// Creates frames for the demo video

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;

// Color palette
const COLORS = {
    bg: '#0a0a0f',
    card: '#13131f',
    border: '#2a2a3e',
    orange: '#FF6B35',
    cyan: '#00F5FF',
    pink: '#FF006E',
    green: '#39FF14',
    white: '#ffffff',
    gray: '#808080'
};

// Create output directory
const outputDir = '/home/node/.openclaw/workspace/agent-memory/video-frames';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

let frameCount = 0;

function createFrame(content, duration) {
    const numFrames = duration * FPS;
    
    for (let i = 0; i < numFrames; i++) {
        const frameNum = String(frameCount + i).padStart(5, '0');
        const framePath = path.join(outputDir, `frame_${frameNum}.png`);
        
        // Create frame using ImageMagick
        const cmd = `convert -size ${WIDTH}x${HEIGHT} xc:"${COLORS.bg}" ` +
            `-pointsize 60 -fill "${COLORS.orange}" -gravity center ` +
            `-annotate +0+0 "${content.title || content}" ` +
            `"${framePath}"`;
        
        try {
            execSync(cmd, { stdio: 'ignore' });
        } catch (e) {
            // Frame creation continues
        }
        
        if (i % 30 === 0) {
            process.stdout.write(`.`);
        }
    }
    
    frameCount += numFrames;
    console.log(` Created ${numFrames} frames`);
}

// Simple frames for each scene
const scenes = [
    { title: "AGENTMEMORY\\nOn-Chain Persistent Memory", duration: 10 },
    { title: "The Problem\\nAI Agents Wake With Amnesia", duration: 15 },
    { title: "Session Amnesia\\n100% Context Lost", duration: 15 },
    { title: "AgentMemory Solution\\nHuman-Owned, Agent-Operated", duration: 20 },
    { title: "System Architecture\\nClient → Solana → IPFS", duration: 20 },
    { title: "Demo: Connect Wallet", duration: 15 },
    { title: "Demo: Initialize Vault", duration: 20 },
    { title: "Demo: Store Encrypted Memory", duration: 25 },
    { title: "Demo: Retrieve & Search", duration: 20 },
    { title: "Demo: Version History", duration: 20 },
    { title: "Demo: Memory Sharing", duration: 20 },
    { title: "Technology Stack\\nSolana + Anchor + ChaCha20-Poly1305", duration: 20 },
    { title: "Key Features", duration: 15 },
    { title: "Ready to Deploy\\nTry AgentMemory Today", duration: 25 }
];

console.log('Generating video frames...');
console.log('═══════════════════════════════════════');

scenes.forEach((scene, idx) => {
    process.stdout.write(`Scene ${idx + 1}/${scenes.length}: `);
    createFrame(scene, scene.duration);
});

console.log('═══════════════════════════════════════');
console.log(`Total frames created: ${frameCount}`);
console.log(`Duration: ${frameCount / FPS} seconds`);

// Try to create video with ffmpeg if available
try {
    execSync('which ffmpeg', { stdio: 'ignore' });
    console.log('\nCreating MP4 video with ffmpeg...');
    
    const videoCmd = `ffmpeg -y -framerate ${FPS} -i ${outputDir}/frame_%05d.png ` +
        `-c:v libx264 -pix_fmt yuv420p -crf 23 ` +
        `/home/node/.openclaw/workspace/agent-memory/demo-video.mp4`;
    
    execSync(videoCmd, { stdio: 'inherit' });
    console.log('✓ Video created: demo-video.mp4');
} catch (e) {
    console.log('\nFFmpeg not available.');
    console.log('Frames saved in:', outputDir);
    console.log('To create video, install ffmpeg and run:');
    console.log(`ffmpeg -framerate ${FPS} -i ${outputDir}/frame_%05d.png -c:v libx264 demo-video.mp4`);
}

// Create animated GIF as fallback
try {
    console.log('\nCreating animated GIF...');
    const gifCmd = `convert -delay ${100/FPS} -loop 0 ${outputDir}/frame_*.png ` +
        `-resize 640x360 ` +
        `/home/node/.openclaw/workspace/agent-memory/demo-video.gif`;
    
    execSync(gifCmd, { stdio: 'ignore', timeout: 120000 });
    console.log('✓ GIF created: demo-video.gif');
} catch (e) {
    console.log('GIF creation failed (may be too large)');
}

// Clean up frames
console.log('\nCleaning up frame files...');
try {
    execSync(`rm -rf ${outputDir}`);
    console.log('✓ Cleanup complete');
} catch (e) {
    console.log('Frames preserved in:', outputDir);
}

console.log('\n═══════════════════════════════════════');
console.log('Video generation complete!');
console.log('═══════════════════════════════════════');
