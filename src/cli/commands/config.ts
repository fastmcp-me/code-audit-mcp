/**
 * Config command - Manage configuration settings
 */

import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import inquirer from 'inquirer';
import { 
  getConfig, 
  getConfigValue, 
  setConfigValue, 
  resetConfig, 
  getConfigManager
} from '../utils/config.js';

interface ConfigOptions {
  show?: boolean;
  reset?: boolean;
  set?: string;
  get?: string;
}

/**
 * Config command handler
 */
export async function configCommand(options: ConfigOptions): Promise<void> {
  try {
    // Handle --show option
    if (options.show) {
      await showConfiguration();
      return;
    }

    // Handle --reset option
    if (options.reset) {
      await resetConfiguration();
      return;
    }

    // Handle --set option
    if (options.set) {
      await setConfiguration(options.set);
      return;
    }

    // Handle --get option
    if (options.get) {
      await getConfiguration(options.get);
      return;
    }

    // If no options provided, show interactive config menu
    await interactiveConfig();

  } catch (error) {
    console.error(chalk.red('Configuration error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Show current configuration
 */
async function showConfiguration(): Promise<void> {
  const spinner = ora('Loading configuration...').start();

  try {
    const config = await getConfig();
    const configManager = getConfigManager();
    const paths = configManager.getConfigPaths();
    const validation = configManager.validateConfig();

    spinner.succeed('Configuration loaded');

    console.log();
    console.log(chalk.blue.bold('📋 Current Configuration'));
    console.log();

    // Show configuration source info
    console.log(chalk.cyan('Configuration Files:'));
    console.log(`  Global: ${chalk.gray(paths.global)}`);
    if (paths.project) {
      console.log(`  Project: ${chalk.gray(paths.project)}`);
    } else {
      console.log(`  Project: ${chalk.gray('None')}`);
    }
    console.log();

    // Show validation status
    const statusIcon = validation.isValid ? '✅' : '❌';
    const statusColor = validation.isValid ? chalk.green : chalk.red;
    console.log(`${statusIcon} Status: ${statusColor(validation.isValid ? 'Valid' : 'Invalid')}`);
    
    if (!validation.isValid) {
      console.log(chalk.red('  Errors:'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`    • ${error}`));
      });
    }
    console.log();

    // Display configuration sections
    displayConfigSection('Ollama Settings', config.ollama);
    displayConfigSection('Audit Rules', config.audit.rules);
    displayConfigSection('Output Settings', config.audit.output);
    displayConfigSection('Server Settings', config.server);
    displayConfigSection('Update Settings', config.updates);
    displayConfigSection('Telemetry', config.telemetry);

  } catch (error) {
    spinner.fail('Failed to load configuration');
    throw error;
  }
}

/**
 * Display a configuration section
 */
function displayConfigSection(title: string, section: any): void {
  console.log(chalk.cyan.bold(title + ':'));
  
  if (typeof section === 'object' && section !== null) {
    for (const [key, value] of Object.entries(section)) {
      const formattedValue = formatConfigValue(value);
      console.log(`  ${key}: ${formattedValue}`);
    }
  }
  
  console.log();
}

/**
 * Format configuration value for display
 */
function formatConfigValue(value: any): string {
  if (value === null || value === undefined) {
    return chalk.gray('not set');
  }
  
  if (typeof value === 'boolean') {
    return value ? chalk.green('✓') : chalk.red('✗');
  }
  
  if (Array.isArray(value)) {
    return chalk.yellow(`[${value.join(', ')}]`);
  }
  
  if (typeof value === 'string') {
    return chalk.yellow(value);
  }
  
  return chalk.yellow(String(value));
}

/**
 * Reset configuration to defaults
 */
async function resetConfiguration(): Promise<void> {
  const spinner = ora('Preparing to reset configuration...').start();
  spinner.stop();

  console.log();
  console.log(chalk.yellow.bold('⚠️  Configuration Reset'));
  console.log(chalk.gray('This will reset your global configuration to default values.'));
  console.log();

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Are you sure you want to reset the configuration?',
      default: false
    }
  ]);

  if (!confirmed) {
    console.log(chalk.gray('Reset cancelled.'));
    return;
  }

  const resetSpinner = ora('Resetting configuration...').start();

  try {
    const success = await resetConfig(async () => true);
    
    if (success) {
      resetSpinner.succeed('Configuration reset successfully');
      console.log();
      console.log(chalk.green('✅ Configuration has been reset to defaults'));
      console.log(chalk.gray('Run "code-audit config --show" to view the default settings'));
    } else {
      resetSpinner.fail('Reset was cancelled');
    }
  } catch (error) {
    resetSpinner.fail('Failed to reset configuration');
    throw error;
  }
}

