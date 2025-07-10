/**
 * Type definitions for the Code Audit MCP Server
 */

// Base audit types
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
export type Environment = 'production' | 'development' | 'testing';
export type ProjectType =
  | 'web'
  | 'api'
  | 'cli'
  | 'library'
  | 'mobile'
  | 'desktop';

// Configuration types
export interface ServerConfig {
  name: string;
  version: string;
  ollama: OllamaConfig;
  models: Record<string, ModelConfig>;
  auditors: Record<AuditType, AuditorConfig>;
  languages: Record<string, LanguageConfig>;
  logging: LoggingConfig;
  performance: PerformanceConfig;
}

export interface OllamaConfig {
  host: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
}

export interface AuditorConfig {
  enabled: boolean;
  severity: Severity[];
  rules: Record<string, boolean>;
  thresholds: Record<string, number>;
}

export interface LoggingConfig {
  level: string;
  enableMetrics: boolean;
  enableTracing: boolean;
}

export interface PerformanceConfig {
  maxConcurrentAudits: number;
  cacheEnabled: boolean;
  cacheTtl: number;
}

export interface LanguageConfig {
  name: string;
  extensions: string[];
  parser?: string;
  framework?: string;
  linter?: string;
  testFramework?: string;
}

// Model configuration
export interface ModelConfig {
  name: string;
  displayName: string;
  specialization: AuditType[];
  maxTokens: number;
  temperature: number;
  topP?: number;
  isAvailable?: boolean;
  fallbackModels?: string[];
  performance: {
    speed: 'fast' | 'medium' | 'slow';
    accuracy: 'high' | 'medium' | 'low';
    resourceUsage: 'low' | 'medium' | 'high';
  };
}

// Audit request and context
export interface AuditRequest {
  code: string;
  language: string;
  auditType: AuditType;
  file?: string;
  context?: AuditContext;
  priority?: Priority;
  maxIssues?: number;
  includeFixSuggestions?: boolean;
}

export interface AuditContext {
  framework?: string;
  environment?: Environment;
  performanceCritical?: boolean;
  teamSize?: number;
  projectType?: ProjectType;
}

// Audit results
export interface AuditResult {
  requestId: string;
  issues: AuditIssue[];
  summary: AuditSummary;
  coverage: AuditCoverage;
  suggestions: AuditSuggestions;
  metrics: AuditMetrics;
  model: string;
  timestamp: string;
  version: string;
}

export interface AuditIssue {
  id: string;
  location: {
    line: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
  };
  severity: Severity;
  type: string;
  category: AuditType;
  title: string;
  description: string;
  suggestion?: string;
  confidence: number;
  fixable: boolean;
  ruleId?: string;
  documentation?: string;
  codeSnippet?: string;
  impact?: string;
  effort?: 'low' | 'medium' | 'high';
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
  complexity: number;
}

export interface AuditSuggestions {
  autoFixable: AuditIssue[];
  priorityFixes: AuditIssue[];
  quickWins: AuditIssue[];
  technicalDebt: AuditIssue[];
}

export interface AuditMetrics {
  duration: number;
  modelResponseTime: number;
  parsingTime: number;
  postProcessingTime: number;
}

// Health check
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    ollama: {
      status: boolean;
      version?: string;
      models: string[];
      lastCheck: string;
    };
    auditors: Record<AuditType, boolean>;
    system: {
      memory: number;
      disk: number;
    };
  };
  errors?: string[];
}

// Error types
export interface AuditError {
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
  timestamp: string;
}

// Prompt templates
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

// Log entry
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  category: string;
}
