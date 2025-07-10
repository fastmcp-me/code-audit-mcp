/**
 * Performance auditor for identifying bottlenecks and optimization opportunities
 */

import { BaseAuditor } from './base.js';
import type { AuditRequest, AuditIssue, AuditorConfig } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';

export class PerformanceAuditor extends BaseAuditor {
  constructor(
    config: AuditorConfig,
    ollamaClient: OllamaClient,
    modelManager: ModelManager
  ) {
    super(config, ollamaClient, modelManager);
    this.auditType = 'performance';
  }

  /**
   * Post-process performance issues with complexity analysis
   */
  protected async postProcessIssues(
    rawIssues: Partial<AuditIssue>[],
    request: AuditRequest,
    language: string
  ): Promise<AuditIssue[]> {
    const issues = await super.postProcessIssues(rawIssues, request, language);

    // Add static performance pattern detection
    const patternIssues = this.detectPerformancePatterns(
      request.code,
      language
    );

    // Merge and deduplicate
    const allIssues = [...issues, ...patternIssues];
    const deduplicatedIssues = this.deduplicateIssues(allIssues);

    // Adjust severity based on performance criticality
    return this.adjustSeverityForContext(deduplicatedIssues, request.context);
  }

  /**
   * Detect performance patterns using static analysis
   */
  private detectPerformancePatterns(
    code: string,
    language: string
  ): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Nested loops (O(n²) complexity)
      if (this.isNestedLoop(line, lines, i, language)) {
        issues.push(this.createNestedLoopIssue(line, lineNumber));
      }

      // Inefficient string concatenation
      if (this.isInefficientStringConcatenation(line, language)) {
        issues.push(this.createStringConcatenationIssue(line, lineNumber));
      }

      // Database queries in loops
      if (this.isQueryInLoop(line, lines, i, language)) {
        issues.push(this.createQueryInLoopIssue(line, lineNumber));
      }

      // Synchronous file operations
      if (this.isSyncFileOperation(line, language)) {
        issues.push(this.createSyncFileOperationIssue(line, lineNumber));
      }

      // Large object creation in loops
      if (this.isObjectCreationInLoop(line, lines, i, language)) {
        issues.push(this.createObjectCreationInLoopIssue(line, lineNumber));
      }

      // Missing caching for expensive operations
      if (this.isMissingCaching(line, language)) {
        issues.push(this.createMissingCachingIssue(line, lineNumber));
      }

      // Inefficient array operations
      if (this.isInefficientArrayOperation(line, language)) {
        issues.push(
          this.createInefficientArrayOperationIssue(line, lineNumber)
        );
      }

      // Memory leak potential
      if (this.isMemoryLeakPotential(line, language)) {
        issues.push(this.createMemoryLeakIssue(line, lineNumber));
      }

      // Blocking operations in async context
      if (this.isBlockingInAsyncContext(line, lines, i, language)) {
        issues.push(this.createBlockingOperationIssue(line, lineNumber));
      }

