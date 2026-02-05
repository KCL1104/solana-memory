#!/usr/bin/env node
/**
 * OneSearch MCP CLI Wrapper for OpenClaw
 * 
 * This wrapper bridges OneSearch MCP Server with OpenClaw's CLI backend mechanism.
 * It translates OpenClaw's stdin JSON format to MCP JSON-RPC protocol.
 * 
 * Usage:
 *   node one-search-mcp-wrapper.js --stdin
 *   
 * OpenClaw config:
 *   "one-search-mcp": {
 *     "command": "node",
 *     "args": ["/path/to/one-search-mcp-wrapper.js", "--stdin"],
 *     "output": "json",
 *     "input": "stdin"
 *   }
 */

const { spawn } = require('child_process');
const path = require('path');

// MCP Protocol constants
const MCP_METHODS = {
  INITIALIZE: 'initialize',
  TOOLS_LIST: 'tools/list',
  TOOLS_CALL: 'tools/call'
};

class OneSearchMCPWrapper {
  constructor() {
    this.mcpServer = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.buffer = '';
    this.tools = [];
  }

  /**
   * Start the MCP server process
   */
  async startMCPServer() {
    const searchProvider = process.env.SEARCH_PROVIDER || 'duckduckgo';
    const searchApiKey = process.env.SEARCH_API_KEY || '';
    const searchApiUrl = process.env.SEARCH_API_URL || '';

    const env = {
      ...process.env,
      SEARCH_PROVIDER: searchProvider,
      ...(searchApiKey && { SEARCH_API_KEY: searchApiKey }),
      ...(searchApiUrl && { SEARCH_API_URL: searchApiUrl }),
    };

    // Start the MCP server using npx
    this.mcpServer = spawn('npx', ['-y', 'one-search-mcp'], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle MCP server output
    this.mcpServer.stdout.on('data', (data) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.mcpServer.stderr.on('data', (data) => {
      // Log stderr for debugging
      console.error(`[MCP Server] ${data.toString().trim()}`);
    });

    this.mcpServer.on('error', (error) => {
      console.error(JSON.stringify({
        error: true,
        message: `MCP Server error: ${error.message}`
      }));
      process.exit(1);
    });

    this.mcpServer.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(JSON.stringify({
          error: true,
          message: `MCP Server exited with code ${code}`
        }));
        process.exit(1);
      }
    });

    // Initialize MCP connection
    await this.initialize();
    