/**
 * Set configuration value
 */
async function setConfiguration(keyValue: string): Promise<void> {
  const [key, ...valueParts] = keyValue.split('=');
  const value = valueParts.join('=');

  if (!key || value === undefined) {
    throw new Error('Invalid format. Use: --set key=value');
  }

  const spinner = ora(`Setting ${key}...`).start();

  try {
    // Parse value based on expected type
    const parsedValue = parseConfigValue(value);
    
    await setConfigValue(key.trim(), parsedValue);
    
    spinner.succeed(`Configuration updated: ${key} = ${value}`);
    
    console.log();
    console.log(chalk.green('✅ Configuration value updated successfully'));
    console.log(chalk.gray('Run "code-audit config --show" to view all settings'));

  } catch (error) {
    spinner.fail(`Failed to set ${key}`);
    throw error;
  }
}

/**
 * Parse configuration value from string
 */
function parseConfigValue(value: string): any {
  const trimmed = value.trim();
  
  // Boolean values
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  
  // Null/undefined
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  
  // Numbers
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  
  if (/^\d+\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed);
  }
  
  // Arrays (simple comma-separated)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const arrayContent = trimmed.slice(1, -1);
    if (arrayContent.trim() === '') return [];
    return arrayContent.split(',').map(item => item.trim());
  }
  
  // Objects (simple JSON)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error(`Invalid JSON object: ${trimmed}`);
    }
  }
  
  // Default to string
  return trimmed;
}

/**
 * Get configuration value
 */
async function getConfiguration(key: string): Promise<void> {
  const spinner = ora(`Getting ${key}...`).start();

  try {
    const value = await getConfigValue(key.trim());
    
    spinner.succeed(`Retrieved ${key}`);
    
    console.log();
    if (value === undefined) {
      console.log(chalk.gray(`Configuration key "${key}" is not set`));
    } else {
      console.log(chalk.cyan('Key:'), chalk.yellow(key));
      console.log(chalk.cyan('Value:'), formatConfigValue(value));
      console.log(chalk.cyan('Type:'), chalk.gray(typeof value));
    }

  } catch (error) {
    spinner.fail(`Failed to get ${key}`);
    throw error;
  }
}

/**
 * Interactive configuration menu
 */
async function interactiveConfig(): Promise<void> {
  console.log(chalk.blue.bold('⚙️  Configuration Manager'));
  console.log();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'View current configuration', value: 'show' },
        { name: 'Edit Ollama settings', value: 'ollama' },
        { name: 'Configure audit rules', value: 'audit' },
        { name: 'Server settings', value: 'server' },
        { name: 'Reset to defaults', value: 'reset' },
        { name: 'Export configuration', value: 'export' },
        { name: 'Cancel', value: 'cancel' }
      ]
    }
  ]);

  switch (action) {
    case 'show':
      await showConfiguration();
      break;
    case 'ollama':
      await configureOllama();
      break;
    case 'audit':
      await configureAudit();
      break;
    case 'server':
      await configureServer();
      break;
    case 'reset':
      await resetConfiguration();
      break;
    case 'export':
      await exportConfiguration();
      break;
    case 'cancel':
      console.log(chalk.gray('Configuration cancelled.'));
      break;
  }
}

/**
 * Configure Ollama settings
 */
async function configureOllama(): Promise<void> {
  const config = await getConfig();
  
  console.log();
  console.log(chalk.cyan.bold('🦙 Ollama Configuration'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'host',
      message: 'Ollama host URL:',
      default: config.ollama.host,
      validate: (input) => {
        if (!input.trim()) return 'Host URL is required';
        try {
          new URL(input);
          return true;
        } catch {
          return 'Invalid URL format';
        }
      }
    },
    {
      type: 'number',
      name: 'timeout',
      message: 'Timeout (milliseconds):',
      default: config.ollama.timeout,
      validate: (input) => (input && input >= 1000) || 'Timeout must be at least 1000ms'
    },
    {
      type: 'input',
      name: 'primary',
      message: 'Primary model:',
      default: config.ollama.models.primary,
      validate: (input) => input.trim() ? true : 'Primary model is required'
    }
  ]);

  const spinner = ora('Updating Ollama configuration...').start();

  try {
    await setConfigValue('ollama.host', answers.host);
    await setConfigValue('ollama.timeout', answers.timeout);
    await setConfigValue('ollama.models.primary', answers.primary);
    
    spinner.succeed('Ollama configuration updated');
    console.log(chalk.green('✅ Ollama settings saved successfully'));
  } catch (error) {
    spinner.fail('Failed to update Ollama configuration');
    throw error;
  }
}

