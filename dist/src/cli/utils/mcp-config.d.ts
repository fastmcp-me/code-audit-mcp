/**
 * MCP (Model Context Protocol) configuration management for Claude Desktop and Claude Code
 * Handles detection, reading, and writing of MCP server configurations across different environments
 */
/**
 * MCP server configuration interface
 */
export interface MCPServerConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
/**
 * MCP configuration file structure
 */
export interface MCPConfig {
    mcpServers?: Record<string, MCPServerConfig>;
    [key: string]: unknown;
}
/**
 * Claude environment types
 */
export declare enum ClaudeEnvironment {
    DESKTOP = "desktop",
    CODE_GLOBAL = "code-global",
    CODE_PROJECT = "code-project"
}
/**
 * Configuration paths for different Claude environments
 */
export interface ClaudeConfigPaths {
    desktop?: string;
    codeGlobal?: string;
    codeProject?: string;
}
/**
 * MCP configuration manager class
 */
export declare class MCPConfigManager {
    private configPaths;
    private executablePath;
    constructor();
    /**
     * Detect configuration file paths based on platform and environment
     */
    private detectConfigPaths;
    /**
     * Get available Claude environments
     */
    getAvailableEnvironments(): {
        environment: ClaudeEnvironment;
        path: string;
        exists: boolean;
        configured: boolean;
    }[];
    /**
     * Read configuration from a specific environment
     */
    private readConfig;
    /**
     * Write configuration to a specific environment
     */
    private writeConfig;
    /**
     * Get configuration path for an environment
     */
    private getConfigPath;
    /**
     * Resolve the executable path for code-audit
     */
    resolveExecutablePath(): Promise<string>;
    /**
     * Generate MCP server configuration for code-audit
     */
    private generateServerConfig;
    /**
     * Check if code-audit server is already configured
     */
    isServerConfigured(environment: ClaudeEnvironment): boolean;
    /**
     * Configure code-audit as an MCP server
     */
    configureServer(environment: ClaudeEnvironment, options?: {
        force?: boolean;
        serverName?: string;
    }): Promise<boolean>;
    /**
     * Remove code-audit from MCP servers
     */
    removeServer(environment: ClaudeEnvironment, serverName?: string): boolean;
    /**
     * Get current MCP configuration status
     */
    getStatus(): {
        executable: string | null;
        environments: ReturnType<typeof this.getAvailableEnvironments>;
    };
    /**
     * Backup MCP configurations
     */
    backupConfigurations(): Promise<{
        desktop?: MCPConfig;
        codeGlobal?: MCPConfig;
        codeProject?: MCPConfig;
        timestamp: string;
    }>;
    /**
     * Restore MCP configurations from backup
     */
    restoreConfigurations(backup: Awaited<ReturnType<typeof this.backupConfigurations>>, environments?: ClaudeEnvironment[]): void;
    /**
     * Auto-detect and configure all available environments
     */
    autoConfigureAll(options?: {
        force?: boolean;
    }): Promise<{
        configured: ClaudeEnvironment[];
        failed: ClaudeEnvironment[];
        skipped: ClaudeEnvironment[];
    }>;
}
/**
 * Get MCP configuration manager instance
 */
export declare function getMCPConfigManager(): MCPConfigManager;
//# sourceMappingURL=mcp-config.d.ts.map