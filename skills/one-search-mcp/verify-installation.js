#!/usr/bin/env node
/**
 * OneSearch MCP Installation Verification Script
 * 
 * Usage: node verify-installation.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_PATH = '/home/node/.openclaw/workspace/skills/one-search-mcp';

console.log('🔍 OneSearch MCP Installation Verification\n');
console.log('=' .repeat(50));

// Check files
const requiredFiles = [
  'README.md',
  'QUICKSTART.md',
  'package.json',
  'scripts/one-search-wrapper-simple.js',
  'scripts/one-search-mcp-wrapper.js',
  'config/openclaw-example.json',
  'config/setup-snippet.md'
];

console.log('\n📁 File Check:');
let allFilesExist = true;
for (const file of requiredFiles) {
  const fullPath = path.join(BASE_PATH, file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

// Check Node.js version
console.log('\n🟢 Node.js Check:');
try {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  const ok = major >= 20;
  console.log(`  ${ok ? '✅' : '❌'} Node.js ${version} (require >= 20.0.0)`);
} catch (e) {
  console.log('  ❌ Cannot detect Node.js version');
}

// Check npx
console.log('\n📦 NPX Check:');
try {
  execSync('which npx', { stdio: 'ignore' });
  console.log('  ✅ npx available');
} catch (e) {
  console.log('  ❌ npx not found');
}

// Check one-search-mcp in cache
console.log('\n🔍 one-search-mcp Package Check:');
try {
  const cachePath = require('os').homedir() + '/.npm/_npx';
  const dirs = fs.readdirSync(cachePath);
  let found = false;
  for (const dir of dirs) {
    const pkgPath = path.join(cachePath, dir, 'node_modules/one-search-mcp');
    if (fs.existsSync(pkgPath)) {
      found = true;
      break;
    }
  }
  if (found) {
    console.log('  ✅ one-search-mcp found in npx cache');
  } else {
    console.log('  ⚠️  one-search-mcp not in cache (will download on first use)');
  }
} catch (e) {
  console.log('  ⚠️  Cannot check cache');
}

// Summary
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('✅ All required files present!');
  console.log('\n📝 Next steps:');
  console.log('  1. Add to ~/.openclaw/openclaw.json (see config/setup-snippet.md)');
  console.log('  2. Restart OpenClaw: openclaw gateway restart');
  console.log('  3. Test with: echo "OpenAI" | node scripts/one-search-wrapper-simple.js --stdin');
} else {
  console.log('❌ Some files are missing. Please check the installation.');
}
