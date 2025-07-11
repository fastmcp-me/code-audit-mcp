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
import { getConfigManager, getDefaultConfig, getConfig, setConfigValue, resetConfig, } from '../utils/config.js';
import { checkOllamaHealth, getInstalledModels, pullModelWithRetry, } from '../utils/ollama.js';
import { getMCPConfigManager, ClaudeEnvironment } from '../utils/mcp-config.js';
const execAsync = promisify(exec);
/**
 * Main setup command handler
 */
export async function setupCommand(options = {}) {
    console.log(boxen(chalk.cyan.bold('🔧 Code Audit MCP Setup Wizard\n\n') +
        chalk.white('This wizard will help you set up Code Audit MCP\n') +
        chalk.white('for AI-powered code analysis with local Ollama models.'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
    }));
    try {
        // Check if already configured and not forcing
        if (!options.force && (await isAlreadyConfigured())) {
            const { proceed } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'proceed',
                    message: 'Code Audit MCP appears to be already configured. Continue anyway?',
                    default: false,
                },
            ]);
            if (!proceed) {
                console.log(chalk.yellow('Setup cancelled.'));
                return;
            }
        }
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
                chalk.white('• Restart Claude Desktop/Code to load the new configuration\n') +
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
        console.log(boxen(successMessage, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
        }));
    }
    catch (error) {
        console.error(chalk.red('\n❌ Setup failed:'), error instanceof Error ? error.message : String(error));
        if (options.verbose && error instanceof Error) {
            console.error(chalk.gray('Stack trace:'), error.stack);
        }
        console.log(chalk.yellow('\nFor help, visit: https://github.com/moikas-code/code-audit-mcp/issues'));
        process.exit(1);
    }
}
/**
 * Check if already configured
 */
async function isAlreadyConfigured() {
    try {
        const configManager = getConfigManager();
        const paths = configManager.getConfigPaths();
        // Check if global config exists
        if (existsSync(paths.global)) {
            // Check if Ollama is accessible
            try {
                await checkOllamaHealth();
                return true;
            }
            catch {
                return false;
            }
        }
        return false;
    }
    catch {
        return false;
    }
}
/**
 * Check system requirements
 */
async function checkSystemRequirements() {
    const spinner = ora('Checking system requirements...').start();
    try {
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 18) {
            spinner.fail(chalk.red('Node.js 18+ is required'));
            throw new Error(`Node.js 18+ is required. Current version: ${nodeVersion}`);
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
        const state = {
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
        spinner.succeed(chalk.green(`System requirements met (Node ${nodeVersion}, ${platform})`));
        return state;
    }
    catch (error) {
        spinner.fail(chalk.red('System requirements check failed'));
        throw error;
    }
}
/**
 * Check and setup Ollama
 */
async function checkAndSetupOllama(state) {
    const spinner = ora('Checking Ollama installation...').start();
    try {
        // Try to check Ollama health
        await checkOllamaHealth();
        state.ollamaInstalled = true;
        state.ollamaRunning = true;
        const models = await getInstalledModels();
        state.modelsInstalled = models.map((m) => m.name);
        spinner.succeed(chalk.green(`Ollama is running with ${models.length} model(s) installed`));
    }
    catch {
        spinner.warn(chalk.yellow('Ollama not accessible'));
        // Check if Ollama is installed but not running
        try {
            await execAsync('ollama --version');
            state.ollamaInstalled = true;
            console.log(chalk.yellow('\n⚠️  Ollama is installed but not running.\n' +
                'Please start Ollama and run setup again.\n\n' +
                'To start Ollama:\n' +
                '• On macOS: Run the Ollama app\n' +
                '• On Linux/Windows: Run `ollama serve`'));
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
        }
        catch {
            // Ollama not installed
            console.log(chalk.red('\n❌ Ollama is not installed.\n\n' +
                'Please install Ollama first:\n' +
                '• Visit: https://ollama.ai\n' +
                '• Follow the installation instructions for your platform\n' +
                '• Run `ollama serve` to start the service\n' +
                '• Then run setup again'));
            throw new Error('Ollama is not installed');
        }
    }
}
/**
 * Setup configuration
 */
async function setupConfiguration(options) {
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
        if (options.auto ||
            options.claudeDesktop ||
            options.claudeCode ||
            options.project) {
            await setConfigValue('ollama.host', currentConfig.ollama?.host || defaultConfig.ollama.host);
            await setConfigValue('ollama.timeout', currentConfig.ollama?.timeout || defaultConfig.ollama.timeout);
            await setConfigValue('server.transport', currentConfig.server?.transport || defaultConfig.server.transport);
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
                validate: (input) => {
                    try {
                        new URL(input);
                        return true;
                    }
                    catch {
                        return 'Please enter a valid URL';
                    }
                },
            },
            {
                type: 'number',
                name: 'ollamaTimeout',
                message: 'Ollama request timeout (ms):',
                default: currentConfig.ollama?.timeout || defaultConfig.ollama.timeout,
                validate: (input) => input >= 1000 || 'Timeout must be at least 1000ms',
            },
            {
                type: 'list',
                name: 'transport',
                message: 'MCP transport method:',
                choices: [
                    { name: 'Standard I/O (recommended)', value: 'stdio' },
                    { name: 'HTTP Server', value: 'http' },
                ],
                default: currentConfig.server?.transport || defaultConfig.server.transport,
            },
        ]);
        // Update configuration
        await setConfigValue('ollama.host', answers.ollamaHost);
        await setConfigValue('ollama.timeout', answers.ollamaTimeout);
        await setConfigValue('server.transport', answers.transport);
        spinner.succeed(chalk.green('Configuration saved'));
    }
    catch (error) {
        spinner.fail(chalk.red('Configuration setup failed'));
        throw error;
    }
}
/**
 * Setup models
 */
