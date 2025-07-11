/**
 * Start command - Launch the MCP server
 */
import chalk from 'chalk';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync, appendFileSync, openSync, closeSync, constants, } from 'fs';
import { homedir } from 'os';
import ora from 'ora';
import { getConfig, ConfigError } from '../utils/config.js';
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
function _isServerRunning() {
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
    catch {
        // Process doesn't exist, remove stale PID file
        unlinkSync(pidFile);
        return false;
    }
}
/**
 * Atomically acquire PID lock and save PID
 * Returns true if lock acquired, false if another process is running
 */
function acquirePidLock(pid) {
    const pidFile = getPidFilePath();
    const pidDir = dirname(pidFile);
    // Ensure directory exists
    if (!existsSync(pidDir)) {
        mkdirSync(pidDir, { recursive: true });
    }
    try {
        // Atomic create - fails if file exists
        const fd = openSync(pidFile, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY);
        writeFileSync(pidFile, pid.toString());
        closeSync(fd);
        return true;
    }
    catch (error) {
        if (error.code === 'EEXIST') {
            // File exists, check if process is alive
            try {
                const existingPid = parseInt(readFileSync(pidFile, 'utf8').trim());
                process.kill(existingPid, 0);
                return false; // Process is alive
            }
            catch {
                // Process is dead, remove stale PID file and retry
                unlinkSync(pidFile);
                return acquirePidLock(pid);
            }
        }
        throw error;
    }
}
/**
 * Save PID to file (legacy function for compatibility)
 */
function _savePid(pid) {
    if (!acquirePidLock(pid)) {
        throw new Error('Failed to acquire PID lock - another instance may be starting');
    }
}
/**
 * Wait for server to be ready
 */
async function waitForServerReady(pid, timeout = 10000) {
    const startTime = Date.now();
    const checkInterval = 500; // Check every 500ms
    while (Date.now() - startTime < timeout) {
        try {
            // Check if process is still alive
            process.kill(pid, 0);
            // If we've waited at least 2 seconds and process is still alive, assume it's ready
            if (Date.now() - startTime > 2000) {
                return true;
            }
        }
        catch {
            // Process died
            return false;
        }
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }
    // Process is still alive after timeout, assume it's ready
    return true;
}
/**
 * Start the MCP server
 */
