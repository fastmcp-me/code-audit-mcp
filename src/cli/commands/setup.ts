/**
 * Setup command - Interactive setup wizard
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import os from 'os';

import {
  getConfigManager,
  getDefaultConfig,
  getConfig,
  setConfigValue,
  resetConfig,
} from '../utils/config.js';
import {
  checkOllamaHealth,
  getInstalledModels,
  pullModelWithRetry,
  getAvailableDiskSpace,
} from '../utils/ollama.js';
import { getMCPConfigManager, ClaudeEnvironment } from '../utils/mcp-config.js';

const execAsync = promisify(exec);

interface SetupOptions {
  force?: boolean;
  minimal?: boolean;
  comprehensive?: boolean;
  verbose?: boolean;
  claudeDesktop?: boolean;
  claudeCode?: boolean;
  project?: boolean;
  auto?: boolean;
}

interface SetupState {
  ollamaInstalled: boolean;
  ollamaRunning: boolean;
  configExists: boolean;
  modelsInstalled: string[];
  systemRequirements: {
    nodeVersion: string;
    platform: string;
    memory: number;
  };
}

/**
 * Main setup command handler
 */
export async function setupCommand(options: SetupOptions = {}): Promise<void> {
  console.log(
    boxen(
      chalk.cyan.bold('🔧 Code Audit MCP Setup Wizard\n\n') +
        chalk.white('This wizard will help you set up Code Audit MCP\n') +
        chalk.white('for AI-powered code analysis with local Ollama models.'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    )
  );

  try {
    // Check if already configured and not forcing
    if (!options.force && (await isAlreadyConfigured())) {
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message:
            'Code Audit MCP appears to be already configured. Continue anyway?',
          default: false,
        },
      ]);

      if (!proceed) {
        console.log(chalk.yellow('Setup cancelled.'));
        return;
      }
    }

    // Pre-flight system checks
    console.log(chalk.blue('\n🔍 Pre-flight system checks...'));
    await verifySystemReadiness(options);

    // Step 1: System requirements check
    console.log(chalk.blue('\n📋 Step 1: Checking system requirements...'));
    const systemState = await checkSystemRequirements();

    // Step 2: Ollama installation check
    console.log(chalk.blue('\n🤖 Step 2: Checking Ollama installation...'));
    await checkAndSetupOllama(systemState);

    // Step 3: Configuration setup
    console.log(chalk.blue('\n⚙️ Step 3: Setting up configuration...'));
    await setupConfiguration(options);

    // Step 4: Model installation
    console.log(chalk.blue('\n📦 Step 4: Installing AI models...'));
    await setupModels(options);

    // Step 5: Final verification
    console.log(chalk.blue('\n✅ Step 5: Verifying setup...'));
    await verifySetup();

    // Step 6: MCP configuration
    console.log(chalk.blue('\n🔌 Step 6: Configuring MCP servers...'));
    const mcpConfigured = await setupMCPServers(options);

    // Success message
    const successMessage = mcpConfigured
      ? chalk.green.bold('🎉 Setup Complete!\n\n') +
        chalk.white('Code Audit MCP is now ready to use.\n') +
        chalk.white('MCP server configuration has been added to Claude.\n\n') +
        chalk.cyan('Next steps:\n') +
        chalk.white(
          '• Restart Claude Desktop/Code to load the new configuration\n'
        ) +
        chalk.white('• Run ') +
        chalk.yellow('code-audit health') +
        chalk.white(' to check system health\n') +
        chalk.white('• Visit the documentation for usage examples')
      : chalk.green.bold('🎉 Setup Complete!\n\n') +
        chalk.white('Code Audit MCP is now ready to use.\n\n') +
        chalk.cyan('Next steps:\n') +
        chalk.white('• Run ') +
        chalk.yellow('code-audit start') +
        chalk.white(' to start the server\n') +
        chalk.white('• Run ') +
        chalk.yellow('code-audit health') +
        chalk.white(' to check system health\n') +
        chalk.white('• Visit the documentation for usage examples');

    console.log(
      boxen(successMessage, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
      })
    );
  } catch (error) {
    console.error(
      chalk.red('\n❌ Setup failed:'),
      error instanceof Error ? error.message : String(error)
    );

    if (options.verbose && error instanceof Error) {
      console.error(chalk.gray('Stack trace:'), error.stack);
    }

    console.log(
      chalk.yellow(
        '\nFor help, visit: https://github.com/moikas-code/code-audit-mcp/issues'
      )
    );
    process.exit(1);
  }
}

