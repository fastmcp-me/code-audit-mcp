/**
 * Security auditor for identifying security vulnerabilities
 */
import { BaseAuditor } from './base.js';
export class SecurityAuditor extends BaseAuditor {
    constructor(config, ollamaClient, modelManager) {
        super(config, ollamaClient, modelManager);
        this.auditType = 'security';
    }
    /**
     * Post-process security issues with additional validation
     */
    async postProcessIssues(rawIssues, request, language) {
        const issues = await super.postProcessIssues(rawIssues, request, language);
        // Add security-specific post-processing
        return issues.map(issue => {
            // Enhance security issues with specific classifications
            issue = this.classifySecurityIssue(issue, request.code);
            // Add OWASP mapping if applicable
            issue = this.addOWASPMapping(issue);
            // Validate severity for security context
            issue = this.validateSecuritySeverity(issue, request.context?.environment);
            return issue;
        });
    }
    /**
     * Classify security issue with more specific types
     */
    classifySecurityIssue(issue, code) {
        const line = this.getCodeLine(code, issue.location.line);
        const lowercaseDescription = issue.description.toLowerCase();
        const lowercaseLine = line.toLowerCase();
        // SQL Injection patterns
        if (lowercaseDescription.includes('sql') || lowercaseDescription.includes('injection')) {
            if (lowercaseLine.includes('query') || lowercaseLine.includes('select') || lowercaseLine.includes('insert')) {
                issue.type = 'sql_injection';
                issue.ruleId = 'SEC001';
            }
        }
        // XSS patterns
        if (lowercaseDescription.includes('xss') || lowercaseDescription.includes('cross-site')) {
            if (lowercaseLine.includes('innerhtml') || lowercaseLine.includes('eval') || lowercaseLine.includes('document.write')) {
                issue.type = 'xss_vulnerability';
                issue.ruleId = 'SEC002';
            }
        }
        // Hardcoded secrets
        if (lowercaseDescription.includes('secret') || lowercaseDescription.includes('password') || lowercaseDescription.includes('key')) {
            if (lowercaseLine.includes('password') || lowercaseLine.includes('apikey') || lowercaseLine.includes('secret')) {
                issue.type = 'hardcoded_secret';
                issue.ruleId = 'SEC003';
            }
        }
        // Authentication issues
        if (lowercaseDescription.includes('auth') || lowercaseDescription.includes('login')) {
            issue.type = 'authentication_flaw';
            issue.ruleId = 'SEC004';
        }
        // CSRF issues
        if (lowercaseDescription.includes('csrf') || lowercaseDescription.includes('cross-site request')) {
            issue.type = 'csrf_vulnerability';
            issue.ruleId = 'SEC005';
        }
        // Path traversal
        if (lowercaseDescription.includes('path') && lowercaseDescription.includes('traversal')) {
            issue.type = 'path_traversal';
            issue.ruleId = 'SEC006';
        }
        // Command injection
        if (lowercaseDescription.includes('command') && lowercaseDescription.includes('injection')) {
            issue.type = 'command_injection';
            issue.ruleId = 'SEC007';
        }
        // Insecure deserialization
        if (lowercaseDescription.includes('deserial') || lowercaseDescription.includes('pickle') || lowercaseDescription.includes('unserialize')) {
            issue.type = 'insecure_deserialization';
            issue.ruleId = 'SEC008';
        }
        return issue;
    }
    /**
     * Add OWASP Top 10 mapping
     */
    addOWASPMapping(issue) {
        const owaspMappings = {
            'sql_injection': 'A03:2021 – Injection',
            'xss_vulnerability': 'A03:2021 – Injection',
            'authentication_flaw': 'A07:2021 – Identification and Authentication Failures',
            'csrf_vulnerability': 'A01:2021 – Broken Access Control',
            'hardcoded_secret': 'A02:2021 – Cryptographic Failures',
            'path_traversal': 'A01:2021 – Broken Access Control',
            'command_injection': 'A03:2021 – Injection',
            'insecure_deserialization': 'A08:2021 – Software and Data Integrity Failures'
        };
        const owaspCategory = owaspMappings[issue.type];
        if (owaspCategory) {
            issue.documentation = `OWASP Top 10: ${owaspCategory}`;
        }
        return issue;
    }
    /**
     * Validate and adjust severity based on environment
     */
    validateSecuritySeverity(issue, environment) {
        // Increase severity for production environments
        if (environment === 'production') {
            const criticalTypes = ['sql_injection', 'command_injection', 'authentication_flaw'];
            const highTypes = ['xss_vulnerability', 'csrf_vulnerability', 'path_traversal'];
            if (criticalTypes.includes(issue.type) && issue.severity !== 'critical') {
                issue.severity = 'critical';
                issue.impact = 'Critical security vulnerability in production environment';
            }
            else if (highTypes.includes(issue.type) && issue.severity === 'medium') {
                issue.severity = 'high';
                issue.impact = 'High-risk security vulnerability in production environment';
            }
        }
        // Hardcoded secrets are always critical in any environment
        if (issue.type === 'hardcoded_secret') {
            issue.severity = 'critical';
            issue.impact = 'Credential exposure can lead to unauthorized access';
        }
        return issue;
    }
    /**
     * Get a specific line from code
     */
    getCodeLine(code, lineNumber) {
        const lines = code.split('\n');
        return lines[lineNumber - 1] || '';
    }
    /**
     * Override temperature for security analysis (more conservative)
     */
    getTemperature() {
        return 0.05; // Very low temperature for consistent security analysis
    }
}
//# sourceMappingURL=security.js.map