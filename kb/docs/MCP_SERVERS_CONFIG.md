# MCP Servers Configuration Reference

## Quick Restore Command

```bash
# After Claude Code reset, run:
/Users/warrengates/Documents/code/code-audit-mcp/scripts/setup-mcp-claude.sh
```

## Current MCP Servers

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

## Configuration File Location

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Troubleshooting

### If MCP servers don't appear:

1. Ensure Claude Code is completely closed
2. Run the restore script
3. Start Claude Code fresh

### To verify configuration:

```bash
cat "$HOME/Library/Application Support/Claude/claude_desktop_config.json" | jq .
```

### To backup configuration:

```bash
cp "$HOME/Library/Application Support/Claude/claude_desktop_config.json" \
   "$HOME/Documents/claude-mcp-backup.json"
```

## Adding New MCP Servers

Edit the restore script and add your new server to the mcpServers object:

```json
"your-server-name": {
  "command": "path/to/command",
  "args": ["arg1", "arg2"],
  "env": {
    "ENV_VAR": "value"
  }
}
```
