/**
 * MCP command - Manage MCP server configurations for Claude
 */
interface MCPOptions {
    list?: boolean;
    backup?: boolean;
    restore?: string;
    remove?: boolean;
    force?: boolean;
    environment?: string;
}
/**
 * Main MCP command handler
 */
export declare function mcpCommand(subcommand?: string, options?: MCPOptions): Promise<void>;
export {};
//# sourceMappingURL=mcp.d.ts.map