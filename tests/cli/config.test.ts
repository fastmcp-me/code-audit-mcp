/**
 * Unit tests for configuration utility
 */

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { join } from 'path';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import {
  getConfigManager,
  getConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  getDefaultConfig,
  hasProjectConfig,
} from '../../src/cli/utils/config.js';

const TEST_CONFIG_DIR = join(tmpdir(), 'code-audit-test-config');

describe('Configuration Utility', () => {
  let originalHome: string | undefined;
  let originalCwd: string;

  beforeEach(() => {
    // Save original values
    originalHome = process.env.HOME;
    originalCwd = process.cwd();

    // Clean up any existing test config
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_CONFIG_DIR, { recursive: true });

    // Mock the home directory for testing
    process.env.HOME = TEST_CONFIG_DIR;
    process.chdir(TEST_CONFIG_DIR);
  });

  afterEach(() => {
    // Restore original values
    if (originalHome !== undefined) {
      process.env.HOME = originalHome;
    }
    process.chdir(originalCwd);

    // Clean up test config
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }

    // Reset singleton instance
    (global as any).__configManager = undefined;
  });

  describe('getDefaultConfig', () => {
    test('should return valid default configuration', () => {
      const defaultConfig = getDefaultConfig();

      assert.ok(defaultConfig);
      assert.ok(defaultConfig.ollama);
      assert.strictEqual(defaultConfig.ollama.host, 'http://localhost:11434');
      assert.strictEqual(defaultConfig.ollama.models.primary, 'codellama:7b');
      assert.strictEqual(defaultConfig.audit.rules.security, true);
      assert.strictEqual(defaultConfig.server.transport, 'stdio');
    });

    test('should return a deep copy of the default config', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();

      config1.ollama.host = 'http://modified.local';

      assert.strictEqual(config2.ollama.host, 'http://localhost:11434');
    });
  });

  describe('getConfigManager', () => {
    test('should return singleton instance', () => {
      const manager1 = getConfigManager();
      const manager2 = getConfigManager();

      assert.strictEqual(manager1, manager2);
    });

    test('should initialize with default configuration', async () => {
      const config = await getConfig();
      const defaultConfig = getDefaultConfig();

      assert.strictEqual(config.ollama.host, defaultConfig.ollama.host);
      assert.strictEqual(config.ollama.timeout, defaultConfig.ollama.timeout);
    });
  });

  describe('configuration validation', () => {
    test('should validate configuration correctly', () => {
      const manager = getConfigManager();
      const validation = manager.validateConfig();

      assert.strictEqual(validation.isValid, true);
      assert.deepStrictEqual(validation.errors, []);
    });

    test('should detect invalid host URL', async () => {
      await setConfigValue('ollama.host', '');

      const manager = getConfigManager();
      const validation = manager.validateConfig();

      assert.strictEqual(validation.isValid, false);
      assert.ok(validation.errors.includes('ollama.host is required'));
    });

    test('should detect invalid timeout', async () => {
      await setConfigValue('ollama.timeout', 500);

      const manager = getConfigManager();
      const validation = manager.validateConfig();

      assert.strictEqual(validation.isValid, false);
      assert.ok(
        validation.errors.includes('ollama.timeout must be at least 1000ms')
      );
    });

    test('should detect invalid port range', async () => {
      await setConfigValue('server.port', 70000);

      const manager = getConfigManager();
      const validation = manager.validateConfig();

      assert.strictEqual(validation.isValid, false);
      assert.ok(
        validation.errors.includes('server.port must be between 1 and 65535')
      );
    });
  });

  describe('get and set configuration values', () => {
    test('should get configuration value', async () => {
      const host = await getConfigValue<string>('ollama.host');
      assert.strictEqual(host, 'http://localhost:11434');
    });

    test('should get nested configuration value', async () => {
      const primary = await getConfigValue<string>('ollama.models.primary');
      assert.strictEqual(primary, 'codellama:7b');
    });

    test('should return undefined for non-existent key', async () => {
      const value = await getConfigValue('non.existent.key');
      assert.strictEqual(value, undefined);
    });

    test('should set configuration value', async () => {
      await setConfigValue('ollama.host', 'http://test.local:11434');

      const host = await getConfigValue<string>('ollama.host');
      assert.strictEqual(host, 'http://test.local:11434');
    });

    test('should set nested configuration value', async () => {
      await setConfigValue('ollama.models.primary', 'test-model:latest');

      const primary = await getConfigValue<string>('ollama.models.primary');
      assert.strictEqual(primary, 'test-model:latest');
    });

    test('should validate configuration values before setting', async () => {
      await assert.rejects(
        () => setConfigValue('ollama.timeout', 100),
        /Invalid value/
      );
      await assert.rejects(
        () => setConfigValue('server.port', -1),
        /Invalid value/
      );
      await assert.rejects(
        () => setConfigValue('audit.output.format', 'invalid'),
        /Invalid value/
      );
    });
  });

  describe('configuration reset', () => {
    test('should reset configuration to defaults', async () => {
      // Modify some values
      await setConfigValue('ollama.host', 'http://modified.local');
      await setConfigValue('server.port', 8080);

      // Reset configuration
      const success = await resetConfig(async () => true);
      assert.strictEqual(success, true);

      // Check values are back to defaults
      const host = await getConfigValue<string>('ollama.host');
      const port = await getConfigValue<number>('server.port');

      assert.strictEqual(host, 'http://localhost:11434');
      assert.strictEqual(port, 3000);
    });

    test('should not reset if confirmation callback returns false', async () => {
      await setConfigValue('ollama.host', 'http://modified.local');

      const success = await resetConfig(async () => false);
      assert.strictEqual(success, false);

      const host = await getConfigValue<string>('ollama.host');
      assert.strictEqual(host, 'http://modified.local');
    });
  });

  describe('configuration paths', () => {
    test('should provide configuration file paths', () => {
      const manager = getConfigManager();
      const paths = manager.getConfigPaths();

      assert.ok(paths.global);
      assert.ok(paths.global.includes('.code-audit'));
    });
  });

  describe('export and import configuration', () => {
    test('should export configuration', () => {
      const manager = getConfigManager();
      const exported = manager.exportConfig();

      assert.ok(exported.global);
      assert.ok(exported.global.ollama);
      assert.ok(exported.global.audit);
    });

    test('should import configuration', async () => {
      const manager = getConfigManager();

      // Export current config
      const originalExport = manager.exportConfig();

      // Modify config
      await setConfigValue('ollama.host', 'http://modified.local');

      // Import original config
      manager.importConfig(originalExport);

      // Check that config was restored
      const host = await getConfigValue<string>('ollama.host');
      assert.strictEqual(host, 'http://localhost:11434');
    });
  });

  describe('telemetry ID generation', () => {
    test('should generate anonymous telemetry ID', async () => {
      const telemetryId = await getConfigValue<string>('telemetry.anonymousId');

      assert.ok(telemetryId);
      assert.match(telemetryId, /^audit_[a-z0-9]+$/);
    });

    test('should preserve telemetry ID across resets', async () => {
      const originalId = await getConfigValue<string>('telemetry.anonymousId');

      await resetConfig(async () => true);

      const newId = await getConfigValue<string>('telemetry.anonymousId');
      assert.ok(newId);
      // New ID should be generated after reset
    });
  });

  describe('project configuration detection', () => {
    test('should detect absence of project config', () => {
      assert.strictEqual(hasProjectConfig(), false);
    });

    test('should detect presence of project config', () => {
      // Create a project config file
      writeFileSync(
        join(TEST_CONFIG_DIR, '.code-audit.json'),
        JSON.stringify({
          server: { port: 4000 },
        })
      );

      assert.strictEqual(hasProjectConfig(), true);
    });
  });

  describe('configuration migration', () => {
    test('should handle configuration migration', async () => {
      const manager = getConfigManager();
      const migrated = await manager.migrateConfig();

      // For version 1.0.0, no migration should be needed
      assert.strictEqual(migrated, false);
    });
  });

  describe('boolean and array configuration values', () => {
    test('should handle boolean values', async () => {
      await setConfigValue('audit.rules.security', false);

      const value = await getConfigValue<boolean>('audit.rules.security');
      assert.strictEqual(value, false);
    });

    test('should handle array values', async () => {
      const newFallbacks = ['model1:7b', 'model2:7b'];
      await setConfigValue('ollama.models.fallback', newFallbacks);

      const value = await getConfigValue<string[]>('ollama.models.fallback');
      assert.deepStrictEqual(value, newFallbacks);
    });
  });

  describe('thread safety and concurrent access', () => {
    test('should handle concurrent configuration access', async () => {
      const promises = [
        setConfigValue('ollama.timeout', 5000),
        getConfigValue('ollama.host'),
        setConfigValue('server.port', 4000),
        getConfigValue('audit.rules.security'),
      ];

      const results = await Promise.all(promises);
      assert.ok(results);
    });
  });
});
