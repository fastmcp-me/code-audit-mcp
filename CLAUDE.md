# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides AI-powered code auditing using local Ollama models. It's designed as a globally installable npm package with a comprehensive CLI interface.

## Essential Commands

### Development

```bash
# Build TypeScript project
npm run build

# Run in development mode with hot reload
npm run dev

# Run all quality checks (lint, format, type-check)
npm run quality-check

# Auto-fix linting and formatting issues
npm run quality-fix

# Run unit tests
npm run test-audit

# Test local package installation
npm run test-local

# Full test suite (clean, install, test)
npm run full-test
```

### Testing a Single Command

```bash
# Test individual CLI commands during development
./bin/code-audit.js start --stdio
./bin/code-audit.js health
./bin/code-audit.js models --list
```

### Package Management

```bash
# Clean build artifacts
npm run clean

# Pack for local testing
npm pack

# Test global installation locally
npm run pack-test
```

## Architecture Overview

### MCP Server Architecture

The server implements the Model Context Protocol with the following key components:

1. **Server Core** (`src/server/index.ts`):
   - MCP-compliant server with StdioServerTransport
   - Tool registration: `audit_code`, `health_check`, `list_models`, `update_config`
   - Request handling with parallel audit support
   - Configuration management and hot-reloading

2. **Auditor System** (`src/server/auditors/`):
   - `BaseAuditor`: Abstract class providing common audit workflow
   - Specialized auditors: Security, Completeness, Performance, Quality, Architecture, Testing, Documentation
   - Each auditor uses different AI models optimized for their specific analysis type
   - Pattern-based static analysis combined with AI insights

3. **Ollama Integration** (`src/server/ollama/`):
   - `OllamaClient`: HTTP client with retry logic and health monitoring
   - `ModelManager`: Model selection strategies (Performance, Quality, Balanced)
   - `prompts.ts`: Context-aware prompt generation for each audit type

### CLI Architecture

The CLI provides a comprehensive interface for server management:

1. **CLI Entry** (`bin/code-audit.js`):
   - Executable entry point with proper shebang
   - Routes to TypeScript CLI implementation

2. **Command Structure** (`src/cli/commands/`):
   - `start.ts`: Server lifecycle management (foreground/daemon)
   - `setup.ts`: Interactive setup wizard
   - `models.ts`: AI model management
   - `config.ts`: Configuration management
   - `health.ts`: System health checks
   - `update.ts`: Auto-update functionality

3. **Utilities** (`src/cli/utils/`):
   - `ollama.ts`: Platform-specific Ollama detection and management
   - `config.ts`: Type-safe configuration with Conf package

### Key Design Patterns

1. **Factory Pattern**: `AuditorFactory` creates appropriate auditor instances
2. **Strategy Pattern**: Model selection strategies for different optimization goals
3. **Abstract Factory**: `BaseAuditor` provides template for all auditors
4. **Singleton**: Configuration management uses singleton pattern
5. **Observer**: Health monitoring and metrics collection

## MCP Integration Points

### Tool Schemas

All tools follow MCP protocol with proper schema validation:

- Request validation using Zod schemas
- Structured error responses with MCP error codes
- Streaming support for large code analysis

### Claude Code Configuration

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "/path/to/code-audit-mcp/bin/code-audit.js",
      "args": ["start", "--stdio"],
      "env": {}
    }
  }
}
```

## Model Requirements

### Essential Models

- `codellama:7b` - Fast general-purpose analysis
- `granite-code:8b` - Security-focused analysis

### Additional Models by Audit Type

- Security: `granite-code:8b`, `deepseek-coder:33b`
- Performance: `deepseek-coder:6.7b`, `codellama:13b`
- Testing: `starcoder2:7b`, `starcoder2:15b`
- Documentation: `qwen2.5-coder:7b`, `llama3.1:8b`

## Configuration System

### Global Config Location

- `~/.code-audit/config.json` - Global configuration
- `.code-audit.json` - Project-specific overrides

### Key Configuration Options

- `ollama.host`: Ollama server URL
- `audit.rules.<type>`: Enable/disable audit types
- `server.transport`: MCP transport (stdio/http)
- `models.primary`: Default model selection

## Error Handling Patterns

1. **Ollama Connection**: Graceful fallback with clear user messages
2. **Model Availability**: Automatic fallback to available models
3. **Audit Failures**: Partial results with error details
4. **CLI Errors**: Actionable error messages with recovery steps

## Testing Strategy

### Unit Tests

- Located in `tests/` directory
- Run with `npm run test-audit`
- Focus on auditor logic and utility functions

### Integration Tests

- `test-local.js`: Comprehensive CLI testing
- Tests all commands and error scenarios
- Validates package installation

## Pre-commit Hooks

Husky runs automatic checks on commit:

1. ESLint for code quality
2. Prettier for formatting
3. TypeScript compilation check

## VS Code Integration

The project includes comprehensive VS Code settings:

- Auto-formatting on save
- ESLint integration
- TypeScript IntelliSense
- Debug configurations for server and CLI

## Performance Considerations

1. **Model Selection**: Fast mode uses smaller models for quick feedback
2. **Parallel Audits**: Configurable concurrency limits
3. **Caching**: Request deduplication for repeated analyses
4. **Streaming**: Large file support with chunking

## Security Notes

1. **File Permissions**: Config files use 0o600 permissions
2. **Input Validation**: All user inputs validated
3. **No Hardcoded Secrets**: Configuration-based credentials
4. **Process Isolation**: Daemon mode with proper cleanup

## Knowledge Base Organization

The project uses a knowledge base system to track issues, implementations, and documentation:

### Directory Structure

- `kb/active/` - Current issues, ongoing work, and planning documents
- `kb/completed/` - Finished implementations, resolved issues, and historical documentation

### Management Guidelines

1. **Regular Audits**: Check kb/active/ for completed work that should be moved
2. **Status Indicators**: Look for "COMPLETE", "✅", "IMPLEMENTED" in documents
3. **Feature Verification**: Always verify implementation in src/ before moving to completed
4. **New Issues**: Create new documents in kb/active/ for unimplemented features
5. **Naming Convention**: Use UPPERCASE_WITH_UNDERSCORES.md for issue tracking files

### Current Active Issues

- Setup command enhancements (SETUP_COMMAND_REMAINING_FIXES.md)
- GitHub CI/CD implementation
- Various analysis documents for ongoing improvements
