/**
 * Quality auditor for code maintainability and best practices
 */
import { BaseAuditor } from './base.js';
import type { AuditorConfig } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';
export declare class QualityAuditor extends BaseAuditor {
    constructor(config: AuditorConfig, ollamaClient: OllamaClient, modelManager: ModelManager);
}
//# sourceMappingURL=quality.d.ts.map