/**
 * MCP-aware logger that suppresses console output when running in stdio mode
 */
interface LoggerOptions {
    enableConsole?: boolean;
    enableFile?: boolean;
    logFile?: string;
}
declare class MCPLogger {
    private isMCPMode;
    private options;
    constructor(options?: LoggerOptions);
    log(...args: unknown[]): void;
    error(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
}
export declare const logger: MCPLogger;
export { MCPLogger };
//# sourceMappingURL=mcp-logger.d.ts.map