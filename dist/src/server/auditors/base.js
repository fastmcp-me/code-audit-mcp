/**
 * Base auditor abstract class with common functionality
 */
import { randomUUID } from 'crypto';
import { generatePrompt, generateFastModePrompt } from '../ollama/prompts.js';
export class BaseAuditor {
    auditType;
    config;
    ollamaClient;
    modelManager;
    constructor(config, ollamaClient, modelManager) {
        this.config = config;
        this.ollamaClient = ollamaClient;
        this.modelManager = modelManager;
    }
    /**
     * Main audit method - implements the core audit workflow
     */
    async audit(request) {
        const startTime = Date.now();
        const requestId = randomUUID();
        try {
            // Validate request
            this.validateRequest(request);
            // Check if this auditor is enabled for the request
            if (!this.shouldAudit(request)) {
                return this.createEmptyResult(requestId, startTime);
            }
            // Detect language and prepare context
            const language = this.detectLanguage(request.code, request.language);
            const codeMetrics = await this.analyzeCodeMetrics(request.code, language);
            // Select appropriate model
            const model = this.selectModel(request, language);
            if (!model) {
                throw this.createError('NO_AVAILABLE_MODEL', 'No suitable model available for audit');
            }
            // Generate audit prompt
            const promptContext = {
                code: request.code,
                language,
                auditType: this.auditType,
                context: request.context,
                codeMetrics,
            };
            const prompt = request.priority === 'fast'
                ? generateFastModePrompt(promptContext)
                : generatePrompt(promptContext);
            // Perform AI analysis
            const aiStartTime = Date.now();
            const aiResponse = await this.ollamaClient.generate({
                model,
                prompt,
                temperature: this.getTemperature(),
                max_tokens: this.getMaxTokens(),
            });
            const aiEndTime = Date.now();
            // Parse and validate AI response
            const rawIssues = await this.parseAIResponse(aiResponse.response);
            // Post-process issues
            const issues = await this.postProcessIssues(rawIssues, request, language);
            // Filter and sort issues
            const filteredIssues = this.filterIssues(issues, request);
            const sortedIssues = this.sortIssues(filteredIssues);
            // Create final result
            const result = this.createResult(requestId, sortedIssues, model, startTime, aiEndTime - aiStartTime, codeMetrics);
            return result;
        }
        catch (error) {
            console.error(`Audit failed for ${this.auditType}:`, error);
            throw error instanceof Error
                ? error
                : this.createError('AUDIT_FAILED', 'Unknown audit error');
        }
    }
    /**
     * Validate the audit request
     */
    validateRequest(request) {
        if (!request.code?.trim()) {
            throw this.createError('INVALID_REQUEST', 'Code is required and cannot be empty');
        }
        if (!request.language?.trim()) {
            throw this.createError('INVALID_REQUEST', 'Language is required');
        }
        if (request.code.length > 50000) {
            throw this.createError('CODE_TOO_LARGE', 'Code exceeds maximum size limit (50KB)');
        }
    }
    /**
     * Check if this auditor should run for the given request
     */
    shouldAudit(request) {
        // Check if auditor is enabled
        if (!this.config.enabled) {
            return false;
        }
        // Check if audit type matches (or if it's 'all')
        if (request.auditType !== 'all' && request.auditType !== this.auditType) {
            return false;
        }
        // Check fast mode compatibility
        if (request.priority === 'fast') {
            return this.auditType === 'security' || this.auditType === 'completeness';
        }
        return true;
    }
    /**
     * Detect or validate the programming language
     */
    detectLanguage(code, declaredLanguage) {
        // For now, trust the declared language
        // Could implement language detection heuristics here
        return declaredLanguage.toLowerCase();
    }
    /**
     * Analyze basic code metrics
     */
    async analyzeCodeMetrics(code, _language) {
        const lines = code.split('\n');
        const lineCount = lines.length;
        // Simple function counting (language-agnostic)
        const functionPatterns = [
            /function\s+\w+/g, // JavaScript/TypeScript functions
            /def\s+\w+/g, // Python functions
            /\w+\s*\([^)]*\)\s*{/g, // C-style functions
            /fn\s+\w+/g, // Rust functions
            /func\s+\w+/g, // Go functions
        ];
        let functionCount = 0;
        for (const pattern of functionPatterns) {
            const matches = code.match(pattern);
            if (matches) {
                functionCount += matches.length;
            }
        }
        // Simple complexity estimation
        const complexityPatterns = [
            /\bif\b/g,
            /\belse\b/g,
            /\bwhile\b/g,
            /\bfor\b/g,
            /\bswitch\b/g,
            /\btry\b/g,
            /\bcatch\b/g,
        ];
        let complexity = 1; // Base complexity
        for (const pattern of complexityPatterns) {
            const matches = code.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        }
        return {
            lineCount,
            functionCount,
            complexity: Math.round(complexity / Math.max(functionCount, 1)),
        };
    }
    /**
     * Select the best model for this audit
     */
    selectModel(request, language) {
        const availableModels = this.ollamaClient.getAvailableModels();
        const priority = request.priority || 'thorough';
        return this.modelManager.selectModel(this.auditType, language, priority, availableModels);
    }
    /**
     * Get temperature for model generation
     */
    getTemperature() {
        return 0.1; // Low temperature for consistent, factual analysis
    }
    /**
     * Get max tokens for model generation
     */
    getMaxTokens() {
        return 2048; // Sufficient for structured issue reports
    }
    /**
     * Parse AI response into structured issues
     */
    async parseAIResponse(response) {
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                response.match(/(\{[\s\S]*\})/);
            if (!jsonMatch) {
                throw new Error('No JSON found in AI response');
            }
            const jsonStr = jsonMatch[1];
            const parsed = JSON.parse(jsonStr);
            if (!parsed.issues || !Array.isArray(parsed.issues)) {
                throw new Error('Invalid response format: missing issues array');
            }
            return parsed.issues;
        }
        catch (error) {
            console.error('Failed to parse AI response:', error);
            console.error('Raw response:', response);
            // Try to extract issues manually if JSON parsing fails
            return this.fallbackParseResponse(response);
        }
    }
    /**
     * Fallback parsing when JSON parsing fails
     */
    fallbackParseResponse(response) {
        // Very basic fallback - look for line numbers and descriptions
        const issues = [];
        const lines = response.split('\n');
        for (const line of lines) {
            const lineMatch = line.match(/line\s*(\d+)/i);
            if (lineMatch) {
                issues.push({
                    location: { line: parseInt(lineMatch[1]) },
                    severity: 'medium',
                    type: 'parse_fallback',
                    category: this.auditType,
                    title: 'Issue detected (parsing fallback)',
                    description: line.trim(),
                    confidence: 0.3,
                    fixable: false,
                });
            }
        }
        return issues;
    }
    /**
     * Post-process and validate issues from AI
     */
    async postProcessIssues(rawIssues, request, _language) {
        const issues = [];
        for (const raw of rawIssues) {
            try {
                const issue = this.validateAndNormalizeIssue(raw, request, _language);
                if (issue) {
                    issues.push(issue);
                }
            }
            catch (error) {
                console.warn('Failed to process issue:', error, raw);
                // Continue processing other issues
            }
        }
        return issues;
    }
    /**
     * Validate and normalize a single issue
     */
    validateAndNormalizeIssue(raw, request, _language) {
        // Required fields validation
        if (!raw.location?.line || !raw.title || !raw.description) {
            return null;
        }
        // Normalize severity
        const severity = this.normalizeSeverity(raw.severity);
        // Generate unique ID
        const id = randomUUID();
        // Ensure confidence is in valid range
        const confidence = Math.max(0, Math.min(1, raw.confidence || 0.5));
        // Validate line number
        const codeLines = request.code.split('\n');
        const line = Math.max(1, Math.min(codeLines.length, raw.location.line));
        return {
            id,
            location: {
                line,
                column: raw.location.column,
                endLine: raw.location.endLine,
                endColumn: raw.location.endColumn,
            },
            severity,
            type: raw.type || 'unknown',
            category: this.auditType,
            title: raw.title.substring(0, 200), // Limit title length
            description: raw.description.substring(0, 1000), // Limit description length
            suggestion: raw.suggestion?.substring(0, 1000),
            codeSnippet: this.extractCodeSnippet(request.code, line),
            confidence,
            fixable: Boolean(raw.fixable),
            ruleId: raw.ruleId,
            documentation: raw.documentation,
            impact: raw.impact,
            effort: raw.effort || 'medium',
        };
    }
    /**
     * Normalize severity to valid values
     */
    normalizeSeverity(severity) {
        const validSeverities = [
            'critical',
            'high',
            'medium',
            'low',
            'info',
        ];
        const normalized = severity?.toLowerCase();
        return validSeverities.includes(normalized) ? normalized : 'medium';
    }
    /**
     * Extract code snippet around a specific line
     */
    extractCodeSnippet(code, line, context = 2) {
        const lines = code.split('\n');
        const start = Math.max(0, line - context - 1);
        const end = Math.min(lines.length, line + context);
        return lines.slice(start, end).join('\n');
    }
    /**
     * Filter issues based on configuration and request
     */
    filterIssues(issues, request) {
        let filtered = issues;
        // Filter by severity
        if (this.config.severity.length > 0) {
            filtered = filtered.filter((issue) => this.config.severity.includes(issue.severity));
        }
        // Filter by enabled rules
        filtered = filtered.filter((issue) => {
            const ruleId = issue.ruleId || issue.type;
            return this.config.rules[ruleId] !== false;
        });
        // Limit number of issues if requested
        if (request.maxIssues && request.maxIssues > 0) {
            filtered = filtered.slice(0, request.maxIssues);
        }
        return filtered;
    }
    /**
     * Sort issues by severity and line number
     */
    sortIssues(issues) {
        const severityOrder = {
            critical: 0,
            high: 1,
            medium: 2,
            low: 3,
            info: 4,
        };
        return issues.sort((a, b) => {
            // First by severity
            const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0) {
                return severityDiff;
            }
            // Then by line number
            return a.location.line - b.location.line;
        });
    }
    /**
     * Create audit result
     */
    createResult(requestId, issues, model, startTime, aiResponseTime, codeMetrics) {
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        return {
            requestId,
            issues,
            summary: this.createSummary(issues),
            coverage: this.createCoverage(codeMetrics, issues),
            suggestions: this.createSuggestions(issues),
            metrics: {
                duration: totalDuration,
                modelResponseTime: aiResponseTime,
                parsingTime: totalDuration - aiResponseTime,
                postProcessingTime: Math.max(0, totalDuration - aiResponseTime - 100),
            },
            model,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        };
    }
    /**
     * Create audit summary
     */
    createSummary(issues) {
        const summary = {
            total: issues.length,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
            byCategory: {},
            byType: {},
        };
        for (const issue of issues) {
            summary[issue.severity]++;
            summary.byCategory[issue.category] =
                (summary.byCategory[issue.category] || 0) + 1;
            summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
        }
        return summary;
    }
    /**
     * Create coverage information
     */
    createCoverage(codeMetrics, _issues) {
        return {
            linesAnalyzed: codeMetrics.lineCount,
            functionsAnalyzed: codeMetrics.functionCount,
            classesAnalyzed: 0, // Could be implemented with better parsing
            complexity: codeMetrics.complexity,
        };
    }
    /**
     * Create suggestions based on issues
     */
    createSuggestions(issues) {
        return {
            autoFixable: issues.filter((issue) => issue.fixable),
            priorityFixes: issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'high'),
            quickWins: issues.filter((issue) => issue.effort === 'low' &&
                (issue.severity === 'medium' || issue.severity === 'high')),
            technicalDebt: issues.filter((issue) => issue.category === 'quality' || issue.category === 'architecture'),
        };
    }
    /**
     * Create empty result for disabled auditors
     */
    createEmptyResult(requestId, startTime) {
        return {
            requestId,
            issues: [],
            summary: {
                total: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                info: 0,
                byCategory: {},
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
                duration: Date.now() - startTime,
                modelResponseTime: 0,
                parsingTime: 0,
                postProcessingTime: 0,
            },
            model: 'none',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        };
    }
    /**
     * Create standardized error
     */
    createError(code, message, details) {
        return {
            code,
            message,
            details,
            recoverable: true,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Get audit type
     */
    getAuditType() {
        return this.auditType;
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
//# sourceMappingURL=base.js.map