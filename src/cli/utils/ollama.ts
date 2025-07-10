/**
 * Ollama utility functions for CLI commands
 */

import { getConfig } from './config.js';

interface OllamaModel {
  name: string;
  size: string;
  modified: string;
}

interface OllamaInfo {
  models: string[];
  version?: string;
}

/**
 * Check Ollama health status
 */
export async function checkOllamaHealth(host?: string): Promise<OllamaInfo> {
  const config = await getConfig();
  const ollamaHost = host || config.ollama.host;

  try {
    const response = await fetch(`${ollamaHost}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config.ollama.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    const models = data.models ? data.models.map((m: any) => m.name) : [];

    return {
      models,
      version: data.version || 'unknown',
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to connect to Ollama at ${ollamaHost}: ${error.message}`
      );
    }
    throw new Error(`Failed to connect to Ollama at ${ollamaHost}`);
  }
}

/**
 * Get list of installed models
 */
export async function getInstalledModels(): Promise<OllamaModel[]> {
  const config = await getConfig();

  try {
    const response = await fetch(`${config.ollama.host}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config.ollama.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    return data.models || [];
  } catch (error) {
    throw new Error(
      `Failed to get installed models: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check health status of individual models
 */
export async function getModelHealth(): Promise<Record<string, boolean>> {
  const models = await getInstalledModels();
  const health: Record<string, boolean> = {};

  // For now, assume all installed models are healthy
  // In a more complete implementation, this could test each model
  for (const model of models) {
    health[model.name] = true;
  }

  return health;
}

/**
 * Pull a model from Ollama
 */
export async function pullModel(modelName: string): Promise<void> {
  const config = await getConfig();

  try {
    const response = await fetch(`${config.ollama.host}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
      signal: AbortSignal.timeout(300000), // 5 minutes for model pull
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }

    // Handle streaming response for progress updates
    const reader = response.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse and handle progress updates here if needed
        new TextDecoder().decode(value);
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to pull model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Remove a model from Ollama
 */
export async function removeModel(modelName: string): Promise<void> {
  const config = await getConfig();

  try {
    const response = await fetch(`${config.ollama.host}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
      signal: AbortSignal.timeout(config.ollama.timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove model: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to remove model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Ensure required models are installed
 */
export async function ensureRequiredModels(): Promise<void> {
  const config = await getConfig();
  const installedModels = await getInstalledModels();
  const installedModelNames = installedModels.map((m) => m.name);

  // Essential models that should be available
  const requiredModels = ['codellama:7b', 'granite-code:8b'];

  const missingModels = requiredModels.filter(
    (model) =>
      !installedModelNames.some((installed) => installed.includes(model))
  );

  if (missingModels.length > 0) {
    console.warn(
      `Warning: Missing required models: ${missingModels.join(', ')}`
    );
    console.warn('Server will start but may have limited functionality.');
    console.warn(
      'Run "code-audit models --pull <model>" to install missing models.'
    );
  }
}