/**
 * Configure audit settings
 */
async function configureAudit(): Promise<void> {
  const config = await getConfig();
  
  console.log();
  console.log(chalk.cyan.bold('🔍 Audit Configuration'));
  console.log();

  const auditRules = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'rules',
      message: 'Select audit rules to enable:',
      choices: [
        { name: 'Security Analysis', value: 'security', checked: config.audit.rules.security },
        { name: 'Performance Analysis', value: 'performance', checked: config.audit.rules.performance },
        { name: 'Code Quality', value: 'quality', checked: config.audit.rules.quality },
        { name: 'Documentation Check', value: 'documentation', checked: config.audit.rules.documentation },
        { name: 'Test Coverage', value: 'testing', checked: config.audit.rules.testing },
        { name: 'Architecture Review', value: 'architecture', checked: config.audit.rules.architecture },
        { name: 'Completeness Check', value: 'completeness', checked: config.audit.rules.completeness }
      ]
    }
  ]);

  const outputSettings = await inquirer.prompt([
    {
      type: 'list',
      name: 'format',
      message: 'Output format:',
      choices: ['json', 'markdown', 'html'],
      default: config.audit.output.format
    },
    {
      type: 'list',
      name: 'verbosity',
      message: 'Verbosity level:',
      choices: ['minimal', 'normal', 'detailed'],
      default: config.audit.output.verbosity
    },
    {
      type: 'confirm',
      name: 'includeMetrics',
      message: 'Include metrics in output:',
      default: config.audit.output.includeMetrics
    }
  ]);

  const spinner = ora('Updating audit configuration...').start();

  try {
    // Update audit rules
    for (const rule of ['security', 'performance', 'quality', 'documentation', 'testing', 'architecture', 'completeness']) {
      await setConfigValue(`audit.rules.${rule}`, auditRules.rules.includes(rule));
    }

    // Update output settings
    await setConfigValue('audit.output.format', outputSettings.format);
    await setConfigValue('audit.output.verbosity', outputSettings.verbosity);
    await setConfigValue('audit.output.includeMetrics', outputSettings.includeMetrics);

    spinner.succeed('Audit configuration updated');
    console.log(chalk.green('✅ Audit settings saved successfully'));
  } catch (error) {
    spinner.fail('Failed to update audit configuration');
    throw error;
  }
}

/**
 * Configure server settings
 */
async function configureServer(): Promise<void> {
  const config = await getConfig();
  
  console.log();
  console.log(chalk.cyan.bold('🖥️  Server Configuration'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'transport',
      message: 'Transport method:',
      choices: [
        { name: 'Standard I/O (recommended)', value: 'stdio' },
        { name: 'HTTP', value: 'http' }
      ],
      default: config.server.transport
    },
    {
      type: 'number',
      name: 'port',
      message: 'HTTP port (if using HTTP transport):',
      default: config.server.port,
      when: (answers) => answers.transport === 'http',
      validate: (input) => (input && input >= 1 && input <= 65535) || 'Port must be between 1 and 65535'
    },
    {
      type: 'list',
      name: 'logLevel',
      message: 'Log level:',
      choices: ['error', 'warn', 'info', 'debug'],
      default: config.server.logLevel
    }
  ]);

  const spinner = ora('Updating server configuration...').start();

  try {
    await setConfigValue('server.transport', answers.transport);
    if (answers.port) {
      await setConfigValue('server.port', answers.port);
    }
    await setConfigValue('server.logLevel', answers.logLevel);
    
    spinner.succeed('Server configuration updated');
    console.log(chalk.green('✅ Server settings saved successfully'));
  } catch (error) {
    spinner.fail('Failed to update server configuration');
    throw error;
  }
}

/**
 * Export configuration
 */
async function exportConfiguration(): Promise<void> {
  const spinner = ora('Exporting configuration...').start();

  try {
    const configManager = getConfigManager();
    const exported = configManager.exportConfig();
    
    spinner.succeed('Configuration exported');
    
    console.log();
    console.log(chalk.cyan.bold('📤 Configuration Export'));
    console.log();
    
    console.log(boxen(
      JSON.stringify(exported, null, 2),
      { 
        padding: 1, 
        borderColor: 'cyan',
        title: 'Configuration Data',
        titleAlignment: 'center'
      }
    ));
    
    console.log();
    console.log(chalk.gray('Copy this data to backup or transfer your configuration.'));
    
  } catch (error) {
    spinner.fail('Failed to export configuration');
    throw error;
  }
}