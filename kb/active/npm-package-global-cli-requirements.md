# MCP Code Audit Server - NPM Package & Global CLI Requirements

## Issue Summary
Transform the current MCP Code Audit Server into a globally installable npm package with CLI functionality, auto-updates, and intelligent model management.

## Requirements

### 1. NPM Package Publishing
- **Global Installation**: `npm install -g code-audit-mcp`
- **CLI Command**: `code-audit` or `audit-mcp` command available globally
- **Semantic Versioning**: Proper version management for updates
- **Package Metadata**: Complete package.json with keywords, description, repository links

### 2. CLI Interface
- **Server Management**: Start/stop/restart MCP server
- **Configuration**: Setup and configuration management
- **Model Management**: Install/update/list available models
- **Health Checks**: Verify Ollama and model availability
- **Interactive Setup**: Guided initial configuration

### 3. Auto-Update Functionality
- **Update Checking**: Check for new versions on startup or command
- **Automatic Updates**: Option to auto-update to latest version
- **Version Notifications**: Notify users of available updates
- **Rollback Support**: Ability to rollback to previous version if needed

### 4. Intelligent Model Management
- **Auto-Pull Models**: Automatically pull required models if missing
- **Model Validation**: Verify model compatibility and availability
- **Progress Indicators**: Show download progress for large models
- **Model Recommendations**: Suggest optimal models based on usage

### 5. Ollama Integration & Warnings
- **Ollama Detection**: Check if Ollama is installed and running
- **Installation Guidance**: Provide clear instructions if Ollama is missing
- **Service Management**: Help start Ollama service if stopped
- **Connection Validation**: Verify Ollama API connectivity

### 6. Local Testing Requirements
- **Development Server**: Run MCP server locally for testing
- **Project Integration**: Test with actual code projects
- **Performance Validation**: Ensure audit speed and accuracy
- **Error Handling**: Verify graceful error handling and recovery

## Technical Implementation Plan

### Package Structure
```
code-audit-mcp/
├── package.json              # NPM package configuration
├── bin/
│   └── code-audit.js         # CLI entry point
├── src/
│   ├── cli/
│   │   ├── commands/         # CLI command implementations
│   │   ├── update.ts         # Auto-update functionality
│   │   └── index.ts          # CLI router
│   ├── server/              # MCP server (existing)
│   └── config/              # Configuration management
├── templates/               # Configuration templates
└── docs/                   # Documentation
```

### CLI Commands Structure
- `code-audit start` - Start MCP server
- `code-audit stop` - Stop MCP server
- `code-audit setup` - Initial setup and configuration
- `code-audit update` - Check/install updates
- `code-audit models` - Manage AI models
- `code-audit health` - System health check
- `code-audit config` - Configuration management
- `code-audit test` - Test server functionality

### Auto-Update Implementation
- Use `update-notifier` or similar package for version checking
- Implement self-updating mechanism with proper permissions
- Version compatibility checking before updates
- Backup/restore functionality for configurations

### Model Management Features
- Detect missing models on startup
- Progressive download with progress bars
- Model size estimation and disk space checking
- Fallback model strategies for different hardware

### Ollama Integration
- Platform-specific Ollama detection (Windows, macOS, Linux)
- Service status checking and startup assistance
- Clear error messages with installation links
- Automatic service discovery on different ports

## Success Criteria

### 1. Installation & Setup
- [ ] `npm install -g code-audit-mcp` works correctly
- [ ] `code-audit` command available in PATH
- [ ] Automated setup completes without errors
- [ ] All required models download successfully

### 2. CLI Functionality
- [ ] All CLI commands work as expected
- [ ] Help documentation is comprehensive
- [ ] Error messages are clear and actionable
- [ ] Configuration persists between sessions

### 3. Auto-Update System
- [ ] Version checking works on startup
- [ ] Updates install without breaking existing config
- [ ] Rollback functionality works when needed
- [ ] Update notifications are non-intrusive

### 4. Model & Ollama Management
- [ ] Missing models auto-install on first use
- [ ] Ollama detection works on all platforms
- [ ] Clear warnings when dependencies are missing
- [ ] Performance optimizations for model selection

### 5. Local Testing
- [ ] MCP server starts and responds to requests
- [ ] Code auditing works with real projects
- [ ] Integration with Claude Code functions properly
- [ ] Performance meets expectations (<3s for fast mode)

## Dependencies & Technologies

### NPM Package Dependencies
- `commander` - CLI framework
- `chalk` - Terminal styling
- `ora` - Loading spinners
- `inquirer` - Interactive prompts
- `update-notifier` - Update checking
- `boxen` - Terminal boxes for messages
- `pkg-conf` - Configuration management

### System Dependencies
- Node.js 18+ (specified in engines)
- Ollama (checked and guided installation)
- Sufficient disk space for models
- Network connectivity for model downloads

## Testing Strategy

### Local Development Testing
1. **Package Testing**: Test npm pack/install locally
2. **CLI Testing**: Verify all commands work in isolation
3. **Integration Testing**: Test with real projects and code
4. **Performance Testing**: Validate audit speed and accuracy
5. **Error Scenario Testing**: Test failure modes and recovery

### Pre-Publish Validation
1. **Cross-Platform Testing**: Windows, macOS, Linux
2. **Node Version Testing**: Test on Node 18, 20, 22
3. **Network Condition Testing**: Slow/offline scenarios
4. **Permission Testing**: Installation without admin rights
5. **Integration Testing**: Claude Code integration validation

## Migration from Current State
1. Restructure project for npm package publishing
2. Create CLI entry points and command structure
3. Implement auto-update system
4. Add intelligent model management
5. Enhance Ollama integration with warnings
6. Create comprehensive testing suite
7. Update documentation for npm package usage
8. Publish to npm registry

This transformation will make the MCP Code Audit Server much more accessible and user-friendly while maintaining all existing functionality.