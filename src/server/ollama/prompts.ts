/**
 * Audit-specific prompts for different types of code analysis
 */

import type { AuditType, PromptTemplate, PromptContext } from '../types.js';

/**
 * System prompts for different audit types
 */
export const SYSTEM_PROMPTS: Record<AuditType, string> = {
  security: `You are a cybersecurity expert specializing in code security audits. Your role is to identify security vulnerabilities, unsafe coding practices, and potential attack vectors in code.

Focus on:
- OWASP Top 10 vulnerabilities (SQL injection, XSS, CSRF, etc.)
- Authentication and authorization flaws
- Input validation issues
- Cryptographic weaknesses
- Hardcoded secrets and credentials
- Unsafe deserialization
- Path traversal vulnerabilities
- Command injection risks
- Memory safety issues (for relevant languages)
- Insecure dependencies and imports

Provide specific, actionable security recommendations with severity levels.`,

  completeness: `You are a code quality expert specializing in identifying incomplete or unfinished code implementations. Your role is to find areas where code is incomplete, has placeholder content, or lacks proper implementation.

Focus on:
- TODO, FIXME, HACK comments
- Empty function bodies or placeholder implementations
- Missing error handling and exception management
- Unhandled edge cases and boundary conditions
- Missing validation for inputs and outputs
- Incomplete conditional branches
- Unused variables and dead code
- Missing return statements
- Incomplete type definitions
- Missing required configuration

Identify areas that could cause runtime failures or unexpected behavior.`,

  performance: `You are a performance optimization expert specializing in identifying bottlenecks and inefficiencies in code. Your role is to find performance issues and suggest optimizations.

Focus on:
- Algorithmic complexity (O(n²), O(n³) issues)
- Memory management and potential leaks
- Database query optimization opportunities
- Inefficient loops and iterations
- Unnecessary computations and redundant operations
- Blocking operations in async contexts
- Resource-intensive operations without caching
- Large object creation in loops
- String concatenation inefficiencies
- Network request optimization opportunities
- File I/O optimization potential

Provide specific optimization strategies with estimated impact.`,

  quality: `You are a code quality expert specializing in maintainability, readability, and best practices. Your role is to identify code smells, violations of SOLID principles, and maintainability issues.

Focus on:
- Code smells (long methods, large classes, duplicate code)
- SOLID principle violations
- Poor naming conventions
- Complex conditional logic and deep nesting
- Lack of separation of concerns
- Tight coupling between components
- Missing or poor abstraction
- Inconsistent coding style
- Magic numbers and hardcoded values
- Poor error handling patterns
- Lack of documentation in complex areas

Suggest refactoring strategies that improve maintainability.`,

  architecture: `You are a software architecture expert specializing in design patterns, system structure, and architectural best practices. Your role is to identify architectural issues and design pattern opportunities.

Focus on:
- Design pattern implementation opportunities
- Architectural anti-patterns
- Dependency management and inversion
- Component coupling and cohesion
- Layer separation and boundaries
- Single Responsibility Principle adherence
- Interface segregation opportunities
- Factory and builder pattern applications
- Observer pattern implementations
- Strategy pattern opportunities
- Dependency injection improvements

Recommend architectural improvements and pattern applications.`,

  testing: `You are a testing expert specializing in identifying testability issues, missing test coverage areas, and testing anti-patterns. Your role is to find code that is difficult to test or has testing gaps.

Focus on:
- Testability issues (hard-to-mock dependencies)
- Missing test coverage for edge cases
- Race conditions in async code
- Non-deterministic behavior
- External dependency management in tests
- Test data setup complexity
- Assertion complexity and clarity
- Test isolation issues
- Mock and stub opportunities
- Integration vs unit testing boundaries
- Property-based testing opportunities

Suggest testing strategies and testability improvements.`,

  documentation: `You are a documentation expert specializing in code documentation, API documentation, and compliance documentation. Your role is to identify missing or poor documentation.

Focus on:
- Missing API documentation
- Poor inline comments and code documentation
- Missing README and setup instructions
- Undocumented configuration options
- Missing examples and usage patterns
- Poor error message documentation
- Missing compliance documentation
- Unclear function and method documentation
- Missing type documentation
- Undocumented assumptions and constraints
- Missing architectural decision records

Suggest documentation improvements and standards compliance.`,

  all: `You are a comprehensive code auditor with expertise in security, performance, quality, architecture, testing, and documentation. Your role is to perform a complete code audit across all dimensions.

Analyze the code for:
1. Security vulnerabilities and unsafe practices
2. Incomplete implementations and missing error handling
3. Performance bottlenecks and optimization opportunities
4. Code quality issues and maintainability problems
5. Architectural issues and design pattern opportunities
6. Testing gaps and testability issues
7. Documentation deficiencies

Prioritize findings by severity and impact, focusing on the most critical issues first.`
};