      // Inefficient DOM operations
      if (this.isInefficientDOMOperation(line, language)) {
        issues.push(this.createDOMOperationIssue(line, lineNumber));
      }
    }

    return issues;
  }

  /**
   * Check for nested loops
   */
  private isNestedLoop(
    line: string,
    lines: string[],
    index: number,
    language: string
  ): boolean {
    const loopPatterns = [
      /\bfor\s*\(/,
      /\bwhile\s*\(/,
      /\.forEach\s*\(/,
      /\.map\s*\(/,
      /\.filter\s*\(/,
    ];

    if (!loopPatterns.some((pattern) => pattern.test(line))) {
      return false;
    }

    // Look for another loop within a reasonable distance
    let braceCount = 0;
    let foundNestedLoop = false;

    for (let i = index + 1; i < Math.min(lines.length, index + 20); i++) {
      const currentLine = lines[i];
      braceCount += (currentLine.match(/{/g) || []).length;
      braceCount -= (currentLine.match(/}/g) || []).length;

      if (braceCount < 0) break;

      if (loopPatterns.some((pattern) => pattern.test(currentLine))) {
        foundNestedLoop = true;
        break;
      }
    }

    return foundNestedLoop;
  }

  /**
   * Check for inefficient string concatenation
   */
  private isInefficientStringConcatenation(
    line: string,
    language: string
  ): boolean {
    if (language === 'javascript' || language === 'typescript') {
      return /\w+\s*\+=\s*["']/.test(line) && line.includes('for');
    }
    if (language === 'python') {
      return /\w+\s*\+=\s*["']/.test(line);
    }
    if (language === 'java' || language === 'csharp') {
      return /String\s+\w+\s*=.*\+/.test(line) && line.includes('for');
    }
    return false;
  }

  /**
   * Check for database queries in loops
   */
  private isQueryInLoop(
    line: string,
    lines: string[],
    index: number,
    language: string
  ): boolean {
    const queryPatterns = [
      /\.query\s*\(/,
      /\.execute\s*\(/,
      /SELECT\s+/i,
      /INSERT\s+/i,
      /UPDATE\s+/i,
      /DELETE\s+/i,
      /\.find\s*\(/,
      /\.save\s*\(/,
    ];

    if (!queryPatterns.some((pattern) => pattern.test(line))) {
      return false;
    }

    // Check if we're inside a loop
    for (let i = index - 10; i < index; i++) {
      if (i >= 0 && lines[i]) {
        if (/\b(for|while|forEach)\b/.test(lines[i])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for synchronous file operations
   */
  private isSyncFileOperation(line: string, language: string): boolean {
    if (language === 'javascript' || language === 'typescript') {
      const syncPatterns = [
        /fs\.readFileSync/,
        /fs\.writeFileSync/,
        /fs\.existsSync/,
        /fs\.statSync/,
      ];
      return syncPatterns.some((pattern) => pattern.test(line));
    }
    return false;
  }

  /**
   * Check for object creation in loops
   */
  private isObjectCreationInLoop(
    line: string,
    lines: string[],
    index: number,
    language: string
  ): boolean {
    const objectPatterns = [
      /new\s+\w+\s*\(/,
      /\{\s*\w+:/,
      /\[\s*\w+/,
      /Object\.create/,
    ];

    if (!objectPatterns.some((pattern) => pattern.test(line))) {
      return false;
    }

    // Check if we're inside a loop
    for (let i = index - 10; i < index; i++) {
      if (i >= 0 && lines[i]) {
        if (/\b(for|while|forEach)\b/.test(lines[i])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for missing caching opportunities
   */
  private isMissingCaching(line: string, language: string): boolean {
    const expensiveOperations = [
      /Math\.(sin|cos|sqrt|pow)/,
      /JSON\.parse/,
      /JSON\.stringify/,
      /\w+\.match\(/,
      /\w+\.replace\(/,
      /fetch\(/,
      /axios\./,
    ];

    return expensiveOperations.some((pattern) => pattern.test(line));
  }

  /**
   * Check for inefficient array operations
   */
  private isInefficientArrayOperation(line: string, language: string): boolean {
    if (language === 'javascript' || language === 'typescript') {
      // Array operations that could be optimized
      const inefficientPatterns = [
        /\.indexOf\s*\([^)]+\)\s*!\s*=\s*-1/, // Use includes() instead
        /\.splice\s*\(\s*0\s*,\s*1\s*\)/, // Use shift() instead
        /\.slice\s*\(\s*0\s*,\s*-1\s*\)/, // Use pop() instead
        /for\s*\(.*\.length\s*\)/, // Cache length
      ];
      return inefficientPatterns.some((pattern) => pattern.test(line));
    }
    return false;
  }

  /**
   * Check for memory leak potential
   */
  private isMemoryLeakPotential(line: string, language: string): boolean {
    if (language === 'javascript' || language === 'typescript') {
      const leakPatterns = [
        /addEventListener\s*\((?!.*removeEventListener)/,
        /setInterval\s*\((?!.*clearInterval)/,
        /setTimeout\s*\((?!.*clearTimeout)/,
        /new\s+EventSource\s*\((?!.*close)/,
      ];
      return leakPatterns.some((pattern) => pattern.test(line));
    }
    return false;
  }

  /**
   * Check for blocking operations in async context
   */
  private isBlockingInAsyncContext(
    line: string,
    lines: string[],
    index: number,
    language: string
  ): boolean {
    if (language !== 'javascript' && language !== 'typescript') {
      return false;
    }

    const blockingPatterns = [
      /fs\.readFileSync/,
      /fs\.writeFileSync/,
      /JSON\.parse\(.*large/i,
      /while\s*\(true\)/,
    ];

    if (!blockingPatterns.some((pattern) => pattern.test(line))) {
      return false;
    }

    // Check if we're in an async function
    for (let i = index - 20; i < index; i++) {
      if (i >= 0 && lines[i]) {
        if (/async\s+function|async\s*\(/.test(lines[i])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for inefficient DOM operations
   */
  private isInefficientDOMOperation(line: string, language: string): boolean {
    if (language !== 'javascript' && language !== 'typescript') {
      return false;
    }

    const inefficientDOMPatterns = [
      /document\.getElementById.*for/,
      /querySelector.*for/,
      /innerHTML\s*\+=/, // Use textContent or createElement
      /document\.createElement.*for/,
    ];

    return inefficientDOMPatterns.some((pattern) => pattern.test(line));
  }

  /**
   * Create performance issue objects
   */
  private createNestedLoopIssue(line: string, lineNumber: number): AuditIssue {
    return {
      id: `nested_loop_${lineNumber}`,
      location: { line: lineNumber },
      severity: 'high',
      type: 'nested_loops',
      category: 'performance',
      title: 'Nested loops detected (O(n²) complexity)',
      description:
        'Nested loops can cause performance issues with large datasets',
      suggestion:
        'Consider using maps, sets, or other data structures to reduce complexity',
      confidence: 0.9,
      fixable: true,
      ruleId: 'PERF001',
      effort: 'medium',
    };
  }

  private createStringConcatenationIssue(
    line: string,
    lineNumber: number
  ): AuditIssue {
    return {
      id: `string_concat_${lineNumber}`,
      location: { line: lineNumber },
      severity: 'medium',
      type: 'inefficient_string_concatenation',
      category: 'performance',
      title: 'Inefficient string concatenation',
      description: 'String concatenation in loops can be slow',
      suggestion:
        'Use StringBuilder, string templates, or array.join() for better performance',
      confidence: 0.8,
      fixable: true,
      ruleId: 'PERF002',
      effort: 'low',
    };
  }

  private createQueryInLoopIssue(line: string, lineNumber: number): AuditIssue {
    return {
      id: `query_in_loop_${lineNumber}`,
      location: { line: lineNumber },
      severity: 'critical',
      type: 'database_query_in_loop',
      category: 'performance',
      title: 'Database query inside loop (N+1 problem)',
      description:
        'Running database queries in loops can severely impact performance',
      suggestion: 'Batch queries or use joins to fetch all data at once',
      confidence: 0.9,
      fixable: true,
      ruleId: 'PERF003',
      effort: 'medium',
    };
  }

  private createSyncFileOperationIssue(
    line: string,
    lineNumber: number
  ): AuditIssue {
    return {
      id: `sync_file_op_${lineNumber}`,
      location: { line: lineNumber },
      severity: 'medium',
      type: 'synchronous_file_operation',
      category: 'performance',
      title: 'Synchronous file operation blocks event loop',
      description: 'Synchronous file operations can block the main thread',
      suggestion: 'Use asynchronous file operations instead',
      confidence: 0.9,
      fixable: true,
      ruleId: 'PERF004',
      effort: 'low',
    };
  }

  private createObjectCreationInLoopIssue(
    line: string,
    lineNumber: number
  ): AuditIssue {
    return {
      id: `object_creation_loop_${lineNumber}`,
      location: { line: lineNumber },
      severity: 'medium',
      type: 'object_creation_in_loop',
      category: 'performance',
      title: 'Object creation inside loop',
      description:
        'Creating objects in loops can cause garbage collection pressure',
      suggestion: 'Move object creation outside the loop or use object pooling',
      confidence: 0.7,
      fixable: true,
      ruleId: 'PERF005',
      effort: 'medium',
    };
  }

  private createMissingCachingIssue(
    line: string,
    lineNumber: number
  ): AuditIssue {
    return {
      id: `missing_caching_${lineNumber}`,
      location: { line: lineNumber },
      severity: 'low',
      type: 'missing_caching',
      category: 'performance',
      title: 'Expensive operation could benefit from caching',
      description: 'Repetitive expensive operations should be cached',
      suggestion: 'Implement caching for this operation if called frequently',
      confidence: 0.6,
      fixable: true,
      ruleId: 'PERF006',
      effort: 'medium',
    };
  }

  private createInefficientArrayOperationIssue(
    line: string,
    lineNumber: number
  ): AuditIssue {
    return {
      id: `inefficient_array_${lineNumber}`,
      location: { line: lineNumber },
      severity: 'low',
      type: 'inefficient_array_operation',
      category: 'performance',
      title: 'Inefficient array operation',
      description: 'Array operation could be optimized',
      suggestion: 'Use more efficient array methods or cache array length',
      confidence: 0.8,
      fixable: true,
      ruleId: 'PERF007',
      effort: 'low',
    };
  }

  private createMemoryLeakIssue(line: string, lineNumber: number): AuditIssue {
    return {
      id: `memory_leak_${lineNumber}`,
      location: { line: lineNumber },
      severity: 'high',
      type: 'potential_memory_leak',
      category: 'performance',
      title: 'Potential memory leak',
      description:
        'Event listener or timer without cleanup can cause memory leaks',
      suggestion:
        'Add proper cleanup (removeEventListener, clearInterval, etc.)',
      confidence: 0.7,
      fixable: true,
      ruleId: 'PERF008',
      effort: 'low',
    };
  }

  private createBlockingOperationIssue(
    line: string,
    lineNumber: number
  ): AuditIssue {
    return {
      id: `blocking_async_${lineNumber}`,
      location: { line: lineNumber },
      severity: 'high',
      type: 'blocking_operation_in_async',
      category: 'performance',
      title: 'Blocking operation in async function',
      description: 'Blocking operations defeat the purpose of async functions',
      suggestion:
        'Use async alternatives for file operations and CPU-intensive tasks',
      confidence: 0.9,
      fixable: true,
      ruleId: 'PERF009',
      effort: 'medium',
    };
  }

  private createDOMOperationIssue(
    line: string,
    lineNumber: number
  ): AuditIssue {
    return {
      id: `dom_operation_${lineNumber}`,
      location: { line: lineNumber },
      severity: 'medium',
      type: 'inefficient_dom_operation',
      category: 'performance',
      title: 'Inefficient DOM operation',
      description: 'DOM operations in loops or repetitive queries can be slow',
      suggestion:
        'Cache DOM elements, use document fragments, or batch DOM updates',
      confidence: 0.8,
      fixable: true,
      ruleId: 'PERF010',
      effort: 'medium',
    };
  }

  /**
   * Adjust severity based on performance criticality
   */
  private adjustSeverityForContext(
    issues: AuditIssue[],
    context?: any
  ): AuditIssue[] {
    if (!context?.performanceCritical) {
      return issues;
    }

    return issues.map((issue) => {
      // Increase severity for performance-critical code
      if (issue.severity === 'low') {
        issue.severity = 'medium';
      } else if (issue.severity === 'medium') {
        issue.severity = 'high';
      }

      issue.impact = 'Performance-critical code requires optimization';
      return issue;
    });
  }

  /**
   * Deduplicate issues by line number and type
   */
  private deduplicateIssues(issues: AuditIssue[]): AuditIssue[] {
    const seen = new Set<string>();
    return issues.filter((issue) => {
      const key = `${issue.location.line}_${issue.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}
