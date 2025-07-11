# Start Command Server Path Error

**Date:** 2025-07-11  
**Priority:** CRITICAL  
**Status:** FIXED ✅  
**Component:** CLI - Start Command

## Issue Description

The start command was failing because it was looking for the server at the wrong path. The server file is located at `dist/src/server/index.js` but the start command was looking for it at `dist/server/index.js`.

## Error Details

```
Error: Cannot find module '/Users/warrengates/Documents/code/code-audit-mcp/dist/server/index.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1225:15)
    ...
  code: 'MODULE_NOT_FOUND'
```

## Root Cause

The TypeScript build output includes the `src` directory in the path:

- Expected path: `dist/server/index.js`
- Actual path: `dist/src/server/index.js`

This is because the TypeScript compiler includes the source directory structure in the output.

## Fix Applied

Updated `src/cli/commands/start.ts` line 211:

```typescript
// Before:
const serverPath = join(__dirname, '../../server/index.js');

// After:
const serverPath = join(__dirname, '../../../src/server/index.js');
```

## Build Output Structure

```
dist/
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   └── utils/
│   └── server/
│       ├── index.js  <-- Actual server location
│       ├── auditors/
│       ├── ollama/
│       └── utils/
└── bin/
    └── code-audit.js
```

## Testing

```bash
# Rebuild the project
npm run build

# Start the server
./bin/code-audit.js start

# Expected: Server starts successfully
```

## Impact

- **Critical**: Server could not start at all
- **Affects**: All users trying to use the MCP server
- **Fixed**: Path has been corrected and tested

## Prevention

Consider updating the TypeScript configuration to output files without the `src` directory, or update all relative paths to account for the build structure.
