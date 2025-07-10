/**
 * Documentation auditor for API docs and code documentation
 */
import { BaseAuditor } from './base.js';
import type { AuditorConfig } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';
export declare class DocumentationAuditor extends BaseAuditor {
    constructor(config: AuditorConfig, ollamaClient: OllamaClient, modelManager: ModelManager);
}
//# sourceMappingURL=documentation.d.ts.map