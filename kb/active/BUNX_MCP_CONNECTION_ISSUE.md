# Bunx MCP Connection Issue

## Problem

When running `bunx @moikas/code-audit-mcp start --stdio`, users experience "Connection failed: McpError: MCP error -32000: Connection closed" errors.

## Root Cause

1. **bunx stderr output**: When bunx runs a package, it outputs dependency resolution messages to stderr:

   ```
   Resolving dependencies
   Resolved, downloaded and extracted [N]
   Saved lockfile
   ```

2. **MCP protocol corruption**: These stderr messages can interfere with the MCP protocol when Claude Code is expecting clean stdio communication.

3. **Unhandled promise rejections**: The server had unhandled promise rejections that could cause immediate exit in some environments.

## Solutions Implemented

### 1. Better Error Handling in Server

Added unhandled rejection handlers in `src/server/index.ts`:

```typescript
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in stdio mode to allow proper error reporting
  if (process.env.MCP_STDIO_MODE !== 'true') {
    process.exit(1);
  }
});
```

### 2. Improved Logger for MCP Mode

Updated `src/server/utils/mcp-logger.ts` to:

- Suppress all console output in MCP stdio mode by default
- Write errors to stderr (which is safe for MCP protocol)
- Add DEBUG_MCP environment variable for debugging

### 3. Non-blocking Ollama Initialization

Modified server to not fail if Ollama is unavailable during startup:

- Ollama connection happens asynchronously
- Server continues running even if Ollama is offline
- Connection retried on-demand when needed

### 4. Bunx Wrapper Script (Optional)

Created `bin/code-audit-bunx-wrapper.js` that filters bunx messages from stderr.

## Workarounds for Users

### Option 1: Install Globally

```bash
npm install -g @moikas/code-audit-mcp
# Then use directly without bunx
code-audit start --stdio
```

### Option 2: Use npx Instead

```bash
npx @moikas/code-audit-mcp start --stdio
```

### Option 3: Configure Claude with Direct Path

After global install, find the path:

```bash
which code-audit
```

Then use that path in Claude Code configuration instead of bunx.

## Testing

The server now works correctly with bunx:

1. Responds to MCP initialize requests
2. Lists tools correctly
3. Handles Ollama connection failures gracefully

## Status

RESOLVED - The fixes have been implemented and tested. The package version 1.0.6 includes these fixes.