    // Get available tools
    await this.listTools();
  }

  /**
   * Process MCP response buffer (JSON-RPC messages separated by newlines)
   */
  processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          this.handleResponse(response);
        } catch (e) {
          console.error(`[Parse Error] ${e.message}: ${line.substring(0, 200)}`);
        }
      }
    }
  }

  /**
   * Handle MCP JSON-RPC response
   */
  handleResponse(response) {
    if (response.id && this.pendingRequests.has(response.id)) {
      const { resolve, reject } = this.pendingRequests.get(response.id);
      this.pendingRequests.delete(response.id);

      if (response.error) {
        reject(new Error(response.error.message || 'Unknown MCP error'));
      } else {
        resolve(response.result);
      }
    }
  }

  /**
   * Send JSON-RPC request to MCP server
   */
  async sendRequest(method, params = {}) {
    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout for method: ${method}`));
        }
      }, 60000); // 60 second timeout

      this.mcpServer.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  /**
   * Initialize MCP connection
   */
  async initialize() {
    await this.sendRequest(MCP_METHODS.INITIALIZE, {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'openclaw-one-search-wrapper',
        version: '1.0.0'
      }
    });
  }

  /**
   * List available tools
   */
  async listTools() {
    const result = await this.sendRequest(MCP_METHODS.TOOLS_LIST);
    this.tools = result.tools || [];
    return this.tools;
  }

  /**
   * Call a tool
   */
  async callTool(name, args) {
    const result = await this.sendRequest(MCP_METHODS.TOOLS_CALL, {
      name,
      arguments: args
    });
    return result;
  }

  /**
   * Convert OpenClaw query to MCP tool call
   */
  async processOpenClawQuery(query) {
    // Parse query - OpenClaw passes query string via stdin
    // Expected format: "<tool_name> <arguments_json>" or just "<search_query>"
    
    let toolName = 'one_search';
    let toolArgs = {};

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(query);
      toolName = parsed.tool || parsed.action || 'one_search';
      toolArgs = parsed.args || parsed.arguments || parsed;
    } catch (e) {
      // Treat as plain search query
      toolArgs = { query: query.trim() };
    }

    // Validate tool exists
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      // Default to one_search if tool not found
      toolName = 'one_search';
    }

    // Set defaults
    if (toolName === 'one_search') {
      toolArgs.limit = toolArgs.limit || 10;
      if (!toolArgs.query && toolArgs.q) {
        toolArgs.query = toolArgs.q;
      }
    }

    // Call the tool
    const result = await this.callTool(toolName, toolArgs);
    
    // Format result for OpenClaw
    return this.formatForOpenClaw(toolName, result, toolArgs);
  }

  /**
   * Format MCP result for OpenClaw CLI backend
   */
  formatForOpenClaw(toolName, mcpResult, originalArgs) {
    if (!mcpResult || !mcpResult.content) {
      return {
        query: originalArgs.query || '',
        tool: toolName,
        results: [],
        total: 0,
        error: 'No results from MCP server'
      };
    }

    // Extract text content from MCP result
    const textContent = mcpResult.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');

    // Try to parse as JSON (for structured results)
    let parsedContent;
    try {
      parsedContent = JSON.parse(textContent);
    } catch (e) {
      parsedContent = textContent;
    }

    // Format based on tool type
    switch (toolName) {
      case 'one_search':
        return this.formatSearchResults(originalArgs.query, parsedContent);
      
      case 'one_scrape':
        return this.formatScrapeResults(originalArgs.url, parsedContent);
      
      case 'one_map':
        return this.formatMapResults(originalArgs.url, parsedContent);
      
      case 'one_extract':
        return this.formatExtractResults(originalArgs.urls, parsedContent);
      
      default:
        return {
          query: originalArgs.query || originalArgs.url || '',
          tool: toolName,
          results: parsedContent,
          raw: mcpResult
        };
    }
  }

  /**
   * Format search results
   */
  formatSearchResults(query, content) {
    // Handle array of results
    if (Array.isArray(content)) {
      return {
        query,
        results: content.map(item => ({
          title: item.title || item.name || '',
          url: item.url || item.link || '',
          snippet: item.snippet || item.description || item.content || ''
        })),
        total: content.length
      };
    }

    // Handle object with results property
    if (content && content.results && Array.isArray(content.results)) {
      return {
        query,
        results: content.results.map(item => ({
          title: item.title || '',
          url: item.url || '',
          snippet: item.snippet || item.description || ''
        })),
        total: content.results.length
      };
    }

    // Return raw content if format unknown
    return {
      query,
      results: content,
      total: Array.isArray(content) ? content.length : 1
    };
  }

  /**
   * Format scrape results
   */
  formatScrapeResults(url, content) {
    return {
      url,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      type: 'scrape'
    };
  }

  /**
   * Format map results (link discovery)
   */
  formatMapResults(url, content) {
    const links = Array.isArray(content) ? content : 
                  (content.links || content.urls || []);
    
    return {
      url,
      links: links,
      total: links.length,
      type: 'map'
    };
  }

  /**
   * Format extract results
   */
  formatExtractResults(urls, content) {
    return {
      urls: Array.isArray(urls) ? urls : [urls],
      data: content,
      type: 'extract'
    };
  }

  /**
   * Stop the MCP server
   */
  stop() {
    if (this.mcpServer) {
      this.mcpServer.kill();
    }
  }
}

/**
 * Read query from stdin
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const useStdin = args.includes('--stdin');

  if (!useStdin) {
    console.log(JSON.stringify({
      error: true,
      message: 'Usage: node one-search-mcp-wrapper.js --stdin',
      description: 'OneSearch MCP wrapper for OpenClaw CLI backend'
    }, null, 2));
    process.exit(1);
  }

  const query = await readStdin();

  if (!query) {
    console.log(JSON.stringify({
      error: true,
      message: 'No query provided via stdin'
    }, null, 2));
    process.exit(1);
  }

  const wrapper = new OneSearchMCPWrapper();

  try {
    // Start MCP server and initialize
    await wrapper.startMCPServer();

    // Process the query
    const result = await wrapper.processOpenClawQuery(query);

    // Output JSON result for OpenClaw
    console.log(JSON.stringify(result, null, 2));

    // Cleanup
    wrapper.stop();
    process.exit(0);

  } catch (error) {
    console.log(JSON.stringify({
      error: true,
      message: error.message,
      query: query
    }, null, 2));

    wrapper.stop();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

main().catch(error => {
  console.error(JSON.stringify({
    error: true,
    message: error.message
  }, null, 2));
  process.exit(1);
});
