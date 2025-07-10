/**
 * Base auditor abstract class with common functionality
 */
import type { AuditRequest, AuditResult, AuditIssue, AuditorConfig, AuditError, AuditType, Severity, AuditSummary, AuditCoverage, AuditSuggestions } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';
export declare abstract class BaseAuditor {
    protected auditType: AuditType;
    protected config: AuditorConfig;
    protected ollamaClient: OllamaClient;
    protected modelManager: ModelManager;
    constructor(config: AuditorConfig, ollamaClient: OllamaClient, modelManager: ModelManager);
    /**
     * Main audit method - implements the core audit workflow
     */
    audit(request: AuditRequest): Promise<AuditResult>;
    /**
     * Validate the audit request
     */
    protected validateRequest(request: AuditRequest): void;
    /**
     * Check if this auditor should run for the given request
     */
    protected shouldAudit(request: AuditRequest): boolean;
    /**
     * Detect or validate the programming language
     */
    protected detectLanguage(code: string, declaredLanguage: string): string;
    /**
     * Analyze basic code metrics
     */
    protected analyzeCodeMetrics(code: string, language: string): Promise<{
        lineCount: number;
        functionCount: number;
        complexity: number;
    }>;
    /**
     * Select the best model for this audit
     */
    protected selectModel(request: AuditRequest, language: string): string | null;
    /**
     * Get temperature for model generation
     */
    protected getTemperature(): number;
    /**
     * Get max tokens for model generation
     */
    protected getMaxTokens(): number;
    /**
     * Parse AI response into structured issues
     */
    protected parseAIResponse(response: string): Promise<Partial<AuditIssue>[]>;
    /**
     * Fallback parsing when JSON parsing fails
     */
    protected fallbackParseResponse(response: string): Partial<AuditIssue>[];
    /**
     * Post-process and validate issues from AI
     */
    protected postProcessIssues(rawIssues: Partial<AuditIssue>[], request: AuditRequest, language: string): Promise<AuditIssue[]>;
    /**
     * Validate and normalize a single issue
     */
    protected validateAndNormalizeIssue(raw: Partial<AuditIssue>, request: AuditRequest, language: string): AuditIssue | null;
    /**
     * Normalize severity to valid values
     */
    protected normalizeSeverity(severity?: string): Severity;
    /**
     * Extract code snippet around a specific line
     */
    protected extractCodeSnippet(code: string, line: number, context?: number): string;
    /**
     * Filter issues based on configuration and request
     */
    protected filterIssues(issues: AuditIssue[], request: AuditRequest): AuditIssue[];
    /**
     * Sort issues by severity and line number
     */
    protected sortIssues(issues: AuditIssue[]): AuditIssue[];
    /**
     * Create audit result
     */
    protected createResult(requestId: string, issues: AuditIssue[], model: string, startTime: number, aiResponseTime: number, codeMetrics: {
        lineCount: number;
        functionCount: number;
        complexity: number;
    }): AuditResult;
    /**
     * Create audit summary
     */
    protected createSummary(issues: AuditIssue[]): AuditSummary;
    /**
     * Create coverage information
     */
    protected createCoverage(codeMetrics: {
        lineCount: number;
        functionCount: number;
        complexity: number;
    }, issues: AuditIssue[]): AuditCoverage;
    /**
     * Create suggestions based on issues
     */
    protected createSuggestions(issues: AuditIssue[]): AuditSuggestions;
    /**
     * Create empty result for disabled auditors
     */
    protected createEmptyResult(requestId: string, startTime: number): AuditResult;
    /**
     * Create standardized error
     */
    protected createError(code: string, message: string, details?: unknown): AuditError;
    /**
     * Get audit type
     */
    getAuditType(): AuditType;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<AuditorConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): AuditorConfig;
}
//# sourceMappingURL=base.d.ts.map