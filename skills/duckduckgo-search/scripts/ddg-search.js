#!/usr/bin/env node
/**
 * DuckDuckGo Search CLI Wrapper for OpenClaw
 * 
 * Usage:
 *   node ddg-search.js <query> [options]
 *   node ddg-search.js --stdin                    # Read query from stdin (OpenClaw mode)
 * 
 * Options:
 *   --type, -t     Search type: text|images|videos|news (default: text)
 *   --safe, -s     Safe search: strict|moderate|off (default: moderate)
 *   --limit, -l    Limit results (default: 10)
 *   --json, -j     Output as JSON (always enabled for OpenClaw)
 *   --stdin        Read query from stdin
 * 
 * OpenClaw Integration:
 *   This script is designed to work as a CLI backend for OpenClaw.
 *   It outputs JSON format compatible with web search results.
 */

const DDG = require('duck-duck-scrape');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    type: 'text',
    safe: 'moderate',
    limit: 10,
    json: true,  // Default to JSON for OpenClaw integration
    query: '',
    stdin: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-t':
      case '--type':
        options.type = args[++i];
        break;
      case '-s':
      case '--safe':
        options.safe = args[++i];
        break;
      case '-l':
      case '--limit':
        options.limit = parseInt(args[++i], 10);
        break;
      case '-j':
      case '--json':
        options.json = true;
        break;
      case '--stdin':
        options.stdin = true;
        break;
      default:
        if (!arg.startsWith('-')) {
          options.query = options.query ? `${options.query} ${arg}` : arg;
        }
    }
  }

  return options;
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

function getSafeSearchType(type) {
  switch (type.toLowerCase()) {
    case 'strict': return DDG.SafeSearchType.STRICT;
    case 'off': return DDG.SafeSearchType.OFF;
    default: return DDG.SafeSearchType.MODERATE;
  }
}

// Format results to match OpenClaw's expected web search format
function formatForOpenClaw(results, query) {
  if (results.noResults || !results.results || results.results.length === 0) {
    return {
      query,
      results: [],
      total: 0
    };
  }

  const formatted = results.results.map(item => ({
    title: item.title || '',
    url: item.url || '',
    snippet: item.description || item.excerpt || '',
    ...(item.published && { published: item.published }),
    ...(item.image && { image: item.image }),
    ...(item.duration && { duration: item.duration })
  }));

  return {
    query,
    results: formatted,
    total: formatted.length
  };
}

async function search(options) {
  const safeSearch = getSafeSearchType(options.safe);
  
  try {
    let results;
    
    switch (options.type.toLowerCase()) {
      case 'images':
        results = await DDG.searchImages(options.query, { safeSearch, limit: options.limit });
        break;
      case 'videos':
        results = await DDG.searchVideos(options.query, { safeSearch, limit: options.limit });
        break;
      case 'news':
        results = await DDG.searchNews(options.query, { safeSearch, limit: options.limit });
        break;
      case 'text':
      default:
        results = await DDG.search(options.query, { safeSearch, limit: options.limit });
        break;
    }

    // Always output JSON for OpenClaw integration
    const output = formatForOpenClaw(results, options.query);
    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    // Output error as JSON for proper handling
    console.log(JSON.stringify({
      error: true,
      message: error.message,
      query: options.query,
      results: []
    }, null, 2));
    process.exit(1);
  }
}

// Main
async function main() {
  const options = parseArgs();

  // Handle stdin mode (OpenClaw integration)
  if (options.stdin) {
    const stdinQuery = await readStdin();
    if (stdinQuery) {
      options.query = stdinQuery;
    }
  }

  if (!options.query) {
    // Output JSON help for programmatic usage
    console.log(JSON.stringify({
      error: true,
      message: 'No query provided',
      usage: 'node ddg-search.js <query> [options] or use --stdin',
      options: {
        type: 'text|images|videos|news (default: text)',
        safe: 'strict|moderate|off (default: moderate)',
        limit: 'number (default: 10)',
        stdin: 'read query from stdin'
      }
    }, null, 2));
    process.exit(1);
  }

  await search(options);
}

main();
