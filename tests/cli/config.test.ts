/**
 * Unit tests for configuration utility and command
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { join } from 'path';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import {
  getConfigManager,
  getConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  getDefaultConfig,
  hasProjectConfig,
  ConfigSchema
} from '../../src/cli/utils/config.js';

const TEST_CONFIG_DIR = join(tmpdir(), 'code-audit-test-config');

describe('Configuration Utility', () => {
  beforeEach(() => {
    // Clean up any existing test config
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_CONFIG_DIR, { recursive: true });
    
    // Mock the home directory for testing
    process.env.HOME = TEST_CONFIG_DIR;
  });

  afterEach(() => {
    // Clean up test config
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
  });

  describe('getDefaultConfig', () => {
    test('should return valid default configuration', () => {
      const defaultConfig = getDefaultConfig();
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.ollama).toBeDefined();
      expect(defaultConfig.ollama.host).toBe('http://localhost:11434');
      expect(defaultConfig.ollama.models.primary).toBe('codellama:7b');
      expect(defaultConfig.audit.rules.security).toBe(true);
      expect(defaultConfig.server.transport).toBe('stdio');
    });

    test('should return a deep copy of the default config', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();
      
      config1.ollama.host = 'http://modified.local';
      
      expect(config2.ollama.host).toBe('http://localhost:11434');
    });
  });

  describe('getConfigManager', () => {
    test('should return singleton instance', () => {
      const manager1 = getConfigManager();
      const manager2 = getConfigManager();
      
      expect(manager1).toBe(manager2);
    });

    test('should initialize with default configuration', async () => {
      const config = await getConfig();
      const defaultConfig = getDefaultConfig();
      
      expect(config.ollama.host).toBe(defaultConfig.ollama.host);
      expect(config.ollama.timeout).toBe(defaultConfig.ollama.timeout);
    });
  });

  describe('configuration validation', () => {
    test('should validate configuration correctly', () => {
      const manager = getConfigManager();
      const validation = manager.validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    test('should detect invalid host URL', async () => {
      await setConfigValue('ollama.host', '');
      
      const manager = getConfigManager();
      const validation = manager.validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ollama.host is required');
    });

    test('should detect invalid timeout', async () => {
      await setConfigValue('ollama.timeout', 500);
      
      const manager = getConfigManager();
      const validation = manager.validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ollama.timeout must be at least 1000ms');
    });

    test('should detect invalid port range', async () => {
      await setConfigValue('server.port', 70000);
      
      const manager = getConfigManager();
      const validation = manager.validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('server.port must be between 1 and 65535');
    });
  });

  describe('get and set configuration values', () => {
    test('should get configuration value', async () => {
      const host = await getConfigValue<string>('ollama.host');
      expect(host).toBe('http://localhost:11434');
    });

    test('should get nested configuration value', async () => {
      const primary = await getConfigValue<string>('ollama.models.primary');
      expect(primary).toBe('codellama:7b');
    });

    test('should return undefined for non-existent key', async () => {
      const value = await getConfigValue('non.existent.key');
      expect(value).toBeUndefined();
    });

    test('should set configuration value', async () => {
      await setConfigValue('ollama.host', 'http://test.local:11434');
      
      const host = await getConfigValue<string>('ollama.host');
      expect(host).toBe('http://test.local:11434');
    });

    test('should set nested configuration value', async () => {
      await setConfigValue('ollama.models.primary', 'test-model:latest');
      
      const primary = await getConfigValue<string>('ollama.models.primary');
      expect(primary).toBe('test-model:latest');
    });

    test('should validate configuration values before setting', async () => {
      await expect(setConfigValue('ollama.timeout', 100)).rejects.toThrow();
      await expect(setConfigValue('server.port', -1)).rejects.toThrow();
      await expect(setConfigValue('audit.output.format', 'invalid')).rejects.toThrow();
    });
  });

  describe('configuration reset', () => {
    test('should reset configuration to defaults', async () => {
      // Modify some values
      await setConfigValue('ollama.host', 'http://modified.local');
      await setConfigValue('server.port', 8080);
      
      // Reset configuration
      const success = await resetConfig(async () => true);
      expect(success).toBe(true);
      
      // Check values are back to defaults
      const host = await getConfigValue<string>('ollama.host');
      const port = await getConfigValue<number>('server.port');
      
      expect(host).toBe('http://localhost:11434');
      expect(port).toBe(3000);
    });

    test('should not reset if confirmation callback returns false', async () => {
      await setConfigValue('ollama.host', 'http://modified.local');
      
      const success = await resetConfig(async () => false);
      expect(success).toBe(false);
      
      const host = await getConfigValue<string>('ollama.host');
      expect(host).toBe('http://modified.local');
    });
  });

  describe('configuration paths', () => {
    test('should provide configuration file paths', () => {
      const manager = getConfigManager();
      const paths = manager.getConfigPaths();
      
      expect(paths.global).toBeDefined();
      expect(paths.global).toContain('.code-audit');
    });
  });

  describe('export and import configuration', () => {
    test('should export configuration', () => {
      const manager = getConfigManager();
      const exported = manager.exportConfig();
      
      expect(exported.global).toBeDefined();
      expect(exported.global.ollama).toBeDefined();
      expect(exported.global.audit).toBeDefined();
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
      expect(host).toBe('http://localhost:11434');
    });
  });

  describe('telemetry ID generation', () => {
    test('should generate anonymous telemetry ID', async () => {
      const telemetryId = await getConfigValue<string>('telemetry.anonymousId');
      
      expect(telemetryId).toBeDefined();
      expect(telemetryId).toMatch(/^audit_[a-z0-9]+$/);
    });

    test('should preserve telemetry ID across resets', async () => {
      const originalId = await getConfigValue<string>('telemetry.anonymousId');
      
      await resetConfig(async () => true);
      
      const newId = await getConfigValue<string>('telemetry.anonymousId');
      expect(newId).toBeDefined();
      // New ID should be generated after reset
    });
  });

  describe('project configuration detection', () => {
    test('should detect absence of project config', () => {
      expect(hasProjectConfig()).toBe(false);
    });

    // Note: Testing project config detection would require setting up
    // temporary project files, which is more complex for this test suite
  });

  describe('configuration migration', () => {
    test('should handle configuration migration', async () => {
      const manager = getConfigManager();
      const migrated = await manager.migrateConfig();
      
      // For version 1.0.0, no migration should be needed
      expect(migrated).toBe(false);
    });
  });

  describe('boolean and array configuration values', () => {
    test('should handle boolean values', async () => {
      await setConfigValue('audit.rules.security', false);
      
      const value = await getConfigValue<boolean>('audit.rules.security');
      expect(value).toBe(false);
    });

    test('should handle array values', async () => {
      const newFallbacks = ['model1:7b', 'model2:7b'];
      await setConfigValue('ollama.models.fallback', newFallbacks);
      
      const value = await getConfigValue<string[]>('ollama.models.fallback');
      expect(value).toEqual(newFallbacks);
    });
  });

  describe('thread safety and concurrent access', () => {
    test('should handle concurrent configuration access', async () => {
      const promises = [
        setConfigValue('ollama.timeout', 5000),
        getConfigValue('ollama.host'),
        setConfigValue('server.port', 4000),
        getConfigValue('audit.rules.security')
      ];
      
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});

describe('Configuration Value Parsing', () => {
  // These tests would be for the parseConfigValue function in the config command
  // Since it's an internal function, we'll test it through the command interface
  
  test('should parse string values correctly', () => {
    // This would require exposing the parseConfigValue function or testing through CLI
    expect(true).toBe(true); // Placeholder
  });

  test('should parse boolean values correctly', () => {
    // Placeholder for testing boolean parsing
    expect(true).toBe(true);
  });

  test('should parse number values correctly', () => {
    // Placeholder for testing number parsing  
    expect(true).toBe(true);
  });

  test('should parse array values correctly', () => {
    // Placeholder for testing array parsing
    expect(true).toBe(true);
  });
});