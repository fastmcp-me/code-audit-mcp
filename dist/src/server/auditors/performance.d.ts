/**
 * Performance auditor for identifying bottlenecks and optimization opportunities
 */
import { BaseAuditor } from './base.js';
import type { AuditRequest, AuditIssue, AuditorConfig } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';
export declare class PerformanceAuditor extends BaseAuditor {
    constructor(config: AuditorConfig, ollamaClient: OllamaClient, modelManager: ModelManager);
    /**
     * Post-process performance issues with complexity analysis
     */
    protected postProcessIssues(rawIssues: Partial<AuditIssue>[], request: AuditRequest, language: string): Promise<AuditIssue[]>;
    /**
     * Detect performance patterns using static analysis
     */
    private detectPerformancePatterns;
    /**
     * Check for nested loops
     */
    private isNestedLoop;
    /**
     * Check for inefficient string concatenation
     */
    private isInefficientStringConcatenation;
    /**
     * Check for database queries in loops
     */
    private isQueryInLoop;
    /**
     * Check for synchronous file operations
     */
    private isSyncFileOperation;
    /**
     * Check for object creation in loops
     */
    private isObjectCreationInLoop;
    /**
     * Check for missing caching opportunities
     */
    private isMissingCaching;
    /**
     * Check for inefficient array operations
     */
    private isInefficientArrayOperation;
    /**
     * Check for memory leak potential
     */
    private isMemoryLeakPotential;
    /**
     * Check for blocking operations in async context
     */
    private isBlockingInAsyncContext;
    /**
     * Check for inefficient DOM operations
     */
    private isInefficientDOMOperation;
    /**
     * Create performance issue objects
     */
    private createNestedLoopIssue;
    private createStringConcatenationIssue;
    private createQueryInLoopIssue;
    private createSyncFileOperationIssue;
    private createObjectCreationInLoopIssue;
    private createMissingCachingIssue;
    private createInefficientArrayOperationIssue;
    private createMemoryLeakIssue;
    private createBlockingOperationIssue;
    private createDOMOperationIssue;
    /**
     * Adjust severity based on performance criticality
     */
    private adjustSeverityForContext;
    /**
     * Deduplicate issues by line number and type
     */
    private deduplicateIssues;
}
//# sourceMappingURL=performance.d.ts.map