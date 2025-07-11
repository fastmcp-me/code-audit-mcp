/**
 * Main CLI interface for Code Audit MCP
 */

import { Command } from 'commander';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import commands
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { setupCommand } from './commands/setup.js';
import { updateCommand } from './commands/update.js';
import { modelsCommand } from './commands/models.js';
import { healthCommand } from './commands/health.js';
import { configCommand } from './commands/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get package information
 */
function getPackageInfo() {
  try {
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return packageJson;
  } catch {
    return { name: 'code-audit-mcp', version: '1.0.0' };
  }
}

/**
 * Check for updates
 */
function checkForUpdates(pkg: { name: string; version: string }) {
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60 * 60 * 24, // 24 hours
  });

  if (notifier.update) {
    console.log(
      chalk.yellow(`
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│          Update available: ${chalk.green(notifier.update.latest)}                          │
│          Current version: ${chalk.red(notifier.update.current)}                           │
│                                                             │
│          Run ${chalk.cyan('npm install -g code-audit-mcp')} to update      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
`)
    );
  }
}

/**
 * Main CLI function
 */
export async function cli(): Promise<void> {
  const pkg = getPackageInfo();

  // Check for updates (non-blocking)
  checkForUpdates(pkg);

  const program = new Command();

  // Configure the main program
  program
    .name('code-audit')
    .description('AI-powered code auditing via MCP using local Ollama models')
    .version(pkg.version, '-v, --version', 'Show version number')
    .helpOption('-h, --help', 'Show help information');

  // Add global options
  program
    .option('--verbose', 'Enable verbose output')
    .option('--config <path>', 'Path to config file')
    .option('--no-color', 'Disable colored output');

  // Register commands
  program
    .command('start')
    .description('Start the MCP server')
    .option('-d, --daemon', 'Run as daemon process')
    .option('-p, --port <port>', 'Port for HTTP transport (optional)')
    .option('--stdio', 'Use stdio transport (default)')
    .action(startCommand);

  program
    .command('stop')
    .description('Stop the running MCP server')
    .action(stopCommand);

  program
    .command('setup')
    .description('Interactive setup wizard')
    .option('--force', 'Force re-setup even if already configured')
    .option('--minimal', 'Minimal setup with essential models only')
    .option('--comprehensive', 'Full setup with all recommended models')
    .option('--claude-desktop', 'Configure Claude Desktop MCP server')
    .option('--claude-code', 'Configure Claude Code global MCP server')
    .option('--project', 'Configure Claude Code project MCP server')
    .option('--auto', 'Auto-configure all available Claude environments')
    .action(setupCommand);

  program
    .command('update')
    .description('Check for and install updates')
    .option('--check', "Only check for updates, don't install")
    .option('--force', 'Force update even if no new version')
    .action(updateCommand);

  program
    .command('models')
    .description('Manage AI models')
    .option('--list', 'List installed models')
    .option('--pull <model>', 'Pull a specific model')
    .option('--remove <model>', 'Remove a specific model')
    .option('--update', 'Update all models to latest versions')
    .action(modelsCommand);

  program
    .command('health')
    .description('Check system health')
    .option('--detailed', 'Show detailed health information')
    .option('--json', 'Output as JSON')
    .action(healthCommand);

  program
    .command('config')
    .description('Manage configuration')
    .option('--show', 'Show current configuration')
    .option('--reset', 'Reset to default configuration')
    .option('--set <key=value>', 'Set a configuration value')
    .option('--get <key>', 'Get a configuration value')
    .action(configCommand);

  // Add example usage
  program.addHelpText(
    'after',
    `
Examples:
  $ code-audit setup              Interactive setup wizard
  $ code-audit start              Start MCP server
  $ code-audit start --daemon     Start as background daemon
  $ code-audit health             Check system health
  $ code-audit models --list      List installed models
  $ code-audit update             Check for updates

For more information, visit: https://github.com/warrengates/code-audit-mcp
`
  );

  // Handle global error cases
  program.exitOverride();

  try {
    await program.parseAsync(process.argv);
  } catch (error: unknown) {
    // Type guard for Commander.js errors
    const isCommanderError = (
      err: unknown
    ): err is { code: string; message: string } => {
      return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        'message' in err
      );
    };

    // Type guard for Error objects
    const isError = (err: unknown): err is Error => {
      return err instanceof Error;
    };

    if (isCommanderError(error)) {
      if (error.code === 'commander.version') {
        // Version flag was used, exit normally
        process.exit(0);
      } else if (error.code === 'commander.help') {
        // Help flag was used, exit normally
        process.exit(0);
      } else if (error.code === 'commander.unknownCommand') {
        console.error(chalk.red(`Unknown command: ${error.message}`));
        console.log(
          chalk.gray('Run "code-audit --help" for available commands.')
        );
        process.exit(1);
      }
    }

    if (isError(error)) {
      console.error(chalk.red('An error occurred:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
    } else {
      console.error(chalk.red('An unknown error occurred:'), String(error));
    }
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(
    chalk.red('Unhandled Rejection at:'),
    promise,
    chalk.red('reason:'),
    reason
  );
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});
