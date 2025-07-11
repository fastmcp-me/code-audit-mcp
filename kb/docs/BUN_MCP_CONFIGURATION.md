# Bun MCP Configuration Guide

**Date:** 2025-07-11  
**Issue:** MCP server doesn't work when installed with Bun

## Problem

When installing code-audit-mcp with Bun (`bun install -g @moikas/code-audit-mcp`), the MCP server fails to start in Claude Desktop/Code because:

1. The executable is a Node.js script with `#!/usr/bin/env node` shebang
2. Claude doesn't know to use Bun to execute it
3. Path resolution issues in the compiled code

## Solution

### Option 1: Use Wrapper Script (Recommended)

1. Create a wrapper script at `~/.config/claude/code-audit-wrapper.sh`:

```bash
#!/bin/bash
# Wrapper script for Code Audit MCP Server
exec /Users/warrengates/.bun/bin/bun /Users/warrengates/.bun/bin/code-audit "$@"
```

2. Make it executable:

```bash
chmod +x ~/.config/claude/code-audit-wrapper.sh
```

3. Update MCP configuration in `~/.config/claude/mcp-settings.json`:

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "/Users/warrengates/.config/claude/code-audit-wrapper.sh",
      "args": ["start", "--stdio"],
      "env": {}
    }
  }
}
```

### Option 2: Use bunx directly

```json
{
  "mcpServers": {
    "code-audit": {
      "command": "/Users/warrengates/.bun/bin/bunx",
      "args": ["@moikas/code-audit-mcp", "start", "--stdio"],
      "env": {}
    }
  }
}
```

### Option 3: Install with npm instead

```bash
npm install -g @moikas/code-audit-mcp
```

Then use standard configuration:

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

## Fixed Issues

### Path Resolution Bug (Fixed in v1.0.4)

The server path was incorrectly resolved as:

```javascript
// Before (broken):
const serverPath = join(__dirname, '../../../src/server/index.js');

// After (fixed):
const serverPath = join(__dirname, '../../server/index.js');
```

This caused the error:

```
Error: Cannot find module '/path/to/dist/dist/server/index.js'
```

## Testing

Test the MCP server with:

```bash
bunx @moikas/code-audit-mcp start --stdio <<< '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"0.1.0","capabilities":{"tools":{},"prompts":{},"resources":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

## Restart Claude

After updating the MCP configuration, restart Claude Desktop or Claude Code to load the new configuration.
