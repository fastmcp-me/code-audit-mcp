/**
 * MCP-aware logger that suppresses console output when running in stdio mode
 */
class MCPLogger {
    isMCPMode;
    options;
    constructor(options = {}) {
        // Detect if running in MCP stdio mode
        this.isMCPMode = process.env.MCP_STDIO_MODE === 'true' || process.argv.includes('--stdio');
        this.options = {
            enableConsole: !this.isMCPMode,
            enableFile: false,
            ...options,
        };
    }
    log(...args) {
        if (this.options.enableConsole && !this.isMCPMode) {
            console.log(...args);
        }
        // TODO: Add file logging if needed
    }
    error(...args) {
        if (this.options.enableConsole && !this.isMCPMode) {
            console.error(...args);
        }
        // TODO: Add file logging if needed
    }
    warn(...args) {
        if (this.options.enableConsole && !this.isMCPMode) {
            console.warn(...args);
        }
        // TODO: Add file logging if needed
    }
    debug(...args) {
        if (this.options.enableConsole && !this.isMCPMode) {
            console.log(...args);
        }
        // TODO: Add file logging if needed
    }
    info(...args) {
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
//# sourceMappingURL=mcp-logger.js.map