/**
 * Export all auditors
 */
export { BaseAuditor } from './base.js';
export { SecurityAuditor } from './security.js';
export { CompletenessAuditor } from './completeness.js';
export { PerformanceAuditor } from './performance.js';
export { QualityAuditor } from './quality.js';
export { ArchitectureAuditor } from './architecture.js';
export { TestingAuditor } from './testing.js';
export { DocumentationAuditor } from './documentation.js';
import type { AuditType, AuditorConfig } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';
import { BaseAuditor } from './base.js';
/**
 * Factory for creating auditor instances
 */
export declare class AuditorFactory {
    private static auditorClasses;
    static createAuditor(auditType: AuditType, config: AuditorConfig, ollamaClient: OllamaClient, modelManager: ModelManager): BaseAuditor;
    static createAllAuditors(configs: Record<AuditType, AuditorConfig>, ollamaClient: OllamaClient, modelManager: ModelManager): Record<AuditType, BaseAuditor>;
    static getSupportedAuditTypes(): AuditType[];
}
//# sourceMappingURL=index.d.ts.map