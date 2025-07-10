/**
 * Testing auditor for testability and test coverage analysis
 */
import { BaseAuditor } from './base.js';
export class TestingAuditor extends BaseAuditor {
    constructor(config, ollamaClient, modelManager) {
        super(config, ollamaClient, modelManager);
        this.auditType = 'testing';
    }
}
//# sourceMappingURL=testing.js.map