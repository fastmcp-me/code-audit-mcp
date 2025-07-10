/**
 * Stop command - Stop the running MCP server
 */

import chalk from 'chalk';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import ora from 'ora';

/**
 * Get PID file path
 */
function getPidFilePath(): string {
  const configDir = join(homedir(), '.code-audit');
  return join(configDir, 'server.pid');
}

/**
 * Stop the MCP server
 */
export async function stopCommand(): Promise<void> {
  console.log(chalk.blue.bold('🛑 Stopping Code Audit MCP Server'));

  const pidFile = getPidFilePath();

  if (!existsSync(pidFile)) {
    console.log(chalk.yellow('⚠️  No running server found'));
    return;
  }

  try {
    const pid = parseInt(readFileSync(pidFile, 'utf8').trim());

    const spinner = ora(`Stopping server (PID: ${pid})...`).start();

    try {
      // Try graceful shutdown first
      process.kill(pid, 'SIGTERM');

      // Wait a bit for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if process is still running
      try {
        process.kill(pid, 0);
        // Still running, force kill
        spinner.text = 'Force stopping server...';
        process.kill(pid, 'SIGKILL');

        // Wait a bit more
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (_error) {
        // Process is dead, that's what we want
      }

      spinner.succeed('Server stopped successfully');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
        // Process doesn't exist
        spinner.succeed('Server was not running');
      } else {
        spinner.fail(`Failed to stop server: ${(error as Error).message}`);
        throw error;
      }
    }

    // Clean up PID file
    unlinkSync(pidFile);

    console.log(chalk.green('✅ Server shutdown complete'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(chalk.yellow('⚠️  PID file not found or corrupted'));
    } else {
      console.error(
        chalk.red('❌ Failed to stop server:'),
        (error as Error).message
      );
    }
  }
}
