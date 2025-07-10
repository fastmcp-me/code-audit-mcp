/**
 * Completeness auditor for identifying incomplete implementations
 */
import { BaseAuditor } from './base.js';
export class CompletenessAuditor extends BaseAuditor {
    constructor(config, ollamaClient, modelManager) {
        super(config, ollamaClient, modelManager);
        this.auditType = 'completeness';
    }
    /**
     * Post-process completeness issues with pattern detection
     */
    async postProcessIssues(rawIssues, request, language) {
        const issues = await super.postProcessIssues(rawIssues, request, language);
        // Add static pattern detection for common completeness issues
        const patternIssues = this.detectCompletenessPatterns(request.code, language);
        // Merge and deduplicate
        const allIssues = [...issues, ...patternIssues];
        return this.deduplicateIssues(allIssues);
    }
    /**
     * Detect completeness patterns using static analysis
     */
    detectCompletenessPatterns(code, language) {
        const issues = [];
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            const trimmedLine = line.trim().toLowerCase();
            // TODO comments
            if (this.isTodoComment(line)) {
                issues.push(this.createTodoIssue(line, lineNumber));
            }
            // FIXME comments
            if (this.isFixmeComment(line)) {
                issues.push(this.createFixmeIssue(line, lineNumber));
            }
            // HACK comments
            if (this.isHackComment(line)) {
                issues.push(this.createHackIssue(line, lineNumber));
            }
            // Empty function bodies
            if (this.isEmptyFunction(line, lines, i, language)) {
                issues.push(this.createEmptyFunctionIssue(line, lineNumber));
            }
            // Missing return statements
            if (this.isMissingReturn(line, lines, i, language)) {
                issues.push(this.createMissingReturnIssue(line, lineNumber));
            }
            // Placeholder implementations
            if (this.isPlaceholderImplementation(line)) {
                issues.push(this.createPlaceholderIssue(line, lineNumber));
            }
            // Missing error handling
            if (this.isMissingErrorHandling(line, lines, i, language)) {
                issues.push(this.createMissingErrorHandlingIssue(line, lineNumber));
            }
            // Unhandled promises
            if (this.isUnhandledPromise(line, language)) {
                issues.push(this.createUnhandledPromiseIssue(line, lineNumber));
            }
        }
        return issues;
    }
    /**
     * Check if line contains TODO comment
     */
    isTodoComment(line) {
        const todoPatterns = [
            /\/\/.*todo/i,
            /\/\*.*todo.*\*\//i,
            /#.*todo/i,
            /<!--.*todo.*-->/i,
        ];
        return todoPatterns.some((pattern) => pattern.test(line));
    }
    /**
     * Check if line contains FIXME comment
     */
    isFixmeComment(line) {
        const fixmePatterns = [
            /\/\/.*fixme/i,
            /\/\*.*fixme.*\*\//i,
            /#.*fixme/i,
            /<!--.*fixme.*-->/i,
        ];
        return fixmePatterns.some((pattern) => pattern.test(line));
    }
    /**
     * Check if line contains HACK comment
     */
    isHackComment(line) {
        const hackPatterns = [
            /\/\/.*hack/i,
            /\/\*.*hack.*\*\//i,
            /#.*hack/i,
            /<!--.*hack.*-->/i,
        ];
        return hackPatterns.some((pattern) => pattern.test(line));
    }
    /**
     * Check if line represents an empty function
     */
    isEmptyFunction(line, lines, index, language) {
        const functionPatterns = {
            javascript: /function\s+\w+\s*\([^)]*\)\s*{/,
            typescript: /function\s+\w+\s*\([^)]*\)\s*:\s*\w+\s*{/,
            python: /def\s+\w+\s*\([^)]*\)\s*:/,
            java: /\w+\s+\w+\s*\([^)]*\)\s*{/,
            csharp: /\w+\s+\w+\s*\([^)]*\)\s*{/,
            go: /func\s+\w+\s*\([^)]*\)\s*\w*\s*{/,
            rust: /fn\s+\w+\s*\([^)]*\)\s*->\s*\w+\s*{/,
        };
        const pattern = functionPatterns[language];
        if (!pattern || !pattern.test(line)) {
            return false;
        }
        // Check if the function body is empty or only contains comments
        let braceCount = 0;
        let hasContent = false;
        for (let i = index; i < lines.length; i++) {
            const currentLine = lines[i].trim();
            braceCount += (currentLine.match(/{/g) || []).length;
            braceCount -= (currentLine.match(/}/g) || []).length;
            if (braceCount === 0 && i > index) {
                break;
            }
            // Check for actual content (not comments or empty lines)
            if (currentLine &&
                !currentLine.startsWith('//') &&
                !currentLine.startsWith('/*') &&
                !currentLine.startsWith('#')) {
                const contentLine = currentLine.replace(/[{}]/g, '').trim();
                if (contentLine) {
                    hasContent = true;
                }
            }
        }
        return !hasContent;
    }
    /**
     * Check if function is missing return statement
     */
    isMissingReturn(line, lines, index, language) {
        // Only check for languages that require explicit returns
        if (!['javascript', 'typescript', 'java', 'csharp', 'go', 'rust'].includes(language)) {
            return false;
        }
        const functionPattern = /function\s+\w+\s*\([^)]*\)\s*:\s*\w+|def\s+\w+\s*\([^)]*\)\s*->/;
        if (!functionPattern.test(line) || line.includes('void')) {
            return false;
        }
        // Look for return statement in function body
        let braceCount = 0;
        let hasReturn = false;
        for (let i = index; i < lines.length; i++) {
            const currentLine = lines[i].trim();
            braceCount += (currentLine.match(/{/g) || []).length;
            braceCount -= (currentLine.match(/}/g) || []).length;
            if (braceCount === 0 && i > index) {
                break;
            }
            if (currentLine.includes('return ')) {
                hasReturn = true;
                break;
            }
        }
        return !hasReturn;
    }
    /**
     * Check if line contains placeholder implementation
     */
    isPlaceholderImplementation(line) {
        const placeholderPatterns = [
            /throw new Error\("not implemented"\)/i,
            /throw new NotImplementedError/i,
            /raise NotImplementedError/i,
            /panic\("not implemented"\)/i,
            /unimplemented!/i,
            /\/\/ implementation/i,
            /\/\/ placeholder/i,
        ];
        return placeholderPatterns.some((pattern) => pattern.test(line));
    }
    /**
     * Check if line is missing error handling
     */
    isMissingErrorHandling(line, lines, index, language) {
        // Look for risky operations without try-catch
        const riskyPatterns = [
            /JSON\.parse/,
            /JSON\.stringify/,
            /fetch\(/,
            /XMLHttpRequest/,
            /fs\.readFileSync/,
            /fs\.writeFileSync/,
            /parseInt/,
            /parseFloat/,
        ];
        if (!riskyPatterns.some((pattern) => pattern.test(line))) {
            return false;
        }
        // Check if it's already in a try-catch block
        for (let i = index - 10; i < index; i++) {
            if (i >= 0 && lines[i] && lines[i].trim().startsWith('try')) {
                return false;
            }
        }
        return true;
    }
    /**
     * Check if line contains unhandled promise
     */
    isUnhandledPromise(line, language) {
        if (!['javascript', 'typescript'].includes(language)) {
            return false;
        }
        const promisePatterns = [
            /\w+\.\w+\([^)]*\)(?!\s*\.(then|catch|finally))/,
            /await\s+\w+\([^)]*\)/, // await without try-catch is checked elsewhere
        ];
        return (promisePatterns.some((pattern) => pattern.test(line)) &&
            !line.includes('.then') &&
            !line.includes('.catch') &&
            !line.includes('await'));
    }
    /**
     * Create TODO issue
     */
    createTodoIssue(line, lineNumber) {
        return {
            id: `todo_${lineNumber}`,
            location: { line: lineNumber },
            severity: 'medium',
            type: 'todo_comment',
            category: 'completeness',
            title: 'TODO comment indicates incomplete implementation',
            description: `Found TODO comment: ${line.trim()}`,
            suggestion: 'Implement the missing functionality or remove the TODO comment',
            confidence: 1.0,
            fixable: false,
            ruleId: 'COMP001',
        };
    }
    /**
     * Create FIXME issue
     */
    createFixmeIssue(line, lineNumber) {
        return {
            id: `fixme_${lineNumber}`,
            location: { line: lineNumber },
            severity: 'high',
            type: 'fixme_comment',
            category: 'completeness',
            title: 'FIXME comment indicates broken functionality',
            description: `Found FIXME comment: ${line.trim()}`,
            suggestion: 'Fix the issue mentioned in the FIXME comment',
            confidence: 1.0,
            fixable: false,
            ruleId: 'COMP002',
        };
    }
    /**
     * Create HACK issue
     */
    createHackIssue(line, lineNumber) {
        return {
            id: `hack_${lineNumber}`,
            location: { line: lineNumber },
            severity: 'medium',
            type: 'hack_comment',
            category: 'completeness',
            title: 'HACK comment indicates suboptimal implementation',
            description: `Found HACK comment: ${line.trim()}`,
            suggestion: 'Replace the hack with a proper implementation',
            confidence: 1.0,
            fixable: false,
            ruleId: 'COMP003',
        };
    }
    /**
     * Create empty function issue
     */
    createEmptyFunctionIssue(line, lineNumber) {
        return {
            id: `empty_function_${lineNumber}`,
            location: { line: lineNumber },
            severity: 'medium',
            type: 'empty_function',
            category: 'completeness',
            title: 'Empty function body',
            description: 'Function has no implementation',
            suggestion: 'Implement the function body or add appropriate error handling',
            confidence: 0.9,
            fixable: false,
            ruleId: 'COMP004',
        };
    }
    /**
     * Create missing return issue
     */
    createMissingReturnIssue(line, lineNumber) {
        return {
            id: `missing_return_${lineNumber}`,
            location: { line: lineNumber },
            severity: 'high',
            type: 'missing_return',
            category: 'completeness',
            title: 'Function missing return statement',
            description: 'Function declares a return type but has no return statement',
            suggestion: 'Add appropriate return statement or change return type to void',
            confidence: 0.8,
            fixable: false,
            ruleId: 'COMP005',
        };
    }
    /**
     * Create placeholder issue
     */
    createPlaceholderIssue(line, lineNumber) {
        return {
            id: `placeholder_${lineNumber}`,
            location: { line: lineNumber },
            severity: 'high',
            type: 'placeholder_implementation',
            category: 'completeness',
            title: 'Placeholder implementation found',
            description: `Placeholder implementation: ${line.trim()}`,
            suggestion: 'Replace placeholder with actual implementation',
            confidence: 1.0,
            fixable: false,
            ruleId: 'COMP006',
        };
    }
    /**
     * Create missing error handling issue
     */
    createMissingErrorHandlingIssue(line, lineNumber) {
        return {
            id: `missing_error_handling_${lineNumber}`,
            location: { line: lineNumber },
            severity: 'medium',
            type: 'missing_error_handling',
            category: 'completeness',
            title: 'Missing error handling for risky operation',
            description: 'Operation that can throw errors is not wrapped in try-catch',
            suggestion: 'Add appropriate error handling (try-catch block)',
            confidence: 0.7,
            fixable: true,
            ruleId: 'COMP007',
        };
    }
    /**
     * Create unhandled promise issue
     */
    createUnhandledPromiseIssue(line, lineNumber) {
        return {
            id: `unhandled_promise_${lineNumber}`,
            location: { line: lineNumber },
            severity: 'medium',
            type: 'unhandled_promise',
            category: 'completeness',
            title: 'Promise without error handling',
            description: 'Promise is not handled with .catch() or try-catch',
            suggestion: 'Add .catch() handler or wrap in try-catch if using await',
            confidence: 0.8,
            fixable: true,
            ruleId: 'COMP008',
        };
    }
    /**
     * Deduplicate issues by line number and type
     */
    deduplicateIssues(issues) {
        const seen = new Set();
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
//# sourceMappingURL=completeness.js.map