async function setupModels(options) {
    try {
        // Check current models
        let installedModels = [];
        try {
            const models = await getInstalledModels();
            installedModels = models.map((m) => m.name);
        }
        catch {
            console.log(chalk.yellow('Cannot check installed models (Ollama not accessible)'));
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
        let modelsToInstall = [];
        if (options.minimal) {
            modelsToInstall = minimalModels;
        }
        else if (options.comprehensive) {
            modelsToInstall = comprehensiveModels;
        }
        else if (options.auto ||
            options.claudeDesktop ||
            options.claudeCode ||
            options.project) {
            // In auto/MCP mode, use minimal models by default
            modelsToInstall = minimalModels;
        }
        else {
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
        const newModels = modelsToInstall.filter((model) => !installedModels.includes(model));
        if (newModels.length === 0) {
            console.log(chalk.green('All selected models are already installed'));
            return;
        }
        console.log(chalk.blue(`\nInstalling ${newModels.length} model(s): ${newModels.join(', ')}`));
        console.log(chalk.yellow('This may take several minutes depending on your internet connection...'));
        // Install models one by one
        for (const model of newModels) {
            const spinner = ora(`Downloading ${model}...`).start();
            try {
                await pullModelWithRetry(model, (progress) => {
                    if (progress.status === 'downloading' && progress.total) {
                        const percent = ((progress.completed / progress.total) *
                            100).toFixed(1);
                        spinner.text = `Downloading ${model}: ${percent}%`;
                    }
                });
                spinner.succeed(chalk.green(`Downloaded ${model}`));
            }
            catch {
                spinner.fail(chalk.red(`Failed to download ${model}`));
                console.log(chalk.yellow(`You can manually download it later with: ollama pull ${model}`));
            }
        }
        console.log(chalk.green('Model installation completed'));
    }
    catch (error) {
        console.error(chalk.red('Model setup failed:'), error);
        throw error;
    }
}
/**
 * Verify setup
 */
async function verifySetup() {
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
                spinner.warn(chalk.yellow('No models installed - some features may not work'));
            }
            else {
                spinner.succeed(chalk.green(`Setup verified - ${health.models.length} model(s) available`));
            }
        }
        catch {
            spinner.warn(chalk.yellow('Cannot verify Ollama connection - setup may be incomplete'));
        }
    }
    catch (error) {
        spinner.fail(chalk.red('Setup verification failed'));
        throw error;
    }
}
/**
 * Setup MCP servers in Claude environments
 */
