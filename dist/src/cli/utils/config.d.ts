/**
 * Configuration utility for Code Audit MCP
 * Provides type-safe configuration management with global and project-specific overrides
 */
/**
 * Configuration schema for validation
 */
export interface ConfigSchema {
    ollama: {
        host: string;
        timeout: number;
        models: {
            primary: string;
            fallback: string[];
        };
    };
    audit: {
        rules: {
            security: boolean;
            performance: boolean;
            quality: boolean;
            documentation: boolean;
            testing: boolean;
            architecture: boolean;
            completeness: boolean;
        };
        output: {
            format: 'json' | 'markdown' | 'html';
            includeMetrics: boolean;
            verbosity: 'minimal' | 'normal' | 'detailed';
        };
        filters: {
            excludePatterns: string[];
            includePatterns: string[];
            maxFileSize: number;
        };
    };
    server: {
        port: number;
        transport: 'stdio' | 'http';
        logLevel: 'error' | 'warn' | 'info' | 'debug';
    };
    updates: {
        checkInterval: number;
        autoUpdate: boolean;
        prerelease: boolean;
    };
    telemetry: {
        enabled: boolean;
        anonymousId: string;
    };
}
/**
 * Configuration manager class
 */
declare class ConfigManager {
    private globalConfig;
    private projectConfigPath;
    private projectConfig;
    private configVersion;
    constructor();
    /**
     * Get configuration schema for validation
     */
    private getConfigSchema;
    /**
     * Initialize global configuration directory and files
     */
    private initializeGlobalConfig;
    /**
     * Generate anonymous telemetry ID
     */
    private generateAnonymousId;
    /**
     * Detect project-specific configuration
     */
    private detectProjectConfig;
    /**
     * Get merged configuration (global + project overrides)
     */
    getConfig(): ConfigSchema;
    /**
     * Get specific configuration value with support for nested keys
     */
    get<T>(key: string): T | undefined;
    /**
     * Set configuration value with support for nested keys
     */
    set(key: string, value: any, isGlobal?: boolean): void;
    /**
     * Reset configuration to defaults
     */
    reset(confirmCallback?: () => Promise<boolean>): Promise<boolean>;
    /**
     * Get configuration file paths
     */
    getConfigPaths(): {
        global: string;
        project?: string;
    };
    /**
     * Validate configuration value
     */
    private validateConfigValue;
    /**
     * Merge configurations with deep merge
     */
    private mergeConfigs;
    /**
     * Get nested configuration value
     */
    private getNestedValue;
    /**
     * Set nested configuration value
     */
    private setNestedValue;
    /**
     * Migrate configuration to newer version if needed
     */
    migrateConfig(): Promise<boolean>;
    /**
     * Export configuration for backup
     */
    exportConfig(): {
        global: ConfigSchema;
        project?: Partial<ConfigSchema>;
    };
    /**
     * Import configuration from backup
     */
    importConfig(config: {
        global: ConfigSchema;
        project?: Partial<ConfigSchema>;
    }): void;
    /**
     * Check if configuration is valid
     */
    validateConfig(): {
        isValid: boolean;
        errors: string[];
    };
}
/**
 * Get configuration manager instance
 */
export declare function getConfigManager(): ConfigManager;
/**
 * Get merged configuration
 */
export declare function getConfig(): Promise<ConfigSchema>;
/**
 * Get specific configuration value
 */
export declare function getConfigValue<T>(key: string): Promise<T | undefined>;
/**
 * Set configuration value
 */
export declare function setConfigValue(key: string, value: any, isGlobal?: boolean): Promise<void>;
/**
 * Reset configuration to defaults
 */
export declare function resetConfig(confirmCallback?: () => Promise<boolean>): Promise<boolean>;
/**
 * Get default configuration
 */
export declare function getDefaultConfig(): ConfigSchema;
/**
 * Check if project has local configuration
 */
export declare function hasProjectConfig(): boolean;
export {};
//# sourceMappingURL=config.d.ts.map