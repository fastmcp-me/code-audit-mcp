# MCP Configuration Options

**Date:** 2025-07-11  
**Updated:** After fixing path resolution in v1.0.4

## Overview

There are multiple ways to configure the Code Audit MCP server in Claude Desktop/Code, depending on how you installed the package.

## Installation Methods & Configurations

### 1. Global Install with npm

```bash
npm install -g @moikas/code-audit-mcp
```

**MCP Configuration:**

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

### 2. Global Install with Bun

```bash
bun install -g @moikas/code-audit-mcp
```

**Option A - Using Wrapper Script:**

1. Create wrapper at `~/.config/claude/code-audit-wrapper.sh`:

```bash
#!/bin/bash
exec /Users/[username]/.bun/bin/bun /Users/[username]/.bun/bin/code-audit "$@"
```

2. Make executable:

```bash
chmod +x ~/.config/claude/code-audit-wrapper.sh
```

3. MCP Configuration:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "/Users/[username]/.config/claude/code-audit-wrapper.sh",
      "args": ["start", "--stdio"],
      "env": {}
    }
  }
}
```

**Option B - Direct Bun Execution:**

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "/Users/[username]/.bun/bin/bun",
      "args": ["/Users/[username]/.bun/bin/code-audit", "start", "--stdio"],
      "env": {}
    }
  }
}
```

### 3. Using npx (No Installation)

This method doesn't require any installation and always uses the latest version:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "npx",
      "args": ["@moikas/code-audit-mcp", "start", "--stdio"],
      "env": {}
    }
  }
}
```

**Note:** First run will download the package, subsequent runs use cache.

### 4. Using bunx (No Installation)

Similar to npx but uses Bun:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "bunx",
      "args": ["@moikas/code-audit-mcp", "start", "--stdio"],
      "env": {}
    }
  }
}
```

### 5. Local Development

When developing locally:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "/path/to/project/bin/code-audit.js",
      "args": ["start", "--stdio"],
      "env": {}
    }
  }
}
```

## Troubleshooting

### Server Not Starting

1. **Check logs:** Look at Claude's developer console for errors
2. **Test manually:** Run the command in terminal to see output
3. **Verify paths:** Ensure all paths in configuration are correct
4. **Check permissions:** Ensure executable files have proper permissions

### Path Resolution Issues (Fixed in v1.0.4)

Earlier versions had issues with path resolution when using npx or certain installation methods. This has been fixed in v1.0.4 with smart path detection that tries multiple paths:

1. `../../server/index.js` (compiled dist structure)
2. `../../../src/server/index.js` (development structure)
3. `../server/index.js` (alternative structure)

### Testing Your Configuration

Test any configuration with:

```bash
[command] [args...] <<< '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"0.1.0","capabilities":{"tools":{},"prompts":{},"resources":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

Example:

```bash
npx @moikas/code-audit-mcp start --stdio <<< '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"0.1.0","capabilities":{"tools":{},"prompts":{},"resources":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

## Recommended Approach

- **For simplicity:** Use npm global install
- **For always latest:** Use npx
- **For Bun users:** Use the wrapper script approach
- **For development:** Use local path

## Configuration File Location

The MCP configuration file is located at:

- **macOS/Linux:** `~/.config/claude/mcp-settings.json`
- **Windows:** `%APPDATA%\claude\mcp-settings.json`

After updating the configuration, restart Claude Desktop or Claude Code to apply changes.