/**
 * Verify system readiness before setup
 */
async function verifySystemReadiness(options: SetupOptions): Promise<void> {
  const spinner = ora('Running pre-flight checks...').start();

  try {
    // Check disk space
    const availableGB = getAvailableDiskSpace();
    const requiredGB = options.minimal ? 10 : options.comprehensive ? 50 : 20;

    if (availableGB > 0 && availableGB < requiredGB) {
      spinner.fail(
        chalk.red(
          `Insufficient disk space: ${availableGB}GB available, ${requiredGB}GB required`
        )
      );
      throw new Error('Insufficient disk space for model installation');
    }

    // Check network connectivity to Ollama registry
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch('https://registry.ollama.ai', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch {
      spinner.fail(chalk.red('Cannot reach Ollama registry'));
      console.log(chalk.yellow('\n💡 Troubleshooting tips:'));
      console.log(chalk.dim('  • Check your internet connection'));
      console.log(chalk.dim('  • Verify firewall/proxy settings'));
      console.log(chalk.dim('  • Try again later if registry is down'));
      throw new Error('Network connectivity check failed');
    }

    // Check system memory and provide recommendations
    const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));

    if (totalMemoryGB < 8) {
      spinner.warn(
        chalk.yellow(
          `System has ${totalMemoryGB}GB RAM. Recommended: 8GB+ for optimal performance`
        )
      );
      console.log(chalk.yellow('\n💡 Model recommendations for your system:'));
      console.log(
        chalk.dim('  • Use 7b models only (codellama:7b, granite-code:8b)')
      );
      console.log(
        chalk.dim('  • Avoid running multiple models simultaneously')
      );
      console.log(
        chalk.dim('  • Close other applications during model downloads')
      );
    }

    // Early Ollama health check
    try {
      await checkOllamaHealth();
      spinner.succeed(chalk.green('Pre-flight checks passed'));
    } catch {
      spinner.warn(
        chalk.yellow('Ollama not accessible - will check again during setup')
      );
    }
  } catch (error) {
    spinner.fail(chalk.red('Pre-flight checks failed'));

    if (!options.force) {
      console.log(
        chalk.yellow(
          '\nUse --force to bypass pre-flight checks (not recommended)'
        )
      );
      throw error;
    } else {
      console.log(
        chalk.yellow('\n⚠️  Continuing despite failed checks (--force)')
      );
    }
  }
}

/**
 * Check if already configured
 */
