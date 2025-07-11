# Claude Code Integration Guide

This guide explains how to integrate code-audit-mcp with Claude Code, focusing on the differences between global and project-level configurations.

## Overview

Claude Code supports MCP servers at two levels:

1. **Global Configuration**: Available across all projects
2. **Project Configuration**: Specific to a single project/repository

## Quick Setup

### Option 1: During Initial Setup

```bash
# Install code-audit globally
npm install -g @moikas/code-audit-mcp

# Run setup with auto-configuration
code-audit setup --auto
```

### Option 2: Using the MCP Command

```bash
# Configure for Claude Code (global)
code-audit mcp configure --environment code-global

# Configure for current project
code-audit mcp configure --environment project
```

### Option 3: Using Claude Code's Built-in Command

```bash
# Add MCP server using Claude's command
claude mcp add

# Select "stdio" server type
# Enter command: code-audit
# Enter args: start --stdio
```

## Configuration Locations

### Global Configuration

- **Location**: `~/.config/claude/mcp-settings.json`
- **Scope**: Available in all Claude Code projects
- **Best for**: Tools you want to use everywhere

### Project Configuration

- **Location**: `.claude/mcp-settings.json` or `.mcp.json`
- **Scope**: Only available in the specific project
- **Best for**: Project-specific tools or configurations
- **Version Control**: Can be committed to share with team

## Configuration File Format

Both configuration files use the same format:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "/path/to/code-audit",
      "args": ["start", "--stdio"],
      "env": {}
    }
  }
}
```

## Project-Level Setup

### Creating Project Configuration

1. **Automatic Method**:

   ```bash
   # In your project directory
   code-audit mcp configure --environment project
   ```

2. **Manual Method**:

   ```bash
   # Create .claude directory
   mkdir -p .claude

   # Create configuration
   cat > .claude/mcp-settings.json << EOF
   {
     "mcpServers": {
       "code-audit": {
         "command": "code-audit",
         "args": ["start", "--stdio"],
         "env": {}
       }
     }
   }
   EOF
   ```

### Sharing with Team

Add `.claude/mcp-settings.json` to your repository:

```bash
git add .claude/mcp-settings.json
git commit -m "Add code-audit MCP configuration for team"
```

Team members will automatically have access to code-audit when they open the project in Claude Code.

## Environment Variables

You can pass environment variables to the MCP server:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "code-audit",
      "args": ["start", "--stdio"],
      "env": {
        "OLLAMA_HOST": "http://localhost:11434",
        "AUDIT_LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Troubleshooting

### MCP Server Not Available

1. **Check Configuration**:

   ```bash
   # Verify configuration exists
   code-audit mcp status
   ```

2. **Restart Claude Code**:
   - Configuration changes require a restart
   - Fully quit and reopen Claude Code

3. **Check Executable Path**:
   ```bash
   # Verify code-audit is in PATH
   which code-audit
   ```

### Project vs Global Conflicts

- Project configuration takes precedence over global
- To disable globally configured server in a project:
  ```json
  {
    "mcpServers": {
      "code-audit": null
    }
  }
  ```

### Debug Mode

Enable debug logging to troubleshoot issues:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "code-audit",
      "args": ["start", "--stdio", "--verbose"],
      "env": {
        "DEBUG": "code-audit:*"
      }
    }
  }
}
```

## Best Practices

1. **Global vs Project**:
   - Use global for personal development tools
   - Use project for team-shared configurations

2. **Version Control**:
   - Commit `.claude/mcp-settings.json` for team projects
   - Add to `.gitignore` for personal configurations

3. **Security**:
   - Never commit sensitive environment variables
   - Use `.env` files and reference them in documentation

4. **Documentation**:
   - Document required MCP servers in your README
   - Include setup instructions for new team members

## Advanced Configuration

### Multiple Configurations

You can have different configurations for different scenarios:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "code-audit",
      "args": ["start", "--stdio"],
      "env": {}
    },
    "code-audit-dev": {
      "command": "/path/to/development/code-audit",
      "args": ["start", "--stdio", "--verbose"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Conditional Loading

Use environment variables to conditionally load servers:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "${CODE_AUDIT_PATH:-code-audit}",
      "args": ["start", "--stdio"],
      "env": {}
    }
  }
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Verify MCP Configuration
  run: |
    # Check if MCP config exists
    test -f .claude/mcp-settings.json || exit 1

    # Validate JSON
    jq . .claude/mcp-settings.json > /dev/null

    # Verify code-audit is configured
    jq -e '.mcpServers["code-audit"]' .claude/mcp-settings.json
```

## Migration from Claude Desktop

If migrating from Claude Desktop to Claude Code:

```bash
# Backup existing configuration
code-audit mcp backup

# Configure Claude Code
code-audit mcp configure --environment code-global

# Or restore from backup
code-audit mcp restore --restore mcp-backup-*.json
```

## Related Documentation

- [MCP Servers Configuration Reference](./MCP_SERVERS_CONFIG.md)
- [Code Audit MCP Documentation](../README.md)
- [Claude Code Official Docs](https://docs.anthropic.com/en/docs/claude-code)
