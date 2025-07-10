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
export class Logger {
  private config: LoggerConfig;
  private static instance: Logger;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  /**
   * Get singleton logger instance
   */
  static getInstance(config?: LoggerConfig): Logger {
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
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, unknown>, requestId?: string): void {
    this.log('debug', message, metadata, requestId);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, unknown>, requestId?: string): void {
    this.log('info', message, metadata, requestId);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>, requestId?: string): void {
    this.log('warn', message, metadata, requestId);
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: Record<string, unknown>, requestId?: string): void {
    this.log('error', message, metadata, requestId);
  }

  /**
   * Log audit metrics
   */
  metrics(category: string, metrics: Record<string, number>, requestId?: string): void {
    if (!this.config.enableMetrics) {
      return;
    }

    this.log('info', `Metrics: ${category}`, { metrics, category: 'metrics' }, requestId);
  }

  /**
   * Log trace information
   */
  trace(operation: string, metadata?: Record<string, unknown>, requestId?: string): void {
    if (!this.config.enableTracing) {
      return;
    }

    this.log('debug', `Trace: ${operation}`, { ...metadata, category: 'trace' }, requestId);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>, requestId?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.config.enableTimestamps ? new Date().toISOString() : '',
      level,
      message,
      metadata,
      requestId,
      category: metadata?.category as string
    };

    const formatted = this.formatLogEntry(entry);
    this.output(level, formatted);
  }

  /**
   * Check if message should be logged based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
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
  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];

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
  private colorize(level: LogLevel): string {
    if (!this.config.enableColors) {
      return level.toUpperCase();
    }

    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m'  // Red
    };

    const reset = '\x1b[0m';
    return `${colors[level]}${level.toUpperCase()}${reset}`;
  }

  /**
   * Output log message to appropriate stream
   */
  private output(level: LogLevel, message: string): void {
    if (level === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
  }
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;
  private endTime?: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
  }

  /**
   * Stop the timer and return duration
   */
  stop(): number {
    this.endTime = performance.now();
    return this.getDuration();
  }

  /**
   * Get duration without stopping timer
   */
  getDuration(): number {
    const end = this.endTime || performance.now();
    return end - this.startTime;
  }

  /**
   * Log the timer result
   */
  log(logger: Logger, level: LogLevel = 'debug', requestId?: string): void {
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
export function createTimer(name: string): PerformanceTimer {
  return new PerformanceTimer(name);
}

/**
 * Audit event logger
 */
export class AuditLogger {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Log audit start
   */
  auditStarted(auditType: string, language: string, requestId: string): void {
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
  auditCompleted(
    auditType: string,
    language: string,
    issueCount: number,
    duration: number,
    requestId: string
  ): void {
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
  auditFailed(auditType: string, language: string, error: string, requestId: string): void {
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
  modelSelected(auditType: string, selectedModel: string, requestId: string): void {
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
  modelFallback(
    auditType: string,
    originalModel: string,
    fallbackModel: string,
    reason: string,
    requestId: string
  ): void {
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
  ollamaEvent(event: string, metadata: Record<string, unknown>): void {
    this.logger.debug(`Ollama: ${event}`, {
      category: 'ollama',
      event,
      ...metadata
    });
  }

  /**
   * Log server health check
   */
  healthCheck(status: string, checks: Record<string, boolean>): void {
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
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  const defaultConfig: LoggerConfig = {
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
export function createAuditLogger(logger?: Logger): AuditLogger {
  return new AuditLogger(logger || Logger.getInstance());
}