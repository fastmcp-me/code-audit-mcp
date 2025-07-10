#!/usr/bin/env node

/**
 * Local testing script for code-audit-mcp package
 * Tests the CLI functionality before publishing to npm
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

console.log(chalk.blue.bold('🧪 Testing Code Audit MCP Package Locally'));
console.log(chalk.gray(`Version: ${packageJson.version}\n`));

/**
 * Test suite configuration
 */
const tests = [
  {
    name: 'CLI Entry Point',
    command: 'node bin/code-audit.js --version',
    description: 'Test CLI entry point'
  },
  {
    name: 'Help Command',
    command: 'node bin/code-audit.js --help',
    description: 'Test help output'
  },
  {
    name: 'Health Check',
    command: 'node bin/code-audit.js health --json',
    description: 'Test health check command'
  },
  {
    name: 'Configuration',
    command: 'node bin/code-audit.js config --show',
    description: 'Test configuration display'
  },
  {
    name: 'Models List',
    command: 'node bin/code-audit.js models --list',
    description: 'Test model listing'
  }
];

/**
 * Run a single test
 */
async function runTest(test) {
  const spinner = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
  let frame = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${chalk.yellow(spinner[frame])} ${test.name}...`);
    frame = (frame + 1) % spinner.length;
  }, 100);

  try {
    const output = execSync(test.command, { 
      encoding: 'utf8', 
      timeout: 30000,
      stdio: 'pipe'
    });
    
    clearInterval(interval);
    console.log(`\r${chalk.green('✓')} ${test.name}`);
    
    if (process.env.VERBOSE) {
      console.log(chalk.gray(`  Output: ${output.trim().substring(0, 100)}...`));
    }
    
    return { success: true, output };
  } catch (error) {
    clearInterval(interval);
    console.log(`\r${chalk.red('✗')} ${test.name}`);
    console.log(chalk.red(`  Error: ${error.message}`));
    return { success: false, error: error.message };
  }
}

/**
 * Test package creation and installation
 */
async function testPackaging() {
  console.log(chalk.yellow('\n📦 Testing Package Creation'));
  
  try {
    // Clean up any existing package
    const tarballName = `code-audit-mcp-${packageJson.version}.tgz`;
    if (existsSync(tarballName)) {
      unlinkSync(tarballName);
    }

    // Create package
    console.log(chalk.gray('Creating npm package...'));
    execSync('npm pack', { stdio: 'pipe' });
    
    if (existsSync(tarballName)) {
      console.log(chalk.green('✓ Package created successfully'));
      console.log(chalk.gray(`  File: ${tarballName}`));
      
      // Get package size
      const { statSync } = await import('fs');
      const stats = statSync(tarballName);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(chalk.gray(`  Size: ${sizeKB} KB`));
      
      return true;
    } else {
      console.log(chalk.red('✗ Package creation failed'));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('✗ Package creation failed'));
    console.log(chalk.red(`  Error: ${error.message}`));
    return false;
  }
}

/**
 * Test actual audit functionality
 */
async function testAudit() {
  console.log(chalk.yellow('\n🔍 Testing Audit Functionality'));
  
  const testCode = `
function processPayment(amount) {
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  // TODO: implement payment logic
  for(let i = 0; i < users.length; i++) {
    for(let j = 0; j < transactions.length; j++) {
      // O(n²) complexity
    }
  }
}`;

  const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'audit_code',
      arguments: {
        code: testCode,
        language: 'javascript',
        auditType: 'all',
        priority: 'fast'
      }
    }
  };

  try {
    // Test if we can at least start the server
    console.log(chalk.gray('Testing server startup...'));
    
    const child = spawn('npx', ['tsx', 'src/server/index.ts'], {
      stdio: 'pipe'
    });

    // Send test request
    child.stdin.write(JSON.stringify(testRequest) + '\n');
    child.stdin.end();

    // Wait for response or timeout
    const response = await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('Timeout waiting for server response'));
      }, 10000);

      child.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('jsonrpc')) {
          clearTimeout(timeout);
          child.kill();
          resolve(output);
        }
      });

      child.stderr.on('data', (data) => {
        console.log(chalk.yellow(`  Server stderr: ${data.toString().trim()}`));
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    console.log(chalk.green('✓ Server responds to audit requests'));
    
    if (process.env.VERBOSE) {
      console.log(chalk.gray(`  Response: ${response.toString().substring(0, 200)}...`));
    }
    
    return true;
  } catch (error) {
    console.log(chalk.red('✗ Audit functionality test failed'));
    console.log(chalk.red(`  Error: ${error.message}`));
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(chalk.blue('🔧 Running CLI Tests\n'));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await runTest(test);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(chalk.blue('\n📦 Package Tests'));
  const packageResult = await testPackaging();
  if (packageResult) passed++; else failed++;
  
  console.log(chalk.blue('\n🔍 Functionality Tests'));
  const auditResult = await testAudit();
  if (auditResult) passed++; else failed++;
  
  // Summary
  console.log(chalk.blue.bold('\n📊 Test Summary'));
  console.log(`${chalk.green('✓')} Passed: ${passed}`);
  console.log(`${chalk.red('✗')} Failed: ${failed}`);
  
  if (failed === 0) {
    console.log(chalk.green.bold('\n🎉 All tests passed! Package is ready for publishing.'));
    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray('  1. npm publish'));
    console.log(chalk.gray('  2. npm install -g code-audit-mcp'));
    console.log(chalk.gray('  3. code-audit setup'));
  } else {
    console.log(chalk.red.bold('\n❌ Some tests failed. Please fix issues before publishing.'));
    process.exit(1);
  }
}

// Add environment variable for verbose output
if (process.argv.includes('--verbose')) {
  process.env.VERBOSE = 'true';
}

// Run the tests
runTests().catch(error => {
  console.error(chalk.red.bold('\n💥 Test runner crashed:'), error);
  process.exit(1);
});