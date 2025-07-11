# VS Code Setup Guide

This guide provides detailed instructions for setting up Visual Studio Code for optimal development experience with the Code Audit MCP project.

## Table of Contents

- [Initial Setup](#initial-setup)
- [Recommended Extensions](#recommended-extensions)
- [Workspace Settings](#workspace-settings)
- [Debugging Configuration](#debugging-configuration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips and Tricks](#tips-and-tricks)
- [Troubleshooting](#troubleshooting)

## Initial Setup

### 1. Open the Project

```bash
# Open VS Code in the project directory
code /path/to/code-audit-mcp

# Or from within the project directory
code .
```

### 2. Accept Workspace Recommendations

When you first open the project, VS Code will prompt you to install recommended extensions. Click "Install All" to get the optimal setup.

### 3. Select TypeScript Version

Use the workspace TypeScript version:

1. Open any TypeScript file
2. Click the TypeScript version in the status bar (bottom right)
3. Select "Use Workspace Version"

## Recommended Extensions

### Essential Extensions

These extensions are required for the best development experience:

#### 1. **ESLint** (`dbaeumer.vscode-eslint`)

- Real-time linting feedback
- Auto-fix on save
- Integration with project ESLint config

#### 2. **Prettier** (`esbenp.prettier-vscode`)

- Automatic code formatting
- Consistent style across the project
- Format on save enabled

#### 3. **TypeScript Next** (`ms-vscode.vscode-typescript-next`)

- Latest TypeScript language features
- Enhanced IntelliSense
- Better error messages

### TypeScript Development

#### 4. **Error Lens** (`usernamehw.errorlens`)

- Inline error display
- Immediate feedback
- Color-coded severity

#### 5. **Pretty TypeScript Errors** (`yoavbls.pretty-ts-errors`)

- Readable error messages
- Helpful explanations
- Quick fixes

#### 6. **Code Spell Checker** (`streetsidesoftware.code-spell-checker`)

- Catch typos in code and comments
- Custom dictionary support
- Multi-language support

### Code Quality and Testing

#### 7. **SonarLint** (`sonarsource.sonarlint-vscode`)

- Advanced code analysis
- Security vulnerability detection
- Code smell identification

#### 8. **Jest** (`orta.vscode-jest`)

- Run tests from VS Code
- Inline test results
- Coverage visualization

#### 9. **Jest Runner** (`firsttris.vscode-jest-runner`)

- Run/debug individual tests
- CodeLens integration
- Quick test execution

### Git Integration

#### 10. **GitLens** (`eamodio.gitlens`)

- Advanced Git features
- Blame annotations
- Commit history exploration

#### 11. **Git History** (`donjayamanne.githistory`)

- Visualize file history
- Compare versions
- Branch visualization

#### 12. **Git Graph** (`mhutchie.git-graph`)

- Repository visualization
- Branch management
- Commit graph

### Productivity

#### 13. **NPM IntelliSense** (`christian-kohler.npm-intellisense`)

- Auto-complete npm modules
- Import suggestions
- Version information

#### 14. **Path IntelliSense** (`christian-kohler.path-intellisense`)

- File path auto-completion
- Custom path mappings
- Quick navigation

#### 15. **Auto Rename Tag** (`formulahendry.auto-rename-tag`)

- Rename paired tags
- HTML/JSX support
- Saves time

### Documentation

#### 16. **Markdown All in One** (`yzhang.markdown-all-in-one`)

- Markdown preview
- TOC generation
- Keyboard shortcuts

#### 17. **Markdown Lint** (`davidanson.vscode-markdownlint`)

- Markdown style checking
- Auto-fix support
- Consistent documentation

### Installing Extensions

#### Option 1: Install All at Once

```bash
# Run this script to install all recommended extensions
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension usernamehw.errorlens
code --install-extension yoavbls.pretty-ts-errors
code --install-extension streetsidesoftware.code-spell-checker
code --install-extension sonarsource.sonarlint-vscode
code --install-extension orta.vscode-jest
code --install-extension firsttris.vscode-jest-runner
code --install-extension eamodio.gitlens
code --install-extension donjayamanne.githistory
code --install-extension mhutchie.git-graph
code --install-extension christian-kohler.npm-intellisense
code --install-extension christian-kohler.path-intellisense
code --install-extension formulahendry.auto-rename-tag
code --install-extension yzhang.markdown-all-in-one
code --install-extension davidanson.vscode-markdownlint
```

#### Option 2: Use Extensions View

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Type "Show Recommended Extensions"
3. Install each extension individually

## Workspace Settings

The project includes comprehensive workspace settings in `.vscode/settings.json`:

### Editor Configuration

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.rulers": [80, 120],
  "editor.tabSize": 2,
  "editor.insertSpaces": true
}
```

### TypeScript Settings

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.importModuleSpecifier": "shortest",
  "typescript.suggest.autoImports": true,
  "typescript.inlayHints.parameterNames.enabled": "literals"
}
```

### File Management

```json
{
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/*.tgz": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  }
}
```

## Debugging Configuration

### Launch Configurations

Create `.vscode/launch.json` if it doesn't exist:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug MCP Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "tsx",
      "program": "${workspaceFolder}/src/server/server.ts",
      "skipFiles": ["<node_internals>/**"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "true"
      }
    },
    {
      "name": "Debug CLI Setup",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "tsx",
      "program": "${workspaceFolder}/src/cli/setup.ts",
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Current Test",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "tsx",
      "args": ["--test", "${file}"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "Attach to Process",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Using the Debugger

1. Set breakpoints by clicking in the gutter
2. Select debug configuration from dropdown
3. Press F5 or click "Start Debugging"
4. Use debug controls to step through code

### Debug Console

- Evaluate expressions
- Inspect variables
- Execute code in context

## Keyboard Shortcuts

### Essential Shortcuts

| Action           | Mac              | Windows/Linux  |
| ---------------- | ---------------- | -------------- |
| Command Palette  | `Cmd+Shift+P`    | `Ctrl+Shift+P` |
| Quick Open       | `Cmd+P`          | `Ctrl+P`       |
| Find in Files    | `Cmd+Shift+F`    | `Ctrl+Shift+F` |
| Toggle Terminal  | `Cmd+\``         | `Ctrl+\``      |
| Format Document  | `Option+Shift+F` | `Alt+Shift+F`  |
| Go to Definition | `F12`            | `F12`          |
| Find References  | `Shift+F12`      | `Shift+F12`    |
| Rename Symbol    | `F2`             | `F2`           |
| Quick Fix        | `Cmd+.`          | `Ctrl+.`       |
| Toggle Comment   | `Cmd+/`          | `Ctrl+/`       |

### Custom Shortcuts

Add to `keybindings.json`:

```json
[
  {
    "key": "cmd+shift+t",
    "command": "workbench.action.terminal.runSelectedText"
  },
  {
    "key": "cmd+shift+l",
    "command": "eslint.executeAutofix"
  },
  {
    "key": "cmd+shift+m",
    "command": "markdown.showPreview"
  }
]
```

## Tips and Tricks

### 1. Multi-Cursor Editing

- `Option+Click` (Mac) or `Alt+Click` (Windows) to add cursors
- `Cmd+D` (Mac) or `Ctrl+D` (Windows) to select next occurrence
- `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Windows) to select all occurrences

### 2. Code Navigation

- `Cmd+Click` (Mac) or `Ctrl+Click` (Windows) to go to definition
- `Cmd+-` (Mac) or `Ctrl+-` (Windows) to go back
- `Cmd+Shift+-` (Mac) or `Ctrl+Shift+-` (Windows) to go forward

### 3. Refactoring

- `F2` to rename symbols
- `Cmd+.` (Mac) or `Ctrl+.` (Windows) for quick fixes
- Extract method/variable from context menu

### 4. Terminal Integration

- Create multiple terminals with `+` button
- Split terminal with split button
- Name terminals for easy identification

### 5. Git Integration

- View changes in Source Control panel
- Stage/unstage with checkboxes
- Commit with `Cmd+Enter` (Mac) or `Ctrl+Enter` (Windows)

### 6. Snippets

Create custom snippets in `.vscode/snippets.code-snippets`:

```json
{
  "Async Function": {
    "prefix": "afn",
    "body": [
      "async function ${1:functionName}(${2:params}): Promise<${3:ReturnType}> {",
      "  ${4:// Implementation}",
      "}"
    ]
  },
  "Test Case": {
    "prefix": "test",
    "body": [
      "it('should ${1:description}', async () => {",
      "  ${2:// Arrange}",
      "  ",
      "  ${3:// Act}",
      "  ",
      "  ${4:// Assert}",
      "});"
    ]
  }
}
```

## Troubleshooting

### ESLint Not Working

1. Check ESLint output:
   - View → Output → ESLint

2. Restart ESLint:
   - Command Palette → "ESLint: Restart ESLint Server"

3. Verify configuration:
   ```bash
   npx eslint --print-config src/server.ts
   ```

### Prettier Not Formatting

1. Check Prettier is selected as formatter:
   - Right-click in editor → "Format Document With..."
   - Select Prettier

2. Check for syntax errors:
   - Prettier won't format invalid code

3. Check Prettier output:
   - View → Output → Prettier

### TypeScript IntelliSense Issues

1. Restart TypeScript server:
   - Command Palette → "TypeScript: Restart TS Server"

2. Check TypeScript version:
   - Status bar → TypeScript version
   - Use workspace version

3. Clear cache:
   ```bash
   rm -rf node_modules/.cache
   npm install
   ```

### Performance Issues

1. Exclude large directories:
   - Add to `files.exclude` in settings

2. Disable unused extensions:
   - Extensions view → Disable for Workspace

3. Increase memory:
   ```json
   {
     "typescript.tsserver.maxTsServerMemory": 4096
   }
   ```

### Git Integration Issues

1. Check Git path:

   ```json
   {
     "git.path": "/usr/bin/git"
   }
   ```

2. Refresh Source Control:
   - Click refresh button in Source Control panel

3. Check Git output:
   - View → Output → Git

## Advanced Configuration

### Task Runner

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build",
      "type": "npm",
      "script": "build",
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Test",
      "type": "npm",
      "script": "test",
      "group": {
        "kind": "test",
        "isDefault": true
      }
    },
    {
      "label": "Quality Check",
      "type": "npm",
      "script": "quality-check",
      "problemMatcher": ["$eslint-stylish"]
    }
  ]
}
```

### Code Snippets

Create project-specific snippets for common patterns:

```json
{
  "Auditor Class": {
    "prefix": "auditor",
    "body": [
      "import { BaseAuditor } from './base.js';",
      "",
      "export class ${1:Name}Auditor extends BaseAuditor {",
      "  constructor(config, ollamaClient, modelManager) {",
      "    super('${2:type}', config, ollamaClient, modelManager);",
      "  }",
      "",
      "  protected async getSystemPrompt(): Promise<string> {",
      "    return `${3:System prompt}`;",
      "  }",
      "}"
    ]
  }
}
```

### Workspace-Specific Settings

Override user settings for this project:

```json
{
  "editor.fontSize": 14,
  "editor.lineHeight": 22,
  "terminal.integrated.fontSize": 13,
  "workbench.colorTheme": "Default Dark+",
  "workbench.iconTheme": "vscode-icons"
}
```

This comprehensive setup ensures a productive and consistent development environment for all contributors to the Code Audit MCP project.
