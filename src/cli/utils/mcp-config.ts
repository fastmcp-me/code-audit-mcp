/**
 * MCP (Model Context Protocol) configuration management for Claude Desktop and Claude Code
 * Handles detection, reading, and writing of MCP server configurations across different environments
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { homedir, platform } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

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
  [key: string]: unknown; // Allow other configuration options
}

/**
 * Claude environment types
 */
export enum ClaudeEnvironment {
  DESKTOP = 'desktop',
  CODE_GLOBAL = 'code-global',
  CODE_PROJECT = 'code-project',
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
export class MCPConfigManager {
  private configPaths: ClaudeConfigPaths;
  private executablePath: string | null = null;

  constructor() {
    this.configPaths = this.detectConfigPaths();
  }

  /**
   * Detect configuration file paths based on platform and environment
   */
  private detectConfigPaths(): ClaudeConfigPaths {
    const paths: ClaudeConfigPaths = {};
    const home = homedir();
    const cwd = process.cwd();

    // Claude Desktop paths
    switch (platform()) {
      case 'darwin': // macOS
        paths.desktop = join(
          home,
          'Library',
          'Application Support',
          'Claude',
          'claude_desktop_config.json'
        );
        break;
      case 'win32': // Windows
        paths.desktop = join(
          process.env.APPDATA || join(home, 'AppData', 'Roaming'),
          'Claude',
          'claude_desktop_config.json'
        );
        break;
      case 'linux':
        paths.desktop = join(
          home,
          '.config',
          'Claude',
          'claude_desktop_config.json'
        );
        break;
    }

    // Claude Code global config
    paths.codeGlobal = join(home, '.config', 'claude', 'mcp-settings.json');

    // Claude Code project configs (check multiple possible locations)
    const projectConfigPaths = [
      join(cwd, '.claude', 'mcp-settings.json'),
      join(cwd, '.mcp.json'),
    ];

    for (const path of projectConfigPaths) {
      if (existsSync(path)) {
        paths.codeProject = path;
        break;
      }
    }

    // If no project config exists, use the preferred location
    if (!paths.codeProject) {
      paths.codeProject = join(cwd, '.claude', 'mcp-settings.json');
    }

    return paths;
  }

  /**
   * Get available Claude environments
   */
  public getAvailableEnvironments(): {
    environment: ClaudeEnvironment;
    path: string;
    exists: boolean;
    configured: boolean;
  }[] {
    const environments = [];

    if (this.configPaths.desktop) {
      const exists = existsSync(this.configPaths.desktop);
      const configured =
        exists && this.isServerConfigured(ClaudeEnvironment.DESKTOP);
      environments.push({
        environment: ClaudeEnvironment.DESKTOP,
        path: this.configPaths.desktop,
        exists,
        configured,
      });
    }

    if (this.configPaths.codeGlobal) {
      const exists = existsSync(this.configPaths.codeGlobal);
      const configured =
        exists && this.isServerConfigured(ClaudeEnvironment.CODE_GLOBAL);
      environments.push({
        environment: ClaudeEnvironment.CODE_GLOBAL,
        path: this.configPaths.codeGlobal,
        exists,
        configured,
      });
    }

    if (this.configPaths.codeProject) {
      const exists = existsSync(this.configPaths.codeProject);
      const configured =
        exists && this.isServerConfigured(ClaudeEnvironment.CODE_PROJECT);
      environments.push({
        environment: ClaudeEnvironment.CODE_PROJECT,
        path: this.configPaths.codeProject,
        exists,
        configured,
      });
    }

    return environments;
  }

  /**
   * Read configuration from a specific environment
   */
  private readConfig(environment: ClaudeEnvironment): MCPConfig | null {
    const path = this.getConfigPath(environment);
    if (!path || !existsSync(path)) {
      return null;
    }

    try {
      const content = readFileSync(path, 'utf8');
      return JSON.parse(content) as MCPConfig;
    } catch (error) {
      console.error(
        chalk.yellow(`Warning: Failed to parse ${environment} config:`, error)
      );
      return null;
    }
  }

