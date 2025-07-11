# Audit-Based Implementation Plan for Setup/Start Fixes

**Date:** 2025-07-11  
**Based On:** Completeness and Security Audit Results  
**Priority:** CRITICAL  
**Status:** READY FOR IMPLEMENTATION

## Audit Summary

Using our codebase's own auditing tools, we've identified specific code patterns that contribute to the hanging and breaking issues in the setup and start commands. This plan prioritizes fixes based on audit severity levels.

## Critical Issues From Audit

### 🔴 High Priority (Audit Score: CRITICAL)

#### Issue 1: Daemon Spawn Failures (start.ts:105-109)

**Audit Finding**: No error handling for child process spawn in daemon mode
**Code Location**: `src/cli/commands/start.ts:105-109`
**Impact**: Silent failures when server cannot start

```typescript
// Current problematic code:
const child = spawn('node', [serverPath], {
  detached: true,
  stdio: 'ignore', // This hides all errors!
});
```

**Fix Required**:

```typescript
const child = spawn('node', [serverPath], {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'], // Capture stderr
});

child.stderr?.on('data', (data) => {
  const errorLog = join(get_config_dir(), 'server-error.log');
  appendFileSync(errorLog, data.toString());
});

child.on('error', (error) => {
  console.error(chalk.red('Failed to start server:'), error.message);
  process.exit(1);
});
```

#### Issue 2: Server Path Validation Missing (start.ts:99)

**Audit Finding**: File existence not verified before spawn
**Code Location**: `src/cli/commands/start.ts:99`
**Impact**: Process fails with confusing error messages

```typescript
// Add before spawn:
if (!existsSync(serverPath)) {
  throw new Error(
    `Server file not found: ${serverPath}. Run 'npm run build' first.`
  );
}
```

#### Issue 3: Empty Catch Blocks (3 instances detected)

**Audit Finding**: Errors are silently swallowed
**Locations**: setup.ts:multiple, start.ts:multiple
**Impact**: Users get no feedback when operations fail

### 🟡 Medium Priority (Audit Score: MEDIUM)

#### Issue 4: System Memory Check Inadequate

**Audit Finding**: Only checks Node.js heap, not actual system resources
**Code Location**: `src/cli/commands/setup.ts:117-123`
**Current Code**:

```typescript
const memory = process.memoryUsage().heapTotal / 1024 / 1024; // MB
```

**Fix Required**:

```typescript
import { totalmem, freemem } from 'os';

function check_system_resources(): {
  memory: number;
  free: number;
  adequate: boolean;
} {
  const total_mb = totalmem() / 1024 / 1024;
  const free_mb = freemem() / 1024 / 1024;
  const adequate = free_mb > 2048; // Need at least 2GB free for model downloads

  return { memory: total_mb, free: free_mb, adequate };
}
```

#### Issue 5: Unused Options in Interface

**Audit Finding**: StartOptions has unused fields
**Code Location**: `src/cli/commands/start.ts:12-17`
**Impact**: Code confusion and potential bugs

### 🟢 Low Priority (Audit Score: LOW)

#### Issue 6: Hard-coded Timeouts

**Audit Finding**: Timeouts should be configurable
**Code Location**: Multiple files
**Fix**: Move to configuration system

## Implementation Plan Based on Audit Severity

### Phase 1: Critical Fixes (Audit Score: CRITICAL)

**Timeline**: Immediate (Day 1)

1. **Fix Daemon Error Handling**

   ```bash
   Priority: P0 - Blocking issue
   Files: src/cli/commands/start.ts
   Lines: 105-109, add error handlers
   Test: Manual daemon start with invalid server file
   ```

2. **Add Server Path Validation**

   ```bash
   Priority: P0 - Prevents confusing errors
   Files: src/cli/commands/start.ts
   Lines: 99, add existsSync check
   Test: Run start without build
   ```

3. **Replace Empty Catch Blocks**
   ```bash
   Priority: P0 - Silent failures
   Files: src/cli/commands/setup.ts, src/cli/commands/start.ts
   Pattern: catch { } -> catch (error) { /* handle */ }
   Test: Force errors in setup/start flows
   ```

