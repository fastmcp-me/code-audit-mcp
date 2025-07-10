/**
 * Documentation auditor for API docs and code documentation
 */
import { BaseAuditor } from './base.js';
export class DocumentationAuditor extends BaseAuditor {
    constructor(config, ollamaClient, modelManager) {
        super(config, ollamaClient, modelManager);
        this.auditType = 'documentation';
    }
}
//# sourceMappingURL=documentation.js.map