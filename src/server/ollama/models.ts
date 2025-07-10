/**
 * Model configuration and specialization for different audit types
 */

import type { ModelConfig, AuditType } from '../types.js';

/**
 * Default model configurations with specializations
 */
export const DEFAULT_MODELS: Record<string, ModelConfig> = {
  'codellama:7b': {
    name: 'codellama:7b',
    displayName: 'CodeLlama 7B',
    specialization: ['security', 'completeness', 'quality'],
    maxTokens: 4096,
    temperature: 0.1,
    topP: 0.9,
    fallbackModels: ['codellama:13b', 'deepseek-coder:6.7b'],
    performance: {
      speed: 'fast',
      accuracy: 'medium',
      resourceUsage: 'medium',
    },
  },

  'codellama:13b': {
    name: 'codellama:13b',
    displayName: 'CodeLlama 13B',
    specialization: ['security', 'completeness', 'quality', 'architecture'],
    maxTokens: 4096,
    temperature: 0.1,
    topP: 0.9,
    fallbackModels: ['codellama:7b', 'deepseek-coder:6.7b'],
    performance: {
      speed: 'medium',
      accuracy: 'high',
      resourceUsage: 'medium',
    },
  },

  'deepseek-coder:6.7b': {
    name: 'deepseek-coder:6.7b',
    displayName: 'DeepSeek Coder 6.7B',
    specialization: ['performance', 'quality', 'architecture'],
    maxTokens: 4096,
    temperature: 0.1,
    topP: 0.95,
    fallbackModels: ['codellama:7b', 'starcoder2:7b'],
    performance: {
      speed: 'medium',
      accuracy: 'high',
      resourceUsage: 'medium',
    },
  },

  'deepseek-coder:33b': {
    name: 'deepseek-coder:33b',
    displayName: 'DeepSeek Coder 33B',
    specialization: ['performance', 'architecture', 'quality', 'documentation'],
    maxTokens: 4096,
    temperature: 0.1,
    topP: 0.95,
    fallbackModels: ['deepseek-coder:6.7b', 'codellama:13b'],
    performance: {
      speed: 'slow',
      accuracy: 'high',
      resourceUsage: 'high',
    },
  },

  'starcoder2:7b': {
    name: 'starcoder2:7b',
    displayName: 'StarCoder2 7B',
    specialization: ['testing', 'quality', 'completeness'],
    maxTokens: 4096,
    temperature: 0.1,
    topP: 0.9,
    fallbackModels: ['codellama:7b', 'deepseek-coder:6.7b'],
    performance: {
      speed: 'fast',
      accuracy: 'medium',
      resourceUsage: 'medium',
    },
  },

  'starcoder2:15b': {
    name: 'starcoder2:15b',
    displayName: 'StarCoder2 15B',
    specialization: ['testing', 'architecture', 'documentation'],
    maxTokens: 4096,
    temperature: 0.1,
    topP: 0.9,
    fallbackModels: ['starcoder2:7b', 'codellama:13b'],
    performance: {
      speed: 'medium',
      accuracy: 'high',
      resourceUsage: 'high',
    },
  },

  'qwen2.5-coder:7b': {
    name: 'qwen2.5-coder:7b',
    displayName: 'Qwen2.5 Coder 7B',
    specialization: ['completeness', 'quality', 'documentation'],
    maxTokens: 4096,
    temperature: 0.1,
    topP: 0.9,
    fallbackModels: ['codellama:7b', 'starcoder2:7b'],
    performance: {
      speed: 'fast',
      accuracy: 'medium',
      resourceUsage: 'medium',
    },
  },

  'llama3.1:8b': {
    name: 'llama3.1:8b',
    displayName: 'Llama 3.1 8B',
    specialization: ['documentation', 'architecture'],
    maxTokens: 4096,
    temperature: 0.1,
    topP: 0.9,
    fallbackModels: ['codellama:7b'],
    performance: {
      speed: 'fast',
      accuracy: 'medium',
      resourceUsage: 'medium',
    },
  },

  'granite-code:8b': {
    name: 'granite-code:8b',
    displayName: 'Granite Code 8B',
    specialization: ['security', 'quality', 'completeness'],
    maxTokens: 4096,
    temperature: 0.1,
    topP: 0.9,
    fallbackModels: ['codellama:7b', 'deepseek-coder:6.7b'],
    performance: {
      speed: 'fast',
      accuracy: 'medium',
      resourceUsage: 'medium',
    },
  },
};

