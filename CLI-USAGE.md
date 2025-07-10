# Code Audit MCP - CLI Usage Guide

## 🚀 Installation

### Global Installation (Recommended)

```bash
# Install globally from npm
npm install -g code-audit-mcp

# Verify installation
code-audit --version
```

### Local Development Installation

```bash
# Clone repository
git clone <repository-url>
cd code-audit-mcp

# Install dependencies
npm install

# Build the package
npm run build

# Test locally
npm run test-local
```

## 📋 Quick Start

### 1. Initial Setup

```bash
# Run interactive setup wizard
code-audit setup

# Or use preset configurations
code-audit setup --minimal       # Essential models only (~4GB)
code-audit setup --comprehensive # Recommended setup (~15GB)
```

### 2. Start the MCP Server

```bash
# Start in foreground (for testing)
code-audit start

# Start as background daemon
code-audit start --daemon

# Stop the server
code-audit stop
```

### 3. Check System Health

```bash
# Basic health check
code-audit health

# Detailed health information
code-audit health --detailed

# JSON output for scripting
code-audit health --json
```

## 🔧 Available Commands

### `code-audit setup`

Interactive setup wizard for first-time configuration.

```bash
code-audit setup [options]

Options:
  --force          Force re-setup even if already configured
  --minimal        Minimal setup with essential models only
  --comprehensive  Full setup with all recommended models
```

**What it does:**
- Checks prerequisites (Node.js, Ollama)
- Guides model selection and installation
- Creates configuration files
- Tests the complete setup

### `code-audit start`

Start the MCP server for code auditing.

```bash
code-audit start [options]

Options:
  -d, --daemon     Run as daemon process
  -p, --port       Port for HTTP transport (optional)
  --stdio          Use stdio transport (default)
```

**Examples:**
```bash
# Start in foreground (good for testing)
code-audit start

# Start as background daemon
code-audit start --daemon

# Start with HTTP transport on custom port
code-audit start --port 3001
```

### `code-audit stop`

Stop the running MCP server.

```bash
code-audit stop
```

### `code-audit health`

Check system health and configuration.

```bash
code-audit health [options]

Options:
  --detailed       Show detailed health information
  --json          Output as JSON
```

**Health Checks:**
- ✅ Ollama installation and service status
- ✅ AI model availability and health
- ✅ Configuration validity
- ✅ Network connectivity
- ✅ Disk space and system resources

### `code-audit models`

Manage AI models for code analysis.

```bash
code-audit models [options]

Options:
  --list           List installed models
  --pull <model>   Pull a specific model
  --remove <model> Remove a specific model
  --update         Update all models to latest versions
  --recommend      Show system-specific recommendations
  --health         Check model health status
```

**Examples:**
```bash
# List all installed models
code-audit models --list

# Install a specific model
code-audit models --pull codellama:7b

# Remove a model (with confirmation)
code-audit models --remove old-model:latest

# Update all models
code-audit models --update

# Get recommendations for your system
code-audit models --recommend
```

### `code-audit config`

Manage configuration settings.

```bash
code-audit config [options]

Options:
  --show           Show current configuration
  --reset          Reset to default configuration
  --set <key=value> Set a configuration value
  --get <key>      Get a configuration value
```

**Examples:**
```bash
# Show current configuration
code-audit config --show

# Set Ollama host
code-audit config --set ollama.host=http://remote-server:11434

# Get a specific value
code-audit config --get ollama.models.primary

# Reset to defaults (with confirmation)
code-audit config --reset

# Interactive configuration menu
code-audit config
```

### `code-audit update`

Check for and install updates.

```bash
code-audit update [options]

Options:
  --check         Only check for updates, don't install
  --force         Force update even if no new version
```

**Examples:**
```bash
# Check for updates
code-audit update --check

# Interactive update with confirmation
code-audit update

# Force update to latest version
code-audit update --force
```

## 🤖 Model Management

### Recommended Model Sets

#### Essential (~4GB)
Best for: Getting started, limited resources
```bash
code-audit models --pull codellama:7b
code-audit models --pull granite-code:8b
```

