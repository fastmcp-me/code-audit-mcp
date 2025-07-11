# Release v1.0.5

**Date:** 2025-07-11  
**Type:** Patch Release

## What's Fixed

### 🐛 Bug Fixes

- **Fixed npx execution**: Resolved path resolution issues when running with `npx @moikas/code-audit-mcp`
- **Improved path detection**: Smart path resolution now tries multiple paths to handle different execution contexts:
  - Global npm/bun installations
  - npx/bunx execution
  - Local development
- **Better error messages**: When path resolution fails, now shows all attempted paths for easier debugging

### 📚 Documentation

- Added comprehensive MCP configuration guide for all installation methods
- Created Bun-specific configuration documentation
- Documented wrapper script approach for Bun users

## Installation

```bash
# npm
npm install -g @moikas/code-audit-mcp@1.0.5

# Bun
bun install -g @moikas/code-audit-mcp@1.0.5

# npx (no installation)
npx @moikas/code-audit-mcp start --stdio
```

## MCP Configuration Examples

### Using npx

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

### Using global install

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

## Testing

You can test the server with:

```bash
npx @moikas/code-audit-mcp start --stdio <<< '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"0.1.0","capabilities":{"tools":{},"prompts":{},"resources":{}},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

This patch release ensures the MCP server works correctly regardless of how it's installed or executed.
