/**
 * Start command - Launch the MCP server
 */
interface StartOptions {
    daemon?: boolean;
    port?: string;
    stdio?: boolean;
}
/**
 * Start the MCP server
 */
export declare function startCommand(options: StartOptions): Promise<void>;
export {};
//# sourceMappingURL=start.d.ts.map