/**
 * Priority order for models by audit type (best to worst)
 */
export const MODEL_PRIORITY: Record<AuditType, string[]> = {
  security: [
    'granite-code:8b',
    'codellama:13b',
    'codellama:7b',
    'deepseek-coder:6.7b',
    'qwen2.5-coder:7b',
  ],

  completeness: [
    'codellama:13b',
    'qwen2.5-coder:7b',
    'starcoder2:7b',
    'codellama:7b',
    'granite-code:8b',
  ],

  performance: [
    'deepseek-coder:33b',
    'deepseek-coder:6.7b',
    'codellama:13b',
    'granite-code:8b',
    'codellama:7b',
  ],

  quality: [
    'deepseek-coder:33b',
    'deepseek-coder:6.7b',
    'codellama:13b',
    'qwen2.5-coder:7b',
    'starcoder2:15b',
    'granite-code:8b',
  ],

  architecture: [
    'deepseek-coder:33b',
    'starcoder2:15b',
    'codellama:13b',
    'deepseek-coder:6.7b',
    'llama3.1:8b',
  ],

  testing: [
    'starcoder2:15b',
    'starcoder2:7b',
    'deepseek-coder:6.7b',
    'codellama:13b',
    'qwen2.5-coder:7b',
  ],

  documentation: [
    'deepseek-coder:33b',
    'llama3.1:8b',
    'qwen2.5-coder:7b',
    'starcoder2:15b',
    'codellama:13b',
  ],

  all: [
    'deepseek-coder:33b',
    'codellama:13b',
    'deepseek-coder:6.7b',
    'starcoder2:15b',
    'granite-code:8b',
    'codellama:7b',
  ],
};

/**
 * Fast mode models (prioritize speed for rapid feedback)
 */
export const FAST_MODE_MODELS: string[] = [
  'codellama:7b',
  'granite-code:8b',
  'starcoder2:7b',
  'qwen2.5-coder:7b',
  'deepseek-coder:6.7b',
];

/**
 * Thorough mode models (prioritize accuracy over speed)
 */
export const THOROUGH_MODE_MODELS: string[] = [
  'deepseek-coder:33b',
  'codellama:13b',
  'starcoder2:15b',
  'deepseek-coder:6.7b',
];

/**
 * Language-specific model preferences
 */
