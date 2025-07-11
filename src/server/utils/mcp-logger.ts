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
    }
    // TODO: Add file logging if needed
  }

  error(...args: unknown[]): void {
    if (this.options.enableConsole && !this.isMCPMode) {
      console.error(...args);
    }
    // TODO: Add file logging if needed
  }

  warn(...args: unknown[]): void {
    if (this.options.enableConsole && !this.isMCPMode) {
      console.warn(...args);
    }
    // TODO: Add file logging if needed
  }

  debug(...args: unknown[]): void {
    if (this.options.enableConsole && !this.isMCPMode) {
      console.log(...args);
    }
    // TODO: Add file logging if needed
  }

  info(...args: unknown[]): void {
    if (this.options.enableConsole && !this.isMCPMode) {
      console.log(...args);
    }
    // TODO: Add file logging if needed
  }
}

// Export singleton instance
export const logger = new MCPLogger();

// Export class for custom instances
export { MCPLogger };
