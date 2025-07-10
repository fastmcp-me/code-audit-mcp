/**
 * Logging utilities for the MCP server
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    metadata?: Record<string, unknown>;
    requestId?: string;
    category?: string;
}
export interface LoggerConfig {
    level: LogLevel;
    enableMetrics: boolean;
    enableTracing: boolean;
    enableTimestamps: boolean;
    enableColors: boolean;
}
/**
 * Simple structured logger for the MCP server
 */
export declare class Logger {
    private config;
    private static instance;
    constructor(config: LoggerConfig);
    /**
     * Get singleton logger instance
     */
    static getInstance(config?: LoggerConfig): Logger;
    /**
     * Update logger configuration
     */
    updateConfig(config: Partial<LoggerConfig>): void;
    /**
     * Log debug message
     */
    debug(message: string, metadata?: Record<string, unknown>, requestId?: string): void;
    /**
     * Log info message
     */
    info(message: string, metadata?: Record<string, unknown>, requestId?: string): void;
    /**
     * Log warning message
     */
    warn(message: string, metadata?: Record<string, unknown>, requestId?: string): void;
    /**
     * Log error message
     */
    error(message: string, metadata?: Record<string, unknown>, requestId?: string): void;
    /**
     * Log audit metrics
     */
    metrics(category: string, metrics: Record<string, number>, requestId?: string): void;
    /**
     * Log trace information
     */
    trace(operation: string, metadata?: Record<string, unknown>, requestId?: string): void;
    /**
     * Core logging method
     */
    private log;
    /**
     * Check if message should be logged based on level
     */
    private shouldLog;
    /**
     * Format log entry for output
     */
    private formatLogEntry;
    /**
     * Add colors to log levels (for terminal output)
     */
    private colorize;
    /**
     * Output log message to appropriate stream
     */
    private output;
}
/**
 * Performance timer utility
 */
export declare class PerformanceTimer {
    private startTime;
    private endTime?;
    private name;
    constructor(name: string);
    /**
     * Stop the timer and return duration
     */
    stop(): number;
    /**
     * Get duration without stopping timer
     */
    getDuration(): number;
    /**
     * Log the timer result
     */
    log(logger: Logger, level?: LogLevel, requestId?: string): void;
}
/**
 * Create a performance timer
 */
export declare function createTimer(name: string): PerformanceTimer;
/**
 * Audit event logger
 */
export declare class AuditLogger {
    private logger;
    constructor(logger: Logger);
    /**
     * Log audit start
     */
    auditStarted(auditType: string, language: string, requestId: string): void;
    /**
     * Log audit completion
     */
    auditCompleted(auditType: string, language: string, issueCount: number, duration: number, requestId: string): void;
    /**
     * Log audit failure
     */
    auditFailed(auditType: string, language: string, error: string, requestId: string): void;
    /**
     * Log model selection
     */
    modelSelected(auditType: string, selectedModel: string, requestId: string): void;
    /**
     * Log model fallback
     */
    modelFallback(auditType: string, originalModel: string, fallbackModel: string, reason: string, requestId: string): void;
    /**
     * Log Ollama client events
     */
    ollamaEvent(event: string, metadata: Record<string, unknown>): void;
    /**
     * Log server health check
     */
    healthCheck(status: string, checks: Record<string, boolean>): void;
}
/**
 * Create default logger with common configuration
 */
export declare function createLogger(config?: Partial<LoggerConfig>): Logger;
/**
 * Create audit logger
 */
export declare function createAuditLogger(logger?: Logger): AuditLogger;
//# sourceMappingURL=logger.d.ts.map