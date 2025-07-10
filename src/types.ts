/**
 * Core types and interfaces for the MCP Code Audit Server
 */

export type AuditType = 
  | 'security' 
  | 'completeness' 
  | 'performance' 
  | 'quality' 
  | 'architecture' 
  | 'testing' 
  | 'documentation' 
  | 'all';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type Priority = 'fast' | 'thorough';

export type ProjectType = 'web' | 'api' | 'cli' | 'library' | 'mobile' | 'desktop' | 'backend' | 'frontend' | 'fullstack' | 'database' | 'devops' | 'data-science' | 'machine-learning' | 'blockchain' | 'iot' | 'game-dev' | 'other';

export type Environment = 'production' | 'development' | 'testing';

export interface AuditContext {
  framework?: string;        // React, Express, Django, etc.
  environment?: Environment;
  performanceCritical?: boolean;
  teamSize?: number;
  projectType?: ProjectType;
  languageVersion?: string;  // e.g., "ES2022", "TypeScript 5.0"
  lintingRules?: string[];   // ESLint rules, etc.
}

export interface AuditRequest {
  code: string;
  language: string;
  auditType: AuditType;
  file?: string;
  context?: AuditContext;
  priority?: Priority;
  maxIssues?: number;        // Limit number of issues returned
  includeFixSuggestions?: boolean;
}

export interface CodeLocation {
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface AuditIssue {
  id: string;                // Unique identifier for the issue
  location: CodeLocation;
  severity: Severity;
  type: string;              // e.g., "sql_injection", "todo_comment"
  category: AuditType;       // Which audit type found this issue
  title: string;             // Short description
  description: string;       // Detailed description
  suggestion?: string;       // How to fix the issue
  codeSnippet?: string;      // Relevant code snippet
  confidence: number;        // 0-1 confidence score from AI
  fixable: boolean;          // Can be auto-fixed
  ruleId?: string;          // Reference to specific rule
  documentation?: string;    // Link to docs or standards
  impact?: string;          // Business/technical impact
  effort?: 'low' | 'medium' | 'high';  // Estimated fix effort
}

export interface AuditSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  byCategory: Record<AuditType, number>;
  byType: Record<string, number>;
}

export interface AuditCoverage {
  linesAnalyzed: number;
  functionsAnalyzed: number;
  classesAnalyzed: number;
  complexity: number;        // Average complexity score
  testCoverage?: number;     // If available
}

export interface AuditSuggestions {
  autoFixable: AuditIssue[];
  priorityFixes: AuditIssue[];
  quickWins: AuditIssue[];   // Low effort, high impact
  technicalDebt: AuditIssue[]; // Long-term improvements
}

export interface AuditMetrics {
  duration: number;          // Total analysis time in ms
  modelResponseTime: number; // AI model response time
  parsingTime: number;       // Code parsing time
  postProcessingTime: number; // Result processing time
  tokensUsed?: number;       // If available from model
}

export interface AuditResult {
  requestId: string;
  issues: AuditIssue[];
  summary: AuditSummary;
  coverage: AuditCoverage;
  suggestions: AuditSuggestions;
  metrics: AuditMetrics;
  model: string;             // Which AI model was used
  timestamp: string;         // ISO timestamp
  version: string;           // Auditor version
}

export interface ModelConfig {
  name: string;
  displayName: string;
  specialization: AuditType[];
  maxTokens: number;
  temperature: number;
  topP?: number;
  isAvailable?: boolean;     // Runtime availability check
  fallbackModels?: string[]; // Fallback options
  performance: {
    speed: 'fast' | 'medium' | 'slow';
    accuracy: 'high' | 'medium' | 'low';
    resourceUsage: 'low' | 'medium' | 'high';
  };
}

export interface OllamaClientConfig {
  host: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
}

export interface LanguageConfig {
  name: string;
  extensions: string[];
  keywords: string[];
  commentPatterns: {
    single: string[];
    multiStart: string[];
    multiEnd: string[];
  };
  complexityFactors: {
    loopWeight: number;
    conditionalWeight: number;
    functionWeight: number;
    nestingPenalty: number;
  };
}

export interface AuditorConfig {
  enabled: boolean;
  severity: Severity[];      // Which severities to include
  rules: Record<string, boolean>; // Specific rules to enable/disable
  customPrompts?: string[];  // Additional prompts
  thresholds?: Record<string, number>; // Numeric thresholds
}

export interface ServerConfig {
  name: string;
  version: string;
  ollama: OllamaClientConfig;
  models: Record<string, ModelConfig>;
  auditors: Record<AuditType, AuditorConfig>;
  languages: Record<string, LanguageConfig>;
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    enableTracing: boolean;
  };
  performance: {
    maxConcurrentAudits: number;
    cacheEnabled: boolean;
    cacheTtl: number;
  };
}

export interface AuditError {
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
  timestamp: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    ollama: boolean;
    models: Record<string, boolean>;
    auditors: Record<AuditType, boolean>;
  };
  timestamp: string;
  uptime: number;
}

// Utility types for better type safety
export type AuditTypeExcluding<T extends AuditType> = Exclude<AuditType, T>;
export type RequiredAuditRequest = Required<Pick<AuditRequest, 'code' | 'language' | 'auditType'>>;
export type PartialAuditResult = Partial<AuditResult> & Pick<AuditResult, 'requestId' | 'issues'>;

// Event types for logging and monitoring
export interface AuditEvent {
  type: 'audit_started' | 'audit_completed' | 'audit_failed' | 'model_switched';
  requestId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// Prompt template types
export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
  auditTypes: AuditType[];
  languages: string[];
}

export interface PromptContext {
  code: string;
  language: string;
  auditType: AuditType;
  context?: AuditContext;
  previousIssues?: AuditIssue[];
  codeMetrics?: {
    lineCount: number;
    functionCount: number;
    complexity: number;
  };
}