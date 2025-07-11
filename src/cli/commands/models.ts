/**
 * Models command - Manage AI models
 */

import chalk from 'chalk';
import ora from 'ora';
import { Listr } from 'listr2';
import inquirer from 'inquirer';
import {
  getInstalledModels,
  pullModel,
  removeModel,
  checkOllamaHealth,
} from '../utils/ollama.js';

interface ModelOptions {
  list?: boolean;
  pull?: string;
  remove?: string;
  update?: boolean;
}

interface OllamaModel {
  name: string;
  size: string;
  modified: string;
}

const RECOMMENDED_MODELS = [
  {
    name: 'codellama:7b',
    description: 'Code Llama 7B - Lightweight code generation',
    size: '~3.8GB',
  },
  {
    name: 'granite-code:8b',
    description: 'IBM Granite Code 8B - Enterprise code analysis',
    size: '~4.6GB',
  },
  {
    name: 'codellama:13b',
    description: 'Code Llama 13B - Enhanced code generation',
    size: '~7.3GB',
  },
  {
    name: 'deepseek-coder:6.7b',
    description: 'DeepSeek Coder 6.7B - Advanced code understanding',
    size: '~3.8GB',
  },
];

function format_size(bytes: string): string {
  const size_num = parseInt(bytes);
  if (isNaN(size_num)) return bytes;

  const gb = size_num / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)}GB`;
}

function format_date(date_string: string): string {
  try {
    const date = new Date(date_string);
    return date.toLocaleDateString();
  } catch {
    return date_string;
  }
}

async function list_models(): Promise<void> {
  const spinner = ora('Fetching installed models...').start();

  try {
    const models = await getInstalledModels();
    spinner.succeed('Models retrieved successfully');

    if (models.length === 0) {
      console.log(chalk.yellow('\n📭 No models installed'));
      console.log(
        chalk.dim('Run "code-audit models --pull <model>" to install a model')
      );
      console.log(chalk.dim('\nRecommended models:'));

      RECOMMENDED_MODELS.forEach((model) => {
        console.log(
          chalk.dim(`  • ${model.name} - ${model.description} (${model.size})`)
        );
      });
      return;
    }

    console.log(chalk.green(`\n📦 Installed Models (${models.length})`));
    console.log(chalk.dim('─'.repeat(80)));

    models.forEach((model: OllamaModel, index: number) => {
      const number = chalk.dim(`${index + 1}.`);
      const name = chalk.bold.cyan(model.name);
      const size = chalk.yellow(format_size(model.size));
      const modified = chalk.dim(format_date(model.modified));

      console.log(`${number} ${name}`);
      console.log(`   Size: ${size} | Modified: ${modified}`);
      if (index < models.length - 1) console.log();
    });

    console.log(chalk.dim('\n─'.repeat(80)));
    console.log(chalk.dim(`Total: ${models.length} models installed`));
  } catch (error) {
    spinner.fail('Failed to retrieve models');
    console.error(
      chalk.red('Error:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

async function pull_model_interactive(model_name?: string): Promise<void> {
  let target_model = model_name;

  if (!target_model) {
    const { selected_model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected_model',
        message: 'Select a model to install:',
        choices: [
          ...RECOMMENDED_MODELS.map((model) => ({
            name: `${model.name} - ${model.description} (${model.size})`,
            value: model.name,
          })),
          new inquirer.Separator(),
          {
            name: 'Enter custom model name',
            value: 'custom',
          },
        ],
      },
    ]);

    if (selected_model === 'custom') {
      const { custom_name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'custom_name',
          message: 'Enter model name (e.g., codellama:7b):',
          validate: (input: string) => {
            if (!input.trim()) return 'Model name is required';
            if (!input.includes(':'))
              return 'Model name should include tag (e.g., model:tag)';
            return true;
          },
        },
      ]);
      target_model = custom_name;
    } else {
      target_model = selected_model;
    }
  }

  console.log(chalk.blue(`\n🔄 Pulling model: ${chalk.bold(target_model)}`));
  console.log(
    chalk.dim('This may take several minutes depending on model size...')
  );

  const spinner = ora('Downloading model...').start();

  try {
    await pullModel(target_model);
    spinner.succeed(`Model ${chalk.bold(target_model)} installed successfully`);
    console.log(chalk.green('\n✅ Model is ready for use!'));
  } catch (error) {
    spinner.fail(`Failed to install model ${target_model}`);
    console.error(
      chalk.red('Error:'),
      error instanceof Error ? error.message : String(error)
    );
    console.log(chalk.yellow('\n💡 Troubleshooting tips:'));
    console.log(chalk.dim('  • Check your internet connection'));
    console.log(chalk.dim('  • Verify Ollama is running: ollama list'));
    console.log(chalk.dim('  • Ensure model name is correct'));
    process.exit(1);
  }
}

async function remove_model_interactive(model_name?: string): Promise<void> {
  let target_model = model_name;

  if (!target_model) {
    const models = await getInstalledModels();

    if (models.length === 0) {
      console.log(chalk.yellow('📭 No models installed to remove'));
      return;
    }

    const { selected_model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected_model',
        message: 'Select a model to remove:',
        choices: models.map((model: OllamaModel) => ({
          name: `${model.name} (${format_size(model.size)})`,
          value: model.name,
        })),
      },
    ]);

    target_model = selected_model;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove ${chalk.bold(target_model)}?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('❌ Removal cancelled'));
    return;
  }

  const spinner = ora(`Removing model ${target_model}...`).start();

  try {
    await removeModel(target_model);
    spinner.succeed(`Model ${chalk.bold(target_model)} removed successfully`);
  } catch (error) {
    spinner.fail(`Failed to remove model ${target_model}`);
    console.error(
      chalk.red('Error:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

async function update_all_models(): Promise<void> {
  console.log(chalk.blue('🔄 Updating all installed models...'));

  const models = await getInstalledModels();

  if (models.length === 0) {
    console.log(chalk.yellow('📭 No models installed to update'));
    return;
  }

  const tasks = new Listr(
    models.map((model: OllamaModel) => ({
      title: `Updating ${model.name}`,
      task: async () => {
        await pullModel(model.name);
      },
    })),
    {
      concurrent: false,
      exitOnError: false,
    }
  );

  try {
    await tasks.run();
    console.log(chalk.green('\n✅ All models updated successfully!'));
  } catch {
    console.error(chalk.red('\n❌ Some models failed to update'));
    console.log(chalk.yellow('💡 Try updating individual models manually'));
  }
}

export async function modelsCommand(options: ModelOptions): Promise<void> {
  const { list = false, pull, remove, update = false } = options;

  try {
    const spinner = ora('Checking Ollama connection...').start();
    await checkOllamaHealth();
    spinner.succeed('Connected to Ollama');
  } catch (error) {
    console.error(chalk.red('❌ Cannot connect to Ollama'));
    console.error(
      chalk.red('Error:'),
      error instanceof Error ? error.message : String(error)
    );
    console.log(
      chalk.yellow('\n💡 Make sure Ollama is installed and running:')
    );
    console.log(chalk.dim('  • Install: https://ollama.ai/download'));
    console.log(chalk.dim('  • Start: ollama serve'));
    process.exit(1);
  }

  try {
    if (list) {
      await list_models();
    } else if (pull) {
      await pull_model_interactive(pull);
    } else if (remove) {
      await remove_model_interactive(remove);
    } else if (update) {
      await update_all_models();
    } else {
      await list_models();
    }
  } catch (error) {
    console.error(
      chalk.red('Models command failed:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
