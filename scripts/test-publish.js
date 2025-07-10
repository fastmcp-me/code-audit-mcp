#!/usr/bin/env node

/**
 * Test script to validate npm publishing setup
 * This script simulates the publishing process without actually publishing
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const PACKAGE_NAME = '@moikas/code-audit-mcp';
const EXPECTED_REGISTRY = 'https://registry.npmjs.org/';

console.log('🧪 Testing npm publishing setup...\n');

try {
  // 1. Validate package.json
  console.log('📋 Validating package.json...');
  const packagePath = resolve('package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

  if (packageJson.name !== PACKAGE_NAME) {
    throw new Error(
      `Package name mismatch: expected ${PACKAGE_NAME}, got ${packageJson.name}`
    );
  }

  if (!packageJson.files || !packageJson.files.includes('dist/')) {
    throw new Error('package.json files array must include "dist/" directory');
  }

  console.log(`✅ Package name: ${packageJson.name}`);
  console.log(`✅ Version: ${packageJson.version}`);
  console.log(`✅ Files: ${packageJson.files.join(', ')}`);

  // 2. Test build process
  console.log('\n🔨 Testing build process...');
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build successful');

  // 3. Test package creation
  console.log('\n📦 Testing package creation...');
  const packOutput = execSync('npm pack --dry-run', { encoding: 'utf8' });
  console.log('✅ Package creation test passed');
  console.log('Package contents preview:');
  console.log(packOutput);

  // 4. Validate npm configuration (if .npmrc exists)
  console.log('\n🔧 Checking npm configuration...');
  try {
    const whoami = execSync('npm whoami', { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ NPM authenticated as: ${whoami.trim()}`);
  } catch (error) {
    console.log('⚠️  NPM not authenticated (expected for CI environment)');
  }

  // 5. Test registry configuration
  console.log('\n🌐 Testing registry configuration...');
  const registry = execSync('npm config get registry', {
    encoding: 'utf8',
  }).trim();
  console.log(`📍 Registry: ${registry}`);

  if (registry !== EXPECTED_REGISTRY) {
    console.log(`⚠️  Registry mismatch: expected ${EXPECTED_REGISTRY}`);
  } else {
    console.log('✅ Registry configuration correct');
  }

  // 6. Test scoped package configuration
  console.log('\n🏷️  Testing scoped package configuration...');
  try {
    const scopedRegistry = execSync('npm config get @moikas:registry', {
      encoding: 'utf8',
    }).trim();
    if (scopedRegistry && scopedRegistry !== 'undefined') {
      console.log(`✅ Scoped registry: ${scopedRegistry}`);
    } else {
      console.log('⚠️  No scoped registry configured (will use default)');
    }
  } catch (error) {
    console.log('⚠️  No scoped registry configured (will use default)');
  }

  console.log('\n🎉 All publishing setup tests passed!');
  console.log('\n📝 Next steps:');
  console.log('1. Ensure NPM_TOKEN secret is configured in GitHub');
  console.log('2. Create a v4.x.x tag to trigger publishing workflow');
  console.log('3. Verify publishing permissions for @moikas scope');
} catch (error) {
  console.error('\n❌ Publishing setup test failed:');
  console.error(error.message);
  process.exit(1);
}
