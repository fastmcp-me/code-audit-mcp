/**
 * Unit tests for Ollama utility
 * Tests platform detection, health checking, and model management
 */

import { test, describe, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { promisify } from 'util';

// Mock external dependencies
const mockExec = mock.fn();
const mockFsAccess = mock.fn();
const mockOllamaClient = {
  list: mock.fn(),
  pull: mock.fn(),
  delete: mock.fn(),
  generate: mock.fn(),
};

// Mock modules before import
mock.module('child_process', () => ({
  exec: mockExec,
  spawn: mock.fn(),
}));

mock.module('fs/promises', () => ({
  access: mockFsAccess,
}));

mock.module('ollama', () => ({
  Ollama: class MockOllama {
    constructor() {
      return mockOllamaClient;
    }
  },
}));

// Import after mocking
import {
  checkOllamaHealth,
  getInstalledModels,
  pullModel,
  removeModel,
  // getModelHealth,
  // ensureRequiredModels,
} from '../src/cli/utils/ollama.js';

// const execAsync = promisify(mockExec);

describe('OllamaUtils', () => {
  let ollamaUtils: OllamaUtils;

  beforeEach(() => {
    // Reset all mocks
    mockExec.mock.resetCalls();
    mockFsAccess.mock.resetCalls();
    mockOllamaClient.list.mock.resetCalls();
    mockOllamaClient.pull.mock.resetCalls();
    mockOllamaClient.delete.mock.resetCalls();
    mockOllamaClient.generate.mock.resetCalls();

    ollamaUtils = new OllamaUtils();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('detectOllamaInstallation', () => {
    test('should detect installation on macOS', async () => {
      // Mock platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      });

      // Mock file access - first path exists
      mockFsAccess.mock.mockImplementationOnce(() => Promise.resolve());

      // Mock version command
      mockExec.mock.mockImplementationOnce(() =>
        Promise.resolve({ stdout: 'ollama version 0.1.0\n', stderr: '' })
      );

      // Mock process check
      mockExec.mock.mockImplementationOnce(() => Promise.resolve());

      const result = await ollamaUtils.detectOllamaInstallation();

      assert.strictEqual(result.isInstalled, true);
      assert.strictEqual(result.platform, 'darwin');
      assert.ok(result.installPath);
      assert.ok(result.version);
      assert.strictEqual(result.isRunning, true);
    });

    test('should detect missing installation', async () => {
      // Mock platform
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      });

      // Mock file access - all paths fail
      mockFsAccess.mock.mockImplementation(() =>
        Promise.reject(new Error('ENOENT'))
      );

      const result = await ollamaUtils.detectOllamaInstallation();

      assert.strictEqual(result.isInstalled, false);
      assert.strictEqual(result.platform, 'linux');
      assert.ok(result.suggestions);
      assert.ok(result.suggestions.length > 0);
    });

    test('should handle unsupported platform', async () => {
      // Mock unsupported platform
      Object.defineProperty(process, 'platform', {
        value: 'freebsd',
        configurable: true,
      });

      const result = await ollamaUtils.detectOllamaInstallation();

      assert.strictEqual(result.isInstalled, false);
      assert.strictEqual(result.platform, 'freebsd');
      assert.strictEqual(result.isRunning, false);
      assert.ok(result.suggestions);
    });
  });

  describe('checkOllamaHealth', () => {
    test('should return healthy status when service is running', async () => {
      // Mock successful list call
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.resolve({ models: [] })
      );

      // Mock version command
      mockExec.mock.mockImplementationOnce(() =>
        Promise.resolve({ stdout: 'ollama version 0.1.0\n', stderr: '' })
      );

      const result = await ollamaUtils.checkOllamaHealth();

      assert.strictEqual(result.isRunning, true);
      assert.ok(result.responseTime);
      assert.ok(result.responseTime > 0);
      assert.strictEqual(result.host, 'http://localhost:11434');
      assert.strictEqual(result.port, 11434);
    });

    test('should return unhealthy status when service fails', async () => {
      // Mock failed list call
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.reject(new Error('Connection refused'))
      );

      const result = await ollamaUtils.checkOllamaHealth();

      assert.strictEqual(result.isRunning, false);
      assert.ok(result.error);
      assert.strictEqual(result.host, 'http://localhost:11434');
      assert.strictEqual(result.port, 11434);
    });

    test('should handle custom host', async () => {
      // Mock successful list call
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.resolve({ models: [] })
      );

      const customHost = 'http://remote-host:11434';
      const result = await ollamaUtils.checkOllamaHealth(customHost);

      assert.strictEqual(result.host, customHost);
    });
  });

  describe('getInstalledModels', () => {
    test('should return list of installed models', async () => {
      const mockModels = [
        {
          name: 'llama2:7b',
          size: 3825819519,
          digest: 'abc123',
          modified_at: '2024-01-01T00:00:00Z',
          details: {
            format: 'gguf',
            family: 'llama',
            parameter_size: '7B',
            quantization_level: 'Q4_0',
          },
        },
        {
          name: 'codellama:13b',
          size: 7365960935,
          digest: 'def456',
          modified_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.resolve({ models: mockModels })
      );

      const result = await ollamaUtils.getInstalledModels();

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].name, 'llama2:7b');
      assert.strictEqual(result[0].size, 3825819519);
      assert.ok(result[0].details);
      assert.strictEqual(result[1].name, 'codellama:13b');
      assert.strictEqual(result[1].details, undefined);
    });

    test('should handle empty model list', async () => {
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.resolve({ models: [] })
      );

      const result = await ollamaUtils.getInstalledModels();

      assert.strictEqual(result.length, 0);
    });

    test('should throw error on client failure', async () => {
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.reject(new Error('Connection failed'))
      );

      await assert.rejects(
        () => ollamaUtils.getInstalledModels(),
        /Failed to get installed models/
      );
    });
  });

  describe('pullModel', () => {
    test('should pull model successfully', async () => {
      const mockStream = [
        { status: 'downloading', total: 1000, completed: 200 },
        { status: 'downloading', total: 1000, completed: 500 },
        { status: 'downloading', total: 1000, completed: 1000 },
      ];

      // Mock async iterator
      mockOllamaClient.pull.mock.mockImplementationOnce(() => ({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockStream) {
            yield chunk;
          }
        },
      }));

      const progressUpdates: ProgressInfo[] = [];
      const onProgress = (progress: ProgressInfo) => {
        progressUpdates.push(progress);
      };

      await ollamaUtils.pullModel('llama2:7b', onProgress);

      assert.strictEqual(progressUpdates.length, 3);
      assert.strictEqual(progressUpdates[0].percentage, 20);
      assert.strictEqual(progressUpdates[1].percentage, 50);
      assert.strictEqual(progressUpdates[2].percentage, 100);
    });

    test('should handle pull failure', async () => {
      mockOllamaClient.pull.mock.mockImplementationOnce(() =>
        Promise.reject(new Error('Model not found'))
      );

      await assert.rejects(
        () => ollamaUtils.pullModel('nonexistent:model'),
        /Failed to pull model nonexistent:model/
      );
    });
  });

  describe('removeModel', () => {
    test('should remove model successfully', async () => {
      mockOllamaClient.delete.mock.mockImplementationOnce(() =>
        Promise.resolve()
      );

      await ollamaUtils.removeModel('llama2:7b');

      assert.strictEqual(mockOllamaClient.delete.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockOllamaClient.delete.mock.calls[0].arguments[0],
        { model: 'llama2:7b' }
      );
    });

    test('should handle remove failure', async () => {
      mockOllamaClient.delete.mock.mockImplementationOnce(() =>
        Promise.reject(new Error('Model not found'))
      );

      await assert.rejects(
        () => ollamaUtils.removeModel('nonexistent:model'),
        /Failed to remove model nonexistent:model/
      );
    });
  });

  describe('getModelHealth', () => {
    test('should check health of specific models', async () => {
      // Mock list call
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.resolve({
          models: [
            {
              name: 'llama2:7b',
              size: 1000,
              digest: 'abc',
              modified_at: '2024-01-01',
            },
            {
              name: 'codellama:13b',
              size: 2000,
              digest: 'def',
              modified_at: '2024-01-02',
            },
          ],
        })
      );

      // Mock generate calls - first succeeds, second fails
      mockOllamaClient.generate.mock
        .mockImplementationOnce(() => Promise.resolve({ response: 'test' }))
        .mock.mockImplementationOnce(() =>
          Promise.reject(new Error('Model error'))
        );

      const result = await ollamaUtils.getModelHealth([
        'llama2:7b',
        'codellama:13b',
      ]);

      assert.strictEqual(result['llama2:7b'], true);
      assert.strictEqual(result['codellama:13b'], false);
    });

    test('should check health of all installed models', async () => {
      // Mock list call
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.resolve({
          models: [
            {
              name: 'llama2:7b',
              size: 1000,
              digest: 'abc',
              modified_at: '2024-01-01',
            },
          ],
        })
      );

      // Mock successful generate call
      mockOllamaClient.generate.mock.mockImplementationOnce(() =>
        Promise.resolve({ response: 'test' })
      );

      const result = await ollamaUtils.getModelHealth();

      assert.strictEqual(result['llama2:7b'], true);
    });
  });

  describe('ensureRequiredModels', () => {
    test('should skip if all models are installed', async () => {
      // Mock list call
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.resolve({
          models: [
            {
              name: 'llama2:7b',
              size: 1000,
              digest: 'abc',
              modified_at: '2024-01-01',
            },
            {
              name: 'codellama:13b',
              size: 2000,
              digest: 'def',
              modified_at: '2024-01-02',
            },
          ],
        })
      );

      const progressUpdates: ProgressInfo[] = [];
      const onProgress = (progress: ProgressInfo) => {
        progressUpdates.push(progress);
      };

      await ollamaUtils.ensureRequiredModels(
        ['llama2:7b', 'codellama:13b'],
        onProgress
      );

      // Should not have called pull since models exist
      assert.strictEqual(mockOllamaClient.pull.mock.callCount(), 0);
      assert.strictEqual(progressUpdates.length, 0);
    });

    test('should pull missing models', async () => {
      // Mock list call
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.resolve({
          models: [
            {
              name: 'llama2:7b',
              size: 1000,
              digest: 'abc',
              modified_at: '2024-01-01',
            },
          ],
        })
      );

      // Mock pull stream
      mockOllamaClient.pull.mock.mockImplementationOnce(() => ({
        [Symbol.asyncIterator]: async function* () {
          yield { status: 'downloading', total: 1000, completed: 1000 };
        },
      }));

      const progressUpdates: ProgressInfo[] = [];
      const onProgress = (progress: ProgressInfo) => {
        progressUpdates.push(progress);
      };

      await ollamaUtils.ensureRequiredModels(
        ['llama2:7b', 'codellama:13b'],
        onProgress
      );

      // Should have called pull for missing model
      assert.strictEqual(mockOllamaClient.pull.mock.callCount(), 1);
      assert.ok(progressUpdates.length > 0);
      assert.ok(progressUpdates.some((p) => p.status.includes('missing')));
    });
  });

  describe('getSystemInfo', () => {
    test('should return comprehensive system information', async () => {
      // Mock platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      });

      // Mock installation detection
      mockFsAccess.mock.mockImplementationOnce(() => Promise.resolve());
      mockExec.mock.mockImplementationOnce(() =>
        Promise.resolve({ stdout: 'ollama version 0.1.0\n', stderr: '' })
      );
      mockExec.mock.mockImplementationOnce(() => Promise.resolve());

      // Mock health check
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.resolve({ models: [] })
      );
      mockExec.mock.mockImplementationOnce(() =>
        Promise.resolve({ stdout: 'ollama version 0.1.0\n', stderr: '' })
      );

      // Mock model list
      mockOllamaClient.list.mock.mockImplementationOnce(() =>
        Promise.resolve({
          models: [
            {
              name: 'llama2:7b',
              size: 1000,
              digest: 'abc',
              modified_at: '2024-01-01',
            },
          ],
        })
      );

      const result = await ollamaUtils.getSystemInfo();

      assert.strictEqual(result.platform, 'darwin');
      assert.ok(result.installation);
      assert.ok(result.health);
      assert.ok(result.models);
      assert.ok(result.config);
      assert.strictEqual(result.installation.isInstalled, true);
      assert.strictEqual(result.health.isRunning, true);
      assert.strictEqual(result.models.length, 1);
    });
  });
});

