/**
 * Architecture auditor for design patterns and system structure
 */
import { BaseAuditor } from './base.js';
export class ArchitectureAuditor extends BaseAuditor {
    constructor(config, ollamaClient, modelManager) {
        super(config, ollamaClient, modelManager);
        this.auditType = 'architecture';
    }
}
//# sourceMappingURL=architecture.js.map