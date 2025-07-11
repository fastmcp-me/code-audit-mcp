/**
 * MCP-aware logger that suppresses console output when running in stdio mode
 */

interface LoggerOptions {
  enableConsole?: boolean;
  enableFile?: boolean;
  logFile?: string;
}

class MCPLogger {
  private isMCPMode: boolean;
  private options: LoggerOptions;

  constructor(options: LoggerOptions = {}) {
    // Detect if running in MCP stdio mode
    this.isMCPMode =
      process.env.MCP_STDIO_MODE === 'true' || process.argv.includes('--stdio');
    this.options = {
      enableConsole: !this.isMCPMode,
      enableFile: false,
      ...options,
    };
  }

  log(...args: unknown[]): void {
    if (this.options.enableConsole && !this.isMCPMode) {
      console.log(...args);
    } else if (this.isMCPMode && process.env.DEBUG_MCP === 'true') {
      // In MCP mode with debug, write to stderr to avoid corrupting stdio
      console.error('[LOG]', ...args);
    }
    // TODO: Add file logging if needed
  }

  error(...args: unknown[]): void {
    if (this.options.enableConsole && !this.isMCPMode) {
      console.error(...args);
    } else if (this.isMCPMode) {
      // Always write errors to stderr in MCP mode
      console.error('[ERROR]', ...args);
    }
    // TODO: Add file logging if needed
  }

  warn(...args: unknown[]): void {
    if (this.options.enableConsole && !this.isMCPMode) {
      console.warn(...args);
    } else if (this.isMCPMode && process.env.DEBUG_MCP === 'true') {
      // In MCP mode with debug, write to stderr to avoid corrupting stdio
      console.error('[WARN]', ...args);
    }
    // TODO: Add file logging if needed
  }

  debug(...args: unknown[]): void {
    if (this.options.enableConsole && !this.isMCPMode) {
      console.log(...args);
    } else if (this.isMCPMode && process.env.DEBUG_MCP === 'true') {
      // In MCP mode with debug, write to stderr to avoid corrupting stdio
      console.error('[DEBUG]', ...args);
    }
    // TODO: Add file logging if needed
  }

  info(...args: unknown[]): void {
    if (this.options.enableConsole && !this.isMCPMode) {
      console.log(...args);
    } else if (this.isMCPMode && process.env.DEBUG_MCP === 'true') {
      // In MCP mode with debug, write to stderr to avoid corrupting stdio
      console.error('[INFO]', ...args);
    }
    // TODO: Add file logging if needed
  }
}

// Export singleton instance
export const logger = new MCPLogger();

// Export class for custom instances
export { MCPLogger };
