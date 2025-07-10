/**
 * Ollama HTTP client wrapper with retry logic and health checking
 */
import { Ollama } from 'ollama';
export class OllamaClient {
    client;
    config;
    availableModels = new Set();
    modelMetrics = new Map();
    lastHealthCheck = 0;
    isHealthy = false;
    constructor(config) {
        this.config = config;
        this.client = new Ollama({
            host: config.host,
        });
    }
    /**
     * Initialize the client and perform health check
     */
    async initialize() {
        try {
            await this.refreshAvailableModels();
            this.isHealthy = true;
            console.log(`Ollama client initialized with ${this.availableModels.size} models`);
        }
        catch (error) {
            this.isHealthy = false;
            throw new Error(`Failed to initialize Ollama client: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if Ollama service is healthy and refresh model list
     */
    async healthCheck() {
        const now = Date.now();
        // Skip if checked recently
        if (now - this.lastHealthCheck < this.config.healthCheckInterval) {
            return {
                status: this.isHealthy ? 'healthy' : 'unhealthy',
                checks: {
                    ollama: {
                        status: this.isHealthy,
                        models: Array.from(this.availableModels),
                        lastCheck: new Date().toISOString()
                    },
                    auditors: {
                        security: true,
                        completeness: true,
                        performance: true,
                        quality: true,
                        architecture: true,
                        testing: true,
                        documentation: true,
                        all: true
                    },
                    system: {
                        memory: 0,
                        disk: 0
                    }
                },
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: now - this.lastHealthCheck
            };
        }
        this.lastHealthCheck = now;
        try {
            // Test basic connectivity
            await this.client.list();
            // Refresh available models
            await this.refreshAvailableModels();
            this.isHealthy = true;
            return {
                status: 'healthy',
                checks: {
                    ollama: {
                        status: true,
                        models: Array.from(this.availableModels),
                        lastCheck: new Date().toISOString()
                    },
                    auditors: {
                        security: true,
                        completeness: true,
                        performance: true,
                        quality: true,
                        architecture: true,
                        testing: true,
                        documentation: true,
                        all: true
                    },
                    system: {
                        memory: 0,
                        disk: 0
                    }
                },
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: now
            };
        }
        catch (error) {
            this.isHealthy = false;
            console.error('Ollama health check failed:', error);
            return {
                status: 'unhealthy',
                checks: {
                    ollama: {
                        status: false,
                        models: Array.from(this.availableModels),
                        lastCheck: new Date().toISOString()
                    },
                    auditors: {
                        security: true,
                        completeness: true,
                        performance: true,
                        quality: true,
                        architecture: true,
                        testing: true,
                        documentation: true,
                        all: true
                    },
                    system: {
                        memory: 0,
                        disk: 0
                    }
                },
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: now
            };
        }
    }
    /**
     * Generate response from model with retry logic
     */
    async generate(request) {
        if (!this.isHealthy) {
            await this.healthCheck();
            if (!this.isHealthy) {
                throw this.createError('OLLAMA_UNAVAILABLE', 'Ollama service is not available');
            }
        }
        if (!this.availableModels.has(request.model)) {
            throw this.createError('MODEL_NOT_FOUND', `Model '${request.model}' is not available`);
        }
        const startTime = Date.now();
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const response = await this.executeGenerate(request);
                // Update metrics
                this.updateModelMetrics(request.model, Date.now() - startTime, false);
                return response;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                // Update failure metrics
                this.updateModelMetrics(request.model, Date.now() - startTime, true);
                if (attempt === this.config.retryAttempts) {
                    break;
                }
                // Wait before retry with exponential backoff
                const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
                await this.sleep(delay);
                console.warn(`Ollama request failed (attempt ${attempt}/${this.config.retryAttempts}), retrying in ${delay}ms:`, lastError.message);
            }
        }
        throw this.createError('GENERATION_FAILED', `Failed to generate response after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
    }
    /**
     * Execute the actual generation request
     */
    async executeGenerate(request) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        try {
            const response = await this.client.generate({
                model: request.model,
                prompt: request.prompt,
                system: request.system,
                options: {
                    temperature: request.temperature,
                    top_p: request.top_p,
                    num_predict: request.max_tokens,
                },
                stream: false,
            });
            return {
                response: response.response,
                model: request.model,
                created_at: response.created_at.toISOString(),
                done: response.done,
                total_duration: response.total_duration,
                load_duration: response.load_duration,
                prompt_eval_count: response.prompt_eval_count,
                prompt_eval_duration: response.prompt_eval_duration,
                eval_count: response.eval_count,
                eval_duration: response.eval_duration,
            };
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Refresh the list of available models
     */
    async refreshAvailableModels() {
        try {
            const models = await this.client.list();
            this.availableModels.clear();
            for (const model of models.models) {
                this.availableModels.add(model.name);
            }
            console.log(`Found ${this.availableModels.size} available models:`, Array.from(this.availableModels));
        }
        catch (error) {
            throw new Error(`Failed to refresh model list: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if a specific model is available
     */
    isModelAvailable(modelName) {
        return this.availableModels.has(modelName);
    }
    /**
     * Get list of available models
     */
    getAvailableModels() {
        return Array.from(this.availableModels);
    }
    /**
     * Pull a model if not available
     */
    async ensureModel(modelName) {
        if (this.isModelAvailable(modelName)) {
            return true;
        }
        try {
            console.log(`Pulling model: ${modelName}`);
            await this.client.pull({ model: modelName });
            // Refresh model list
            await this.refreshAvailableModels();
            return this.isModelAvailable(modelName);
        }
        catch (error) {
            console.error(`Failed to pull model ${modelName}:`, error);
            return false;
        }
    }
    /**
     * Get model performance metrics
     */
    getModelMetrics(modelName) {
        return this.modelMetrics.get(modelName) || {
            requests: 0,
            failures: 0,
            avgResponseTime: 0,
            lastUsed: new Date(0)
        };
    }
    /**
     * Get all model metrics
     */
    getAllMetrics() {
        const metrics = {};
        for (const [model, data] of this.modelMetrics.entries()) {
            metrics[model] = {
                ...data,
                successRate: data.requests > 0 ? ((data.requests - data.failures) / data.requests) : 0
            };
        }
        return metrics;
    }
    /**
     * Select the best available model from a list of candidates
     */
    selectBestModel(candidates, considerPerformance = true) {
        const available = candidates.filter(model => this.isModelAvailable(model));
        if (available.length === 0) {
            return null;
        }
        if (!considerPerformance || available.length === 1) {
            return available[0];
        }
        // Select based on success rate and response time
        let bestModel = available[0];
        let bestScore = -1;
        for (const model of available) {
            const metrics = this.getModelMetrics(model);
            if (metrics.requests === 0) {
                // Prefer untested models over failed ones
                if (bestScore < 0.5) {
                    bestModel = model;
                    bestScore = 0.5;
                }
                continue;
            }
            const successRate = (metrics.requests - metrics.failures) / metrics.requests;
            const responseScore = Math.max(0, 1 - (metrics.avgResponseTime / 30000)); // 30s baseline
            const score = (successRate * 0.7) + (responseScore * 0.3);
            if (score > bestScore) {
                bestModel = model;
                bestScore = score;
            }
        }
        return bestModel;
    }
    /**
     * Update model performance metrics
     */
    updateModelMetrics(modelName, responseTime, failed) {
        const current = this.modelMetrics.get(modelName) || {
            requests: 0,
            failures: 0,
            avgResponseTime: 0,
            lastUsed: new Date()
        };
        current.requests++;
        if (failed) {
            current.failures++;
        }
        // Update average response time (exponential moving average)
        current.avgResponseTime = current.avgResponseTime === 0
            ? responseTime
            : (current.avgResponseTime * 0.8) + (responseTime * 0.2);
        current.lastUsed = new Date();
        this.modelMetrics.set(modelName, current);
    }
    /**
     * Get health status for all models
     */
    getModelHealthStatus() {
        const status = {};
        for (const model of this.availableModels) {
            const metrics = this.getModelMetrics(model);
            status[model] = metrics.requests === 0 || (metrics.failures / metrics.requests) < 0.5;
        }
        return status;
    }
    /**
     * Create standardized error
     */
    createError(code, message, details) {
        return {
            code,
            message,
            details,
            recoverable: code !== 'OLLAMA_UNAVAILABLE',
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        // Clear metrics and caches
        this.modelMetrics.clear();
        this.availableModels.clear();
        this.isHealthy = false;
    }
}
//# sourceMappingURL=client.js.map