### Phase 2: Medium Priority Fixes (Audit Score: MEDIUM)

**Timeline**: Day 2

1. **Improve System Resource Checking**

   ```bash
   Priority: P1 - Better user experience
   Files: src/cli/commands/setup.ts
   Action: Replace memory check with actual system check
   Test: Run setup on low-memory system
   ```

2. **Clean Up Unused Code**
   ```bash
   Priority: P1 - Code hygiene
   Files: src/cli/commands/start.ts
   Action: Remove unused StartOptions fields or implement them
   Test: Code review and TypeScript strict mode
   ```

### Phase 3: Polish and Enhancement (Audit Score: LOW)

**Timeline**: Day 3

1. **Make Timeouts Configurable**
2. **Add Comprehensive Input Validation**
3. **Implement Proper Logging**

## Specific Code Changes Required

### File: src/cli/commands/start.ts

```typescript
// Line 99 - Add validation:
export async function startCommand(options: StartOptions): Promise<void> {
  const serverPath = join(__dirname, '../../server/index.js');

  // NEW: Validate server exists
  if (!existsSync(serverPath)) {
    console.error(chalk.red('❌ Server not built'));
    console.log(chalk.yellow('💡 Run: npm run build'));
    process.exit(1);
  }

  // Continue with existing logic...
}

// Lines 105-109 - Fix daemon spawn:
if (options.daemon) {
  const child = spawn('node', [serverPath], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'], // Capture output
  });

  // NEW: Error handling
  if (!child.pid) {
    throw new Error('Failed to spawn server process');
  }

  child.stderr?.on('data', (data) => {
    const errorLog = join(get_config_dir(), 'server-error.log');
    appendFileSync(
      errorLog,
      `[${new Date().toISOString()}] ${data.toString()}`
    );
  });

  child.on('error', (error) => {
    console.error(chalk.red('Server startup failed:'), error.message);
    process.exit(1);
  });

  // Give process time to fail or succeed
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Check if process is still running
  try {
    process.kill(child.pid, 0);
    console.log(chalk.green(`✅ Server started (PID: ${child.pid})`));
  } catch {
    throw new Error('Server process died shortly after startup');
  }
}
```

### File: src/cli/commands/setup.ts

```typescript
// Replace all empty catch blocks:
try {
  await some_operation();
} catch (error) {
  console.error(
    chalk.red('Operation failed:'),
    error instanceof Error ? error.message : String(error)
  );

  // Provide specific troubleshooting based on error type
  if (error instanceof Error && error.message.includes('timeout')) {
    console.log(
      chalk.yellow(
        '💡 This may take longer than expected. Consider running manually.'
      )
    );
  }

  throw error; // Re-throw to stop process
}
```

## Testing Strategy

### Audit-Verified Test Cases

1. **Critical Path Testing** (Based on audit findings)
   - Start command with missing server file
   - Daemon mode with spawn failures
   - Setup with network timeouts
   - Model installation interruption

2. **Error Path Testing** (Based on empty catch blocks)
   - Force each caught error condition
   - Verify error messages are helpful
   - Ensure process exits cleanly

3. **Resource Testing** (Based on system checks)
   - Low memory scenarios
   - Low disk space scenarios
   - Network connectivity issues

## Success Criteria

### Audit Score Improvements

- Critical issues: 0 remaining
- Medium issues: <2 remaining
- Low issues: <5 remaining

### User Experience Metrics

- No more "hanging" reports
- Clear error messages for all failure modes
- Successful setup completion rate >95%
- Start command success rate >99%

## Monitoring and Validation

### Post-Implementation Audit

Run the same completeness auditor after fixes to verify:

- Empty catch blocks eliminated
- Error handling coverage improved
- Validation logic added where missing
- TODO/FIXME comments resolved

### User Testing Scenarios

1. Fresh system installation
2. Network interruption during setup
3. Insufficient system resources
4. Corrupted or missing build artifacts

---

**Implementation Ready**: All code changes specified with exact line numbers and test cases. Audit tools will be used to verify fix completion.