export const LANGUAGE_MODEL_PREFERENCES: Record<string, string[]> = {
  javascript: ['deepseek-coder:6.7b', 'codellama:13b', 'qwen2.5-coder:7b'],
  typescript: ['deepseek-coder:6.7b', 'codellama:13b', 'qwen2.5-coder:7b'],
  python: ['deepseek-coder:33b', 'codellama:13b', 'granite-code:8b'],
  java: ['deepseek-coder:6.7b', 'granite-code:8b', 'codellama:13b'],
  csharp: ['deepseek-coder:6.7b', 'codellama:13b', 'granite-code:8b'],
  cpp: ['deepseek-coder:6.7b', 'codellama:13b', 'granite-code:8b'],
  c: ['codellama:13b', 'granite-code:8b', 'deepseek-coder:6.7b'],
  go: ['deepseek-coder:6.7b', 'codellama:13b', 'granite-code:8b'],
  rust: ['deepseek-coder:6.7b', 'codellama:13b', 'granite-code:8b'],
  php: ['codellama:13b', 'deepseek-coder:6.7b', 'qwen2.5-coder:7b'],
  ruby: ['codellama:13b', 'deepseek-coder:6.7b', 'granite-code:8b'],
  swift: ['codellama:13b', 'deepseek-coder:6.7b', 'granite-code:8b'],
  kotlin: ['deepseek-coder:6.7b', 'codellama:13b', 'granite-code:8b'],
  scala: ['deepseek-coder:6.7b', 'codellama:13b', 'granite-code:8b'],
  html: ['qwen2.5-coder:7b', 'codellama:7b', 'deepseek-coder:6.7b'],
  css: ['qwen2.5-coder:7b', 'codellama:7b', 'deepseek-coder:6.7b'],
  sql: ['granite-code:8b', 'codellama:13b', 'deepseek-coder:6.7b'],
  shell: ['codellama:13b', 'granite-code:8b', 'deepseek-coder:6.7b'],
  yaml: ['qwen2.5-coder:7b', 'codellama:7b', 'granite-code:8b'],
  json: ['qwen2.5-coder:7b', 'codellama:7b', 'deepseek-coder:6.7b'],
  dockerfile: ['granite-code:8b', 'codellama:13b', 'deepseek-coder:6.7b'],
};

/**
 * Model selection strategy interface
 */
export interface ModelSelectionStrategy {
  selectModel(
    auditType: AuditType,
    language: string,
    priority: 'fast' | 'thorough',
    availableModels: string[]
  ): string | null;
}

/**
 * Default model selection strategy
 */
export class DefaultModelSelectionStrategy implements ModelSelectionStrategy {
  selectModel(
    auditType: AuditType,
    language: string,
    priority: 'fast' | 'thorough',
    availableModels: string[]
  ): string | null {
    // Get preference lists
    const auditTypeModels = MODEL_PRIORITY[auditType] || MODEL_PRIORITY.all;
    const languageModels =
      LANGUAGE_MODEL_PREFERENCES[language.toLowerCase()] || [];
    const priorityModels =
      priority === 'fast' ? FAST_MODE_MODELS : THOROUGH_MODE_MODELS;

    // Create weighted scoring
    const scores = new Map<string, number>();

    // Score by audit type preference (highest weight)
    auditTypeModels.forEach((model, index) => {
      if (availableModels.includes(model)) {
        scores.set(
          model,
          (scores.get(model) || 0) + (auditTypeModels.length - index) * 3
        );
      }
    });

    // Score by language preference (medium weight)
    languageModels.forEach((model, index) => {
      if (availableModels.includes(model)) {
        scores.set(
          model,
          (scores.get(model) || 0) + (languageModels.length - index) * 2
        );
      }
    });

    // Score by priority preference (lower weight)
    priorityModels.forEach((model, index) => {
      if (availableModels.includes(model)) {
        scores.set(
          model,
          (scores.get(model) || 0) + (priorityModels.length - index) * 1
        );
      }
    });

    // Find the highest scoring model
    let bestModel: string | null = null;
    let bestScore = -1;

    for (const [model, score] of scores.entries()) {
      if (score > bestScore) {
        bestModel = model;
        bestScore = score;
      }
    }

    // Fallback to first available model if no scored models
    if (!bestModel && availableModels.length > 0) {
      bestModel = availableModels[0];
    }

    return bestModel;
  }
}

/**
 * Performance-optimized model selection strategy
 */
export class PerformanceModelSelectionStrategy
  implements ModelSelectionStrategy
{
  selectModel(
    auditType: AuditType,
    language: string,
    priority: 'fast' | 'thorough',
    availableModels: string[]
  ): string | null {
    // Always prefer fastest models for performance optimization
    const fastModels = FAST_MODE_MODELS.filter((model) =>
      availableModels.includes(model)
    );

    if (fastModels.length > 0) {
      // Still consider audit type for fast models
      const auditTypeModels = MODEL_PRIORITY[auditType] || [];
      for (const model of auditTypeModels) {
        if (fastModels.includes(model)) {
          return model;
        }
      }
      return fastModels[0];
    }

    // Fallback to default strategy
    return (
      new DefaultModelSelectionStrategy().selectModel(
        auditType,
        language,
        priority,
        availableModels
      ) || null
    );
  }
}