#### Comprehensive (~15GB)  
Best for: Most users, balanced performance/accuracy
```bash
code-audit models --pull codellama:7b
code-audit models --pull granite-code:8b
code-audit models --pull deepseek-coder:6.7b
code-audit models --pull starcoder2:7b
code-audit models --pull qwen2.5-coder:7b
```

#### Full Setup (~50GB)
Best for: Maximum accuracy, high-end systems
```bash
# Includes all comprehensive models plus:
code-audit models --pull codellama:13b
code-audit models --pull deepseek-coder:33b
code-audit models --pull starcoder2:15b
code-audit models --pull llama3.1:8b
```

### Model Specializations

| Model | Best For | Size | RAM Required |
|-------|----------|------|--------------|
| `codellama:7b` | General purpose, fast analysis | ~4GB | 8GB+ |
| `granite-code:8b` | Security analysis | ~5GB | 8GB+ |
| `deepseek-coder:6.7b` | Performance optimization | ~4GB | 8GB+ |
| `starcoder2:7b` | Testing and quality | ~4GB | 8GB+ |
| `qwen2.5-coder:7b` | Documentation analysis | ~4GB | 8GB+ |
| `codellama:13b` | Higher accuracy general | ~7GB | 16GB+ |
| `deepseek-coder:33b` | Maximum accuracy | ~20GB | 32GB+ |

## ⚙️ Configuration

### Configuration Files

Global configuration is stored in:
- **macOS/Linux**: `~/.code-audit/config.json`
- **Windows**: `%USERPROFILE%\.code-audit\config.json`

Project-specific overrides can be placed in:
- `.code-audit.json` (project root)
- `.code-audit/config.json` (project directory)
- `package.json` (in `codeAudit` section)

### Key Configuration Options

```json
{
  "ollama": {
    "host": "http://localhost:11434",
    "timeout": 30000,
    "models": {
      "primary": "codellama:7b",
      "fallback": ["granite-code:8b"]
    }
  },
  "audit": {
    "rules": {
      "security": true,
      "completeness": true,
      "performance": true
    },
    "output": {
      "format": "json",
      "includeMetrics": true
    }
  },
  "server": {
    "port": 3000,
    "transport": "stdio"
  }
}
```

## 🔗 Integration with Claude Code

### MCP Configuration

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "code-audit",
      "args": ["start", "--stdio"],
      "env": {}
    }
  }
}
```

### Usage in Claude Code

Once configured, you can use the audit tools:

```
Analyze this code for security issues:
[paste your code]
```

The MCP server will automatically:
1. ✅ Detect the programming language
2. ✅ Select the appropriate AI model
3. ✅ Perform comprehensive analysis
4. ✅ Return structured results with suggestions

## 🚨 Troubleshooting

### Common Issues

#### Ollama Not Found
```bash
# Check if Ollama is installed
ollama --version

# Install Ollama from https://ollama.ai
# Then restart the setup
code-audit setup --force
```

#### Models Not Downloading
```bash
# Check disk space
df -h

# Check network connectivity
code-audit health --detailed

# Try pulling models manually
ollama pull codellama:7b
```

#### Permission Errors
```bash
# For global installation issues
sudo npm install -g code-audit-mcp

# For configuration access issues
chmod 755 ~/.code-audit/
```

#### Server Won't Start
```bash
# Check if already running
code-audit stop

# Check health status
code-audit health

# Check logs
code-audit start  # Run in foreground to see errors
```

### Debug Mode

Enable verbose output for troubleshooting:

```bash
export DEBUG=code-audit:*
code-audit health --detailed
```

### Getting Help

```bash
# General help
code-audit --help

# Command-specific help
code-audit start --help
code-audit models --help
```

## 🔧 Development & Testing

### Local Testing

```bash
# Full test suite
npm run full-test

# Quick local test
npm run test-local

# Verbose testing
npm run test-local-verbose
```

### Building from Source

```bash
# Clone and build
git clone <repository>
cd code-audit-mcp
npm install
npm run build

# Test locally before publishing
npm run pack-test
```

### Contributing

See our [Contributing Guidelines](CONTRIBUTING.md) for development setup and guidelines.

---

**Need more help?** Check our [GitHub Issues](https://github.com/warrengates/code-audit-mcp/issues) or start a [Discussion](https://github.com/warrengates/code-audit-mcp/discussions).