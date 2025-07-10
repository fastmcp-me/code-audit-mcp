/**
 * Completeness auditor for identifying incomplete implementations
 */
import { BaseAuditor } from './base.js';
import type { AuditRequest, AuditIssue, AuditorConfig } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';
export declare class CompletenessAuditor extends BaseAuditor {
    constructor(config: AuditorConfig, ollamaClient: OllamaClient, modelManager: ModelManager);
    /**
     * Post-process completeness issues with pattern detection
     */
    protected postProcessIssues(rawIssues: Partial<AuditIssue>[], request: AuditRequest, language: string): Promise<AuditIssue[]>;
    /**
     * Detect completeness patterns using static analysis
     */
    private detectCompletenessPatterns;
    /**
     * Check if line contains TODO comment
     */
    private isTodoComment;
    /**
     * Check if line contains FIXME comment
     */
    private isFixmeComment;
    /**
     * Check if line contains HACK comment
     */
    private isHackComment;
    /**
     * Check if line represents an empty function
     */
    private isEmptyFunction;
    /**
     * Check if function is missing return statement
     */
    private isMissingReturn;
    /**
     * Check if line contains placeholder implementation
     */
    private isPlaceholderImplementation;
    /**
     * Check if line is missing error handling
     */
    private isMissingErrorHandling;
    /**
     * Check if line contains unhandled promise
     */
    private isUnhandledPromise;
    /**
     * Create TODO issue
     */
    private createTodoIssue;
    /**
     * Create FIXME issue
     */
    private createFixmeIssue;
    /**
     * Create HACK issue
     */
    private createHackIssue;
    /**
     * Create empty function issue
     */
    private createEmptyFunctionIssue;
    /**
     * Create missing return issue
     */
    private createMissingReturnIssue;
    /**
     * Create placeholder issue
     */
    private createPlaceholderIssue;
    /**
     * Create missing error handling issue
     */
    private createMissingErrorHandlingIssue;
    /**
     * Create unhandled promise issue
     */
    private createUnhandledPromiseIssue;
    /**
     * Deduplicate issues by line number and type
     */
    private deduplicateIssues;
}
//# sourceMappingURL=completeness.d.ts.map