/**
 * Update command - Check for and install updates
 */
import chalk from 'chalk';
import ora from 'ora';
import semver from 'semver';
import { execa } from 'execa';
import fetch from 'node-fetch';
import boxen from 'boxen';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function get_package_info() {
    try {
        const package_path = join(__dirname, '../../../package.json');
        const package_json = JSON.parse(readFileSync(package_path, 'utf8'));
        return {
            name: package_json.name,
            version: package_json.version
        };
    }
    catch {
        return { name: '@moikas/code-audit-mcp', version: '1.0.0' };
    }
}
async function check_latest_version(package_name) {
    try {
        const response = await fetch(`https://registry.npmjs.org/${package_name}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data['dist-tags']?.latest || null;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch package info: ${message}`);
    }
}
async function install_update(package_name) {
    const spinner = ora('Installing update...').start();
    try {
        await execa('npm', ['install', '-g', package_name], {
            stdio: 'pipe'
        });
        spinner.succeed('Update installed successfully');
    }
    catch (error) {
        spinner.fail('Failed to install update');
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Installation failed: ${message}`);
    }
}
function display_update_info(current, latest, package_name) {
    const box_content = [
        chalk.green('🎉 Update Available!'),
        '',
        `Current version: ${chalk.red(current)}`,
        `Latest version:  ${chalk.green(latest)}`,
        '',
        `Run ${chalk.cyan(`npm install -g ${package_name}`)} to update`,
        `Or use ${chalk.cyan('code-audit update')} to update automatically`
    ].join('\n');
    console.log(boxen(box_content, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
    }));
}
function display_no_update_info(current) {
    console.log(chalk.green('✅ You are running the latest version:'), chalk.bold(current));
}
export async function updateCommand(options) {
    const { check = false, force = false } = options;
    try {
        const pkg = get_package_info();
        const spinner = ora('Checking for updates...').start();
        let latest_version;
        try {
            latest_version = await check_latest_version(pkg.name) || pkg.version;
            spinner.succeed('Update check completed');
        }
        catch (error) {
            spinner.fail('Failed to check for updates');
            console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
            console.log(chalk.yellow('\n💡 Try again later or check your internet connection'));
            return;
        }
        const has_update = semver.gt(latest_version, pkg.version);
        const is_same = semver.eq(latest_version, pkg.version);
        if (check) {
            if (has_update) {
                display_update_info(pkg.version, latest_version, pkg.name);
            }
            else {
                display_no_update_info(pkg.version);
            }
            return;
        }
        if (!has_update && !force) {
            if (is_same) {
                display_no_update_info(pkg.version);
            }
            else {
                console.log(chalk.yellow('⚠️  Local version is newer than published version'));
                console.log(`Local: ${chalk.bold(pkg.version)}, Published: ${chalk.dim(latest_version)}`);
            }
            return;
        }
        if (force && is_same) {
            console.log(chalk.yellow('🔄 Force updating to same version...'));
        }
        if (has_update) {
            display_update_info(pkg.version, latest_version, pkg.name);
        }
        try {
            await install_update(pkg.name);
            console.log(chalk.green('\n🎉 Update completed successfully!'));
            console.log(chalk.dim('Restart your terminal to use the updated version'));
        }
        catch (error) {
            console.error(chalk.red('\n❌ Update failed:'), error instanceof Error ? error.message : String(error));
            console.log(chalk.yellow('\n💡 You can try updating manually:'));
            console.log(chalk.cyan(`   npm install -g ${pkg.name}`));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk.red('Update command failed:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
//# sourceMappingURL=update.js.map