/**
 * Security auditor for identifying security vulnerabilities
 */
import { BaseAuditor } from './base.js';
import type { AuditRequest, AuditIssue, AuditorConfig } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';
export declare class SecurityAuditor extends BaseAuditor {
    constructor(config: AuditorConfig, ollamaClient: OllamaClient, modelManager: ModelManager);
    /**
     * Post-process security issues with additional validation
     */
    protected postProcessIssues(rawIssues: Partial<AuditIssue>[], request: AuditRequest, language: string): Promise<AuditIssue[]>;
    /**
     * Classify security issue with more specific types
     */
    private classifySecurityIssue;
    /**
     * Add OWASP Top 10 mapping
     */
    private addOWASPMapping;
    /**
     * Validate and adjust severity based on environment
     */
    private validateSecuritySeverity;
    /**
     * Get a specific line from code
     */
    private getCodeLine;
    /**
     * Override temperature for security analysis (more conservative)
     */
    protected getTemperature(): number;
}
//# sourceMappingURL=security.d.ts.map