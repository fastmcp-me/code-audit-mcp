#!/usr/bin/env node
/**
 * MCP Client test script
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCPServer() {
  const serverPath = join(__dirname, 'dist/src/server/index.js');

  // Create transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
  });

  // Create client
  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    // Connect
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // List available tools
    const tools = await client.request({ method: 'tools/list' }, {});
    console.log('\n📋 Available tools:');
    tools.tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Test audit_code tool
    console.log('\n🔍 Testing audit_code tool...');
    const result = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'audit_code',
          arguments: {
            code: `
function example(arr) {
  for (let i = 0; i <= arr.length; i++) {
    console.log(arr[i]);
  }
}`,
            language: 'javascript',
            auditType: 'quality',
          },
        },
      },
      {}
    );

    console.log('\n📊 Audit Results:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await transport.close();
    console.log('\n👋 Disconnected');
  }
}

testMCPServer().catch(console.error);
