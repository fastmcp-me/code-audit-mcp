#!/usr/bin/env node

/**
 * Code Audit MCP CLI Entry Point
 * Global command: code-audit
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import and run the compiled CLI
async function main() {
  try {
    const cliPath = join(__dirname, '../dist/src/cli/index.js');
    const { cli } = await import(cliPath);
    await cli();
  } catch (error) {
    console.error('Failed to start Code Audit CLI:', error.message);
    process.exit(1);
  }
}

main();