async function isAlreadyConfigured(): Promise<boolean> {
  try {
    const configManager = getConfigManager();
    const paths = configManager.getConfigPaths();

    // Check if global config exists
    if (existsSync(paths.global)) {
      // Check if Ollama is accessible
      try {
        await checkOllamaHealth();
        return true;
      } catch {
        return false;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Check system requirements
 */
async function checkSystemRequirements(): Promise<SetupState> {
  const spinner = ora('Checking system requirements...').start();

  try {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion < 18) {
      spinner.fail(chalk.red('Node.js 18+ is required'));
      throw new Error(
        `Node.js 18+ is required. Current version: ${nodeVersion}`
      );
    }

    // Check platform
    const platform = process.platform;
    const supportedPlatforms = ['darwin', 'linux', 'win32'];

    if (!supportedPlatforms.includes(platform)) {
      spinner.fail(chalk.red(`Unsupported platform: ${platform}`));
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Estimate available memory (simplified)
    const memory = process.memoryUsage().heapTotal / 1024 / 1024; // MB

    const state: SetupState = {
      ollamaInstalled: false,
      ollamaRunning: false,
      configExists: false,
      modelsInstalled: [],
      systemRequirements: {
        nodeVersion,
        platform,
        memory,
      },
    };

    spinner.succeed(
      chalk.green(`System requirements met (Node ${nodeVersion}, ${platform})`)
    );

    return state;
  } catch (error) {
    spinner.fail(chalk.red('System requirements check failed'));
    throw error;
  }
}

/**
 * Check and setup Ollama
 */
async function checkAndSetupOllama(state: SetupState): Promise<void> {
  const spinner = ora('Checking Ollama installation...').start();

  try {
    // Try to check Ollama health
    await checkOllamaHealth();
    state.ollamaInstalled = true;
    state.ollamaRunning = true;

    const models = await getInstalledModels();
    state.modelsInstalled = models.map((m) => m.name);

    spinner.succeed(
      chalk.green(`Ollama is running with ${models.length} model(s) installed`)
    );
  } catch {
    spinner.warn(chalk.yellow('Ollama not accessible'));

    // Check if Ollama is installed but not running
    try {
      await execAsync('ollama --version');
      state.ollamaInstalled = true;

      console.log(
        chalk.yellow(
          '\n⚠️  Ollama is installed but not running.\n' +
            'Please start Ollama and run setup again.\n\n' +
            'To start Ollama:\n' +
            '• On macOS: Run the Ollama app\n' +
            '• On Linux/Windows: Run `ollama serve`'
        )
      );

      const { continueSetup } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueSetup',
          message: 'Would you like to continue setup anyway?',
          default: false,
        },
      ]);

      if (!continueSetup) {
        throw new Error('Setup cancelled - Ollama not running');
      }
    } catch {
      // Ollama not installed
      console.log(
        chalk.red(
          '\n❌ Ollama is not installed.\n\n' +
            'Please install Ollama first:\n' +
            '• Visit: https://ollama.ai\n' +
            '• Follow the installation instructions for your platform\n' +
            '• Run `ollama serve` to start the service\n' +
            '• Then run setup again'
        )
      );

      throw new Error('Ollama is not installed');
    }
  }
}

/**
 * Setup configuration
 */
async function setupConfiguration(options: SetupOptions): Promise<void> {
  const spinner = ora('Setting up configuration...').start();

  try {
    const defaultConfig = getDefaultConfig();

    // If force option, reset to defaults
    if (options.force) {
      await resetConfig(async () => true);
    }

    // Load current config
    const currentConfig = await getConfig();

    // In auto mode, use defaults without prompting
    if (
      options.auto ||
      options.claudeDesktop ||
      options.claudeCode ||
      options.project
    ) {
      await setConfigValue(
        'ollama.host',
        currentConfig.ollama?.host || defaultConfig.ollama.host
      );
      await setConfigValue(
        'ollama.timeout',
        currentConfig.ollama?.timeout || defaultConfig.ollama.timeout
      );
      await setConfigValue(
        'server.transport',
        currentConfig.server?.transport || defaultConfig.server.transport
      );

      spinner.succeed(chalk.green('Configuration saved (using defaults)'));
      return;
    }

    // Ask for configuration preferences
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'ollamaHost',
        message: 'Ollama host URL:',
        default: currentConfig.ollama?.host || defaultConfig.ollama.host,
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        },
      },
      {
        type: 'number',
        name: 'ollamaTimeout',
        message: 'Ollama request timeout (ms):',
        default: currentConfig.ollama?.timeout || defaultConfig.ollama.timeout,
        validate: (input: number) =>
          input >= 1000 || 'Timeout must be at least 1000ms',
      },
      {
        type: 'list',
        name: 'transport',
        message: 'MCP transport method:',
        choices: [
          { name: 'Standard I/O (recommended)', value: 'stdio' },
          { name: 'HTTP Server', value: 'http' },
        ],
        default:
          currentConfig.server?.transport || defaultConfig.server.transport,
      },
    ]);

    // Update configuration
    await setConfigValue('ollama.host', answers.ollamaHost);
    await setConfigValue('ollama.timeout', answers.ollamaTimeout);
    await setConfigValue('server.transport', answers.transport);

    spinner.succeed(chalk.green('Configuration saved'));
  } catch (error) {
    spinner.fail(chalk.red('Configuration setup failed'));
    throw error;
  }
}

/**
 * Setup models
 */
