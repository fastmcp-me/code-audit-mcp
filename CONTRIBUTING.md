# Contributing to Code Audit MCP

Thank you for your interest in contributing to Code Audit MCP! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow:

- **Be respectful**: Treat everyone with respect and kindness
- **Be constructive**: Provide helpful feedback and suggestions
- **Be inclusive**: Welcome contributors of all backgrounds and experience levels
- **Be professional**: Keep discussions focused on the project

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js v18.0.0 or higher
- npm v8.0.0 or higher
- Git installed and configured
- Ollama installed for testing
- VS Code (recommended) or your preferred editor

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR-USERNAME/code-audit-mcp.git
cd code-audit-mcp
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/warrengates/code-audit-mcp.git
```

4. Keep your fork updated:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## Development Setup

### Initial Setup

```bash
# Install dependencies (includes husky setup)
npm install

# Build the project
npm run build

# Run quality checks to ensure everything is working
npm run quality-check

# Test the installation
npm run test-local
```

### VS Code Configuration

If using VS Code, install recommended extensions:

```bash
# Option 1: Accept workspace recommendations when prompted

# Option 2: Install manually
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension usernamehw.errorlens
```

### Pre-commit Hooks

This project uses automatic pre-commit hooks that run:

- **ESLint**: Code quality and error checking
- **Prettier**: Code formatting
- **TypeScript**: Type checking

These run automatically on commit, but you can run them manually:

```bash
# Run all checks
npm run quality-check

# Fix auto-fixable issues
npm run quality-fix

# Individual checks
npm run lint          # ESLint
npm run format:check  # Prettier
npm run type-check    # TypeScript
```

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/add-new-auditor` - New features
- `fix/security-audit-bug` - Bug fixes
- `docs/update-readme` - Documentation
- `refactor/improve-performance` - Code refactoring
- `test/add-unit-tests` - Test additions

### Making Changes

1. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following our [code standards](#code-standards)

3. Test your changes:

```bash
# Run tests
npm test

# Test locally
npm run test-local

# Run specific auditor
npm run dev
```

4. Commit your changes:

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add support for Ruby security auditing"
```

### Commit Messages

Follow the Conventional Commits specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Build process or auxiliary tool changes
- `perf:` - Performance improvements

Examples:

```
feat: add Python Django framework-specific checks
fix: resolve memory leak in performance auditor
docs: update installation instructions for Windows
refactor: simplify model selection strategy
test: add unit tests for security auditor
```

## Code Standards

### TypeScript Guidelines

- Use TypeScript strict mode
- Provide type annotations for all function parameters and return types
- Avoid `any` type - use `unknown` or specific types
- Use interfaces for object shapes
- Document complex types with JSDoc comments

```typescript
// Good
interface AuditRequest {
  code: string;
  language: string;
  auditType?: AuditType;
}

function processAudit(request: AuditRequest): Promise<AuditResult> {
  // Implementation
}

// Avoid
function processAudit(request: any): any {
  // Implementation
}
```

### Code Style

- Follow the configured ESLint and Prettier rules
- Use meaningful variable and function names
- Keep functions focused and small (single responsibility)
- Add comments for complex logic
- Use async/await over callbacks
- Handle errors appropriately

```typescript
// Good
async function analyzeCode(code: string): Promise<AnalysisResult> {
  try {
    const parsed = await parseCode(code);
    const issues = await findIssues(parsed);
    return { success: true, issues };
  } catch (error) {
    logger.error('Code analysis failed:', error);
    throw new AnalysisError('Failed to analyze code', { cause: error });
  }
}

// Avoid
function analyzeCode(code, callback) {
  parseCode(code, (err, parsed) => {
    if (err) callback(err);
    else findIssues(parsed, callback);
  });
}
```

### File Organization

- One component/class per file
- Group related functionality in directories
- Use barrel exports (index.ts) for clean imports
- Keep test files next to source files or in tests/

```
src/
├── auditors/
│   ├── index.ts         # Barrel export
│   ├── base.ts          # Base class
│   ├── security.ts      # Security auditor
│   └── security.test.ts # Tests
```

## Testing Guidelines

### Writing Tests

- Write tests for all new functionality
- Aim for >80% code coverage
- Test edge cases and error conditions
- Use descriptive test names

```typescript
describe('SecurityAuditor', () => {
  describe('detectSQLInjection', () => {
    it('should detect direct string interpolation in SQL queries', async () => {
      const code = `const query = \`SELECT * FROM users WHERE id = \${userId}\`;`;
      const issues = await auditor.audit(code);
      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('sql_injection');
    });

    it('should not flag parameterized queries', async () => {
      const code = `const query = 'SELECT * FROM users WHERE id = ?';`;
      const issues = await auditor.audit(code);
      expect(issues).toHaveLength(0);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- security.test.ts
```

## Submitting Changes

### Pull Request Process

1. Ensure all tests pass and coverage is maintained
2. Update documentation if needed
3. Push your branch to your fork
4. Create a pull request with:
   - Clear title describing the change
   - Description of what and why
   - Link to related issues
   - Screenshots if UI changes

### Pull Request Template

```markdown
## Description

Brief description of the changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Updated existing tests

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
```

### Review Process

- PRs require at least one review
- Address review feedback promptly
- Keep PRs focused and reasonably sized
- Be patient - reviews take time

## Reporting Issues

### Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Minimal steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node version, Ollama version
6. **Code Sample**: Minimal code that triggers the issue
7. **Error Messages**: Full error output

### Issue Template

```markdown
**Describe the bug**
A clear description of the bug

**To Reproduce**

1. Run command '...'
2. With code '...'
3. See error

**Expected behavior**
What you expected to happen

**Environment:**

- OS: [e.g., macOS 14.0]
- Node: [e.g., 18.17.0]
- Ollama: [e.g., 0.1.20]
- Model: [e.g., codellama:7b]

**Additional context**
Any other relevant information
```

## Feature Requests

When requesting features:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: Your suggested approach
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Examples, mockups, or references

## Documentation

### Contributing to Docs

- Keep README.md updated with significant changes
- Update inline code documentation
- Add examples for new features
- Ensure all public APIs are documented

### Documentation Standards

````typescript
/**
 * Analyzes code for security vulnerabilities
 *
 * @param code - The source code to analyze
 * @param options - Analysis options
 * @returns Promise resolving to found security issues
 *
 * @example
 * ```typescript
 * const issues = await analyzeSecurityt(code, {
 *   severity: ['critical', 'high'],
 *   includeFixSuggestions: true
 * });
 * ```
 */
export async function analyzeSecurity(
  code: string,
  options: SecurityOptions
): Promise<SecurityIssue[]> {
  // Implementation
}
````

## Community

### Getting Help

- Check existing issues and discussions
- Ask questions in GitHub Discussions
- Review the documentation and examples
- Be specific about your problem

### Helping Others

- Answer questions in discussions
- Review pull requests
- Improve documentation
- Share your use cases

## Recognition

Contributors are recognized in:

- The project README
- Release notes
- GitHub contributors page

Thank you for contributing to Code Audit MCP!
