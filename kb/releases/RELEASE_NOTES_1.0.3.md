## What's Changed

### 🚀 New Features

- **Enhanced Progress Display**: Model downloads now show real-time progress with MB downloaded/total
- **Pre-flight System Checks**: Setup wizard now verifies:
  - Available disk space (10GB minimal, 20GB recommended, 50GB comprehensive)
  - Network connectivity to Ollama registry
  - System memory with automatic model recommendations
  - Early Ollama service health check

### 🛠 Improvements

- Progress updates are throttled to 500ms intervals to prevent console spam
- Better error prevention with system readiness checks
- Improved user guidance based on system capabilities
- Fixed prettier formatting and linting issues

### 📦 Installation

```bash
npm install -g @moikas/code-audit-mcp@1.0.3
```

### 🔧 Setup

```bash
code-audit setup
```

This release significantly improves the setup wizard experience with better feedback and error prevention.
