# MCP Servers Configuration Reference

## Automated Setup (Recommended)

### During Initial Setup

```bash
# Run the setup wizard with MCP configuration
code-audit setup

# Or configure all Claude environments automatically
code-audit setup --auto
```

### After Installation

```bash
# Show MCP configuration status
code-audit mcp status

# Configure MCP servers interactively
code-audit mcp configure

# Configure specific environment
code-audit mcp configure --environment desktop
code-audit mcp configure --environment code-global
code-audit mcp configure --environment project
```

### Quick Restore Script

```bash
# After Claude reset, run the restore script:
./scripts/setup-mcp-claude.sh

# Or if installed globally:
/path/to/code-audit-mcp/scripts/setup-mcp-claude.sh
```

## Manual Configuration (Fallback)

### Current MCP Servers

### 1. code-audit (Local)

```json
"code-audit": {
  "command": "/Users/warrengates/Documents/code/code-audit-mcp/bin/code-audit.js",
  "args": ["start", "--stdio"],
  "env": {}
}
```

### 2. sequential-thinking

```json
"sequential-thinking": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
}
```

### 3. kb-mcp (Knowledge Base)

```json
"kb-mcp": {
  "command": "npx",
  "args": ["kb", "serve"]
}
```

## Configuration File Locations

### Claude Desktop

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Claude Code

- **Global**: `~/.config/claude/mcp-settings.json`
- **Project**: `.claude/mcp-settings.json` or `.mcp.json`

## Troubleshooting

### If MCP servers don't appear:

1. Ensure Claude Desktop/Code is completely closed
2. Run `code-audit mcp status` to check configuration
3. Run `code-audit mcp configure` to reconfigure
4. Start Claude fresh

### To verify configuration:

```bash
# Check status
code-audit mcp status

# Manual verification for Claude Desktop (macOS)
cat "$HOME/Library/Application Support/Claude/claude_desktop_config.json" | jq .

# Manual verification for Claude Code
cat "$HOME/.config/claude/mcp-settings.json" | jq .
```

### To backup/restore configuration:

```bash
# Backup all MCP configurations
code-audit mcp backup

# Restore from backup
code-audit mcp restore --restore mcp-backup-2024-01-01.json
```

## MCP Command Reference

### Available Commands

- `code-audit mcp status` - Show current configuration status
- `code-audit mcp configure` - Configure MCP servers
- `code-audit mcp remove` - Remove MCP server configuration
- `code-audit mcp backup` - Backup current configurations
- `code-audit mcp restore` - Restore from backup

### Command Options

- `--environment <env>` - Target specific environment (desktop, code-global, project)
- `--force` - Skip confirmation prompts
- `--restore <file>` - Specify backup file for restore

## Adding New MCP Servers Manually

Edit the appropriate configuration file and add your new server to the mcpServers object:

```json
"your-server-name": {
  "command": "path/to/command",
  "args": ["arg1", "arg2"],
  "env": {
    "ENV_VAR": "value"
  }
}
```