async function setupModels(options: SetupOptions): Promise<void> {
  try {
    // Check current models
    let installedModels: string[] = [];
    try {
      const models = await getInstalledModels();
      installedModels = models.map((m) => m.name);
    } catch {
      console.log(
        chalk.yellow('Cannot check installed models (Ollama not accessible)')
      );
    }

    // Define model sets
    const minimalModels = ['granite-code:8b'];
    const recommendedModels = ['granite-code:8b', 'qwen2.5-coder:7b'];
    const comprehensiveModels = [
      'granite-code:8b',
      'qwen2.5-coder:7b',
      'codellama:7b',
      'llama3.1:8b',
    ];

    let modelsToInstall: string[] = [];

    if (options.minimal) {
      modelsToInstall = minimalModels;
    } else if (options.comprehensive) {
      modelsToInstall = comprehensiveModels;
    } else if (
      options.auto ||
      options.claudeDesktop ||
      options.claudeCode ||
      options.project
    ) {
      // In auto/MCP mode, use minimal models by default
      modelsToInstall = minimalModels;
    } else {
      // Interactive selection
      const { modelSet } = await inquirer.prompt([
        {
          type: 'list',
          name: 'modelSet',
          message: 'Which models would you like to install?',
          choices: [
            {
              name: 'Minimal (granite-code:8b only) - ~5GB',
              value: 'minimal',
            },
            {
              name: 'Recommended (granite-code + qwen2.5-coder) - ~10GB',
              value: 'recommended',
            },
            {
              name: 'Comprehensive (all supported models) - ~20GB',
              value: 'comprehensive',
            },
            {
              name: 'Custom selection',
              value: 'custom',
            },
            {
              name: 'Skip model installation',
              value: 'skip',
            },
          ],
          default: 'recommended',
        },
      ]);

      switch (modelSet) {
        case 'minimal':
          modelsToInstall = minimalModels;
          break;
        case 'recommended':
          modelsToInstall = recommendedModels;
          break;
        case 'comprehensive':
          modelsToInstall = comprehensiveModels;
          break;
        case 'custom': {
          const { customModels } = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'customModels',
              message: 'Select models to install:',
              choices: comprehensiveModels.map((model) => ({
                name: `${model} ${installedModels.includes(model) ? '(installed)' : ''}`,
                value: model,
                checked: false,
              })),
            },
          ]);
          modelsToInstall = customModels;
          break;
        }
        case 'skip':
          console.log(chalk.yellow('Skipping model installation'));
          return;
      }
    }

    // Filter out already installed models
    const newModels = modelsToInstall.filter(
      (model) => !installedModels.includes(model)
    );

    if (newModels.length === 0) {
      console.log(chalk.green('All selected models are already installed'));
      return;
    }

    console.log(
      chalk.blue(
        `\nInstalling ${newModels.length} model(s): ${newModels.join(', ')}`
      )
    );
    console.log(
      chalk.yellow(
        'This may take several minutes depending on your internet connection...'
      )
    );

    // Install models one by one
    for (const model of newModels) {
      const spinner = ora(`Downloading ${model}...`).start();

      try {
        await pullModelWithRetry(model, (progress) => {
          if (progress.status === 'downloading' && progress.total) {
            const percent = (
              ((progress.completed as number) / (progress.total as number)) *
              100
            ).toFixed(1);
            spinner.text = `Downloading ${model}: ${percent}%`;
          }
        });
        spinner.succeed(chalk.green(`Downloaded ${model}`));
      } catch {
        spinner.fail(chalk.red(`Failed to download ${model}`));
        console.log(
          chalk.yellow(
            `You can manually download it later with: ollama pull ${model}`
          )
        );
      }
    }

    console.log(chalk.green('Model installation completed'));
  } catch (error) {
    console.error(chalk.red('Model setup failed:'), error);
    throw error;
  }
}

/**
 * Verify setup
 */
