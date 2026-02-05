#!/usr/bin/env node
/**
 * Simple test for one-search-mcp
 */

const { spawn } = require('child_process');

console.log('Starting one-search-mcp test...\n');

const mcp = spawn('npx', ['-y', 'one-search-mcp'], {
  env: { 
    ...process.env,
    SEARCH_PROVIDER: 'duckduckgo'
  }
});

let buffer = '';
let requestId = 0;

mcp.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('<<< Received:', JSON.stringify(response, null, 2));
        
        // After initialize response, send tools/list
        if (response.id === 1 && response.result) {
          setTimeout(() => {
            const req = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/list',
              params: {}
            };
            console.log('>>> Sending tools/list');
            mcp.stdin.write(JSON.stringify(req) + '\n');
          }, 100);
        }
        
        // After tools/list, call one_search
        if (response.id === 2 && response.result) {
          setTimeout(() => {
            const req = {
              jsonrpc: '2.0',
              id: 3,
              method: 'tools/call',
              params: {
                name: 'one_search',
                arguments: { query: 'OpenAI', limit: 3 }
              }
            };
            console.log('>>> Sending one_search');
            mcp.stdin.write(JSON.stringify(req) + '\n');
          }, 100);
        }
        
        // After search, exit
        if (response.id === 3) {
          setTimeout(() => {
            mcp.kill();
            process.exit(0);
          }, 500);
        }
      } catch (e) {
        console.log('Raw:', line);
      }
    }
  }
});

mcp.stderr.on('data', (data) => {
  console.log('[MCP]', data.toString().trim());
});

mcp.on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});

// Send initialize
setTimeout(() => {
  const init = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' }
    }
  };
  console.log('>>> Sending initialize');
  mcp.stdin.write(JSON.stringify(init) + '\n');
}, 100);

setTimeout(() => {
  console.log('\nTimeout - exiting');
  mcp.kill();
  process.exit(1);
}, 30000);
