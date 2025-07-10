/**
 * Model configuration and specialization for different audit types
 */
import type { ModelConfig, AuditType } from '../types.js';
/**
 * Default model configurations with specializations
 */
export declare const DEFAULT_MODELS: Record<string, ModelConfig>;
/**
 * Priority order for models by audit type (best to worst)
 */
export declare const MODEL_PRIORITY: Record<AuditType, string[]>;
/**
 * Fast mode models (prioritize speed for rapid feedback)
 */
export declare const FAST_MODE_MODELS: string[];
/**
 * Thorough mode models (prioritize accuracy over speed)
 */
export declare const THOROUGH_MODE_MODELS: string[];
/**
 * Language-specific model preferences
 */
export declare const LANGUAGE_MODEL_PREFERENCES: Record<string, string[]>;
/**
 * Model selection strategy interface
 */
export interface ModelSelectionStrategy {
    selectModel(auditType: AuditType, language: string, priority: 'fast' | 'thorough', availableModels: string[]): string | null;
}
/**
 * Default model selection strategy
 */
export declare class DefaultModelSelectionStrategy implements ModelSelectionStrategy {
    selectModel(auditType: AuditType, language: string, priority: 'fast' | 'thorough', availableModels: string[]): string | null;
}
/**
 * Performance-optimized model selection strategy
 */
export declare class PerformanceModelSelectionStrategy implements ModelSelectionStrategy {
    selectModel(auditType: AuditType, language: string, priority: 'fast' | 'thorough', availableModels: string[]): string | null;
}
/**
 * Quality-focused model selection strategy
 */
export declare class QualityModelSelectionStrategy implements ModelSelectionStrategy {
    selectModel(auditType: AuditType, language: string, priority: 'fast' | 'thorough', availableModels: string[]): string | null;
}
/**
 * Model manager for handling model selection and configuration
 */
export declare class ModelManager {
    private strategy;
    private modelConfigs;
    constructor(strategy?: ModelSelectionStrategy);
    /**
     * Select the best model for given criteria
     */
    selectModel(auditType: AuditType, language: string, priority: 'fast' | 'thorough', availableModels: string[]): string | null;
    /**
     * Get configuration for a specific model
     */
    getModelConfig(modelName: string): ModelConfig | undefined;
    /**
     * Update model configuration
     */
    updateModelConfig(modelName: string, config: Partial<ModelConfig>): void;
    /**
     * Get all configured models
     */
    getAllModels(): ModelConfig[];
    /**
     * Get models specialized for specific audit type
     */
    getModelsForAuditType(auditType: AuditType): ModelConfig[];
    /**
     * Get recommended models to download
     */
    getRecommendedModels(): string[];
    /**
     * Change model selection strategy
     */
    setStrategy(strategy: ModelSelectionStrategy): void;
    /**
     * Get fallback models for a given model
     */
    getFallbackModels(modelName: string): string[];
}
//# sourceMappingURL=models.d.ts.map