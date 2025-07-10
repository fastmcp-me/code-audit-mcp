/**
 * Health command - Check system health
 */

import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import {
  checkOllamaHealth,
  getInstalledModels,
  getModelHealth,
} from '../utils/ollama.js';
import { getConfig } from '../utils/config.js';

interface HealthOptions {
  detailed?: boolean;
  json?: boolean;
}

interface HealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    ollama: boolean;
    models: Record<string, boolean>;
    config: boolean;
  };
  details: {
    ollama?: {
      version?: string;
      host: string;
      models: string[];
    };
    models?: Array<{
      name: string;
      status: string;
      size?: string;
    }>;
  };
  timestamp: string;
}

/**
 * Health check command
 */
export async function healthCommand(options: HealthOptions): Promise<void> {
  if (!options.json) {
    console.log(chalk.blue.bold('🩺 Code Audit MCP Health Check'));
    console.log();
  }

  const result: HealthResult = {
    status: 'healthy',
    checks: {
      ollama: false,
      models: {},
      config: false,
    },
    details: {},
    timestamp: new Date().toISOString(),
  };

  const spinner = options.json
    ? null
    : ora('Checking system health...').start();

  try {
    // Check configuration
    try {
      await getConfig();
      result.checks.config = true;
      if (spinner) spinner.text = 'Configuration ✓';
    } catch (_error) {
      result.checks.config = false;
      if (spinner) spinner.text = 'Configuration ✗';
    }

    // Check Ollama health
    try {
      const config = await getConfig();
      const ollamaInfo = await checkOllamaHealth(config.ollama.host);
      result.checks.ollama = true;
      result.details.ollama = {
        host: config.ollama.host,
        models: ollamaInfo.models || [],
      };
      if (spinner) spinner.text = 'Ollama ✓';
    } catch (_error) {
      result.checks.ollama = false;
      result.status = 'unhealthy';
      if (spinner) spinner.text = 'Ollama ✗';
    }

    // Check model health
    if (result.checks.ollama) {
      try {
        const installedModels = await getInstalledModels();
        const modelHealth = await getModelHealth();

        result.details.models = installedModels.map((model) => ({
          name: model.name,
          status: modelHealth[model.name] ? 'healthy' : 'unknown',
          size: model.size,
        }));

        for (const model of installedModels) {
          result.checks.models[model.name] = modelHealth[model.name] || false;
        }

        const essentialModels = ['codellama:7b', 'granite-code:8b'];
        const hasEssentialModels = essentialModels.some((model) =>
          installedModels.some((installed) => installed.name === model)
        );

        if (!hasEssentialModels) {
          result.status = 'degraded';
        }

        if (spinner) spinner.text = 'Models ✓';
      } catch (_error) {
        result.status = 'degraded';
        if (spinner) spinner.text = 'Models ✗';
      }
    }

    if (spinner) {
      if (result.status === 'healthy') {
        spinner.succeed('Health check completed');
      } else if (result.status === 'degraded') {
        spinner.warn('Health check completed with warnings');
      } else {
        spinner.fail('Health check found issues');
      }
    }
  } catch (error) {
    result.status = 'unhealthy';
    if (spinner) {
      spinner.fail(
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Output results
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    displayHealthResults(result, options.detailed);
  }
}

/**
 * Display health results in a formatted way
 */
function displayHealthResults(result: HealthResult, detailed?: boolean): void {
  console.log();

  // Overall status
  const statusIcon =
    result.status === 'healthy'
      ? '✅'
      : result.status === 'degraded'
        ? '⚠️'
        : '❌';
  const statusColor =
    result.status === 'healthy'
      ? chalk.green
      : result.status === 'degraded'
        ? chalk.yellow
        : chalk.red;

  console.log(
    boxen(
      `${statusIcon} Overall Status: ${statusColor.bold(result.status.toUpperCase())}`,
      {
        padding: 1,
        borderColor:
          result.status === 'healthy'
            ? 'green'
            : result.status === 'degraded'
              ? 'yellow'
              : 'red',
      }
    )
  );

  console.log();

  // Component status
  console.log(chalk.bold('Component Status:'));
  console.log(
    `  Configuration: ${result.checks.config ? chalk.green('✓') : chalk.red('✗')}`
  );
  console.log(
    `  Ollama Service: ${result.checks.ollama ? chalk.green('✓') : chalk.red('✗')}`
  );

  const modelCount = Object.keys(result.checks.models).length;
  const healthyModels = Object.values(result.checks.models).filter(
    Boolean
  ).length;
  console.log(
    `  AI Models: ${modelCount > 0 ? chalk.green(`✓ (${healthyModels}/${modelCount})`) : chalk.red('✗')}`
  );

  if (detailed) {
    console.log();
    console.log(chalk.bold('Detailed Information:'));

    if (result.details.ollama) {
      console.log(chalk.cyan('  Ollama:'));
      console.log(`    Host: ${result.details.ollama.host}`);
      console.log(
        `    Available Models: ${result.details.ollama.models.length}`
      );
    }

    if (result.details.models && result.details.models.length > 0) {
      console.log(chalk.cyan('  Models:'));
      for (const model of result.details.models) {
        const status =
          model.status === 'healthy' ? chalk.green('✓') : chalk.yellow('?');
        console.log(
          `    ${status} ${model.name} ${model.size ? chalk.gray(`(${model.size})`) : ''}`
        );
      }
    }
  }

  // Recommendations
  if (result.status !== 'healthy') {
    console.log();
    console.log(chalk.bold('Recommendations:'));

    if (!result.checks.config) {
      console.log(
        chalk.yellow('  • Run "code-audit setup" to configure the system')
      );
    }

    if (!result.checks.ollama) {
      console.log(chalk.yellow('  • Install Ollama from https://ollama.ai'));
      console.log(chalk.yellow('  • Make sure Ollama service is running'));
    }

    if (Object.keys(result.checks.models).length === 0) {
      console.log(
        chalk.yellow(
          '  • Run "code-audit models --pull codellama:7b" to install essential models'
        )
      );
    }
  }

  console.log();
  console.log(
    chalk.gray(
      `Health check completed at ${new Date(result.timestamp).toLocaleString()}`
    )
  );
}