  /**
   * Write configuration to a specific environment
   */
  private writeConfig(environment: ClaudeEnvironment, config: MCPConfig): void {
    const path = this.getConfigPath(environment);
    if (!path) {
      throw new Error(`No configuration path available for ${environment}`);
    }

    // Ensure directory exists
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 0o755 });
    }

    // Backup existing config if it exists
    if (existsSync(path)) {
      const backupPath = `${path}.backup-${Date.now()}`;
      writeFileSync(backupPath, readFileSync(path, 'utf8'));
    }

    // Write new config with proper formatting
    writeFileSync(path, JSON.stringify(config, null, 2) + '\n', {
      encoding: 'utf8',
      mode: 0o600, // Secure file permissions
    });
  }

  /**
   * Get configuration path for an environment
   */
  private getConfigPath(environment: ClaudeEnvironment): string | null {
    switch (environment) {
      case ClaudeEnvironment.DESKTOP:
        return this.configPaths.desktop || null;
      case ClaudeEnvironment.CODE_GLOBAL:
        return this.configPaths.codeGlobal || null;
      case ClaudeEnvironment.CODE_PROJECT:
        return this.configPaths.codeProject || null;
      default:
        return null;
    }
  }

  /**
   * Resolve the executable path for code-audit
   */
  public async resolveExecutablePath(): Promise<string> {
    if (this.executablePath) {
      return this.executablePath;
    }

    // Get __dirname equivalent for ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Check if running from development (local)
    const localPath = resolve(
      join(__dirname, '..', '..', '..', 'bin', 'code-audit.js')
    );
    if (existsSync(localPath)) {
      this.executablePath = localPath;
      return localPath;
    }

    // Check if globally installed
    try {
      const { stdout } = await execAsync('which code-audit');
      const globalPath = stdout.trim();
      if (globalPath && existsSync(globalPath)) {
        this.executablePath = globalPath;
        return globalPath;
      }
    } catch {
      // which command failed, try other methods
    }

    // Check common global install locations
    const commonPaths = [
      join(homedir(), '.npm', 'bin', 'code-audit'),
      join(homedir(), '.yarn', 'bin', 'code-audit'),
      join(homedir(), '.pnpm', 'bin', 'code-audit'),
      join(homedir(), '.bun', 'bin', 'code-audit'),
      '/usr/local/bin/code-audit',
      '/usr/bin/code-audit',
    ];

    for (const path of commonPaths) {
      if (existsSync(path)) {
        this.executablePath = path;
        return path;
      }
    }

    throw new Error(
      'Could not find code-audit executable. Please ensure it is installed globally or run from the project directory.'
    );
  }

  /**
   * Generate MCP server configuration for code-audit
   */
  private async generateServerConfig(): Promise<MCPServerConfig> {
    const command = await this.resolveExecutablePath();

    return {
      command,
      args: ['start', '--stdio'],
      env: {},
    };
  }

  /**
   * Check if code-audit server is already configured
   */
  public isServerConfigured(environment: ClaudeEnvironment): boolean {
    const config = this.readConfig(environment);
    return !!config?.mcpServers?.['code-audit'];
  }

  /**
   * Configure code-audit as an MCP server
   */
  public async configureServer(
    environment: ClaudeEnvironment,
    options: {
      force?: boolean;
      serverName?: string;
    } = {}
  ): Promise<boolean> {
    const serverName = options.serverName || 'code-audit';

    try {
      // Read existing config or create new one
      let config = this.readConfig(environment) || {};

      // Initialize mcpServers if not present
      if (!config.mcpServers) {
        config.mcpServers = {};
      }

      // Check if already configured
      if (config.mcpServers[serverName] && !options.force) {
        console.log(
          chalk.yellow(
            `${serverName} is already configured in ${environment}. Use --force to override.`
          )
        );
        return false;
      }

      // Generate and add server configuration
      const serverConfig = await this.generateServerConfig();
      config.mcpServers[serverName] = serverConfig;

      // Write updated config
      this.writeConfig(environment, config);

      console.log(
        chalk.green(`✓ Configured ${serverName} in ${environment} environment`)
      );
      return true;
    } catch (error) {
      console.error(
        chalk.red(`Failed to configure ${environment}:`),
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

  /**
   * Remove code-audit from MCP servers
   */
  public removeServer(
    environment: ClaudeEnvironment,
    serverName: string = 'code-audit'
  ): boolean {
    try {
      const config = this.readConfig(environment);
      if (!config?.mcpServers?.[serverName]) {
        console.log(
          chalk.yellow(`${serverName} is not configured in ${environment}`)
        );
        return false;
      }

      delete config.mcpServers[serverName];
      this.writeConfig(environment, config);

      console.log(
        chalk.green(`✓ Removed ${serverName} from ${environment} environment`)
      );
      return true;
    } catch (error) {
      console.error(
        chalk.red(`Failed to remove from ${environment}:`),
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

  /**
   * Get current MCP configuration status
   */
  public getStatus(): {
    executable: string | null;
    environments: ReturnType<typeof this.getAvailableEnvironments>;
  } {
    return {
      executable: this.executablePath,
      environments: this.getAvailableEnvironments(),
    };
  }

  /**
   * Backup MCP configurations
   */
  public async backupConfigurations(): Promise<{
    desktop?: MCPConfig;
    codeGlobal?: MCPConfig;
    codeProject?: MCPConfig;
    timestamp: string;
  }> {
    const backup: {
      desktop?: MCPConfig;
      codeGlobal?: MCPConfig;
      codeProject?: MCPConfig;
      timestamp: string;
    } = {
      timestamp: new Date().toISOString(),
    };

    const environments = [
      { key: 'desktop', env: ClaudeEnvironment.DESKTOP },
      { key: 'codeGlobal', env: ClaudeEnvironment.CODE_GLOBAL },
      { key: 'codeProject', env: ClaudeEnvironment.CODE_PROJECT },
    ];

    for (const { key, env } of environments) {
      const config = this.readConfig(env);
      if (config) {
        backup[key] = config;
      }
    }

    return backup as {
      desktop?: MCPConfig;
      codeGlobal?: MCPConfig;
      codeProject?: MCPConfig;
      timestamp: string;
    };
  }

  /**
   * Restore MCP configurations from backup
   */
  public restoreConfigurations(
    backup: Awaited<ReturnType<typeof this.backupConfigurations>>,
    environments?: ClaudeEnvironment[]
  ): void {
    const envMap = [
      { key: 'desktop', env: ClaudeEnvironment.DESKTOP },
      { key: 'codeGlobal', env: ClaudeEnvironment.CODE_GLOBAL },
      { key: 'codeProject', env: ClaudeEnvironment.CODE_PROJECT },
    ];

    for (const { key, env } of envMap) {
      if (
        backup[key as keyof typeof backup] &&
        (!environments || environments.includes(env))
      ) {
        try {
          this.writeConfig(
            env,
            backup[key as keyof typeof backup] as MCPConfig
          );
          console.log(chalk.green(`✓ Restored ${env} configuration`));
        } catch (error) {
          console.error(
            chalk.red(`Failed to restore ${env}:`),
            error instanceof Error ? error.message : error
          );
        }
      }
    }
  }

  /**
   * Auto-detect and configure all available environments
   */
  public async autoConfigureAll(options: { force?: boolean } = {}): Promise<{
    configured: ClaudeEnvironment[];
    failed: ClaudeEnvironment[];
    skipped: ClaudeEnvironment[];
  }> {
    const results = {
      configured: [] as ClaudeEnvironment[],
      failed: [] as ClaudeEnvironment[],
      skipped: [] as ClaudeEnvironment[],
    };

    const environments = this.getAvailableEnvironments();

    for (const env of environments) {
      if (env.configured && !options.force) {
        results.skipped.push(env.environment);
        continue;
      }

      const success = await this.configureServer(env.environment, options);
      if (success) {
        results.configured.push(env.environment);
      } else {
        results.failed.push(env.environment);
      }
    }

    return results;
  }
}

// Singleton instance
let mcpConfigManager: MCPConfigManager | null = null;

/**
 * Get MCP configuration manager instance
 */
export function getMCPConfigManager(): MCPConfigManager {
  if (!mcpConfigManager) {
    mcpConfigManager = new MCPConfigManager();
  }
  return mcpConfigManager;
}