/**
 * Language-specific prompt additions
 */
export const LANGUAGE_SPECIFIC_PROMPTS: Record<string, Partial<Record<AuditType, string>>> = {
  javascript: {
    security: `Pay special attention to:
- Prototype pollution vulnerabilities
- eval() and Function() usage
- DOM-based XSS in browser contexts
- Weak random number generation
- Insecure localStorage usage`,
    
    performance: `Focus on:
- Event loop blocking operations
- Memory leaks with event listeners
- Bundle size optimization
- Inefficient DOM manipulations
- Async/await vs Promise performance`
  },

  typescript: {
    quality: `Consider TypeScript-specific issues:
- any type usage and type safety
- Missing type annotations
- Incorrect type assertions
- Union type handling
- Generic type constraints`,
    
    completeness: `Look for:
- Missing type definitions
- Incomplete interface implementations
- Unhandled union type cases
- Missing null/undefined checks`
  },

  python: {
    security: `Focus on Python-specific security issues:
- pickle and eval() usage
- SQL injection in ORM usage
- Path traversal with os.path
- Command injection with subprocess
- Insecure deserialization`,
    
    performance: `Consider:
- Global Interpreter Lock (GIL) implications
- List comprehensions vs loops
- Generator usage opportunities
- Memory usage with large data structures`
  },

  java: {
    security: `Pay attention to:
- Deserialization vulnerabilities
- XML External Entity (XXE) attacks
- LDAP injection possibilities
- Insecure random number generation
- Thread safety issues`,
    
    architecture: `Consider Java patterns:
- Singleton pattern thread safety
- Factory pattern implementations
- Dependency injection opportunities
- Interface segregation principle`
  },

  go: {
    security: `Focus on Go-specific issues:
- Race conditions with goroutines
- Channel deadlocks
- Unsafe package usage
- Path traversal vulnerabilities
- Input validation in HTTP handlers`,
    
    performance: `Consider:
- Goroutine leak prevention
- Channel buffer sizing
- Memory allocation patterns
- Garbage collection optimization`
  },

  rust: {
    security: `Focus on:
- Unsafe block usage
- Memory safety violations
- Integer overflow potential
- FFI safety concerns`,
    
    performance: `Consider:
- Zero-cost abstraction violations
- Unnecessary allocations
- Clone vs move semantics
- Iterator optimization opportunities`
  }
};

/**
 * Framework-specific prompt additions
 */
export const FRAMEWORK_SPECIFIC_PROMPTS: Record<string, Partial<Record<AuditType, string>>> = {
  react: {
    security: `React-specific security concerns:
- XSS through dangerouslySetInnerHTML
- State injection vulnerabilities
- Component prop validation
- Dependency injection security`,
    
    performance: `React performance issues:
- Unnecessary re-renders
- Missing useMemo/useCallback
- Large component trees
- Key prop optimization
- Bundle splitting opportunities`,
    
    quality: `React code quality:
- Hook dependency arrays
- Component composition over inheritance
- Prop drilling issues
- State management patterns`
  },

  express: {
    security: `Express.js security issues:
- Missing helmet middleware
- CORS misconfiguration
- Rate limiting absence
- Input validation gaps
- Session security`,
    
    performance: `Express performance:
- Middleware optimization
- Database connection pooling
- Response compression
- Static file serving
- Caching strategies`
  },

  django: {
    security: `Django security concerns:
- CSRF protection gaps
- SQL injection through raw queries
- XSS in template rendering
- Insecure settings.py configuration
- Authentication bypass`,
    
    architecture: `Django patterns:
- Model-View-Template adherence
- Custom manager usage
- Signal handler patterns
- Middleware implementation`
  },

  spring: {
    security: `Spring security issues:
- Authentication configuration
- Authorization annotation usage
- CSRF protection
- SQL injection in repositories
- Actuator endpoint exposure`,
    
    architecture: `Spring patterns:
- Dependency injection best practices
- Bean lifecycle management
- AOP implementation
- Configuration management`
  }
};

