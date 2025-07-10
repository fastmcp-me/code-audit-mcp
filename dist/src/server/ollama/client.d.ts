/**
 * Ollama HTTP client wrapper with retry logic and health checking
 */
import type { OllamaConfig, HealthCheckResult } from '../types.js';
export interface OllamaResponse {
    response: string;
    model: string;
    created_at: string;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}
export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    system?: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    stream?: boolean;
}
export declare class OllamaClient {
    private client;
    private config;
    private availableModels;
    private modelMetrics;
    private lastHealthCheck;
    private isHealthy;
    constructor(config: OllamaConfig);
    /**
     * Initialize the client and perform health check
     */
    initialize(): Promise<void>;
    /**
     * Check if Ollama service is healthy and refresh model list
     */
    healthCheck(): Promise<HealthCheckResult>;
    /**
     * Generate response from model with retry logic
     */
    generate(request: OllamaGenerateRequest): Promise<OllamaResponse>;
    /**
     * Execute the actual generation request
     */
    private executeGenerate;
    /**
     * Refresh the list of available models
     */
    refreshAvailableModels(): Promise<void>;
    /**
     * Check if a specific model is available
     */
    isModelAvailable(modelName: string): boolean;
    /**
     * Get list of available models
     */
    getAvailableModels(): string[];
    /**
     * Pull a model if not available
     */
    ensureModel(modelName: string): Promise<boolean>;
    /**
     * Get model performance metrics
     */
    getModelMetrics(modelName: string): {
        requests: number;
        failures: number;
        totalDuration: number;
        avgResponseTime: number;
        lastUsed: Date;
    };
    /**
     * Get all model metrics
     */
    getAllMetrics(): Record<string, {
        requests: number;
        failures: number;
        totalDuration: number;
        averageDuration: number;
        lastUsed: Date;
        successRate: number;
    }>;
    /**
     * Select the best available model from a list of candidates
     */
    selectBestModel(candidates: string[], considerPerformance?: boolean): string | null;
    /**
     * Update model performance metrics
     */
    private updateModelMetrics;
    /**
     * Get health status for all models
     */
    private getModelHealthStatus;
    /**
     * Create standardized error
     */
    private createError;
    /**
     * Sleep utility for retry delays
     */
    private sleep;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map