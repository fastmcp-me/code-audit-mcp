/**
 * Configuration utility for Code Audit MCP
 * Provides type-safe configuration management with global and project-specific overrides
 */
import Conf from 'conf';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
    ollama: {
        host: 'http://localhost:11434',
        timeout: 30000,
        models: {
            primary: 'codellama:7b',
            fallback: ['granite-code:8b', 'qwen2.5-coder:7b'],
        },
    },
    audit: {
        rules: {
            security: true,
            performance: true,
            quality: true,
            documentation: true,
            testing: true,
            architecture: true,
            completeness: true,
        },
        output: {
            format: 'json',
            includeMetrics: true,
            verbosity: 'normal',
        },
        filters: {
            excludePatterns: [
                'node_modules/**',
                'dist/**',
                'build/**',
                '**/*.min.js',
                '**/*.d.ts',
                'coverage/**',
                '.git/**',
            ],
            includePatterns: [
                '**/*.ts',
                '**/*.js',
                '**/*.jsx',
                '**/*.tsx',
                '**/*.py',
                '**/*.java',
                '**/*.go',
                '**/*.rs',
            ],
            maxFileSize: 1048576, // 1MB
        },
    },
    server: {
        port: 3000,
        transport: 'stdio',
        logLevel: 'info',
    },
    updates: {
        checkInterval: 86400000, // 24 hours
        autoUpdate: false,
        prerelease: false,
    },
    telemetry: {
        enabled: false,
        anonymousId: '',
    },
};
/**
 * Configuration manager class
 */
