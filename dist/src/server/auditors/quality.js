/**
 * Quality auditor for code maintainability and best practices
 */
import { BaseAuditor } from './base.js';
export class QualityAuditor extends BaseAuditor {
    constructor(config, ollamaClient, modelManager) {
        super(config, ollamaClient, modelManager);
        this.auditType = 'quality';
    }
}
//# sourceMappingURL=quality.js.map