#!/usr/bin/env node
/**
 * Test script for local MCP server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the MCP server
const serverPath = join(__dirname, 'dist/src/server/index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

// Handle server output
server.stdout.on('data', (data) => {
  console.log('Server:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('Server Error:', data.toString());
});

// Send a test request after server starts
setTimeout(() => {
  console.log('Sending test request...');

  // Send a list_tools request
  const request = {
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: 1,
  };

  server.stdin.write(JSON.stringify(request) + '\n');
}, 2000);

// Handle server exit
server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});
