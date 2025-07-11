# Setup and Start Command Critical Fixes Plan

**Date:** 2025-07-11  
**Priority:** CRITICAL  
**Status:** PLANNING  
**Assigned:** MEMU

## Executive Summary

Critical analysis reveals that both `code-audit setup` and `code-audit start` commands have fundamental issues causing hangs and logic failures. The setup command appears to hang during model installation due to lack of progress feedback and insufficient timeouts, while the start command breaks due to missing build artifacts, race conditions, and inadequate error handling.

## Critical Issues Identified

### 🚨 Setup Command Issues

#### **Issue 1: Model Installation Hanging (HIGH PRIORITY)**

- **Problem**: `pullModel` function ignores progress data from Ollama streaming response
- **Symptom**: Users see static "Downloading model..." for 10-30 minutes with no feedback
- **Root Cause**: Progress JSON parsing is commented out with "TODO"
- **Impact**: Users think process is frozen and kill it

#### **Issue 2: Insufficient Timeout (HIGH PRIORITY)**

- **Problem**: 5-minute timeout for model downloads is too short for large models (7-20GB)
- **Symptom**: Downloads fail silently after 5 minutes, appearing as hang
- **Root Cause**: Hardcoded `AbortSignal.timeout(300000)` in `pullModel`
- **Impact**: Large models cannot be installed via setup

#### **Issue 3: Poor Error Handling (MEDIUM PRIORITY)**

- **Problem**: Error details are swallowed in catch blocks
- **Symptom**: Generic error messages with no actionable information
- **Root Cause**: Catch blocks don't preserve or display error details
- **Impact**: Users cannot troubleshoot failures

### 🚨 Start Command Issues

#### **Issue 4: Missing Build Artifacts (CRITICAL)**

- **Problem**: Server tries to start `dist/server/index.js` without checking existence
- **Symptom**: "Module not found" error on first run
- **Root Cause**: No build verification before server spawn
- **Impact**: Command fails immediately if project not built

#### **Issue 5: PID Directory Missing (CRITICAL)**

- **Problem**: PID file written to `~/.code-audit/` without ensuring directory exists
- **Symptom**: ENOENT errors when writing PID file
- **Root Cause**: No directory creation before file operations
- **Impact**: Server cannot track running state

#### **Issue 6: Race Conditions (HIGH PRIORITY)**

- **Problem**: Multiple processes can simultaneously check and start server
- **Symptom**: Duplicate server processes or startup conflicts
- **Root Cause**: No atomic process management
- **Impact**: Unstable server state, resource conflicts

## Implementation Plan

### Phase 1: Critical Fixes (Immediate - Day 1)

#### 1.1 Fix Setup Model Installation Progress

**File**: `src/cli/utils/ollama.ts` (lines 109-142)