async function setupMCPServers(options) {
    try {
        const mcpManager = getMCPConfigManager();
        const environments = mcpManager.getAvailableEnvironments();
        if (environments.length === 0) {
            console.log(chalk.yellow('No Claude environments detected on this system. Skipping MCP configuration.'));
            return false;
        }
        // Auto mode - configure all available environments
        if (options.auto) {
            console.log(chalk.blue('Auto-configuring all available Claude environments...'));
            const results = await mcpManager.autoConfigureAll({
                force: options.force,
            });
            if (results.configured.length > 0) {
                console.log(chalk.green(`✓ Configured ${results.configured.length} environment(s): ${results.configured.join(', ')}`));
            }
            if (results.skipped.length > 0) {
                console.log(chalk.yellow(`⚠ Skipped ${results.skipped.length} environment(s) (already configured): ${results.skipped.join(', ')}`));
            }
            if (results.failed.length > 0) {
                console.log(chalk.red(`✗ Failed to configure ${results.failed.length} environment(s): ${results.failed.join(', ')}`));
            }
            return results.configured.length > 0;
        }
        // Check which environments to configure based on options
        const environmentsToConfig = [];
        if (options.claudeDesktop) {
            environmentsToConfig.push(ClaudeEnvironment.DESKTOP);
        }
        if (options.claudeCode) {
            environmentsToConfig.push(ClaudeEnvironment.CODE_GLOBAL);
        }
        if (options.project) {
            environmentsToConfig.push(ClaudeEnvironment.CODE_PROJECT);
        }
        // If no specific options, ask interactively
        if (environmentsToConfig.length === 0) {
            const availableChoices = environments
                .filter((env) => env.exists || env.environment === ClaudeEnvironment.CODE_PROJECT)
                .map((env) => ({
                name: `${getEnvironmentDisplayName(env.environment)} ${env.configured ? '(already configured)' : ''}`,
                value: env.environment,
                checked: !env.configured,
            }));
            if (availableChoices.length === 0) {
                console.log(chalk.yellow('No Claude environments available for configuration.'));
                return false;
            }
            const { selectedEnvironments } = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'selectedEnvironments',
                    message: 'Select Claude environments to configure:',
                    choices: availableChoices,
                },
            ]);
            if (selectedEnvironments.length === 0) {
                console.log(chalk.yellow('Skipping MCP configuration.'));
                return false;
            }
            environmentsToConfig.push(...selectedEnvironments);
        }
        // Configure selected environments
        let successCount = 0;
        for (const env of environmentsToConfig) {
            const envInfo = environments.find((e) => e.environment === env);
            if (envInfo?.configured && !options.force) {
                console.log(chalk.yellow(`${getEnvironmentDisplayName(env)} is already configured.`));
                continue;
            }
            const spinner = ora(`Configuring ${getEnvironmentDisplayName(env)}...`).start();
            try {
                const success = await mcpManager.configureServer(env, {
                    force: options.force,
                });
                if (success) {
                    spinner.succeed(chalk.green(`✓ Configured ${getEnvironmentDisplayName(env)}`));
                    successCount++;
                }
                else {
                    spinner.fail(chalk.red(`✗ Failed to configure ${getEnvironmentDisplayName(env)}`));
                }
            }
            catch (error) {
                spinner.fail(chalk.red(`✗ Error configuring ${getEnvironmentDisplayName(env)}: ${error instanceof Error ? error.message : String(error)}`));
            }
        }
        if (successCount > 0) {
            console.log(chalk.green(`\n✓ Successfully configured ${successCount} environment(s).`));
            console.log(chalk.yellow('Please restart Claude Desktop/Code to load the new configuration.'));
            return true;
        }
        return false;
    }
    catch (error) {
        console.error(chalk.red('MCP configuration failed:'), error instanceof Error ? error.message : String(error));
        // Don't throw - MCP configuration is optional
        return false;
    }
}
/**
 * Get display name for environment
 */
function getEnvironmentDisplayName(env) {
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
//# sourceMappingURL=setup.js.map