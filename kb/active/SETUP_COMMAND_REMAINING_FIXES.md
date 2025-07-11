# Setup Command Remaining Fixes

**Date:** 2025-07-11  
**Priority:** HIGH  
**Status:** IN PROGRESS  
**Previous Issue:** SETUP_START_COMMAND_FIXES.md (partially implemented)

## Overview

This issue tracks the remaining unimplemented features from the comprehensive setup command fix plan. While progress tracking has been improved and timeouts extended, several critical user experience and reliability features are still missing.

## Implemented Features ✅

1. **Basic Progress Tracking** - `pullModel` now accepts progress callback
2. **Extended Timeout** - Increased from 5 minutes to 60 minutes for model downloads
3. **Start Command Fixes** - All critical start command issues resolved
4. **MCP Configuration** - Setup now automatically configures Claude Desktop and Claude Code (2025-07-11)
   - Added Step 6 for MCP server configuration
   - Supports auto mode (`--auto`) to configure all environments
   - Individual environment options (`--claude-desktop`, `--claude-code`, `--project`)
   - Interactive selection when no options provided
   - Graceful error handling for MCP configuration failures
5. **Enhanced Progress Display** - IMPLEMENTED (2025-07-11 v1.0.3)
   - Progress now shows MB downloaded/total
   - Proper line clearing on completion
   - Progress updates throttled to 500ms intervals
6. **Pre-flight System Checks** - IMPLEMENTED (2025-07-11 v1.0.3)
   - Disk space verification (10GB minimal, 20GB recommended, 50GB comprehensive)
   - Network connectivity check to Ollama registry
   - System memory check with model recommendations
   - Early Ollama service health verification
   - Can bypass with `--force` option if needed

## Remaining Features to Implement

### 1. Enhanced Error Messages (Priority: MEDIUM)

**Current State:** Generic error messages without troubleshooting guidance

**Required Implementation:**

```typescript
catch (error) {
  spinner.fail(chalk.red(`Failed to download ${model}`));

  console.error(chalk.red(`Error details: ${error.message}`));
  console.log(chalk.yellow('\n💡 Troubleshooting tips:'));
  console.log(chalk.dim('  • Check internet connection'));
  console.log(chalk.dim('  • Verify Ollama is running: ollama list'));
  console.log(chalk.dim('  • Try manual install: ollama pull ' + model));
  console.log(chalk.dim('  • Check available disk space'));
}
```

### 2. Atomic Process Management (Priority: MEDIUM)

**Current State:** No protection against concurrent setup/start processes

**Required Implementation:**

- Lock file mechanism for setup process
- Stale lock detection and cleanup
- Clear messaging when another process is running

**Location:** Create utility function in `src/cli/utils/process-lock.ts`

### 3. Server Health Verification (Priority: LOW)

**Current State:** Server starts but no health check verification

**Required Implementation:**

- Post-startup health endpoint check
- Retry logic with backoff
- Clear success/failure indication

**Location:** `src/cli/commands/start.ts` - add `verify_server_startup()` function

## Implementation Checklist

- [x] Add MCP configuration to setup wizard
- [x] Enhance progress display with MB info and proper formatting
- [x] Add pre-flight system checks before setup
- [ ] Implement detailed error messages with troubleshooting
- [ ] Create atomic process lock mechanism
- [ ] Add server health verification after startup
- [ ] Update tests for new functionality
- [ ] Update documentation

## Test Cases

1. **MCP Configuration** ✅
   - Auto mode configures all available environments
   - Individual environment options work correctly
   - Interactive mode prompts for selection
   - Errors are handled gracefully

2. **Progress Display** ✅
   - Shows MB downloaded/total correctly
   - Line clearing on completion works
   - Progress throttling prevents console spam

3. **System Checks** ✅
   - Warns on insufficient disk space
   - Detects no internet connection
   - Shows memory recommendations
   - Can bypass with --force option

4. **Error Handling**
   - Test each error scenario shows proper tips
   - Verify error details are preserved
   - Test recovery suggestions work

5. **Process Locking**
   - Test concurrent setup attempts
   - Test stale lock cleanup
   - Test lock release on error

## Success Criteria

- Users see real-time download progress in MB ✅
- Setup fails fast with clear messages when prerequisites aren't met ✅
- Concurrent process attempts are handled gracefully
- All error messages include actionable troubleshooting steps
- Server health is verified before reporting success
- MCP configuration is seamless and automatic ✅

## References

- Original plan: kb/active/SETUP_START_COMMAND_FIXES.md
- Partial implementation: src/cli/utils/ollama.ts (pullModel)
- Setup command: src/cli/commands/setup.ts
- MCP configuration: src/cli/utils/mcp-config.ts
- MCP setup documentation: kb/docs/MCP_CONFIGURATION_SETUP.md