async function verifySetup(): Promise<void> {
  const spinner = ora('Verifying setup...').start();

  try {
    // Check configuration
    const config = await getConfig();

    if (!config.ollama?.host) {
      throw new Error('Configuration incomplete - missing Ollama host');
    }

    // Try to connect to Ollama
    try {
      const health = await checkOllamaHealth(config.ollama.host);

      if (health.models.length === 0) {
        spinner.warn(
          chalk.yellow('No models installed - some features may not work')
        );
      } else {
        spinner.succeed(
          chalk.green(
            `Setup verified - ${health.models.length} model(s) available`
          )
        );
      }
    } catch {
      spinner.warn(
        chalk.yellow(
          'Cannot verify Ollama connection - setup may be incomplete'
        )
      );
    }
  } catch (error) {
    spinner.fail(chalk.red('Setup verification failed'));
    throw error;
  }
}

/**
 * Setup MCP servers in Claude environments
 */
async function setupMCPServers(options: SetupOptions): Promise<boolean> {
  const mcpManager = getMCPConfigManager();

  try {
    // Determine which environments to configure
    let environments: ClaudeEnvironment[] = [];

    if (options.auto) {
      // Auto mode - configure all available environments
      const available = mcpManager.getAvailableEnvironments();
      environments = available.map((env) => env.environment);
    } else if (options.claudeDesktop || options.claudeCode || options.project) {
      // Specific options provided
      if (options.claudeDesktop) {
        environments.push(ClaudeEnvironment.DESKTOP);
      }
      if (options.claudeCode) {
        environments.push(ClaudeEnvironment.CODE_GLOBAL);
      }
      if (options.project) {
        environments.push(ClaudeEnvironment.CODE_PROJECT);
      }
    } else {
      // Interactive mode - ask user which environments to configure
      const available = mcpManager.getAvailableEnvironments();

      if (available.length === 0) {
        console.log(
          chalk.yellow(
            '\n⚠️  No Claude environments detected. Skipping MCP configuration.'
          )
        );
        return false;
      }

      const { configureMCP } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'configureMCP',
          message:
            'Would you like to configure Code Audit as an MCP server in Claude?',
          default: true,
        },
      ]);

      if (!configureMCP) {
        console.log(chalk.yellow('Skipping MCP configuration'));
        return false;
      }

      // Show available environments and their status
      console.log(chalk.cyan('\nDetected Claude environments:'));
      for (const env of available) {
        const status = env.configured
          ? chalk.green('✓ Already configured')
          : chalk.yellow('○ Not configured');
        console.log(`  ${env.environment}: ${status}`);
      }

      const choices = available.map((env) => ({
        name: `${env.environment} ${env.configured ? '(reconfigure)' : ''}`,
        value: env.environment,
        checked: !env.configured, // Default check unconfigured environments
      }));

      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedEnvironments',
          message: 'Select environments to configure:',
          choices,
        },
      ]);

      const selectedEnvironments =
        answers.selectedEnvironments as ClaudeEnvironment[];

      environments = selectedEnvironments;
    }

    if (environments.length === 0) {
      return false;
    }

    // Configure selected environments
    const spinner = ora('Configuring MCP servers...').start();
    const results = {
      configured: [] as string[],
      failed: [] as string[],
    };

    for (const environment of environments) {
      try {
        const success = await mcpManager.configureServer(environment, {
          force: options.force,
        });
        if (success) {
          results.configured.push(environment);
        } else {
          results.failed.push(environment);
        }
      } catch (error) {
        results.failed.push(environment);
        if (options.verbose) {
          console.error(
            chalk.red(`\nError configuring ${environment}:`),
            error
          );
        }
      }
    }

    spinner.stop();

    // Show results
    if (results.configured.length > 0) {
      console.log(
        chalk.green(
          `\n✓ Successfully configured MCP in: ${results.configured.join(', ')}`
        )
      );
    }

    if (results.failed.length > 0) {
      console.log(
        chalk.red(
          `\n✗ Failed to configure MCP in: ${results.failed.join(', ')}`
        )
      );
    }

    return results.configured.length > 0;
  } catch (error) {
    console.error(
      chalk.red('\nMCP configuration failed:'),
      error instanceof Error ? error.message : error
    );

    // Non-fatal error - setup can continue without MCP
    console.log(
      chalk.yellow(
        '\nYou can configure MCP later by running: code-audit mcp configure'
      )
    );

    return false;
  }
}