/**
 * Generate a complete prompt for a specific audit context
 */
export function generatePrompt(context: PromptContext): string {
  const { code, language, auditType, context: auditContext, codeMetrics } = context;
  
  let prompt = SYSTEM_PROMPTS[auditType];
  
  // Add language-specific guidance
  const langPrompts = LANGUAGE_SPECIFIC_PROMPTS[language.toLowerCase()];
  if (langPrompts?.[auditType]) {
    prompt += '\n\n' + langPrompts[auditType];
  }
  
  // Add framework-specific guidance
  if (auditContext?.framework) {
    const frameworkPrompts = FRAMEWORK_SPECIFIC_PROMPTS[auditContext.framework.toLowerCase()];
    if (frameworkPrompts?.[auditType]) {
      prompt += '\n\n' + frameworkPrompts[auditType];
    }
  }
  
  // Add context-specific instructions
  if (auditContext) {
    prompt += '\n\nContext considerations:';
    
    if (auditContext.environment === 'production') {
      prompt += '\n- This is production code - prioritize security and reliability';
    }
    
    if (auditContext.performanceCritical) {
      prompt += '\n- This is performance-critical code - focus on optimization opportunities';
    }
    
    if (auditContext.teamSize && auditContext.teamSize > 5) {
      prompt += '\n- Large team environment - emphasize maintainability and documentation';
    }
    
    if (auditContext.projectType) {
      const typeGuidance = {
        api: 'API service - focus on security, performance, and error handling',
        web: 'Web application - consider user experience and security',
        cli: 'Command-line tool - focus on error handling and user feedback',
        library: 'Reusable library - emphasize API design and documentation'
      };
      
      if (typeGuidance[auditContext.projectType]) {
        prompt += '\n- ' + typeGuidance[auditContext.projectType];
      }
    }
  }
  
  // Add code metrics context
  if (codeMetrics) {
    prompt += '\n\nCode metrics:';
    prompt += `\n- Lines of code: ${codeMetrics.lineCount}`;
    prompt += `\n- Functions: ${codeMetrics.functionCount}`;
    prompt += `\n- Complexity score: ${codeMetrics.complexity}`;
  }
  
  // Add the actual code analysis request
  prompt += `\n\nAnalyze the following ${language} code and return a JSON response with the following structure:

{
  "issues": [
    {
      "line": number,
      "column": number (optional),
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "type": "specific_issue_type",
      "category": "${auditType}",
      "title": "Brief description",
      "description": "Detailed explanation",
      "suggestion": "How to fix this issue",
      "confidence": 0.0-1.0,
      "fixable": boolean
    }
  ]
}

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Important:
- Only return valid JSON
- Be specific about line numbers
- Provide actionable suggestions
- Rate confidence honestly (0.0 = uncertain, 1.0 = very confident)
- Focus on the most important issues for this audit type
- Include severity levels that match the actual risk/impact`;

  return prompt;
}

/**
 * Generate a fast mode prompt (security + completeness only)
 */
export function generateFastModePrompt(context: PromptContext): string {
  const fastContext = {
    ...context,
    auditType: 'security' as AuditType
  };
  
  let prompt = SYSTEM_PROMPTS.security + '\n\n' + SYSTEM_PROMPTS.completeness;
  
  // Add language and framework specifics for both security and completeness
  const langPrompts = LANGUAGE_SPECIFIC_PROMPTS[context.language.toLowerCase()];
  if (langPrompts?.security) {
    prompt += '\n\n' + langPrompts.security;
  }
  if (langPrompts?.completeness) {
    prompt += '\n\n' + langPrompts.completeness;
  }
  
  if (context.context?.framework) {
    const frameworkPrompts = FRAMEWORK_SPECIFIC_PROMPTS[context.context.framework.toLowerCase()];
    if (frameworkPrompts?.security) {
      prompt += '\n\n' + frameworkPrompts.security;
    }
    if (frameworkPrompts?.completeness) {
      prompt += '\n\n' + frameworkPrompts.completeness;
    }
  }
  
  prompt += `\n\nFAST MODE: Focus only on CRITICAL security vulnerabilities and obvious incomplete implementations that could cause immediate failures.

Analyze the following ${context.language} code for:
1. Critical security vulnerabilities (SQL injection, XSS, authentication bypass, etc.)
2. Incomplete implementations (TODOs, empty functions, missing error handling)

Return JSON with issues array focusing on high-impact problems only:

Code to analyze:
\`\`\`${context.language}
${context.code}
\`\`\``;

  return prompt;
}

