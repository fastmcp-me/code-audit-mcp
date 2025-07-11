# MCP Configuration Setup

## Overview

The `code-audit setup` command now includes automatic MCP (Model Context Protocol) configuration functionality. This feature configures Code Audit MCP as a server in Claude Desktop and Claude Code environments.

## Features

### Step 6: MCP Configuration

After completing the standard setup steps (system requirements, Ollama, configuration, models, and verification), the setup wizard now includes an optional Step 6 for MCP configuration.

### Command Options

New options have been added to the setup command:

- `--claude-desktop` - Configure Claude Desktop MCP server only
- `--claude-code` - Configure Claude Code global MCP server only
- `--project` - Configure Claude Code project MCP server only
- `--auto` - Auto-configure all available Claude environments

### Configuration Modes

1. **Interactive Mode** (default)
   - When no MCP options are provided, the setup wizard will interactively ask which environments to configure
   - Shows the status of each environment (already configured, newly configured, failed)
   - Only shows environments that are available on the system

2. **Auto Mode** (`--auto`)
   - Automatically configures all available Claude environments
   - Skips interactive prompts for configuration and models
   - Uses minimal model set (granite-code:8b) by default
   - Shows summary of configured, skipped, and failed environments

3. **Specific Environment Mode**
   - Use specific flags to configure only selected environments
   - Can combine multiple flags (e.g., `--claude-desktop --project`)
   - Skips interactive prompts when any MCP option is provided

### Configuration Locations

The MCP configurations are written to platform-specific locations:

- **Claude Desktop**:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`

- **Claude Code Global**: `~/.config/claude/mcp-settings.json`

- **Claude Code Project**: `.claude/mcp-settings.json` (in project root)

### Configuration Format

The MCP server configuration follows this format:

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

### Error Handling

- MCP configuration errors are handled gracefully and don't fail the entire setup
- If MCP configuration fails, the setup continues and shows appropriate success message
- Configuration backups are created before modifying existing files

### Success Messages

The success message adapts based on whether MCP was configured:

- With MCP: Mentions that MCP server configuration has been added and to restart Claude
- Without MCP: Shows standard success message with instructions to manually start the server

## Usage Examples

```bash
# Interactive setup with MCP configuration prompt
code-audit setup

# Auto-configure all available Claude environments
code-audit setup --auto

# Configure only Claude Desktop
code-audit setup --claude-desktop

# Configure both Claude Desktop and project
code-audit setup --claude-desktop --project

# Force reconfiguration of all environments
code-audit setup --auto --force

# Comprehensive setup with auto MCP configuration
code-audit setup --comprehensive --auto
```

## Implementation Details

### Key Components

1. **setupMCPServers Function**
   - Main function that handles MCP configuration
   - Detects available environments
   - Handles auto mode, specific options, or interactive selection
   - Returns boolean indicating if any configurations were successful

2. **Environment Detection**
   - Uses MCPConfigManager to detect available Claude environments
   - Checks if environments are already configured
   - Filters out unavailable environments for interactive mode

3. **Executable Resolution**
   - Automatically detects the code-audit executable path
   - Checks local development path first
   - Falls back to global installation paths
   - Supports common package managers (npm, yarn, pnpm, bun)

### Integration Points

- Integrated as Step 6 in the setup wizard
- Uses the existing MCPConfigManager from `utils/mcp-config.ts`
- Preserves all existing setup functionality
- Non-blocking - MCP configuration failures don't prevent setup completion

## Benefits

1. **Streamlined Setup**: Users can configure everything in one command
2. **Automatic Detection**: Detects available Claude environments automatically
3. **Flexible Options**: Supports interactive, automatic, and specific configuration modes
4. **Safe Operations**: Creates backups and handles errors gracefully
5. **Clear Feedback**: Shows status of each environment configuration
