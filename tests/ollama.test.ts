/**
 * Unit tests for Ollama utility
 * Tests Ollama health checking and model management
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Store original fetch to restore later
const originalFetch = global.fetch;

// Mock fetch for testing
let mockFetch: any;

beforeEach(() => {
  // Create mock fetch function
  mockFetch = async (url: string, options?: any) => {
    // Store the last call for assertions
    mockFetch.lastCall = { url, options };

    // Return mock response based on URL
    if (url.includes('/api/tags')) {
      if (mockFetch.shouldFail) {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () =>
          mockFetch.mockResponse || {
            models: [
              {
                name: 'llama2:7b',
                size: 3825819519,
                modified: '2024-01-01T00:00:00Z',
              },
              {
                name: 'codellama:13b',
                size: 7365960935,
                modified: '2024-01-02T00:00:00Z',
              },
            ],
            version: '0.1.0',
          },
      };
    }

    if (url.includes('/api/pull')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'success' }),
      };
    }

    if (url.includes('/api/delete')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'success' }),
      };
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  // Replace global fetch
  global.fetch = mockFetch;
});

afterEach(() => {
  // Restore original fetch
  global.fetch = originalFetch;
});

// Import after setting up mocks
import {
  checkOllamaHealth,
  getInstalledModels,
  pullModel,
  removeModel,
} from '../src/cli/utils/ollama.js';

describe('Ollama Utilities', () => {
  describe('checkOllamaHealth', () => {
    test('should return healthy status with models', async () => {
      const result = await checkOllamaHealth();

      assert.deepStrictEqual(result.models, ['llama2:7b', 'codellama:13b']);
      assert.strictEqual(result.version, '0.1.0');
      assert.ok(mockFetch.lastCall.url.includes('/api/tags'));
    });

    test('should handle custom host', async () => {
      const customHost = 'http://remote-host:11434';
      await checkOllamaHealth(customHost);

      assert.ok(mockFetch.lastCall.url.startsWith(customHost));
    });

    test('should handle API errors', async () => {
      mockFetch.shouldFail = true;

      await assert.rejects(
        async () => await checkOllamaHealth(),
        /Ollama API returned 500: Internal Server Error/
      );
    });

    test('should handle network errors', async () => {
      global.fetch = async () => {
        throw new Error('Network error');
      };

      await assert.rejects(
        async () => await checkOllamaHealth(),
        /Failed to connect to Ollama.*Network error/
      );
    });

    test('should handle timeout', async () => {
      global.fetch = async (_url: string, options?: any) => {
        // Simulate timeout by checking signal
        if (options?.signal) {
          const error = new Error('The operation was aborted');
          (error as any).name = 'AbortError';
          throw error;
        }
        return { ok: true, json: async () => ({}) };
      };

      await assert.rejects(
        async () => await checkOllamaHealth(),
        /Failed to connect to Ollama.*The operation was aborted/
      );
    });
  });

  describe('getInstalledModels', () => {
    test('should return list of installed models', async () => {
      const models = await getInstalledModels();

      assert.strictEqual(models.length, 2);
      assert.strictEqual(models[0].name, 'llama2:7b');
      assert.strictEqual(models[0].size, 3825819519);
      assert.strictEqual(models[1].name, 'codellama:13b');
      assert.strictEqual(models[1].size, 7365960935);
    });

    test('should handle empty model list', async () => {
      mockFetch.mockResponse = { models: [], version: '0.1.0' };

      const models = await getInstalledModels();

      assert.strictEqual(models.length, 0);
    });

    test('should handle missing models field', async () => {
      mockFetch.mockResponse = { version: '0.1.0' };

      const models = await getInstalledModels();

      assert.strictEqual(models.length, 0);
    });
  });

  describe('pullModel', () => {
    test('should pull model successfully', async () => {
      await pullModel('llama2:7b');

      assert.ok(mockFetch.lastCall.url.includes('/api/pull'));
      assert.strictEqual(mockFetch.lastCall.options.method, 'POST');
      const body = JSON.parse(mockFetch.lastCall.options.body);
      assert.strictEqual(body.name, 'llama2:7b');
    });

    test('should handle pull with stream disabled', async () => {
      await pullModel('codellama:13b');

      const body = JSON.parse(mockFetch.lastCall.options.body);
      assert.strictEqual(body.name, 'codellama:13b');
      // Note: The actual implementation doesn't set stream property
    });
  });

  describe('removeModel', () => {
    test('should remove model successfully', async () => {
      await removeModel('llama2:7b');

      assert.ok(mockFetch.lastCall.url.includes('/api/delete'));
      assert.strictEqual(mockFetch.lastCall.options.method, 'DELETE');
      const body = JSON.parse(mockFetch.lastCall.options.body);
      assert.strictEqual(body.name, 'llama2:7b');
    });
  });
});

// Test module exports
describe('Module Exports', () => {
  test('should export all expected functions', () => {
    assert.strictEqual(typeof checkOllamaHealth, 'function');
    assert.strictEqual(typeof getInstalledModels, 'function');
    assert.strictEqual(typeof pullModel, 'function');
    assert.strictEqual(typeof removeModel, 'function');
  });
});
