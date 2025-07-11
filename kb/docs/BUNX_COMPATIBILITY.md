# Bunx Compatibility Guide

## The Issue

When using `bunx` to run the MCP server, it outputs dependency resolution messages to stderr which can interfere with the MCP stdio protocol, causing connection errors.

## Solution

We've created a special wrapper script that filters out these package manager messages. When using bunx or npx, use the `code-audit-mcp` command instead of the regular CLI.

## Configuration

### For bunx users:

```json
{
  "code-audit": {
    "command": "bunx",
    "args": ["@moikas/code-audit-mcp", "code-audit-mcp"],
    "env": {}
  }
}
```

### For npx users:

```json
{
  "code-audit": {
    "command": "npx",
    "args": ["@moikas/code-audit-mcp", "code-audit-mcp"],
    "env": {}
  }
}
```

### Alternative: Direct execution after global install

If you prefer to install globally:

```bash
npm install -g @moikas/code-audit-mcp
```

Then configure:

```json
{
  "code-audit": {
    "command": "code-audit",
    "args": ["start", "--stdio"],
    "env": {}
  }
}
```

## How It Works

The `code-audit-mcp` wrapper:

1. Filters out package manager stderr output
2. Preserves the MCP JSON-RPC communication on stdout
3. Sets the appropriate environment variables
4. Ensures clean communication with Claude

## Troubleshooting

If you still experience issues:

1. **Check Ollama is running**: The server requires Ollama to be available
2. **Enable debug mode**: Set `DEBUG_MCP=true` environment variable
3. **Test manually**: Run `bunx @moikas/code-audit-mcp code-audit-mcp` in terminal to see any errors

## Technical Details

The wrapper filters these common package manager messages:

- "Resolving dependencies"
- "Resolved X packages"
- "Installing dependencies"
- "packages are looking for funding"
- And other npm/bunx/npx status messages

This ensures only valid JSON-RPC messages reach the MCP client.