```typescript
// Replace existing pullModel implementation
export async function pullModel(modelName: string): Promise<void> {
  const ollama_client = get_ollama_client();

  try {
    const response = await fetch(`${ollama_client.host}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
      // Remove timeout for downloads - let them complete naturally
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available');
    }

    let downloaded = 0;
    let total = 0;
    let lastProgress = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const progress = JSON.parse(line);

          if (progress.total && progress.completed) {
            total = progress.total;
            downloaded = progress.completed;
            const percent = ((downloaded / total) * 100).toFixed(1);
            const mb_downloaded = (downloaded / 1024 / 1024).toFixed(1);
            const mb_total = (total / 1024 / 1024).toFixed(1);

            const progress_text = `${percent}% (${mb_downloaded}MB / ${mb_total}MB)`;
            if (progress_text !== lastProgress) {
              process.stdout.write(
                `\rDownloading ${modelName}: ${progress_text}`
              );
              lastProgress = progress_text;
            }
          }

          if (progress.status === 'success') {
            process.stdout.write(
              `\rDownloaded ${modelName}: Complete!                    \n`
            );
            return;
          }

          if (progress.error) {
            throw new Error(progress.error);
          }
        } catch (parseError) {
          // Ignore non-JSON lines
        }
      }
    }
  } catch (error) {
    process.stdout.write('\n'); // Clean up progress line
    throw error;
  }
}
```

#### 1.2 Fix Start Command Build Verification

**File**: `src/cli/commands/start.ts` (before server spawn)

```typescript
async function verify_build_artifacts(): Promise<void> {
  const server_path = join(__dirname, '../../server/index.js');

  if (!existsSync(server_path)) {
    console.log(chalk.yellow('🔨 Server not built. Building now...'));
    const spinner = ora('Building server...').start();

    try {
      await execa('npm', ['run', 'build'], {
        cwd: join(__dirname, '../../../'),
        stdio: 'pipe',
      });
      spinner.succeed('Server built successfully');
    } catch (error) {
      spinner.fail('Build failed');
      throw new Error(
        `Build failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
```

#### 1.3 Fix PID Directory Creation

**File**: `src/cli/commands/start.ts` (before PID operations)

```typescript
function ensure_pid_directory(): void {
  const pid_file = get_pid_file_path();
  const pid_dir = dirname(pid_file);

  if (!existsSync(pid_dir)) {
    mkdirSync(pid_dir, { recursive: true });
  }
}
```

### Phase 2: Enhanced Error Handling (Day 2)

#### 2.1 Improve Setup Error Messages

**File**: `src/cli/commands/setup.ts`

```typescript
// Replace generic catch blocks with specific error handling
try {
  await pullModel(model);
  spinner.succeed(chalk.green(`Downloaded ${model}`));
} catch (error) {
  spinner.fail(chalk.red(`Failed to download ${model}`));

  const error_message = error instanceof Error ? error.message : String(error);
  console.error(chalk.red(`Error details: ${error_message}`));

  // Provide actionable troubleshooting
  console.log(chalk.yellow('\n💡 Troubleshooting tips:'));
  console.log(chalk.dim('  • Check internet connection'));
  console.log(chalk.dim('  • Verify Ollama is running: ollama list'));
  console.log(chalk.dim('  • Try manual install: ollama pull ' + model));
  console.log(chalk.dim('  • Check available disk space'));

  throw error; // Re-throw to stop setup process
}
```

#### 2.2 Add Start Command Atomic Process Management

**File**: `src/cli/commands/start.ts`

```typescript
async function start_server_atomic(options: StartOptions): Promise<void> {
  const lock_file = join(get_config_dir(), 'startup.lock');

  // Attempt to acquire startup lock
  try {
    if (existsSync(lock_file)) {
      const lock_content = readFileSync(lock_file, 'utf8');
      const lock_time = parseInt(lock_content);

      // If lock is older than 30 seconds, assume stale
      if (Date.now() - lock_time < 30000) {
        throw new Error('Another startup process is already running');
      }
    }

    // Acquire lock
    writeFileSync(lock_file, String(Date.now()));

    try {
      await start_server_internal(options);
    } finally {
      // Always release lock
      if (existsSync(lock_file)) {
        unlinkSync(lock_file);
      }
    }
  } catch (error) {
    console.error(
      chalk.red('Startup failed:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
```

### Phase 3: Enhanced User Experience (Day 3)

#### 3.1 Add Setup Pre-flight Checks

**File**: `src/cli/commands/setup.ts`

```typescript
async function verify_system_readiness(): Promise<void> {
  const checks = [
    {
      name: 'Disk Space',
      check: async () => {
        const stats = statSync(process.cwd());
        // Implement disk space check
        return { success: true, details: 'Sufficient space available' };
      },
    },
    {
      name: 'Ollama Connection',
      check: async () => {
        try {
          await checkOllamaHealth();
          return { success: true, details: 'Connected successfully' };
        } catch (error) {
          return {
            success: false,
            details:
              error instanceof Error ? error.message : 'Connection failed',
          };
        }
      },
    },
    {
      name: 'Network Connectivity',
      check: async () => {
        try {
          await fetch('https://registry.ollama.ai', {
            signal: AbortSignal.timeout(5000),
          });
          return { success: true, details: 'Internet connection available' };
        } catch {
          return { success: false, details: 'Cannot reach Ollama registry' };
        }
      },
    },
  ];

  console.log(chalk.blue('\n🔍 Running pre-flight checks...'));

  for (const check of checks) {
    const spinner = ora(`Checking ${check.name}...`).start();
    const result = await check.check();

    if (result.success) {
      spinner.succeed(`${check.name}: ${result.details}`);
    } else {
      spinner.fail(`${check.name}: ${result.details}`);
      throw new Error(`Pre-flight check failed: ${check.name}`);
    }
  }
}
```

#### 3.2 Add Start Command Health Verification

**File**: `src/cli/commands/start.ts`

```typescript
async function verify_server_startup(port: number): Promise<void> {
  const spinner = ora('Verifying server startup...').start();
  const max_attempts = 10;
  const delay = 1000;

  for (let attempt = 1; attempt <= max_attempts; attempt++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`, {
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        spinner.succeed('Server started successfully');
        return;
      }
    } catch {
      // Server not ready yet
    }

    if (attempt < max_attempts) {
      spinner.text = `Waiting for server... (${attempt}/${max_attempts})`;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  spinner.fail('Server failed to start properly');
  throw new Error('Server health check failed');
}
```

## Testing Strategy

### Automated Tests Required

1. **Setup Command Tests**
   - Mock Ollama responses with progress data
   - Test timeout handling with large model simulation
   - Test error scenarios (network failures, disk full)
   - Test user interruption handling

2. **Start Command Tests**
   - Test missing build artifacts scenario
   - Test missing PID directory scenario
   - Test concurrent startup attempts
   - Test server health verification

3. **Integration Tests**
   - End-to-end setup flow with real Ollama instance
   - Server startup and shutdown cycles
   - Error recovery scenarios

### Manual Testing Checklist

- [ ] Fresh installation on clean system
- [ ] Setup with interrupted network connection
- [ ] Setup with insufficient disk space
- [ ] Start command without prior build
- [ ] Multiple concurrent start attempts
- [ ] Server health endpoint verification

## Implementation Timeline

### Day 1 (Immediate Critical Fixes)

- [ ] Implement progress tracking in `pullModel`
- [ ] Add build verification to start command
- [ ] Fix PID directory creation
- [ ] Test basic functionality

### Day 2 (Error Handling Enhancement)

- [ ] Improve error messages and troubleshooting
- [ ] Implement atomic process management
- [ ] Add retry logic for network operations
- [ ] Test error scenarios

### Day 3 (User Experience Polish)

- [ ] Add pre-flight checks to setup
- [ ] Implement server health verification
- [ ] Add graceful cancellation handling
- [ ] Performance testing and optimization

## Risk Assessment

### High Risk Items

1. **Model Download Timeouts** - Large models may still fail on slow connections
2. **Platform Compatibility** - Process management differences across OS
3. **Ollama Version Compatibility** - API changes in newer Ollama versions

### Mitigation Strategies

1. Implement adaptive timeouts based on model size
2. Create platform-specific process management abstractions
3. Add Ollama version detection and compatibility checks

## Success Criteria

### Setup Command

- ✅ Models install with real-time progress feedback
- ✅ Large models (>5GB) install successfully
- ✅ Clear error messages with actionable troubleshooting
- ✅ Graceful handling of user interruption

### Start Command

- ✅ Automatic build verification and trigger
- ✅ Reliable PID file management
- ✅ No race conditions in concurrent startups
- ✅ Health verification of started server

### Overall

- ✅ Zero hanging scenarios
- ✅ Clear user feedback at all stages
- ✅ Robust error recovery
- ✅ Cross-platform compatibility

---

**Next Actions:**

1. Begin Phase 1 implementation immediately
2. Create unit tests for critical functions
3. Set up integration testing environment
4. Schedule testing with different Ollama versions
