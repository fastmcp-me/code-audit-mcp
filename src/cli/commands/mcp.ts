/**
 * MCP command - Manage MCP server configurations for Claude
 */

import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import inquirer from 'inquirer';
import { writeFileSync } from 'fs';
import { join } from 'path';

import { getMCPConfigManager, ClaudeEnvironment } from '../utils/mcp-config.js';

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
export async function mcpCommand(
  subcommand: string = 'status',
  options: MCPOptions = {}
): Promise<void> {
  const _mcpManager = getMCPConfigManager();

  try {
    switch (subcommand) {
      case 'status':
        await showStatus();
        break;

      case 'configure':
        await configure(options);
        break;

      case 'remove':
        await removeServer(options);
        break;

      case 'backup':
        await backupConfigs();
        break;

      case 'restore':
        await restoreConfigs(options);
        break;

      default:
        console.error(chalk.red(`Unknown subcommand: ${subcommand}`));
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(
      chalk.red('MCP command failed:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

/**
 * Show current MCP configuration status
 */
async function showStatus(): Promise<void> {
  const mcpManager = getMCPConfigManager();

  console.log(
    boxen(chalk.cyan.bold('🔌 MCP Configuration Status\n'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  );

  // Try to resolve executable path
  let executablePath: string | null = null;
  try {
    executablePath = await mcpManager.resolveExecutablePath();
    console.log(chalk.blue('Executable Path:'), executablePath);
  } catch {
    console.log(
      chalk.yellow('Executable Path:'),
      chalk.red('Not found - please install code-audit globally')
    );
  }

  console.log('\n' + chalk.blue('Claude Environments:'));

  const environments = mcpManager.getAvailableEnvironments();

  if (environments.length === 0) {
    console.log(chalk.yellow('  No Claude environments detected'));
    return;
  }

  for (const env of environments) {
    const statusIcon = env.configured ? chalk.green('✓') : chalk.yellow('○');
    const statusText = env.configured ? 'Configured' : 'Not configured';
    const existsText = env.exists ? '' : chalk.gray(' (config file not found)');

    console.log(
      `  ${statusIcon} ${getEnvironmentDisplayName(env.environment)}: ${statusText}${existsText}`
    );
    console.log(chalk.gray(`    Path: ${env.path}`));
  }

  console.log('\n' + chalk.cyan('Quick Commands:'));
  console.log('  • Configure all: ' + chalk.yellow('code-audit mcp configure'));
  console.log(
    '  • Configure specific: ' +
      chalk.yellow('code-audit mcp configure --environment desktop')
  );
  console.log(
    '  • Remove configuration: ' + chalk.yellow('code-audit mcp remove')
  );
  console.log('  • Backup configs: ' + chalk.yellow('code-audit mcp backup'));
}

/**
 * Configure MCP servers
 */
async function configure(options: MCPOptions): Promise<void> {
  const mcpManager = getMCPConfigManager();

  // Parse environment option if provided
  let targetEnvironments: ClaudeEnvironment[] = [];

  if (options.environment) {
    const envMap: Record<string, ClaudeEnvironment> = {
      desktop: ClaudeEnvironment.DESKTOP,
      'code-global': ClaudeEnvironment.CODE_GLOBAL,
      code: ClaudeEnvironment.CODE_GLOBAL,
      project: ClaudeEnvironment.CODE_PROJECT,
    };

    const env = envMap[options.environment.toLowerCase()];
    if (!env) {
      console.error(
        chalk.red(`Invalid environment: ${options.environment}`),
        '\nValid options: desktop, code-global, project'
      );
      process.exit(1);
    }

    targetEnvironments.push(env);
  } else {
    // Interactive mode
    const environments = mcpManager.getAvailableEnvironments();

    if (environments.length === 0) {
      console.log(
        chalk.yellow('No Claude environments detected on this system.')
      );
      return;
    }

    console.log(chalk.cyan('\nAvailable Claude environments:'));
    for (const env of environments) {
      const status = env.configured
        ? chalk.green('✓ Already configured')
        : chalk.yellow('○ Not configured');
      console.log(`  ${getEnvironmentDisplayName(env.environment)}: ${status}`);
    }

    const choices = environments.map((env) => ({
      name: `${getEnvironmentDisplayName(env.environment)} ${
        env.configured ? '(reconfigure)' : ''
      }`,
      value: env.environment,
      checked: !env.configured,
    }));

    const { selectedEnvironments } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedEnvironments',
        message: 'Select environments to configure:',
        choices,
      },
    ]);

    if (selectedEnvironments.length === 0) {
      console.log(chalk.yellow('No environments selected.'));
      return;
    }

    targetEnvironments = selectedEnvironments;
  }

  // Configure selected environments
  const spinner = ora('Configuring MCP servers...').start();
  let successCount = 0;
  let failCount = 0;

  for (const env of targetEnvironments) {
    try {
      spinner.text = `Configuring ${getEnvironmentDisplayName(env)}...`;
      const success = await mcpManager.configureServer(env, {
        force: options.force,
      });

      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      failCount++;
      if (error instanceof Error) {
        console.error(
          chalk.red(`\nError configuring ${env}: ${error.message}`)
        );
      }
    }
  }

  spinner.stop();

  if (successCount > 0) {
    console.log(
      chalk.green(`\n✓ Successfully configured ${successCount} environment(s)`)
    );
    console.log(
      chalk.yellow(
        'Please restart Claude Desktop/Code to load the new configuration.'
      )
    );
  }

  if (failCount > 0) {
    console.log(
      chalk.red(`\n✗ Failed to configure ${failCount} environment(s)`)
    );
  }
}

/**
 * Remove MCP server from configurations
 */
async function removeServer(options: MCPOptions): Promise<void> {
  const mcpManager = getMCPConfigManager();
  const environments = mcpManager.getAvailableEnvironments();
  const configuredEnvs = environments.filter((env) => env.configured);

  if (configuredEnvs.length === 0) {
    console.log(chalk.yellow('No configured environments found.'));
    return;
  }

  let targetEnvironments: ClaudeEnvironment[] = [];

  if (options.environment) {
    const envMap: Record<string, ClaudeEnvironment> = {
      desktop: ClaudeEnvironment.DESKTOP,
      'code-global': ClaudeEnvironment.CODE_GLOBAL,
      code: ClaudeEnvironment.CODE_GLOBAL,
      project: ClaudeEnvironment.CODE_PROJECT,
    };

    const env = envMap[options.environment.toLowerCase()];
    if (!env) {
      console.error(chalk.red(`Invalid environment: ${options.environment}`));
      process.exit(1);
    }

    targetEnvironments.push(env);
  } else {
    // Interactive mode
    const choices = configuredEnvs.map((env) => ({
      name: getEnvironmentDisplayName(env.environment),
      value: env.environment,
    }));

    const { selectedEnvironments } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedEnvironments',
        message: 'Select environments to remove code-audit from:',
        choices,
      },
    ]);

    if (selectedEnvironments.length === 0) {
      console.log(chalk.yellow('No environments selected.'));
      return;
    }

    targetEnvironments = selectedEnvironments;
  }

  // Confirm removal
  if (!options.force) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Remove code-audit from ${targetEnvironments.length} environment(s)?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Removal cancelled.'));
      return;
    }
  }

  // Remove from selected environments
  for (const env of targetEnvironments) {
    const success = mcpManager.removeServer(env);
    if (!success) {
      console.error(chalk.red(`Failed to remove from ${env}`));
    }
  }
}