class ConfigManager {
    globalConfig;
    projectConfigPath = null;
    projectConfig = null;
    configVersion = '1.0.0';
    constructor() {
        // Initialize global configuration using 'conf' package
        this.globalConfig = new Conf({
            projectName: 'code-audit-mcp',
            projectVersion: this.configVersion,
            defaults: DEFAULT_CONFIG,
            configName: 'config',
            configFileMode: 0o600, // Secure file permissions
            serialize: (value) => JSON.stringify(value, null, 2),
            // Note: schema validation disabled for now due to complexity
        });
        this.initializeGlobalConfig();
        this.detectProjectConfig();
    }
    /**
     * Get configuration schema for validation
     */
    getConfigSchema() {
        return {
            type: 'object',
            properties: {
                ollama: {
                    type: 'object',
                    properties: {
                        host: { type: 'string' },
                        timeout: { type: 'number', minimum: 1000 },
                        models: {
                            type: 'object',
                            properties: {
                                primary: { type: 'string' },
                                fallback: { type: 'array', items: { type: 'string' } },
                            },
                            required: ['primary', 'fallback'],
                        },
                    },
                    required: ['host', 'timeout', 'models'],
                },
                audit: {
                    type: 'object',
                    properties: {
                        rules: {
                            type: 'object',
                            properties: {
                                security: { type: 'boolean' },
                                performance: { type: 'boolean' },
                                quality: { type: 'boolean' },
                                documentation: { type: 'boolean' },
                                testing: { type: 'boolean' },
                                architecture: { type: 'boolean' },
                                completeness: { type: 'boolean' },
                            },
                            required: [
                                'security',
                                'performance',
                                'quality',
                                'documentation',
                                'testing',
                                'architecture',
                                'completeness',
                            ],
                        },
                    },
                },
            },
        };
    }
    /**
     * Initialize global configuration directory and files
     */
    initializeGlobalConfig() {
        const configDir = join(homedir(), '.code-audit');
        if (!existsSync(configDir)) {
            mkdirSync(configDir, { recursive: true, mode: 0o755 });
        }
        // Generate anonymous telemetry ID if not exists
        if (!this.globalConfig.get('telemetry.anonymousId')) {
            const anonymousId = this.generateAnonymousId();
            this.globalConfig.set('telemetry.anonymousId', anonymousId);
        }
    }
    /**
     * Generate anonymous telemetry ID
     */
    generateAnonymousId() {
        return ('audit_' +
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15));
    }
    /**
     * Detect project-specific configuration
     */
    detectProjectConfig() {
        const cwd = process.cwd();
        const possiblePaths = [
            join(cwd, '.code-audit.json'),
            join(cwd, '.code-audit', 'config.json'),
            join(cwd, 'package.json'), // Check for config in package.json
        ];
        for (const configPath of possiblePaths) {
            if (existsSync(configPath)) {
                try {
                    let config = null;
                    if (configPath.endsWith('package.json')) {
                        const packageJson = JSON.parse(readFileSync(configPath, 'utf8'));
                        config = packageJson['code-audit'];
                    }
                    else {
                        config = JSON.parse(readFileSync(configPath, 'utf8'));
                    }
                    if (config) {
                        this.projectConfigPath = configPath;
                        this.projectConfig = config;
                        break;
                    }
                }
                catch (error) {
                    // Skip invalid config files
                }
            }
        }
    }
    /**
     * Get merged configuration (global + project overrides)
     */
    getConfig() {
        const globalConfig = this.globalConfig.store;
        if (this.projectConfig) {
            return this.mergeConfigs(globalConfig, this.projectConfig);
        }
        return globalConfig;
    }
    /**
     * Get specific configuration value with support for nested keys
     */
    get(key) {
        const config = this.getConfig();
        return this.getNestedValue(config, key);
    }
    /**
     * Set configuration value with support for nested keys
     */
    set(key, value, isGlobal = true) {
        this.validateConfigValue(key, value);
        if (isGlobal) {
            this.setNestedValue(this.globalConfig.store, key, value);
            this.globalConfig.store = { ...this.globalConfig.store };
        }
        else {
            throw new Error('Project-specific configuration setting not yet implemented');
        }
    }
    /**
     * Reset configuration to defaults
     */
    async reset(confirmCallback) {
        if (confirmCallback && !(await confirmCallback())) {
            return false;
        }
        this.globalConfig.clear();
        this.globalConfig.store = { ...DEFAULT_CONFIG };
        this.initializeGlobalConfig();
        return true;
    }
    /**
     * Get configuration file paths
     */
    getConfigPaths() {
        return {
            global: this.globalConfig.path,
            ...(this.projectConfigPath && { project: this.projectConfigPath }),
        };
    }
    /**
     * Validate configuration value
     */
    validateConfigValue(key, value) {
        // Basic validation for common configuration keys
        const validations = {
            'ollama.host': (val) => typeof val === 'string' && val.length > 0,
            'ollama.timeout': (val) => typeof val === 'number' && val >= 1000,
            'audit.output.format': (val) => ['json', 'markdown', 'html'].includes(val),
            'audit.output.verbosity': (val) => ['minimal', 'normal', 'detailed'].includes(val),
            'server.transport': (val) => ['stdio', 'http'].includes(val),
            'server.logLevel': (val) => ['error', 'warn', 'info', 'debug'].includes(val),
            'server.port': (val) => typeof val === 'number' && val >= 1 && val <= 65535,
        };
        const validator = validations[key];
        if (validator && !validator(value)) {
            throw new Error(`Invalid value for configuration key '${key}': ${value}`);
        }
    }
    /**
     * Merge configurations with deep merge
     */
    mergeConfigs(global, project) {
        const result = { ...global };
        for (const [key, value] of Object.entries(project)) {
            if (typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value)) {
                result[key] = {
                    ...result[key],
                    ...value,
                };
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    /**
     * Get nested configuration value
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    /**
     * Set nested configuration value
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    /**
     * Migrate configuration to newer version if needed
     */
    async migrateConfig() {
        const currentVersion = this.globalConfig.get('$version') || '1.0.0';
        if (currentVersion === this.configVersion) {
            return false; // No migration needed
        }
        // Add migration logic here for future versions
        this.globalConfig.set('$version', this.configVersion);
        return true;
    }
    /**
     * Export configuration for backup
     */
    exportConfig() {
        return {
            global: this.globalConfig.store,
            ...(this.projectConfig && { project: this.projectConfig }),
        };
    }
    /**
     * Import configuration from backup
     */
    importConfig(config) {
        this.globalConfig.store = config.global;
        if (config.project && this.projectConfigPath) {
            writeFileSync(this.projectConfigPath, JSON.stringify(config.project, null, 2));
            this.projectConfig = config.project;
        }
    }
    /**
     * Check if configuration is valid
     */
    validateConfig() {
        const errors = [];
        const config = this.getConfig();
        try {
            // Check required fields
            if (!config.ollama?.host) {
                errors.push('ollama.host is required');
            }
            if (!config.ollama?.models?.primary) {
                errors.push('ollama.models.primary is required');
            }
            // Check value ranges
            if (config.ollama?.timeout && config.ollama.timeout < 1000) {
                errors.push('ollama.timeout must be at least 1000ms');
            }
            if (config.server?.port &&
                (config.server.port < 1 || config.server.port > 65535)) {
                errors.push('server.port must be between 1 and 65535');
            }
        }
        catch (error) {
            errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
// Singleton instance
let configManager = null;
/**
 * Get configuration manager instance
 */
export function getConfigManager() {
    if (!configManager) {
        configManager = new ConfigManager();
    }
    return configManager;
}
/**
 * Get merged configuration
 */
export async function getConfig() {
    return getConfigManager().getConfig();
}
/**
 * Get specific configuration value
 */
export async function getConfigValue(key) {
    return getConfigManager().get(key);
}
/**
 * Set configuration value
 */
export async function setConfigValue(key, value, isGlobal = true) {
    return getConfigManager().set(key, value, isGlobal);
}
/**
 * Reset configuration to defaults
 */
export async function resetConfig(confirmCallback) {
    return getConfigManager().reset(confirmCallback);
}
/**
 * Get default configuration
 */
export function getDefaultConfig() {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}
/**
 * Check if project has local configuration
 */
export function hasProjectConfig() {
    return getConfigManager().getConfigPaths().project !== undefined;
}
//# sourceMappingURL=config.js.map