/**
 * Main MCP server implementation for code auditing
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { OllamaClient } from './ollama/client.js';
import {
  ModelManager,
  DefaultModelSelectionStrategy,
} from './ollama/models.js';
import { AuditorFactory, BaseAuditor } from './auditors/index.js';
import type {
  AuditRequest,
  AuditResult,
  ServerConfig,
  AuditType,
  HealthCheckResult,
  AuditorConfig,
} from './types.js';
import { logger } from './utils/mcp-logger.js';

// Internal interfaces for tool responses
interface ConfigUpdateArgs {
  auditors?: Record<string, Partial<AuditorConfig>>;
  ollama?: Record<string, unknown>;
}

/**
 * Default server configuration
 */
const DEFAULT_CONFIG: ServerConfig = {
  name: 'code-audit-mcp',
  version: '1.0.0',
  ollama: {
    host: 'http://localhost:11434',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    healthCheckInterval: 60000,
  },
  models: {},
  auditors: {
    security: {
      enabled: true,
      severity: ['critical', 'high', 'medium'],
      rules: {},
      thresholds: {},
    },
    completeness: {
      enabled: true,
      severity: ['critical', 'high', 'medium'],
      rules: {},
      thresholds: {},
    },
    performance: {
      enabled: true,
      severity: ['critical', 'high', 'medium'],
      rules: {},
      thresholds: {},
    },
    quality: {
      enabled: true,
      severity: ['high', 'medium', 'low'],
      rules: {},
      thresholds: {},
    },
    architecture: {
      enabled: true,
      severity: ['high', 'medium', 'low'],
      rules: {},
      thresholds: {},
    },
    testing: {
      enabled: true,
      severity: ['high', 'medium', 'low'],
      rules: {},
      thresholds: {},
    },
    documentation: {
      enabled: true,
      severity: ['medium', 'low', 'info'],
      rules: {},
      thresholds: {},
    },
    all: {
      enabled: true,
      severity: ['critical', 'high', 'medium', 'low'],
      rules: {},
      thresholds: {},
    },
  },
  languages: {},
  logging: {
    level: 'info',
    enableMetrics: true,
    enableTracing: false,
  },
  performance: {
    maxConcurrentAudits: 3,
    cacheEnabled: false,
    cacheTtl: 300,
  },
};

/**
 * Main MCP server class
 */