/**
 * Prompt templates for specific issue types
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  sql_injection: {
    name: 'SQL Injection Detection',
    template: 'Analyze this code for SQL injection vulnerabilities: {code}',
    variables: ['code'],
    auditTypes: ['security'],
    languages: ['javascript', 'python', 'php', 'java', 'csharp']
  },
  
  xss_detection: {
    name: 'XSS Vulnerability Detection',
    template: 'Check for XSS vulnerabilities in this {language} code: {code}',
    variables: ['code', 'language'],
    auditTypes: ['security'],
    languages: ['javascript', 'typescript', 'php', 'python']
  },
  
  performance_optimization: {
    name: 'Performance Optimization',
    template: 'Identify performance bottlenecks and optimization opportunities: {code}',
    variables: ['code'],
    auditTypes: ['performance'],
    languages: ['javascript', 'python', 'java', 'csharp', 'go', 'rust']
  },
  
  test_coverage_gaps: {
    name: 'Test Coverage Analysis',
    template: 'Identify areas missing test coverage in this {language} code: {code}',
    variables: ['code', 'language'],
    auditTypes: ['testing'],
    languages: ['javascript', 'python', 'java', 'csharp', 'go', 'rust']
  }
};

/**
 * Get severity guidelines for different audit types
 */
export function getSeverityGuidelines(auditType: AuditType): Record<string, string> {
  const baseGuidelines = {
    critical: 'Immediate security risk or system failure potential',
    high: 'Significant impact on security, performance, or reliability',
    medium: 'Moderate impact on code quality or maintainability',
    low: 'Minor improvements or style issues',
    info: 'Informational suggestions or best practices'
  };

  const typeSpecificGuidelines: Record<AuditType, Partial<Record<string, string>>> = {
    security: {
      critical: 'Remote code execution, SQL injection, authentication bypass',
      high: 'XSS, CSRF, sensitive data exposure, authorization flaws',
      medium: 'Weak cryptography, input validation gaps, session management',
      low: 'Security headers, secure coding practices'
    },
    performance: {
      critical: 'O(n³) or worse complexity, memory leaks, infinite loops',
      high: 'O(n²) complexity, blocking operations, large memory usage',
      medium: 'Suboptimal algorithms, unnecessary computations',
      low: 'Minor optimizations, caching opportunities'
    },
    completeness: {
      critical: 'Missing error handling that could crash the system',
      high: 'TODO comments in critical paths, incomplete implementations',
      medium: 'Missing edge case handling, incomplete validation',
      low: 'Minor TODOs, documentation gaps'
    },
    quality: {
      critical: 'Code that severely violates coding standards',
      high: 'Poor code structure, major maintainability issues',
      medium: 'Code style violations, moderate maintainability issues',
      low: 'Minor style issues, small improvements'
    },
    architecture: {
      critical: 'Design patterns that break system architecture',
      high: 'Significant architectural violations, coupling issues',
      medium: 'Moderate design issues, some coupling problems',
      low: 'Minor design improvements, refactoring opportunities'
    },
    testing: {
      critical: 'Missing tests for critical functionality',
      high: 'Insufficient test coverage, missing integration tests',
      medium: 'Some missing unit tests, test quality issues',
      low: 'Minor test improvements, additional edge cases'
    },
    documentation: {
      critical: 'Missing critical API documentation',
      high: 'Insufficient documentation for complex functionality',
      medium: 'Some missing documentation, unclear comments',
      low: 'Minor documentation improvements'
    },
    all: {
      critical: 'Critical issues across all audit types',
      high: 'High priority issues across multiple areas',
      medium: 'Medium priority issues across multiple areas',
      low: 'Low priority issues across multiple areas'
    }
  };

  return {
    ...baseGuidelines,
    ...typeSpecificGuidelines[auditType]
  };
}