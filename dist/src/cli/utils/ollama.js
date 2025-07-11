/**
 * Ollama utility functions for CLI commands
 */
import { getConfig } from './config.js';
import { execSync } from 'child_process';
/**
 * Check Ollama health status
 */
export async function checkOllamaHealth(host) {
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
            throw new Error(`Ollama API returned ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const models = data.models
            ? data.models.map((m) => m.name)
            : [];
        return {
            models,
            version: data.version || 'unknown',
        };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to connect to Ollama at ${ollamaHost}: ${error.message}`);
        }
        throw new Error(`Failed to connect to Ollama at ${ollamaHost}`);
    }
}
/**
 * Get list of installed models
 */
export async function getInstalledModels() {
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
            throw new Error(`Ollama API returned ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.models || [];
    }
    catch (error) {
        throw new Error(`Failed to get installed models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Check health status of individual models
 */
export async function getModelHealth() {
    const models = await getInstalledModels();
    const health = {};
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
export async function pullModel(modelName, onProgress) {
    const config = await getConfig();
    let lastProgressTime = 0;
    const progressThrottleMs = 500; // Update at most twice per second
    try {
        const response = await fetch(`${config.ollama.host}/api/pull`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: modelName }),
            signal: AbortSignal.timeout(3600000), // 60 minutes for model pull
        });
        if (!response.ok) {
            throw new Error(`Failed to pull model: ${response.statusText}`);
        }
        // Handle streaming response for progress updates
        const reader = response.body?.getReader();
        if (reader) {
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    // Clear the progress line when done
                    process.stdout.write('\r' + ' '.repeat(80) + '\r');
                    break;
                }
                buffer += new TextDecoder().decode(value);
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            // Enhanced progress display
                            if (data.status === 'downloading' &&
                                data.completed &&
                                data.total) {
                                const now = Date.now();
                                if (now - lastProgressTime >= progressThrottleMs) {
                                    lastProgressTime = now;
                                    const percent = ((data.completed / data.total) * 100).toFixed(1);
                                    const mbDownloaded = (data.completed / (1024 * 1024)).toFixed(1);
                                    const mbTotal = (data.total / (1024 * 1024)).toFixed(1);
                                    const progressText = `${percent}% (${mbDownloaded}MB / ${mbTotal}MB)`;
                                    // Clear line and write progress
                                    process.stdout.write(`\rDownloading ${modelName}: ${progressText}`);
                                }
                            }
                            if (onProgress)
                                onProgress(data);
                        }
                        catch {
                            // Ignore parse errors
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        // Clear any progress line on error
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
        throw new Error(`Failed to pull model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Remove a model from Ollama
 */
export async function removeModel(modelName) {
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
    }
    catch (error) {
        throw new Error(`Failed to remove model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Ensure required models are installed
 */
export async function ensureRequiredModels() {
    const _config = await getConfig();
    const installedModels = await getInstalledModels();
    const installedModelNames = installedModels.map((m) => m.name);
    // Essential models that should be available
    const requiredModels = ['codellama:7b', 'granite-code:8b'];
    const missingModels = requiredModels.filter((model) => !installedModelNames.some((installed) => installed.includes(model)));
    if (missingModels.length > 0) {
        console.warn(`Warning: Missing required models: ${missingModels.join(', ')}`);
        console.warn('Server will start but may have limited functionality.');
        console.warn('Run "code-audit models --pull <model>" to install missing models.');
    }
}
export async function pullModelWithRetry(modelName, onProgress, maxRetries = 3) {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            await pullModel(modelName, onProgress);
            return;
        }
        catch (error) {
            attempts++;
            if (attempts >= maxRetries) {
                throw error;
            }
            const delay = 5000 * Math.pow(2, attempts - 1);
            console.log(`Retry attempt ${attempts}/${maxRetries} after ${delay / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}
export function estimateModelSize(modelName) {
    if (modelName.includes('70b'))
        return 40; // GB
    if (modelName.includes('34b'))
        return 20;
    if (modelName.includes('13b'))
        return 8;
    if (modelName.includes('7b') || modelName.includes('8b'))
        return 4;
    return 10; // Default
}
export function getAvailableDiskSpace() {
    try {
        const output = execSync('df -k / | tail -1').toString().trim();
        const parts = output.split(/\s+/);
        const availableKB = parseInt(parts[3]);
        return Math.floor(availableKB / 1024 / 1024); // Convert to GB
    }
    catch {
        return -1; // Error, unknown space
    }
}
//# sourceMappingURL=ollama.js.map