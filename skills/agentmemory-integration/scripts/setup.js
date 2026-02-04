#!/usr/bin/env node

/**
 * Quick setup script for AgentMemory Protocol integration
 */

const fs = require('fs');
const path = require('path');

console.log('🧠 AgentMemory Protocol - Quick Setup\n');

const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.log('❌ No package.json found. Run this in your project root.');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.dependencies) {
  packageJson.dependencies = {};
}

if (!packageJson.dependencies.agentmemory) {
  packageJson.dependencies.agentmemory = '^1.0.0';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added agentmemory to dependencies');
} else {
  console.log('✅ agentmemory already in dependencies');
}

const exampleCode = `import { AgentMemory } from 'agentmemory';

const memory = new AgentMemory({
  agentId: 'my-agent-001',
  network: 'devnet'
});

await memory.store({
  content: 'User prefers dark mode',
  importance: 'high'
});

const memories = await memory.search({
  query: 'user preferences'
});
`;

const examplePath = path.join(process.cwd(), 'agentmemory-example.ts');
if (!fs.existsSync(examplePath)) {
  fs.writeFileSync(examplePath, exampleCode);
  console.log('✅ Created agentmemory-example.ts');
}

console.log('\n📦 Next steps:');
console.log('  1. Run: npm install');
console.log('  2. Check: agentmemory-example.ts');
console.log('  3. Start building!\n');
