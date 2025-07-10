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
import { SecurityAuditor } from './security.js';
import { CompletenessAuditor } from './completeness.js';
import { PerformanceAuditor } from './performance.js';
import { QualityAuditor } from './quality.js';
import { ArchitectureAuditor } from './architecture.js';
import { TestingAuditor } from './testing.js';
import { DocumentationAuditor } from './documentation.js';
/**
 * Factory for creating auditor instances
 */
export class AuditorFactory {
    static auditorClasses = {
        security: SecurityAuditor,
        completeness: CompletenessAuditor,
        performance: PerformanceAuditor,
        quality: QualityAuditor,
        architecture: ArchitectureAuditor,
        testing: TestingAuditor,
        documentation: DocumentationAuditor,
    };
    static createAuditor(auditType, config, ollamaClient, modelManager) {
        if (auditType === 'all') {
            throw new Error('Cannot create auditor for type "all". Use specific audit types.');
        }
        const AuditorClass = this.auditorClasses[auditType];
        if (!AuditorClass) {
            throw new Error(`Unknown audit type: ${auditType}`);
        }
        return new AuditorClass(config, ollamaClient, modelManager);
    }
    static createAllAuditors(configs, ollamaClient, modelManager) {
        const auditors = {};
        const auditTypes = [
            'security',
            'completeness',
            'performance',
            'quality',
            'architecture',
            'testing',
            'documentation',
        ];
        for (const auditType of auditTypes) {
            const config = configs[auditType];
            if (config && config.enabled) {
                auditors[auditType] = this.createAuditor(auditType, config, ollamaClient, modelManager);
            }
        }
        return auditors;
    }
    static getSupportedAuditTypes() {
        return Object.keys(this.auditorClasses).filter((type) => type !== 'all');
    }
}
//# sourceMappingURL=index.js.map