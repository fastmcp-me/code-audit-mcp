#!/usr/bin/env node

/**
 * Simple test script for the update command functionality
 */

import {
  updateCommand,
  check_update_available,
  get_current_version,
} from '../src/cli/commands/update.js';

async function test_update_functions() {
  console.log('🧪 Testing Update Command Functions\n');

  try {
    // Test version retrieval
    console.log('📋 Testing version functions...');
    const currentVersion = get_current_version();
    console.log(`✓ Current version: ${currentVersion}`);

    // Test update check (non-interactive)
    console.log('\n🔍 Testing update check...');
    const hasUpdate = await check_update_available();
    console.log(`✓ Update available: ${hasUpdate}`);

    // Test update command with --check flag
    console.log('\n📦 Testing update command (check mode)...');
    await updateCommand({ check: true });

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  test_update_functions();
}
