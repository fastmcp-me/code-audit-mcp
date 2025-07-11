# Setup Command Model Installation Hanging Analysis

**Date:** 2025-07-11  
**Analyzed By:** MEMU  
**Component:** src/cli/commands/setup.ts - Model Installation Logic

## Executive Summary

The setup command has several critical issues in its model installation logic that can cause hanging, poor user experience, and silent failures. The primary issues are inadequate timeout handling, lack of progress feedback, and insufficient error recovery mechanisms.

## Critical Issues Identified

### 1. **Inadequate Timeout for Model Downloads**

**Location:** `src/cli/utils/ollama.ts:119`

```typescript
signal: AbortSignal.timeout(300000), // 5 minutes for model pull
```

**Problems:**

- 5-minute timeout is too short for large models (some are 7-20GB)
- No dynamic timeout based on model size
- No retry mechanism on timeout
- Timeout error not properly communicated to user

**Impact:** Downloads of large models will fail silently after 5 minutes, appearing to "hang"

### 2. **No Real Progress Tracking**

**Location:** `src/cli/utils/ollama.ts:126-136`

```typescript
// Handle streaming response for progress updates
const reader = response.body?.getReader();
if (reader) {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Parse and handle progress updates here if needed
    new TextDecoder().decode(value);
  }
}
```

**Problems:**

- Progress data is read but **completely ignored**
- No parsing of Ollama's progress JSON responses
- No updates to the spinner with download percentage
- User sees static "Downloading model..." for potentially 10+ minutes

**Impact:** User has no visibility into download progress, leading to perception of hanging

### 3. **Poor Error Handling in Setup Loop**

**Location:** `src/cli/commands/setup.ts:473-487`

```typescript
for (const model of newModels) {
  const spinner = ora(`Downloading ${model}...`).start();

  try {
    await pullModel(model);
    spinner.succeed(chalk.green(`Downloaded ${model}`));
  } catch {
    spinner.fail(chalk.red(`Failed to download ${model}`));
    console.log(
      chalk.yellow(
        `You can manually download it later with: ollama pull ${model}`
      )
    );
  }
}
```

**Problems:**

- Continues to next model even if critical model fails
- No option to retry failed downloads
- No aggregate error reporting
- Silent catch blocks swallow error details

### 4. **No Concurrent Download Limits**

**Location:** `src/cli/commands/setup.ts:473` (sequential loop)

**Problems:**

- Downloads happen sequentially, not in parallel
- No option for concurrent downloads with limits
- Total setup time unnecessarily long for multiple models

### 5. **Ollama Connection State Not Maintained**

**Location:** Throughout setup process

**Problems:**

- No periodic health checks during long operations
- If Ollama crashes/stops during model download, no detection
- No automatic restart attempt or user notification

### 6. **Insufficient Model Size Estimation**

**Location:** `src/cli/commands/setup.ts:393-416`

```typescript
choices: [
  {
    name: 'Minimal (granite-code:8b only) - ~5GB',
    value: 'minimal',
  },
  // ...
];
```

**Problems:**

- Size estimates are hardcoded and may be inaccurate
- No dynamic fetching of actual model sizes
- No disk space verification before download
- No warning if insufficient space

## Additional Issues

### 7. **Network Error Handling**

- No handling of intermittent network failures
- No resume capability for partial downloads
- No bandwidth throttling options

### 8. **User Interruption Handling**

- No graceful handling of Ctrl+C during downloads
- PID files/temp files may be left behind
- No cleanup on unexpected exit

### 9. **Model Verification**

- No checksum verification after download
- No test run to ensure model works
- No rollback if model is corrupted

## Detailed Problem Analysis

### The Hanging Symptom

The perceived "hanging" during model installation is caused by:

1. **Silent Progress**: The spinner shows "Downloading model..." with no updates
2. **Long Duration**: Large models take 10-30 minutes on average connections
3. **Timeout Failures**: 5-minute timeout kills large downloads mid-process
4. **No Feedback**: User has no idea if download is progressing or stuck

### The Real Issue

The streaming response handler reads but discards Ollama's progress updates:

```typescript
// This is what Ollama sends (example):
{"status":"pulling manifest"}
{"status":"downloading","digest":"sha256:...","total":4836749312,"completed":1048576}
{"status":"downloading","digest":"sha256:...","total":4836749312,"completed":2097152}
// ... continues with progress updates
{"status":"verifying"}
{"status":"success"}
```

These JSON lines are read but never parsed or used to update the UI.

## Recommended Solutions

### 1. **Implement Proper Progress Tracking**

```typescript
async function pullModelWithProgress(modelName: string): Promise<void> {
  const response = await fetch(`${config.ollama.host}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName }),
    // Dynamic timeout based on expected size
    signal: AbortSignal.timeout(3600000), // 1 hour max
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const progress = JSON.parse(line);
          if (progress.status === 'downloading' && progress.total) {
            const percent = (
              (progress.completed / progress.total) *
              100
            ).toFixed(1);
            spinner.text = `Downloading ${modelName}: ${percent}% (${formatBytes(progress.completed)}/${formatBytes(progress.total)})`;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}
```

### 2. **Add Retry Logic**

```typescript
async function pullModelWithRetry(
  modelName: string,
  maxRetries = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pullModelWithProgress(modelName);
      return;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(
        chalk.yellow(`Retry ${attempt}/${maxRetries} for ${modelName}...`)
      );
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5s delay
    }
  }
}
```

### 3. **Pre-download Validation**

```typescript
async function validateBeforeDownload(models: string[]): Promise<void> {
  // Check disk space
  const requiredSpace = await estimateRequiredSpace(models);
  const availableSpace = await getAvailableSpace();

  if (availableSpace < requiredSpace * 1.2) {
    // 20% buffer
    throw new Error(
      `Insufficient disk space. Need ${formatBytes(requiredSpace)}, have ${formatBytes(availableSpace)}`
    );
  }

  // Verify Ollama is responsive
  await checkOllamaHealth();
}
```

### 4. **Parallel Downloads with Limits**

```typescript
async function downloadModelsInParallel(
  models: string[],
  concurrency = 2
): Promise<void> {
  const queue = [...models];
  const active = new Set<Promise<void>>();

  while (queue.length > 0 || active.size > 0) {
    while (active.size < concurrency && queue.length > 0) {
      const model = queue.shift()!;
      const promise = pullModelWithRetry(model).finally(() => {
        active.delete(promise);
      });
      active.add(promise);
    }

    if (active.size > 0) {
      await Promise.race(active);
    }
  }
}
```

## Implementation Priority

1. **HIGH**: Fix progress tracking (immediate UX improvement)
2. **HIGH**: Increase timeout with dynamic calculation
3. **MEDIUM**: Add retry mechanism
4. **MEDIUM**: Add disk space validation
5. **LOW**: Implement parallel downloads
6. **LOW**: Add bandwidth controls

## Testing Recommendations

1. Test with slow network connections (throttled to 1Mbps)
2. Test with large models (20GB+)
3. Test interruption scenarios (Ctrl+C, network disconnect)
4. Test with full disk scenarios
5. Test with Ollama service stopping mid-download

## Conclusion

The setup command's model installation hanging is primarily a UX issue caused by lack of progress feedback combined with inadequate timeout handling. The fix requires parsing Ollama's streaming responses and updating the UI accordingly. Secondary issues around error handling and retries should also be addressed for a robust solution.
