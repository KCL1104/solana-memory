#!/usr/bin/env node
/**
 * OneSearch MCP Wrapper for OpenClaw
 * Communicates with one-search-mcp via JSON-RPC
 */

const { spawn } = require('child_process');
const path = require('path');

class OneSearchMCPClient {
  constructor() {
    this.messageId = 0;
    this.pendingRequests = new Map();
    this.serverProcess = null;
    this.buffer = '';
  }

  async start() {
    return new Promise((resolve, reject) => {
      const searchProvider = process.env.SEARCH_PROVIDER || 'duckduckgo';
      
      // Start the one-search-mcp server
      this.serverProcess = spawn('npx', ['-y', 'one-search-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          SEARCH_PROVIDER: searchProvider
        }
      });

      this.serverProcess.stdout.on('data', (data) => {
        this.buffer += data.toString();
        this.processBuffer();
      });

      this.serverProcess.stderr.on('data', (data) => {
        const msg = data.toString();
        // Ignore non-error messages
        if (!msg.includes('info') && !msg.includes('MISSING_ENV_FILE')) {
          console.error('Server stderr:', msg);
        }
      });

      this.serverProcess.on('error', (err) => {
        reject(new Error(`Failed to start server: ${err.message}`));
      });

      // Wait for server to start
      setTimeout(() => {
        resolve();
      }, 3000);
    });
  }

  processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          this.handleMessage(message);
        } catch (e) {
          // Not JSON, ignore
        }
      }
    }
  }

  handleMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        reject(new Error(message.error.message || message.error));
      } else {
        resolve(message.result);
      }
    }
  }

  async callTool(toolName, args) {
    return new Promise((resolve, reject) => {
      this.messageId++;
      const id = this.messageId;
      
      const request = {
        jsonrpc: '2.0',
        id: id,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };

      this.pendingRequests.set(id, { resolve, reject });
      
      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 60000);

      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async search(query) {
    // First initialize
    const initRequest = {
      jsonrpc: '2.0',
      id: ++this.messageId,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'openclaw-wrapper', version: '1.0.0' }
      }
    };

    this.serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
    
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Call one_search tool
    const result = await this.callTool('one_search', { query });
    return result;
  }

  stop() {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const useStdin = args.includes('--stdin');

  if (!useStdin) {
    console.error('Usage: node one-search-wrapper-simple.js --stdin');
    console.error('Then type your search query and press Ctrl+D');
    process.exit(1);
  }

  // Read from stdin
  let query = '';
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (chunk) => {
    query += chunk;
  });

  process.stdin.on('end', async () => {
    query = query.trim();
    
    if (!query) {
      console.error('Error: No query provided');
      process.exit(1);
    }

    const client = new OneSearchMCPClient();
    
    try {
      await client.start();
      const result = await client.search(query);
      
      // Output results as JSON
      console.log(JSON.stringify({
        success: true,
        query: query,
        provider: process.env.SEARCH_PROVIDER || 'duckduckgo',
        result: result,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      client.stop();
      process.exit(0);
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        query: query,
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 2));
      client.stop();
      process.exit(1);
    }
  });
}

main().catch(err => {
  console.log(JSON.stringify({
    success: false,
    error: err.message,
    timestamp: new Date().toISOString()
  }, null, 2));
  process.exit(1);
});
