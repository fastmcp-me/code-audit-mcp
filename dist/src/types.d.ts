/**
 * Core types and interfaces for the MCP Code Audit Server
 */
export type AuditType = 'security' | 'completeness' | 'performance' | 'quality' | 'architecture' | 'testing' | 'documentation' | 'all';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Priority = 'fast' | 'thorough';
export type ProjectType = 'web' | 'api' | 'cli' | 'library' | 'mobile' | 'desktop' | 'backend' | 'frontend' | 'fullstack' | 'database' | 'devops' | 'data-science' | 'machine-learning' | 'blockchain' | 'iot' | 'game-dev' | 'other';
export type Environment = 'production' | 'development' | 'testing';
export interface AuditContext {
    framework?: string;
    environment?: Environment;
    performanceCritical?: boolean;
    teamSize?: number;
    projectType?: ProjectType;
    languageVersion?: string;
    lintingRules?: string[];
}
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
export interface CodeLocation {
    line: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
}
export interface AuditIssue {
    id: string;
    location: CodeLocation;
    severity: Severity;
    type: string;
    category: AuditType;
    title: string;
    description: string;
    suggestion?: string;
    codeSnippet?: string;
    confidence: number;
    fixable: boolean;
    ruleId?: string;
    documentation?: string;
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
    testCoverage?: number;
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
    tokensUsed?: number;
}
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
    severity: Severity[];
    rules: Record<string, boolean>;
    customPrompts?: string[];
    thresholds?: Record<string, number>;
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
export type AuditTypeExcluding<T extends AuditType> = Exclude<AuditType, T>;
export type RequiredAuditRequest = Required<Pick<AuditRequest, 'code' | 'language' | 'auditType'>>;
export type PartialAuditResult = Partial<AuditResult> & Pick<AuditResult, 'requestId' | 'issues'>;
export interface AuditEvent {
    type: 'audit_started' | 'audit_completed' | 'audit_failed' | 'model_switched';
    requestId: string;
    timestamp: string;
    data?: Record<string, unknown>;
}
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
//# sourceMappingURL=types.d.ts.map