export class CodeAuditServer {
  private server: Server;
  private config: ServerConfig;
  private ollamaClient: OllamaClient;
  private modelManager: ModelManager;
  private auditors: Record<AuditType, BaseAuditor> = {} as Record<
    AuditType,
    BaseAuditor
  >;
  private activeAudits = new Map<
    string,
    {
      promise: Promise<AuditResult>;
      startTime: number;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.ollamaClient = new OllamaClient(this.config.ollama);
    this.modelManager = new ModelManager(new DefaultModelSelectionStrategy());

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Initialize the server
   */
  async initialize(): Promise<void> {
    try {
      logger.log('Initializing Code Audit MCP Server...');

      // Create auditors first (doesn't require Ollama connection)
      this.auditors = AuditorFactory.createAllAuditors(
        this.config.auditors,
        this.ollamaClient,
        this.modelManager
      );

      logger.log(
        `Server initialized with ${Object.keys(this.auditors).length} auditors`
      );

      // Initialize Ollama client in the background (non-blocking)
      this.initializeOllamaAsync();
    } catch (error) {
      logger.error('Failed to initialize server:', error);
      throw error;
    }
  }

  /**
   * Initialize Ollama client asynchronously
   */
  private async initializeOllamaAsync(): Promise<void> {
    try {
      await this.ollamaClient.initialize();
      logger.log('Ollama client connected successfully');

      // Perform health check after Ollama is ready
      const health = await this.healthCheck();
      if (health.status === 'unhealthy') {
        logger.warn(
          'Ollama health check failed - some features may be limited'
        );
      }
    } catch (error) {
      logger.warn(
        'Failed to connect to Ollama:',
        error instanceof Error ? error.message : error
      );
      logger.log(
        'Server will continue running - Ollama connection will be retried on demand'
      );
      // Ensure the error doesn't propagate as an unhandled rejection
      return;
    }
  }

  /**
   * Setup tool handlers
   */
  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'audit_code',
            description: 'Perform comprehensive code audit using AI models',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The code to audit',
                },
                language: {
                  type: 'string',
                  description: 'Programming language of the code',
                },
                auditType: {
                  type: 'string',
                  enum: [
                    'security',
                    'completeness',
                    'performance',
                    'quality',
                    'architecture',
                    'testing',
                    'documentation',
                    'all',
                  ],
                  description: 'Type of audit to perform',
                  default: 'all',
                },
                file: {
                  type: 'string',
                  description: 'Optional file path for context',
                },
                context: {
                  type: 'object',
                  description: 'Additional context for the audit',
                  properties: {
                    framework: { type: 'string' },
                    environment: {
                      type: 'string',
                      enum: ['production', 'development', 'testing'],
                    },
                    performanceCritical: { type: 'boolean' },
                    teamSize: { type: 'number' },
                    projectType: {
                      type: 'string',
                      enum: [
                        'web',
                        'api',
                        'cli',
                        'library',
                        'mobile',
                        'desktop',
                      ],
                    },
                  },
                },
                priority: {
                  type: 'string',
                  enum: ['fast', 'thorough'],
                  description:
                    'Audit priority (fast = security + completeness only)',
                  default: 'thorough',
                },
                maxIssues: {
                  type: 'number',
                  description: 'Maximum number of issues to return',
                  default: 50,
                },
                includeFixSuggestions: {
                  type: 'boolean',
                  description: 'Include fix suggestions in the response',
                  default: true,
                },
              },
              required: ['code', 'language'],
            },
          },
          {
            name: 'health_check',
            description: 'Check the health status of the audit server',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_models',
            description: 'List available AI models for auditing',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'update_config',
            description: 'Update server configuration',
            inputSchema: {
              type: 'object',
              properties: {
                auditors: {
                  type: 'object',
                  description: 'Auditor configurations to update',
                },
                ollama: {
                  type: 'object',
                  description: 'Ollama client configuration',
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'audit_code':
            return await this.handleAuditCode(args as unknown as AuditRequest);

          case 'health_check':
            return await this.handleHealthCheck();

          case 'list_models':
            return await this.handleListModels();

          case 'update_config':
            return await this.handleUpdateConfig(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        logger.error(`Tool ${name} failed:`, error);
        if (error) logger.error('Error stack:', error.stack);

        if (error instanceof McpError) {
          throw error;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Truly unknown error - check server logs';
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  /**
   * Handle audit_code tool requests
   */
  private async handleAuditCode(
    request: AuditRequest
  ): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    // Validate request
    this.validateAuditRequest(request);

    // Check for duplicate audits
    const requestKey = this.generateRequestKey(request);
    const existingAudit = this.activeAudits.get(requestKey);
    if (existingAudit) {
      logger.log('Audit already in progress, waiting for completion...');
      const result = await existingAudit.promise;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Create audit promise with timeout
    const auditPromise = this.performAudit(request);
    const auditTimeout = 300000; // 5 minutes

    // Create timeout that will clean up the audit
    const timeout = setTimeout(() => {
      const audit = this.activeAudits.get(requestKey);
      if (audit) {
        logger.error(
          `Audit ${requestKey} timed out after ${auditTimeout / 1000} seconds`
        );
        this.activeAudits.delete(requestKey);
      }
    }, auditTimeout);

    // Store audit metadata
    this.activeAudits.set(requestKey, {
      promise: auditPromise,
      startTime: Date.now(),
      timeout,
    });

    try {
      const result = await auditPromise;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } finally {
      // Clean up audit and cancel timeout
      const audit = this.activeAudits.get(requestKey);
      if (audit) {
        clearTimeout(audit.timeout);
        this.activeAudits.delete(requestKey);
      }
    }
  }

  /**
   * Perform the actual audit
   */
  private async performAudit(request: AuditRequest): Promise<AuditResult> {
    const startTime = Date.now();

    try {
      // Handle 'all' audit type
      if (request.auditType === 'all') {
        return await this.performMultipleAudits(request);
      }

      // Handle fast mode (security + completeness only)
      if (request.priority === 'fast') {
        return await this.performFastModeAudit(request);
      }

      // Handle single audit type
      const auditor = this.auditors[request.auditType];
      if (!auditor) {
        throw new Error(`Auditor not available for type: ${request.auditType}`);
      }

      const result = await auditor.audit(request);

      // Log metrics
      this.logAuditMetrics(request, result, Date.now() - startTime);

      return result;
    } catch (error) {
      logger.error('Audit failed:', error);
      throw error;
    }
  }

  /**
   * Perform multiple audits for 'all' type
   */
  private async performMultipleAudits(
    request: AuditRequest
  ): Promise<AuditResult> {
    const auditTypes: AuditType[] = [
      'security',
      'completeness',
      'performance',
      'quality',
      'architecture',
      'testing',
      'documentation',
    ];
    const results: AuditResult[] = [];

    // Run audits in parallel (up to maxConcurrentAudits)
    const concurrentLimit = this.config.performance.maxConcurrentAudits;
    const chunks = this.chunkArray(auditTypes, concurrentLimit);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (auditType) => {
        const auditor = this.auditors[auditType];
        if (auditor) {
          const auditRequest = { ...request, auditType };
          return await auditor.audit(auditRequest);
        }
        return null;
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(
        ...(chunkResults.filter((result) => result !== null) as AuditResult[])
      );
    }

    // Merge results
    return this.mergeAuditResults(results, request);
  }

  /**
   * Perform fast mode audit (security + completeness only)
   */
  private async performFastModeAudit(
    request: AuditRequest
  ): Promise<AuditResult> {
    const fastAuditTypes: AuditType[] = ['security', 'completeness'];
    const results: AuditResult[] = [];

    for (const auditType of fastAuditTypes) {
      const auditor = this.auditors[auditType];
      if (auditor) {
        const auditRequest = {
          ...request,
          auditType,
          priority: 'fast' as const,
        };
        const result = await auditor.audit(auditRequest);
        results.push(result);
      }
    }

    return this.mergeAuditResults(results, request);
  }

  /**
   * Handle health_check tool requests
   */
  private async handleHealthCheck(): Promise<{
    content: Array<{ type: 'text'; text: string }>;
  }> {
    const health = await this.healthCheck();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(health, null, 2),
        },
      ],
    };
  }

  /**
   * Handle list_models tool requests
   */
  private async handleListModels(): Promise<{
    content: Array<{ type: 'text'; text: string }>;
  }> {
    const availableModels = this.ollamaClient.getAvailableModels();
    const allModels = this.modelManager.getAllModels();
    const modelMetrics = this.ollamaClient.getAllMetrics();

    const modelInfo = allModels.map((config) => ({
      ...config,
      available: availableModels.includes(config.name),
      metrics: modelMetrics[config.name] || null,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ models: modelInfo }, null, 2),
        },
      ],
    };
  }

  /**
   * Handle update_config tool requests
   */
  private async handleUpdateConfig(
    args: ConfigUpdateArgs
  ): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    try {
      if (args.auditors) {
        for (const [auditType, config] of Object.entries(args.auditors)) {
          if (this.auditors[auditType as AuditType]) {
            this.auditors[auditType as AuditType].updateConfig(config);
          }
        }
      }

      if (args.ollama) {
        // Note: Ollama config updates would require client recreation
        logger.log('Ollama config update requested (requires restart)');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { message: 'Configuration updated successfully' },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate audit request
   */
  private validateAuditRequest(request: AuditRequest): void {
    if (!request.code?.trim()) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Code is required and cannot be empty'
      );
    }

    if (!request.language?.trim()) {
      throw new McpError(ErrorCode.InvalidParams, 'Language is required');
    }

    if (request.code.length > 100000) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Code size exceeds limit (100KB)'
      );
    }

    const validAuditTypes: AuditType[] = [
      'security',
      'completeness',
      'performance',
      'quality',
      'architecture',
      'testing',
      'documentation',
      'all',
    ];
    if (!validAuditTypes.includes(request.auditType)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid audit type: ${request.auditType}`
      );
    }
  }

  /**
   * Generate request key for deduplication
   */
  private generateRequestKey(request: AuditRequest): string {
    const hash = this.simpleHash(request.code);
    return `${request.language}_${request.auditType}_${request.priority || 'thorough'}_${hash}`;
  }

  /**
   * Simple hash function for code deduplication
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Merge multiple audit results
   */
  private mergeAuditResults(
    results: AuditResult[],
    request: AuditRequest
  ): AuditResult {
    if (results.length === 0) {
      throw new Error('No audit results to merge');
    }

    if (results.length === 1) {
      return results[0];
    }

    const merged: AuditResult = {
      requestId: results[0].requestId,
      issues: [],
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        byCategory: {} as Record<AuditType, number>,
        byType: {},
      },
      coverage: {
        linesAnalyzed: 0,
        functionsAnalyzed: 0,
        classesAnalyzed: 0,
        complexity: 0,
      },
      suggestions: {
        autoFixable: [],
        priorityFixes: [],
        quickWins: [],
        technicalDebt: [],
      },
      metrics: {
        duration: 0,
        modelResponseTime: 0,
        parsingTime: 0,
        postProcessingTime: 0,
      },
      model: results.map((r) => r.model).join(', '),
      timestamp: new Date().toISOString(),
      version: results[0].version,
    };

    // Merge all issues
    for (const result of results) {
      merged.issues.push(...result.issues);

      // Update summary
      merged.summary.total += result.summary.total;
      merged.summary.critical += result.summary.critical;
      merged.summary.high += result.summary.high;
      merged.summary.medium += result.summary.medium;
      merged.summary.low += result.summary.low;
      merged.summary.info += result.summary.info;

      // Merge categories
      for (const [category, count] of Object.entries(
        result.summary.byCategory
      )) {
        merged.summary.byCategory[category as AuditType] =
          (merged.summary.byCategory[category as AuditType] || 0) + count;
      }

      // Merge types
      for (const [type, count] of Object.entries(result.summary.byType)) {
        merged.summary.byType[type] =
          (merged.summary.byType[type] || 0) + count;
      }

      // Merge suggestions
      merged.suggestions.autoFixable.push(...result.suggestions.autoFixable);
      merged.suggestions.priorityFixes.push(
        ...result.suggestions.priorityFixes
      );
      merged.suggestions.quickWins.push(...result.suggestions.quickWins);
      merged.suggestions.technicalDebt.push(
        ...result.suggestions.technicalDebt
      );

      // Update metrics
      merged.metrics.duration += result.metrics.duration;
      merged.metrics.modelResponseTime += result.metrics.modelResponseTime;
      merged.metrics.parsingTime += result.metrics.parsingTime;
      merged.metrics.postProcessingTime += result.metrics.postProcessingTime;

      // Use max coverage values
      merged.coverage.linesAnalyzed = Math.max(
        merged.coverage.linesAnalyzed,
        result.coverage.linesAnalyzed
      );
      merged.coverage.functionsAnalyzed = Math.max(
        merged.coverage.functionsAnalyzed,
        result.coverage.functionsAnalyzed
      );
      merged.coverage.classesAnalyzed = Math.max(
        merged.coverage.classesAnalyzed,
        result.coverage.classesAnalyzed
      );
      merged.coverage.complexity = Math.max(
        merged.coverage.complexity,
        result.coverage.complexity
      );
    }

    // Sort merged issues by severity and line number
    merged.issues.sort((a, b) => {
      const severityOrder = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
        info: 4,
      };
      const severityDiff =
        severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.location.line - b.location.line;
    });

    // Apply max issues limit
    if (request.maxIssues && merged.issues.length > request.maxIssues) {
      merged.issues = merged.issues.slice(0, request.maxIssues);
    }

    return merged;
  }

  /**
   * Perform health check
   */
  private async healthCheck(): Promise<HealthCheckResult> {
    const health = await this.ollamaClient.healthCheck();

    // Add auditor health checks
    for (const [auditType, auditor] of Object.entries(this.auditors)) {
      health.checks.auditors[auditType as AuditType] = auditor !== undefined;
    }

    return health;
  }

  /**
   * Log audit metrics
   */
  private logAuditMetrics(
    request: AuditRequest,
    result: AuditResult,
    totalTime: number
  ): void {
    if (!this.config.logging.enableMetrics) {
      return;
    }

    logger.log(
      `Audit completed: ${request.auditType} (${request.language}) - ${result.issues.length} issues found in ${totalTime}ms`
    );
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      logger.error('MCP Server error:', error);
    };

    process.on('SIGINT', async () => {
      logger.log('Shutting down server...');
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.log('Shutting down server...');
      await this.cleanup();
      process.exit(0);
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    await this.initialize();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.log('Code Audit MCP Server is running');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.ollamaClient.cleanup();
      logger.log('Server cleanup completed');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

/**
 * Start server if this file is run directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  // Add unhandled rejection handlers
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in stdio mode to allow proper error reporting
    if (process.env.MCP_STDIO_MODE !== 'true') {
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Don't exit in stdio mode to allow proper error reporting
    if (process.env.MCP_STDIO_MODE !== 'true') {
      process.exit(1);
    }
  });

  const server = new CodeAuditServer();
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}
