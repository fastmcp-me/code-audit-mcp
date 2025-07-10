# Generate MCP Code Audit Server

Create a complete TypeScript MCP (Model Context Protocol) server that audits code for completeness and security using local Ollama models. The server should integrate with Claude Code workflows to validate AI-generated code.

## Project Structure

```
code-audit-mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts              # Main MCP server entry point
│   ├── types.ts               # TypeScript interfaces and types
│   ├── auditors/
│   │   ├── base.ts           # Base auditor abstract class
│   │   ├── completeness.ts   # Completeness checker
│   │   ├── security.ts       # Security vulnerability checker
│   │   ├── performance.ts    # Performance & optimization checker
│   │   ├── quality.ts        # Code quality & maintainability
│   │   ├── architecture.ts   # Architecture & design patterns
│   │   ├── testing.ts        # Testing & reliability checker
│   │   ├── documentation.ts  # Documentation quality checker
│   │   └── index.ts          # Export all auditors
│   ├── ollama/
│   │   ├── client.ts         # Ollama API wrapper
│   │   ├── prompts.ts        # Audit-specific prompts
│   │   └── models.ts         # Model specialization config
│   └── utils/
│       ├── codeParser.ts     # Code parsing utilities
│       ├── complexity.ts     # Complexity analysis utilities
│       └── logger.ts         # Logging utilities
├── cli/
│   └── setup.ts              # CLI setup script
└── README.md
```

## Requirements

### Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK
- `commander` - CLI framework
- `chalk` - Terminal colors
- TypeScript dev dependencies

### Core Functionality

#### 1. MCP Server (src/server.ts)

- Implement MCP server with tools for code auditing
- Handle `audit_code` tool requests
- Support multiple audit types: security, completeness, performance, quality, architecture, testing, documentation, all
- Context-aware auditing with framework and environment detection
- Priority-based audit execution for rapid feedback
- Return structured audit results with actionable suggestions

#### 2. Ollama Integration (src/ollama/client.ts)

- HTTP client for Ollama API (localhost:11434)
- Model specialization: CodeLlama (general), Deepseek-Coder (performance), Starcoder2 (testing)
- Intelligent model selection based on audit type and code complexity
- Error handling and retry logic with fallback models
- Streaming and non-streaming response support
- Performance optimization with request batching

#### 3. Audit Prompts (src/ollama/prompts.ts)

- **Security audit**: SQL injection, XSS, hardcoded secrets, unsafe operations, authentication flaws
- **Completeness audit**: TODOs, empty functions, missing implementations, unhandled edge cases
- **Performance audit**: Algorithmic efficiency, memory management, database performance, caching opportunities
- **Quality audit**: Code smells, SOLID principles, naming conventions, complexity metrics
- **Architecture audit**: Separation of concerns, design patterns, dependency management
- **Testing audit**: Testability issues, missing edge cases, race conditions, async problems
- **Documentation audit**: API documentation, code comments, compliance standards
- Return structured JSON responses with line numbers, severity, and actionable suggestions

#### 4. Base Auditor (src/auditors/base.ts)

- Abstract class with common audit functionality
- Language detection
- Result formatting
- Error handling

#### 5. Specific Auditors

- **Completeness Auditor**: Detect incomplete implementations, TODOs, placeholders, missing error handling
- **Security Auditor**: Find vulnerabilities using AI analysis with OWASP Top 10 focus
- **Performance Auditor**: Identify algorithmic inefficiencies, memory leaks, database performance issues
- **Quality Auditor**: Code smells, complexity analysis, naming conventions, SOLID principles
- **Architecture Auditor**: Design patterns, separation of concerns, dependency management
- **Testing Auditor**: Testability issues, missing test coverage, race conditions
- **Documentation Auditor**: API docs, code comments, compliance requirements

#### 6. Types (src/types.ts)

```typescript
interface AuditRequest {
  code: string;
  language: string;
  auditType:
    | 'security'
    | 'completeness'
    | 'performance'
    | 'quality'
    | 'architecture'
    | 'testing'
    | 'documentation'
    | 'all';
  file?: string;
  context?: {
    framework?: string; // React, Express, Django, etc.
    environment?: string; // production, development, testing
    performanceCritical?: boolean;
    teamSize?: number;
    projectType?: 'web' | 'api' | 'cli' | 'library';
  };
  priority?: 'fast' | 'thorough'; // Fast = security + completeness only
}

interface AuditIssue {
  line: number;
  column?: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  category: string; // security, performance, quality, etc.
  description: string;
  suggestion?: string;
  codeSnippet?: string;
  confidence: number; // 0-1 confidence score from AI
  fixable: boolean; // Can be auto-fixed
}

interface AuditResult {
  issues: AuditIssue[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    byCategory: Record<string, number>;
  };
  model: string;
  duration: number;
  coverage: {
    linesAnalyzed: number;
    functionsAnalyzed: number;
    complexity: number;
  };
  suggestions: {
    autoFixable: AuditIssue[];
    priorityFixes: AuditIssue[];
  };
}

interface ModelConfig {
  name: string;
  specialization: string[];
  maxTokens: number;
  temperature: number;
}
```

