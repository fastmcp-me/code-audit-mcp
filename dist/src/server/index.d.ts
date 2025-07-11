/**
 * Main MCP server implementation for code auditing
 */
import type { ServerConfig } from './types.js';
/**
 * Main MCP server class
 */
export declare class CodeAuditServer {
    private server;
    private config;
    private ollamaClient;
    private modelManager;
    private auditors;
    private activeAudits;
    constructor(config?: Partial<ServerConfig>);
    /**
     * Initialize the server
     */
    initialize(): Promise<void>;
    /**
     * Initialize Ollama client asynchronously
     */
    private initializeOllamaAsync;
    /**
     * Setup tool handlers
     */
    private setupToolHandlers;
    /**
     * Handle audit_code tool requests
     */
    private handleAuditCode;
    /**
     * Perform the actual audit
     */
    private performAudit;
    /**
     * Perform multiple audits for 'all' type
     */
    private performMultipleAudits;
    /**
     * Perform fast mode audit (security + completeness only)
     */
    private performFastModeAudit;
    /**
     * Handle health_check tool requests
     */
    private handleHealthCheck;
    /**
     * Handle list_models tool requests
     */
    private handleListModels;
    /**
     * Handle update_config tool requests
     */
    private handleUpdateConfig;
    /**
     * Validate audit request
     */
    private validateAuditRequest;
    /**
     * Generate request key for deduplication
     */
    private generateRequestKey;
    /**
     * Simple hash function for code deduplication
     */
    private simpleHash;
    /**
     * Chunk array into smaller arrays
     */
    private chunkArray;
    /**
     * Merge multiple audit results
     */
    private mergeAuditResults;
    /**
     * Perform health check
     */
    private healthCheck;
    /**
     * Log audit metrics
     */
    private logAuditMetrics;
    /**
     * Setup error handling
     */
    private setupErrorHandling;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map