/**
 * Backup MCP configurations
 */
async function backupConfigs(): Promise<void> {
  const mcpManager = getMCPConfigManager();
  const spinner = ora('Creating backup...').start();

  try {
    const backup = await mcpManager.backupConfigurations();
    const backupFile = `mcp-backup-${backup.timestamp.replace(/[:.]/g, '-')}.json`;

    writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    spinner.succeed(chalk.green(`Backup saved to: ${backupFile}`));

    const configCount = Object.keys(backup).filter(
      (key) => key !== 'timestamp' && backup[key as keyof typeof backup]
    ).length;

    console.log(chalk.blue(`\nBacked up ${configCount} configuration(s)`));
  } catch (error) {
    spinner.fail(chalk.red('Backup failed'));
    throw error;
  }
}

/**
 * Restore MCP configurations from backup
 */
async function restoreConfigs(options: MCPOptions): Promise<void> {
  if (!options.restore) {
    console.error(chalk.red('Please specify a backup file with --restore'));
    process.exit(1);
  }

  const mcpManager = getMCPConfigManager();

  try {
    const backupContent = require(join(process.cwd(), options.restore));

    console.log(chalk.blue('Backup information:'));
    console.log(`  Timestamp: ${backupContent.timestamp}`);
    console.log(
      `  Configurations: ${Object.keys(backupContent)
        .filter((k) => k !== 'timestamp')
        .join(', ')}`
    );

    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Restore these configurations?',
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Restore cancelled.'));
        return;
      }
    }

    mcpManager.restoreConfigurations(backupContent);
    console.log(chalk.green('\n✓ Configurations restored successfully'));
  } catch (error) {
    console.error(
      chalk.red('Failed to restore backup:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

/**
 * Show help for MCP command
 */
function showHelp(): void {
  console.log(`
${chalk.cyan('Usage:')} code-audit mcp <subcommand> [options]

${chalk.cyan('Subcommands:')}
  status      Show current MCP configuration status (default)
  configure   Configure code-audit as an MCP server in Claude
  remove      Remove code-audit from MCP servers
  backup      Backup current MCP configurations
  restore     Restore MCP configurations from backup

${chalk.cyan('Options:')}
  --environment <env>  Target specific environment (desktop, code-global, project)
  --force              Skip confirmation prompts
  --restore <file>     Backup file to restore from

${chalk.cyan('Examples:')}
  code-audit mcp                          # Show status
  code-audit mcp configure                # Interactive configuration
  code-audit mcp configure --environment desktop
  code-audit mcp remove --force
  code-audit mcp backup
  code-audit mcp restore --restore backup.json
  `);
}

/**
 * Get display name for environment
 */
function getEnvironmentDisplayName(env: ClaudeEnvironment): string {
  switch (env) {
    case ClaudeEnvironment.DESKTOP:
      return 'Claude Desktop';
    case ClaudeEnvironment.CODE_GLOBAL:
      return 'Claude Code (Global)';
    case ClaudeEnvironment.CODE_PROJECT:
      return 'Claude Code (Project)';
    default:
      return env;
  }
}