#### 7. CLI Setup (cli/setup.ts)

- Check if Ollama is installed and running
- Download recommended models (codellama:7b, deepseek-coder:6.7b)
- Test MCP server connectivity
- Generate example configuration

### CLI Commands

```bash
# Setup and install models
npm run setup

# Start MCP server
npm run dev

# Test audit functionality
npm run test-audit

# Build for production
npm run build
```

### Package.json Scripts

- `dev`: Start server in development mode with nodemon
- `build`: Compile TypeScript
- `start`: Run compiled server
- `setup`: Run CLI setup script
- `test-audit`: Test audit functionality with sample code

### Configuration

- Support for custom Ollama endpoint
- Configurable model preferences
- Audit rule customization
- Logging levels

### Error Handling

- Graceful handling of Ollama connection issues
- Timeout handling for model responses
- Proper error formatting for MCP responses

### Sample Usage

The server should handle requests like:

```json
{
  "method": "tools/call",
  "params": {
    "name": "audit_code",
    "arguments": {
      "code": "function processPayment(amount) {\n  const query = `SELECT * FROM users WHERE id = ${userId}`;\n  // TODO: implement payment logic\n  for(let i = 0; i < users.length; i++) {\n    for(let j = 0; j < transactions.length; j++) {\n      // O(n²) complexity\n    }\n  }\n}",
      "language": "javascript",
      "auditType": "all",
      "context": {
        "framework": "express",
        "environment": "production",
        "performanceCritical": true,
        "projectType": "api"
      },
      "priority": "thorough"
    }
  }
}
```

Expected response with multiple issue types:

```json
{
  "issues": [
    {
      "line": 2,
      "severity": "critical",
      "type": "sql_injection",
      "category": "security",
      "description": "SQL injection vulnerability in query construction",
      "suggestion": "Use parameterized queries or prepared statements",
      "confidence": 0.95,
      "fixable": true
    },
    {
      "line": 3,
      "severity": "medium",
      "type": "incomplete_implementation",
      "category": "completeness",
      "description": "TODO comment indicates incomplete implementation",
      "confidence": 1.0,
      "fixable": false
    },
    {
      "line": 4,
      "severity": "high",
      "type": "algorithmic_complexity",
      "category": "performance",
      "description": "O(n²) nested loop can be optimized",
      "suggestion": "Consider using a Map or Set for faster lookups",
      "confidence": 0.88,
      "fixable": true
    }
  ],
  "summary": {
    "total": 3,
    "critical": 1,
    "high": 1,
    "medium": 1,
    "byCategory": {
      "security": 1,
      "completeness": 1,
      "performance": 1
    }
  }
}
```

## Additional Features

- Support for 10+ programming languages with language-specific rules
- Configurable severity thresholds and custom rule sets
- Integration helpers for VS Code, Claude Code, and other editors
- Performance metrics with detailed timing breakdown
- Intelligent caching for repeated code analysis
- **Priority-based auditing for rapid development**:
  - `fast` mode: Security + Completeness only (for vibe coding)
  - `thorough` mode: All audit types (for production code)
- **Context-aware analysis**:
  - Framework-specific checks (React hooks, Express security, etc.)
  - Environment-specific rules (production vs development)
  - Project-type optimizations (API vs UI vs CLI)
- **Auto-fix suggestions** with confidence scoring
- **Complexity analysis** with cognitive load metrics
- **Team collaboration features**:
  - Consistent coding standards enforcement
  - Technical debt tracking
  - Code review assistance
- **Model ensemble approach**:
  - Use multiple models for cross-validation
  - Combine static analysis with AI insights
  - Fallback strategies for model failures

## Recommended Audit Workflow for Vibe Coding

1. **Immediate**: Security + Completeness (blocks dangerous/broken code)
2. **Fast feedback**: Performance issues for critical paths
3. **Background**: Quality + Architecture analysis
4. **Pre-commit**: Full comprehensive audit

Generate the complete project with all files, proper TypeScript types, comprehensive error handling, and a working CLI setup script. Include detailed README with setup instructions and usage examples.
