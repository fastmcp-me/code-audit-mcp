#!/usr/bin/env node

/**
 * MCP Wrapper Script
 *
 * This wrapper handles package managers (bunx, npx) that output
 * dependency resolution messages to stderr, which can interfere
 * with MCP's stdio protocol.
 *
 * It filters out known package manager messages while preserving
 * the actual MCP communication.
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set MCP_STDIO_MODE for the child process
process.env.MCP_STDIO_MODE = 'true';

// Determine the actual CLI path
const cliPath = join(__dirname, 'code-audit.js');

// Spawn the actual CLI with stdio mode
const child = spawn(process.execPath, [cliPath, 'start', '--stdio'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env,
});

// Pass stdin through directly
process.stdin.pipe(child.stdin);

// Pass stdout through directly (this is where MCP JSON-RPC goes)
child.stdout.pipe(process.stdout);

// Filter stderr to remove package manager noise
child.stderr.on('data', (data) => {
  const message = data.toString();

  // Filter out known package manager messages
  const filterPatterns = [
    /Resolving dependencies/i,
    /Resolved \d+ packages/i,
    /Installing dependencies/i,
    /Installed \d+ packages/i,
    /bunx:/i,
    /npx:/i,
    /Need to install the following packages/i,
    /Ok to proceed/i,
    /packages are looking for funding/i,
  ];

  const shouldFilter = filterPatterns.some((pattern) => pattern.test(message));

  if (!shouldFilter) {
    // Only pass through non-package-manager stderr
    process.stderr.write(data);
  }
});

// Handle child process exit
child.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle errors
child.on('error', (err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