/**
 * Quality-focused model selection strategy
 */
export class QualityModelSelectionStrategy implements ModelSelectionStrategy {
  selectModel(
    auditType: AuditType,
    language: string,
    priority: 'fast' | 'thorough',
    availableModels: string[]
  ): string | null {
    // Always prefer highest quality models regardless of speed
    const qualityModels = THOROUGH_MODE_MODELS.filter((model) =>
      availableModels.includes(model)
    );

    if (qualityModels.length > 0) {
      const auditTypeModels = MODEL_PRIORITY[auditType] || [];
      for (const model of auditTypeModels) {
        if (qualityModels.includes(model)) {
          return model;
        }
      }
      return qualityModels[0];
    }

    // Fallback to default strategy
    return (
      new DefaultModelSelectionStrategy().selectModel(
        auditType,
        language,
        priority,
        availableModels
      ) || null
    );
  }
}

/**
 * Model manager for handling model selection and configuration
 */
export class ModelManager {
  private strategy: ModelSelectionStrategy;
  private modelConfigs: Map<string, ModelConfig>;

  constructor(
    strategy: ModelSelectionStrategy = new DefaultModelSelectionStrategy()
  ) {
    this.strategy = strategy;
    this.modelConfigs = new Map();

    // Load default configurations
    for (const [name, config] of Object.entries(DEFAULT_MODELS)) {
      this.modelConfigs.set(name, config);
    }
  }

  /**
   * Select the best model for given criteria
   */
  selectModel(
    auditType: AuditType,
    language: string,
    priority: 'fast' | 'thorough',
    availableModels: string[]
  ): string | null {
    return (
      this.strategy.selectModel(
        auditType,
        language,
        priority,
        availableModels
      ) || null
    );
  }

  /**
   * Get configuration for a specific model
   */
  getModelConfig(modelName: string): ModelConfig | undefined {
    return this.modelConfigs.get(modelName);
  }

  /**
   * Update model configuration
   */
  updateModelConfig(modelName: string, config: Partial<ModelConfig>): void {
    const existing = this.modelConfigs.get(modelName);
    if (existing) {
      this.modelConfigs.set(modelName, { ...existing, ...config });
    } else {
      this.modelConfigs.set(modelName, {
        name: modelName,
        displayName: modelName,
        specialization: [],
        maxTokens: 4096,
        temperature: 0.1,
        performance: {
          speed: 'medium',
          accuracy: 'medium',
          resourceUsage: 'medium',
        },
        ...config,
      });
    }
  }

  /**
   * Get all configured models
   */
  getAllModels(): ModelConfig[] {
    return Array.from(this.modelConfigs.values());
  }

  /**
   * Get models specialized for specific audit type
   */
  getModelsForAuditType(auditType: AuditType): ModelConfig[] {
    return this.getAllModels().filter((config) =>
      config.specialization.includes(auditType)
    );
  }

  /**
   * Get recommended models to download
   */
  getRecommendedModels(): string[] {
    return [
      'codellama:7b', // Fast, good general purpose
      'deepseek-coder:6.7b', // Good performance analysis
      'granite-code:8b', // Good security analysis
      'starcoder2:7b', // Good testing analysis
    ];
  }

  /**
   * Change model selection strategy
   */
  setStrategy(strategy: ModelSelectionStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get fallback models for a given model
   */
  getFallbackModels(modelName: string): string[] {
    const config = this.getModelConfig(modelName);
    return config?.fallbackModels || [];
  }
}