describe('Convenience Functions', () => {
  beforeEach(() => {
    // Reset all mocks
    mockExec.mock.resetCalls();
    mockFsAccess.mock.resetCalls();
    mockOllamaClient.list.mock.resetCalls();
    mockOllamaClient.pull.mock.resetCalls();
    mockOllamaClient.delete.mock.resetCalls();
    mockOllamaClient.generate.mock.resetCalls();
  });

  test('checkOllamaHealth should work as standalone function', async () => {
    mockOllamaClient.list.mock.mockImplementationOnce(() =>
      Promise.resolve({ models: [] })
    );

    const result = await checkOllamaHealth();

    assert.strictEqual(result.isRunning, true);
  });

  test('getInstalledModels should work as standalone function', async () => {
    mockOllamaClient.list.mock.mockImplementationOnce(() =>
      Promise.resolve({
        models: [
          {
            name: 'llama2:7b',
            size: 1000,
            digest: 'abc',
            modified_at: '2024-01-01',
          },
        ],
      })
    );

    const result = await getInstalledModels();

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'llama2:7b');
  });

  test('pullModel should work as standalone function', async () => {
    mockOllamaClient.pull.mock.mockImplementationOnce(() => ({
      [Symbol.asyncIterator]: async function* () {
        yield { status: 'downloading', total: 1000, completed: 1000 };
      },
    }));

    await pullModel('llama2:7b');

    assert.strictEqual(mockOllamaClient.pull.mock.callCount(), 1);
  });

  test('removeModel should work as standalone function', async () => {
    mockOllamaClient.delete.mock.mockImplementationOnce(() =>
      Promise.resolve()
    );

    await removeModel('llama2:7b');

    assert.strictEqual(mockOllamaClient.delete.mock.callCount(), 1);
  });

  test('detectOllamaInstallation should work as standalone function', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'linux',
      configurable: true,
    });

    mockFsAccess.mock.mockImplementation(() =>
      Promise.reject(new Error('ENOENT'))
    );

    const result = await detectOllamaInstallation();

    assert.strictEqual(result.isInstalled, false);
    assert.strictEqual(result.platform, 'linux');
  });
});

