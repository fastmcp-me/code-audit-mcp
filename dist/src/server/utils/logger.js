/**
 * Logging utilities for the MCP server
 */
/**
 * Simple structured logger for the MCP server
 */
export class Logger {
    config;
    static instance;
    constructor(config) {
        this.config = config;
    }
    /**
     * Get singleton logger instance
     */
    static getInstance(config) {
        if (!Logger.instance) {
            Logger.instance = new Logger(config || {
                level: 'info',
                enableMetrics: false,
                enableTracing: false,
                enableTimestamps: true,
                enableColors: false
            });
        }
        return Logger.instance;
    }
    /**
     * Update logger configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Log debug message
     */
    debug(message, metadata, requestId) {
        this.log('debug', message, metadata, requestId);
    }
    /**
     * Log info message
     */
    info(message, metadata, requestId) {
        this.log('info', message, metadata, requestId);
    }
    /**
     * Log warning message
     */
    warn(message, metadata, requestId) {
        this.log('warn', message, metadata, requestId);
    }
    /**
     * Log error message
     */
    error(message, metadata, requestId) {
        this.log('error', message, metadata, requestId);
    }
    /**
     * Log audit metrics
     */
    metrics(category, metrics, requestId) {
        if (!this.config.enableMetrics) {
            return;
        }
        this.log('info', `Metrics: ${category}`, { metrics, category: 'metrics' }, requestId);
    }
    /**
     * Log trace information
     */
    trace(operation, metadata, requestId) {
        if (!this.config.enableTracing) {
            return;
        }
        this.log('debug', `Trace: ${operation}`, { ...metadata, category: 'trace' }, requestId);
    }
    /**
     * Core logging method
     */
    log(level, message, metadata, requestId) {
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = {
            timestamp: this.config.enableTimestamps ? new Date().toISOString() : '',
            level,
            message,
            metadata,
            requestId,
            category: metadata?.category
        };
        const formatted = this.formatLogEntry(entry);
        this.output(level, formatted);
    }
    /**
     * Check if message should be logged based on level
     */
    shouldLog(level) {
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        return levels[level] >= levels[this.config.level];
    }
    /**
     * Format log entry for output
     */
    formatLogEntry(entry) {
        const parts = [];
        // Timestamp
        if (entry.timestamp && this.config.enableTimestamps) {
            parts.push(`[${entry.timestamp}]`);
        }
        // Level
        const levelStr = this.config.enableColors ? this.colorize(entry.level) : entry.level.toUpperCase();
        parts.push(`[${levelStr}]`);
        // Request ID
        if (entry.requestId) {
            parts.push(`[${entry.requestId.substring(0, 8)}]`);
        }
        // Category
        if (entry.category) {
            parts.push(`[${entry.category}]`);
        }
        // Message
        parts.push(entry.message);
        // Metadata
        if (entry.metadata && Object.keys(entry.metadata).length > 0) {
            const metadataStr = JSON.stringify(entry.metadata, null, 2);
            parts.push(`\n${metadataStr}`);
        }
        return parts.join(' ');
    }
    /**
     * Add colors to log levels (for terminal output)
     */
    colorize(level) {
        if (!this.config.enableColors) {
            return level.toUpperCase();
        }
        const colors = {
            debug: '\x1b[36m', // Cyan
            info: '\x1b[32m', // Green
            warn: '\x1b[33m', // Yellow
            error: '\x1b[31m' // Red
        };
        const reset = '\x1b[0m';
        return `${colors[level]}${level.toUpperCase()}${reset}`;
    }
    /**
     * Output log message to appropriate stream
     */
    output(level, message) {
        if (level === 'error') {
            console.error(message);
        }
        else {
            console.log(message);
        }
    }
}
/**
 * Performance timer utility
 */
export class PerformanceTimer {
    startTime;
    endTime;
    name;
    constructor(name) {
        this.name = name;
        this.startTime = performance.now();
    }
    /**
     * Stop the timer and return duration
     */
    stop() {
        this.endTime = performance.now();
        return this.getDuration();
    }
    /**
     * Get duration without stopping timer
     */
    getDuration() {
        const end = this.endTime || performance.now();
        return end - this.startTime;
    }
    /**
     * Log the timer result
     */
    log(logger, level = 'debug', requestId) {
        const duration = this.getDuration();
        const message = `Timer: ${this.name} completed in ${duration.toFixed(2)}ms`;
        const metadata = {
            category: 'performance',
            timer: this.name,
            duration
        };
        switch (level) {
            case 'debug':
                logger.debug(message, metadata, requestId);
                break;
            case 'info':
                logger.info(message, metadata, requestId);
                break;
            case 'warn':
                logger.warn(message, metadata, requestId);
                break;
            case 'error':
                logger.error(message, metadata, requestId);
                break;
        }
    }
}
/**
 * Create a performance timer
 */
export function createTimer(name) {
    return new PerformanceTimer(name);
}
/**
 * Audit event logger
 */
export class AuditLogger {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Log audit start
     */
    auditStarted(auditType, language, requestId) {
        this.logger.info(`Audit started: ${auditType} for ${language}`, {
            category: 'audit',
            auditType,
            language,
            event: 'started'
        }, requestId);
    }
    /**
     * Log audit completion
     */
    auditCompleted(auditType, language, issueCount, duration, requestId) {
        this.logger.info(`Audit completed: ${auditType} for ${language}`, {
            category: 'audit',
            auditType,
            language,
            issueCount,
            duration,
            event: 'completed'
        }, requestId);
    }
    /**
     * Log audit failure
     */
    auditFailed(auditType, language, error, requestId) {
        this.logger.error(`Audit failed: ${auditType} for ${language}`, {
            category: 'audit',
            auditType,
            language,
            error,
            event: 'failed'
        }, requestId);
    }
    /**
     * Log model selection
     */
    modelSelected(auditType, selectedModel, requestId) {
        this.logger.debug(`Model selected: ${selectedModel} for ${auditType}`, {
            category: 'model',
            auditType,
            selectedModel,
            event: 'selected'
        }, requestId);
    }
    /**
     * Log model fallback
     */
    modelFallback(auditType, originalModel, fallbackModel, reason, requestId) {
        this.logger.warn(`Model fallback: ${originalModel} -> ${fallbackModel}`, {
            category: 'model',
            auditType,
            originalModel,
            fallbackModel,
            reason,
            event: 'fallback'
        }, requestId);
    }
    /**
     * Log Ollama client events
     */
    ollamaEvent(event, metadata) {
        this.logger.debug(`Ollama: ${event}`, {
            category: 'ollama',
            event,
            ...metadata
        });
    }
    /**
     * Log server health check
     */
    healthCheck(status, checks) {
        this.logger.info(`Health check: ${status}`, {
            category: 'health',
            status,
            checks
        });
    }
}
/**
 * Create default logger with common configuration
 */
export function createLogger(config) {
    const defaultConfig = {
        level: 'info',
        enableMetrics: true,
        enableTracing: false,
        enableTimestamps: true,
        enableColors: false
    };
    return new Logger({ ...defaultConfig, ...config });
}
/**
 * Create audit logger
 */
export function createAuditLogger(logger) {
    return new AuditLogger(logger || Logger.getInstance());
}
//# sourceMappingURL=logger.js.map