export async function startCommand(options) {
    console.log(chalk.blue.bold('🚀 Starting Code Audit MCP Server'));
    // Pre-flight checks with timeout
    const spinner = ora('Performing pre-flight checks...').start();
    const preflightTimeout = 30000; // 30 seconds timeout
    try {
        await Promise.race([
            (async () => {
                // Check Ollama health
                const config = await getConfig();
                await checkOllamaHealth(config.ollama.host);
                // Ensure required models are available
                await ensureRequiredModels();
            })(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Pre-flight checks timed out after 30 seconds')), preflightTimeout)),
        ]);
        spinner.succeed('Pre-flight checks passed');
    }
    catch (error) {
        spinner.fail('Pre-flight check failed');
        if (error instanceof ConfigError) {
            console.error(chalk.red('❌ Configuration error:'), error.message);
            if (error.configPath) {
                console.log(chalk.yellow(`Check your config at: ${error.configPath}`));
            }
            console.log(chalk.gray('Run "code-audit config --reset" to restore defaults'));
        }
        else if (error instanceof Error) {
            if (error.message.includes('timed out')) {
                console.error(chalk.red('❌ Pre-flight checks timed out'));
                console.log(chalk.yellow('💡 Ollama might be unresponsive. Try:'));
                console.log(chalk.gray('   • Check if Ollama is running: ollama list'));
                console.log(chalk.gray('   • Restart Ollama service'));
            }
            else if (error.message.includes('ECONNREFUSED')) {
                console.error(chalk.red('❌ Cannot connect to Ollama'));
                console.log(chalk.yellow('💡 Make sure Ollama is running:'));
                console.log(chalk.gray('   • Start Ollama: ollama serve'));
                console.log(chalk.gray('   • Check the configured host in your config'));
            }
            else if (error.message.includes('model')) {
                console.error(chalk.red('❌ Required models not available'));
                console.log(chalk.yellow('💡 Install required models:'));
                console.log(chalk.gray('   • Run: code-audit setup'));
                console.log(chalk.gray('   • Or manually: ollama pull <model>'));
            }
            else {
                console.error(chalk.red(`❌ ${error.message}`));
            }
        }
        else {
            console.error(chalk.red('❌ Unknown error during pre-flight checks'));
        }
        console.log(chalk.yellow('\n💡 Try running "code-audit setup" to configure the system'));
        return;
    }
    // Determine server path
    const serverPath = join(__dirname, '../../../src/server/index.js');
    // Validate server file exists
    if (!existsSync(serverPath)) {
        console.error(chalk.red('❌ Server build artifacts not found'));
        console.log(chalk.yellow('💡 Run "npm run build" to build the server first'));
        console.log(chalk.gray(`Expected file: ${serverPath}`));
        return;
    }
    if (options.daemon) {
        // Start as daemon
        console.log(chalk.gray('Starting server as daemon...'));
        const logDir = join(homedir(), '.code-audit');
        const logFile = join(logDir, 'server.log');
        const errorLogFile = join(logDir, 'server-error.log');
        // Ensure log directory exists
        if (!existsSync(logDir)) {
            mkdirSync(logDir, { recursive: true });
        }
        const child = spawn('node', [serverPath], {
            detached: true,
            stdio: ['pipe', 'pipe', 'pipe'], // Keep stdin open, capture stdout and stderr
        });
        // Handle process spawn errors
        child.on('error', (error) => {
            console.error(chalk.red('❌ Failed to start server daemon:'), error.message);
            process.exit(1);
        });
        // Check if spawn was successful
        if (!child.pid) {
            console.error(chalk.red('❌ Failed to spawn server process'));
            return;
        }
        // Keep stdin alive to prevent MCP server from exiting
        if (child.stdin) {
            child.stdin.end();
        }
        // Log stdout to file
        if (child.stdout) {
            child.stdout.on('data', (data) => {
                appendFileSync(logFile, `[${new Date().toISOString()}] ${data.toString()}`);
            });
        }
        // Log stderr to error file
        if (child.stderr) {
            child.stderr.on('data', (data) => {
                appendFileSync(errorLogFile, `[${new Date().toISOString()}] ${data.toString()}`);
            });
        }
        // Try to acquire PID lock (skip for stdio mode)
        if (!options.stdio && !acquirePidLock(child.pid)) {
            console.error(chalk.red('❌ Another server instance is already running'));
            console.log(chalk.gray('Use "code-audit stop" to stop it first'));
            child.kill('SIGTERM');
            return;
        }
        child.unref();
        // Wait for server to be ready
        const healthCheckSpinner = ora('Waiting for server to be ready...').start();
        const isReady = await waitForServerReady(child.pid, 15000); // Wait up to 15 seconds
        if (isReady) {
            healthCheckSpinner.succeed('Server is ready');
            console.log(chalk.green('✅ Server started as daemon'));
            console.log(chalk.gray(`PID: ${child.pid}`));
            console.log(chalk.gray(`Logs: ${logFile}`));
            console.log(chalk.gray(`Error logs: ${errorLogFile}`));
            console.log(chalk.gray('Use "code-audit stop" to stop the server'));
        }
        else {
            healthCheckSpinner.fail('Server failed to become ready');
            // Check if process is still alive
            try {
                process.kill(child.pid, 0);
                console.error(chalk.red('❌ Server is running but not responding'));
                console.log(chalk.yellow(`Check logs for errors: ${errorLogFile}`));
            }
            catch {
                console.error(chalk.red('❌ Server process died shortly after starting'));
                console.log(chalk.yellow(`Check error logs: ${errorLogFile}`));
            }
            // Clean up PID file since server isn't healthy
            const pidFile = getPidFilePath();
            if (existsSync(pidFile)) {
                unlinkSync(pidFile);
            }
        }
    }
    else {
        // Start in foreground
        console.log(chalk.gray('Starting server in foreground...'));
        console.log(chalk.gray('Press Ctrl+C to stop the server\n'));
        const child = spawn('node', [serverPath], {
            stdio: 'inherit',
        });
        // Check if spawn was successful
        if (!child.pid) {
            console.error(chalk.red('❌ Failed to spawn server process'));
            return;
        }
        // Try to acquire PID lock for foreground mode (skip for stdio mode)
        if (!options.stdio && !acquirePidLock(child.pid)) {
            console.error(chalk.red('❌ Another server instance is already running'));
            console.log(chalk.gray('Use "code-audit stop" to stop it first'));
            child.kill('SIGTERM');
            return;
        }
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log(chalk.yellow('\n🛑 Shutting down server...'));
            // Get shutdown configuration
            try {
                const config = await getConfig();
                const gracefulTimeout = config.server?.shutdown?.gracefulTimeout || 5000;
                const forceTimeout = config.server?.shutdown?.forceTimeout || 10000;
                child.kill('SIGTERM');
                // Warn if taking too long
                const gracefulTimer = setTimeout(() => {
                    console.log(chalk.yellow('⚠️  Graceful shutdown taking longer than expected...'));
                }, gracefulTimeout);
                // Force kill if necessary
                const forceTimer = setTimeout(() => {
                    if (child.killed === false) {
                        console.log(chalk.red('❌ Force killing server process'));
                        child.kill('SIGKILL');
                    }
                }, forceTimeout);
                // Clean up timers when child exits
                child.once('exit', () => {
                    clearTimeout(gracefulTimer);
                    clearTimeout(forceTimer);
                });
            }
            catch {
                // Fallback to default timeouts if config fails
                setTimeout(() => {
                    if (child.killed === false) {
                        child.kill('SIGKILL');
                    }
                }, 10000);
            }
        });
        child.on('exit', (code) => {
            // Clean up PID file (skip for stdio mode)
            if (!options.stdio) {
                const pidFile = getPidFilePath();
                if (existsSync(pidFile)) {
                    unlinkSync(pidFile);
                }
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