// Integration-style tests for error handling
describe('Error Handling', () => {
  let ollamaUtils: OllamaUtils;

  beforeEach(() => {
    mockExec.mock.resetCalls();
    mockFsAccess.mock.resetCalls();
    mockOllamaClient.list.mock.resetCalls();
    mockOllamaClient.pull.mock.resetCalls();
    mockOllamaClient.delete.mock.resetCalls();
    mockOllamaClient.generate.mock.resetCalls();

    ollamaUtils = new OllamaUtils();
  });

  test('should provide helpful error messages', async () => {
    mockOllamaClient.list.mock.mockImplementationOnce(() =>
      Promise.reject(new Error('ECONNREFUSED'))
    );

    const result = await ollamaUtils.checkOllamaHealth();

    assert.strictEqual(result.isRunning, false);
    assert.ok(result.error);
    assert.ok(result.error.includes('ECONNREFUSED'));
  });

  test('should handle timeouts gracefully', async () => {
    const utils = new OllamaUtils({ timeout: 100 });

    // Mock a slow response
    mockOllamaClient.list.mock.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    const result = await utils.checkOllamaHealth();

    assert.strictEqual(result.isRunning, false);
    assert.ok(result.error);
  });

  test('should provide platform-specific installation suggestions', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true,
    });

    mockFsAccess.mock.mockImplementation(() =>
      Promise.reject(new Error('ENOENT'))
    );

    const result = await ollamaUtils.detectOllamaInstallation();

    assert.strictEqual(result.isInstalled, false);
    assert.ok(result.suggestions);
    assert.ok(result.suggestions.some((s) => s.includes('administrator')));
  });
});
