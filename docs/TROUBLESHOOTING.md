# Troubleshooting Guide

This guide helps resolve common issues when developing or using Code Audit MCP.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Development Setup Issues](#development-setup-issues)
- [Runtime Issues](#runtime-issues)
- [Ollama Issues](#ollama-issues)
- [MCP Server Issues](#mcp-server-issues)
- [Build and Compilation Issues](#build-and-compilation-issues)
- [Testing Issues](#testing-issues)
- [Git and Version Control Issues](#git-and-version-control-issues)
- [Performance Issues](#performance-issues)
- [Common Error Messages](#common-error-messages)

## Installation Issues

### npm install fails

**Problem**: Dependencies fail to install

**Solutions**:

1. Clear npm cache:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. Check Node.js version:

```bash
node --version  # Should be >= 18.0.0
```

3. Use different registry:

```bash
npm install --registry https://registry.npmjs.org/
```

4. Check for permissions:

```bash
# On Unix systems
sudo npm install -g code-audit-mcp

# Better: use a Node version manager
nvm use 18
npm install -g code-audit-mcp
```

### Global installation not found

**Problem**: `code-audit` command not found after global install

**Solutions**:

1. Check npm global path:

```bash
npm config get prefix
# Add {prefix}/bin to your PATH
```

2. Reinstall globally:

```bash
npm uninstall -g code-audit-mcp
npm install -g code-audit-mcp
```

3. Use npx instead:

```bash
npx code-audit-mcp setup
```

## Development Setup Issues

### Husky hooks not working

**Problem**: Pre-commit hooks don't run

**Solutions**:

1. Reinstall husky:

```bash
rm -rf .husky
npm run prepare
```

2. Check Git version:

```bash
git --version  # Should be >= 2.9
```

3. Verify hooks installation:

```bash
ls -la .husky/
cat .husky/pre-commit
```

4. Check Git hooks path:

```bash
git config core.hooksPath
# Should be .husky
```

### ESLint errors on commit

**Problem**: ESLint blocks commits

**Solutions**:

1. Fix automatically:

```bash
npm run lint:fix
```

2. Check specific file:

```bash
npx eslint src/path/to/file.ts
```

3. Update ESLint config:

```bash
# Check current config
npx eslint --print-config src/server.ts
```

### TypeScript compilation errors

**Problem**: Type checking fails

**Solutions**:

1. Check TypeScript version:

```bash
npx tsc --version
```

2. Clean and rebuild:

```bash
rm -rf dist/
npm run build
```

3. Check for missing types:

```bash
npm install --save-dev @types/node
```

## Runtime Issues

### Server won't start

**Problem**: MCP server fails to start

**Solutions**:

1. Check for port conflicts:

```bash
# Check if another process is using MCP
ps aux | grep code-audit
```

2. Verify Ollama is running:

```bash
ollama list
curl http://localhost:11434/api/tags
```

3. Check environment:

```bash
echo $NODE_ENV
export NODE_ENV=development
```

4. Run with debug output:

```bash
DEBUG=* code-audit start
```

### Memory errors

**Problem**: Out of memory errors

**Solutions**:

1. Increase Node.js memory:

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

2. Use smaller models:

```bash
# Instead of large models
ollama pull codellama:7b  # Not codellama:34b
```

3. Reduce concurrent operations:

```json
{
  "performance": {
    "maxConcurrentAudits": 1
  }
}
```

## Ollama Issues

### Ollama not found

**Problem**: Ollama commands fail

**Solutions**:

1. Install Ollama:

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

2. Start Ollama service:

```bash
ollama serve
```

3. Verify installation:

```bash
ollama --version
ollama list
```

### Model download fails

**Problem**: Can't pull models

**Solutions**:

1. Check disk space:

```bash
df -h
# Need 10GB+ for basic models
```

2. Try different model:

```bash
# If codellama fails, try:
ollama pull granite-code:8b
```

3. Check Ollama logs:

```bash
# macOS
tail -f ~/.ollama/logs/server.log

# Linux
journalctl -u ollama -f
```

### Ollama connection refused

**Problem**: Can't connect to Ollama API

**Solutions**:

1. Check if Ollama is running:

```bash
curl http://localhost:11434/api/tags
```

2. Start Ollama:

```bash
ollama serve
```

3. Check firewall:

```bash
# Allow localhost connections
sudo ufw allow from 127.0.0.1 to any port 11434
```

4. Use custom host:

```bash
export OLLAMA_HOST=http://localhost:11434
```

## MCP Server Issues

### MCP tools not appearing

**Problem**: Tools don't show in Claude

**Solutions**:

1. Check MCP config:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "code-audit",
      "args": ["start", "--stdio"]
    }
  }
}
```

2. Restart Claude/client

3. Check server logs:

```bash
code-audit start --verbose
```

### Server crashes immediately

**Problem**: Server starts then stops

**Solutions**:

1. Check for syntax errors:

```bash
npm run type-check
```

2. Run directly:

```bash
npx tsx src/server/server.ts
```

3. Check dependencies:

```bash
npm ls @modelcontextprotocol/sdk
```

## Build and Compilation Issues

### Build fails with module errors

**Problem**: Can't resolve modules

**Solutions**:

1. Check imports:

```typescript
// Use .js extension for local imports
import { Auditor } from './auditor.js'; // Not './auditor'
```

2. Clean install:

```bash
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

3. Check tsconfig.json:

```json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "node"
  }
}
```

### Type definitions not found

**Problem**: TypeScript can't find types

**Solutions**:

1. Install types:

```bash
npm install --save-dev @types/node
```

2. Check tsconfig paths:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

3. Restart TypeScript server in VS Code

## Testing Issues

### Tests won't run

**Problem**: Test command fails

**Solutions**:

1. Check test files exist:

```bash
ls tests/*.test.ts
```

2. Run specific test:

```bash
npx tsx --test tests/specific.test.ts
```

3. Check for syntax errors:

```bash
npm run lint tests/
```

### Test timeouts

**Problem**: Tests timeout

**Solutions**:

1. Increase timeout:

```typescript
it('long test', async () => {
  // test code
}, 30000); // 30 second timeout
```

2. Mock Ollama calls:

```typescript
jest.mock('../ollama/client');
```

## Git and Version Control Issues

### Pre-commit hook fails

**Problem**: Can't commit changes

**Solutions**:

1. Fix issues:

```bash
npm run quality-fix
```

2. Check what failed:

```bash
npm run quality-check
```

3. Emergency bypass:

```bash
git commit --no-verify -m "message"
# Fix issues in next commit!
```

### Merge conflicts in package-lock.json

**Problem**: Package lock conflicts

**Solutions**:

1. Regenerate:

```bash
rm package-lock.json
npm install
git add package-lock.json
```

2. Use npm's resolution:

```bash
npm install --package-lock-only
```

## Performance Issues

### Slow audit performance

**Problem**: Audits take too long

**Solutions**:

1. Use faster models:

```json
{
  "priority": "fast"
}
```

2. Limit audit scope:

```json
{
  "auditType": "security", // Not "all"
  "maxIssues": 10
}
```

3. Check model size:

```bash
ollama list
# Use 7b models instead of 33b+
```

### High CPU usage

**Problem**: Server uses too much CPU

**Solutions**:

1. Limit concurrent requests:

```json
{
  "performance": {
    "maxConcurrentAudits": 2
  }
}
```

2. Use CPU limits:

```bash
# Linux
cpulimit -l 50 code-audit start
```

## Common Error Messages

### "ENOENT: no such file or directory"

**Cause**: Missing file or incorrect path

**Fix**:

```bash
# Check file exists
ls -la path/to/file

# Use absolute paths
pwd  # Get current directory
```

### "Cannot find module"

**Cause**: Missing dependency or wrong import

**Fix**:

```bash
# Reinstall dependencies
npm install

# Check import paths
# Use .js extension for local imports
```

### "TypeError: Cannot read property of undefined"

**Cause**: Accessing undefined object property

**Fix**:

```typescript
// Add null checks
if (response?.data?.issues) {
  // Safe to use
}

// Or use optional chaining
const issues = response?.data?.issues ?? [];
```

### "EADDRINUSE: address already in use"

**Cause**: Port already in use

**Fix**:

```bash
# Find process using port
lsof -i :11434

# Kill process
kill -9 <PID>
```

### "Ollama API error"

**Cause**: Ollama service issues

**Fix**:

```bash
# Restart Ollama
killall ollama
ollama serve

# Check models
ollama list
```

## Getting Help

If you're still experiencing issues:

1. **Check existing issues**: [GitHub Issues](https://github.com/warrengates/code-audit-mcp/issues)

2. **Search discussions**: [GitHub Discussions](https://github.com/warrengates/code-audit-mcp/discussions)

3. **Create detailed issue**:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Logs and output

4. **Debug logging**:

```bash
export DEBUG=*
code-audit start 2>&1 | tee debug.log
```

5. **System information**:

```bash
npx envinfo --system --binaries --npmPackages --markdown
```

Remember to sanitize any sensitive information before sharing logs or configuration!
