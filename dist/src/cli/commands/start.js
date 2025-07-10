/**
 * Start command - Launch the MCP server
 */
import chalk from 'chalk';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import ora from 'ora';
import { getConfig } from '../utils/config.js';
import { checkOllamaHealth, ensureRequiredModels } from '../utils/ollama.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Get PID file path
 */
function getPidFilePath() {
    const configDir = join(homedir(), '.code-audit');
    return join(configDir, 'server.pid');
}
/**
 * Check if server is already running
 */
function isServerRunning() {
    const pidFile = getPidFilePath();
    if (!existsSync(pidFile)) {
        return false;
    }
    try {
        const pid = parseInt(readFileSync(pidFile, 'utf8').trim());
        // Check if process is still alive
        process.kill(pid, 0);
        return true;
    }
    catch (error) {
        // Process doesn't exist, remove stale PID file
        unlinkSync(pidFile);
        return false;
    }
}
/**
 * Save PID to file
 */
function savePid(pid) {
    const pidFile = getPidFilePath();
    writeFileSync(pidFile, pid.toString());
}
/**
 * Start the MCP server
 */
export async function startCommand(options) {
    console.log(chalk.blue.bold('🚀 Starting Code Audit MCP Server'));
    // Check if already running
    if (isServerRunning()) {
        console.log(chalk.yellow('⚠️  Server is already running'));
        console.log(chalk.gray('Use "code-audit stop" to stop the server first'));
        return;
    }
    // Pre-flight checks
    const spinner = ora('Performing pre-flight checks...').start();
    try {
        // Check Ollama health
        const config = await getConfig();
        await checkOllamaHealth(config.ollama.host);
        // Ensure required models are available
        await ensureRequiredModels();
        spinner.succeed('Pre-flight checks passed');
    }
    catch (error) {
        spinner.fail(`Pre-flight check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log(chalk.yellow('\n💡 Try running "code-audit setup" to configure the system'));
        return;
    }
    // Determine server path
    const serverPath = join(__dirname, '../../../dist/server/index.js');
    if (options.daemon) {
        // Start as daemon
        console.log(chalk.gray('Starting server as daemon...'));
        const child = spawn('node', [serverPath], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
        savePid(child.pid);
        console.log(chalk.green('✅ Server started as daemon'));
        console.log(chalk.gray(`PID: ${child.pid}`));
        console.log(chalk.gray('Use "code-audit stop" to stop the server'));
    }
    else {
        // Start in foreground
        console.log(chalk.gray('Starting server in foreground...'));
        console.log(chalk.gray('Press Ctrl+C to stop the server\n'));
        const child = spawn('node', [serverPath], {
            stdio: 'inherit'
        });
        // Save PID for potential stop command
        savePid(child.pid);
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n🛑 Shutting down server...'));
            child.kill('SIGTERM');
            setTimeout(() => {
                child.kill('SIGKILL');
            }, 5000);
        });
        child.on('exit', (code) => {
            // Clean up PID file
            const pidFile = getPidFilePath();
            if (existsSync(pidFile)) {
                unlinkSync(pidFile);
            }
            if (code === 0) {
                console.log(chalk.green('✅ Server shut down gracefully'));
            }
            else {
                console.log(chalk.red(`❌ Server exited with code ${code}`));
            }
        });
        child.on('error', (error) => {
            console.error(chalk.red('❌ Failed to start server:'), error.message);
        });
    }
}
//# sourceMappingURL=start.js.map