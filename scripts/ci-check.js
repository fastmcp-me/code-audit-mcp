#!/usr/bin/env node
/* eslint-env node */

/**
 * Run all CI/CD checks locally before pushing
 * This mimics what happens in GitHub Actions
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n🔍 Running CI/CD Validation Locally\n'));

const checks = [
  {
    name: 'Code Formatting',
    command: 'npm run format:check',
    fixCommand: 'npm run format',
    description: 'Checking Prettier formatting...',
  },
  {
    name: 'Linting',
    command: 'npm run lint',
    fixCommand: 'npm run lint:fix',
    description: 'Running ESLint...',
  },
  {
    name: 'Type Checking',
    command: 'npm run type-check',
    fixCommand: null,
    description: 'Running TypeScript compiler...',
  },
  {
    name: 'Tests',
    command: 'npm run test-audit',
    fixCommand: null,
    description: 'Running test suite...',
  },
  {
    name: 'Build',
    command: 'npm run build',
    fixCommand: null,
    description: 'Building project...',
  },
];

let failed = false;
const results = [];

for (const check of checks) {
  console.log(chalk.cyan(`\n→ ${check.name}`));
  console.log(chalk.gray(`  ${check.description}`));

  try {
    execSync(check.command, { stdio: 'inherit' });
    console.log(chalk.green(`  ✅ ${check.name} passed`));
    results.push({ name: check.name, passed: true });
  } catch {
    console.log(chalk.red(`  ❌ ${check.name} failed`));
    if (check.fixCommand) {
      console.log(
        chalk.yellow(
          `     Run '${check.fixCommand}' to fix auto-fixable issues`
        )
      );
    }
    results.push({ name: check.name, passed: false });
    failed = true;
  }
}

// Summary
console.log(chalk.blue.bold('\n📊 Summary:\n'));
results.forEach((result) => {
  const icon = result.passed ? '✅' : '❌';
  const color = result.passed ? chalk.green : chalk.red;
  console.log(color(`  ${icon} ${result.name}`));
});

if (failed) {
  console.log(
    chalk.red(
      '\n❌ CI validation failed! Fix the issues above before pushing.\n'
    )
  );
  process.exit(1);
} else {
  console.log(chalk.green('\n✅ All CI checks passed! Safe to push.\n'));
  console.log(chalk.gray('Tip: You can also run individual checks:'));
  console.log(chalk.gray('  • npm run format:check'));
  console.log(chalk.gray('  • npm run lint'));
  console.log(chalk.gray('  • npm run type-check'));
  console.log(chalk.gray('  • npm run test-audit'));
  console.log(chalk.gray('  • npm run build\n'));
}
