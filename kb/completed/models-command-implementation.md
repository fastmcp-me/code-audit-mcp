# Models Command Implementation

## Overview

The `models` command provides comprehensive AI model management functionality for the Code Audit MCP CLI. It handles downloading, removing, updating, and monitoring AI models used for code auditing.

## Implementation Files

### Main Command File

- **File**: `/src/cli/commands/models.ts`
- **Purpose**: Main command implementation with all subcommand handlers
- **Dependencies**:
  - Ollama utility functions
  - CLI libraries (chalk, ora, boxen, cli-table3, inquirer)
  - Configuration management

### Utility Functions

- **File**: `/src/cli/utils/ollama.ts`
- **Purpose**: Ollama API wrapper functions for model management
- **Key Functions**:
  - `getInstalledModels()` - List installed models
  - `pullModel()` - Download models with progress tracking
  - `removeModel()` - Delete models
  - `getModelHealth()` - Check model health status
  - `validateModelCompatibility()` - System compatibility checks
  - `getRecommendedModels()` - System-based recommendations

## Command Options

### `--list`

Lists all installed models with detailed information in a formatted table.

- Shows model name, size, health status, specialization, performance metrics
- Displays summary statistics
- JSON output support

### `--pull <model>`

Downloads a specific model with real-time progress tracking.

- Validates model compatibility before download
- Shows progress with ora spinner
- Prevents duplicate downloads
- Displays model information after successful download

### `--remove <model>`

Removes a specific model with safety confirmation.

- Confirms model exists before removal
- Interactive confirmation prompt (skipped in JSON mode)
- Safe error handling

### `--update`

Updates all installed models to latest versions.

- Fetches list of installed models
- Sequentially updates each model
- Reports success/failure for each model
- Progress tracking with spinners

### `--recommend`

Analyzes system specifications and recommends optimal models.

- Detects system memory and architecture
- Categorizes models as essential/recommended/optional
- Provides installation commands
- Memory usage estimates

### `--health`

Performs comprehensive health checks on all models.

- Tests each model with a simple prompt
- Reports detailed health status
- Shows last tested timestamps
- Provides health summary statistics

### Default (no options)

Shows a summary overview of the current model status.

- Installed model count
- Missing essential models
- Available command list
- Quick installation commands for missing models

## Key Features

### Progress Tracking

- Real-time download progress with ora spinners
- Percentage completion for model downloads
- Status updates during operations

### Error Handling

- Comprehensive error catching and reporting
- Network error handling
- Disk space validation
- Model compatibility checks

### System Integration

- Reads Ollama host from configuration
- Validates Ollama service availability
- System memory and architecture detection

### User Experience

- Colorized output with chalk
- Formatted tables with cli-table3
- Boxed summaries with boxen
- Interactive confirmations with inquirer
- JSON output mode for scripting

### Model Management

- Essential model auto-detection
- Model specialization tracking
- Performance metrics display
- Health monitoring
- Compatibility validation

## Model Categories

### Essential Models

- `codellama:7b` - Fast general purpose
- `granite-code:8b` - Security analysis

### Recommended Models (8GB+ RAM)

- `deepseek-coder:6.7b` - Performance analysis
- `starcoder2:7b` - Testing analysis
- `qwen2.5-coder:7b` - Documentation analysis

### Optional Models (16GB+ RAM)

- `codellama:13b` - Higher accuracy
- `starcoder2:15b` - Advanced testing

### High-end Models (32GB+ RAM)

- `deepseek-coder:33b` - Maximum accuracy

## Integration Points

### Configuration

- Uses `getConfig()` to get Ollama host settings
- Respects user configuration preferences

### Health System

- Integrates with existing health check infrastructure
- Provides model-specific health status
- Used by other commands for model availability

### CLI Framework

- Follows existing command patterns
- Consistent error handling and output formatting
- JSON mode support for automation

## Usage Examples

```bash
# List all installed models
code-audit models --list

# Download essential models
code-audit models --pull codellama:7b
code-audit models --pull granite-code:8b

# Remove a model
code-audit models --remove starcoder2:15b

# Update all models
code-audit models --update

# Get system recommendations
code-audit models --recommend

# Check model health
code-audit models --health

# Show summary (default)
code-audit models
```

## Dependencies Added

### Runtime Dependencies

- `cli-table3` - Table formatting
- `inquirer` - Interactive prompts
- `chalk` - Terminal colors (existing)
- `ora` - Progress spinners (existing)
- `boxen` - Boxed output (existing)

### Model Configuration

- Integrates with `/src/server/ollama/models.ts` for model specifications
- Uses existing model configurations and priorities
- Leverages specialization mappings

## Error Scenarios Handled

1. **Ollama Service Unavailable**
   - Clear error message with installation instructions
   - Host configuration display

2. **Model Not Found**
   - Validation before operations
   - Helpful error messages

3. **Insufficient System Resources**
   - Memory requirement checks
   - Alternative model suggestions

4. **Network Issues**
   - Retry logic in Ollama client
   - Progress preservation

5. **Disk Space Issues**
   - Size validation before downloads
   - Clear error reporting

## Performance Considerations

- Parallel operations where possible (health checks)
- Efficient model listing and status checks
- Progress tracking without performance impact
- Memory-conscious system recommendations

## Security Considerations

- Input validation for model names
- Safe file operations
- No hardcoded credentials
- Configuration-based host settings

## Future Enhancements

1. Model auto-update scheduling
2. Model usage analytics
3. Custom model configurations
4. Model sharing between users
5. Advanced filtering and search
6. Model benchmark comparisons

## Testing Recommendations

1. Test with various system memory configurations
2. Validate progress tracking with large models
3. Test error scenarios (network failures, disk full)
4. Verify JSON output format consistency
5. Test interactive confirmations
6. Validate model compatibility checks

## Status: Complete

All core functionality has been implemented and tested. The command provides a comprehensive model management interface that integrates well with the existing CLI architecture.
