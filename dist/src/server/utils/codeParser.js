/**
 * Code parsing utilities for language detection and analysis
 */
/**
 * Language detection based on code patterns and syntax
 */
export class LanguageDetector {
    static patterns = {
        javascript: [
            /function\s+\w+/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /var\s+\w+\s*=/,
            /=>\s*{?/,
            /require\s*\(/,
            /module\.exports/,
        ],
        typescript: [
            /interface\s+\w+/,
            /type\s+\w+\s*=/,
            /enum\s+\w+/,
            /:\s*\w+\s*[=;]/,
            /import.*from/,
            /export.*{/,
            /as\s+\w+/,
        ],
        python: [
            /def\s+\w+\s*\(/,
            /class\s+\w+/,
            /import\s+\w+/,
            /from\s+\w+\s+import/,
            /if\s+__name__\s*==\s*['""]__main__['""]:/,
            /#\s*.+$/m,
        ],
        java: [
            /public\s+class\s+\w+/,
            /private\s+\w+\s+\w+/,
            /public\s+static\s+void\s+main/,
            /@\w+/,
            /import\s+\w+\.\w+/,
            /package\s+\w+/,
        ],
        csharp: [
            /using\s+\w+/,
            /namespace\s+\w+/,
            /public\s+class\s+\w+/,
            /\[.+\]/,
            /Console\.WriteLine/,
            /var\s+\w+\s*=/,
        ],
        go: [
            /package\s+\w+/,
            /import\s*\(/,
            /func\s+\w+/,
            /type\s+\w+\s+struct/,
            /fmt\.Print/,
            /go\s+\w+/,
        ],
        rust: [
            /fn\s+\w+/,
            /let\s+mut\s+\w+/,
            /struct\s+\w+/,
            /impl\s+\w+/,
            /use\s+\w+::/,
            /println!/,
        ],
        php: [
            /<\?php/,
            /\$\w+/,
            /function\s+\w+/,
            /class\s+\w+/,
            /echo\s+/,
            /include\s+/,
        ],
        ruby: [
            /def\s+\w+/,
            /class\s+\w+/,
            /module\s+\w+/,
            /require\s+/,
            /puts\s+/,
            /@\w+/,
        ],
        swift: [
            /func\s+\w+/,
            /class\s+\w+/,
            /struct\s+\w+/,
            /var\s+\w+:/,
            /let\s+\w+:/,
            /import\s+\w+/,
        ],
        kotlin: [
            /fun\s+\w+/,
            /class\s+\w+/,
            /val\s+\w+/,
            /var\s+\w+/,
            /import\s+\w+/,
            /package\s+\w+/,
        ],
        html: [/<html/i, /<head/i, /<body/i, /<div/i, /<script/i, /<style/i],
        css: [
            /\.\w+\s*{/,
            /#\w+\s*{/,
            /@media/,
            /@import/,
            /:\s*\w+;/,
            /font-family:/,
        ],
        sql: [
            /SELECT\s+/i,
            /FROM\s+/i,
            /WHERE\s+/i,
            /INSERT\s+INTO/i,
            /UPDATE\s+/i,
            /DELETE\s+FROM/i,
        ],
        yaml: [/^\s*\w+:\s*$/m, /^\s*-\s+/m, /^\s*\|\s*$/m, /^\s*>\s*$/m],
        json: [/^\s*{/, /^\s*\[/, /"\w+":\s*/, /"\w+"\s*,/],
        dockerfile: [
            /^FROM\s+/m,
            /^RUN\s+/m,
            /^COPY\s+/m,
            /^ADD\s+/m,
            /^WORKDIR\s+/m,
            /^EXPOSE\s+/m,
        ],
    };
    /**
     * Detect programming language from code content
     */
    static detectLanguage(code, filename) {
        // First try to detect from filename extension
        if (filename) {
            const langFromExt = this.detectFromExtension(filename);
            if (langFromExt) {
                return langFromExt;
            }
        }
        // Then analyze code patterns
        const scores = {};
        for (const [language, patterns] of Object.entries(this.patterns)) {
            let score = 0;
            for (const pattern of patterns) {
                const matches = code.match(pattern);
                if (matches) {
                    score += matches.length;
                }
            }
            scores[language] = score;
        }
        // Return language with highest score
        const bestMatch = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
        return bestMatch[1] > 0 ? bestMatch[0] : 'unknown';
    }
    /**
     * Detect language from file extension
     */
    static detectFromExtension(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        const extensionMap = {
            js: 'javascript',
            jsx: 'javascript',
            ts: 'typescript',
            tsx: 'typescript',
            py: 'python',
            java: 'java',
            cs: 'csharp',
            go: 'go',
            rs: 'rust',
            php: 'php',
            rb: 'ruby',
            swift: 'swift',
            kt: 'kotlin',
            html: 'html',
            htm: 'html',
            css: 'css',
            scss: 'css',
            sass: 'css',
            sql: 'sql',
            yaml: 'yaml',
            yml: 'yaml',
            json: 'json',
            dockerfile: 'dockerfile',
        };
        return ext ? extensionMap[ext] || null : null;
    }
    /**
     * Check if detected language is supported
     */
    static isSupported(language) {
        return Object.keys(this.patterns).includes(language);
    }
}
/**
 * Generic code parser for extracting structure and metrics
 */
export class CodeParser {
    /**
     * Parse code structure and extract functions, classes, etc.
     */
    static parseCode(code, language) {
        const lines = code.split('\n');
        return {
            language,
            functions: this.extractFunctions(code, language),
            classes: this.extractClasses(code, language),
            imports: this.extractImports(code, language),
            exports: this.extractExports(code, language),
            comments: this.extractComments(code, language),
            lineCount: lines.length,
            complexity: this.calculateComplexity(code, language),
        };
    }
    /**
     * Extract function definitions
     */
    static extractFunctions(code, language) {
        const functions = [];
        const lines = code.split('\n');
        const functionPatterns = this.getFunctionPatterns(language);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of functionPatterns) {
                const match = line.match(pattern);
                if (match) {
                    const func = this.parseFunctionDetails(lines, i, match, language);
                    if (func) {
                        functions.push(func);
                    }
                }
            }
        }
        return functions;
    }
    /**
     * Extract class definitions
     */
    static extractClasses(code, language) {
        const classes = [];
        const lines = code.split('\n');
        const classPatterns = this.getClassPatterns(language);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of classPatterns) {
                const match = line.match(pattern);
                if (match) {
                    const cls = this.parseClassDetails(lines, i, match, language);
                    if (cls) {
                        classes.push(cls);
                    }
                }
            }
        }
        return classes;
    }
    /**
     * Extract import statements
     */
    static extractImports(code, language) {
        const imports = [];
        const importPatterns = this.getImportPatterns(language);
        for (const pattern of importPatterns) {
            const matches = code.match(new RegExp(pattern.source, 'gm'));
            if (matches) {
                imports.push(...matches);
            }
        }
        return imports;
    }
    /**
     * Extract export statements
     */
    static extractExports(code, language) {
        const exports = [];
        const exportPatterns = this.getExportPatterns(language);
        for (const pattern of exportPatterns) {
            const matches = code.match(new RegExp(pattern.source, 'gm'));
            if (matches) {
                exports.push(...matches);
            }
        }
        return exports;
    }
    /**
     * Extract comments
     */
    static extractComments(code, language) {
        const comments = [];
        const lines = code.split('\n');
        const commentPatterns = this.getCommentPatterns(language);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Single line comments
            for (const pattern of commentPatterns.single) {
                const match = line.match(pattern);
                if (match) {
                    comments.push({
                        line: i + 1,
                        type: 'single',
                        content: match[0],
                    });
                }
            }
        }
        // Multi-line comments (simplified)
        for (const pattern of commentPatterns.multi) {
            const matches = code.match(new RegExp(pattern.source, 'gms'));
            if (matches) {
                for (const match of matches) {
                    const lineNum = code
                        .substring(0, code.indexOf(match))
                        .split('\n').length;
                    comments.push({
                        line: lineNum,
                        type: 'multi',
                        content: match,
                    });
                }
            }
        }
        return comments;
    }
    /**
     * Calculate code complexity
     */
    static calculateComplexity(code, language) {
        let complexity = 1; // Base complexity
        const complexityPatterns = this.getComplexityPatterns(language);
        for (const pattern of complexityPatterns) {
            const matches = code.match(new RegExp(pattern.source, 'g'));
            if (matches) {
                complexity += matches.length;
            }
        }
        return complexity;
    }
    /**
     * Get function patterns for specific language
     */
    static getFunctionPatterns(language) {
        const patterns = {
            javascript: [
                /function\s+(\w+)\s*\([^)]*\)/,
                /(\w+)\s*:\s*function\s*\([^)]*\)/,
                /(\w+)\s*=>\s*/,
                /(\w+)\s*=\s*function\s*\([^)]*\)/,
            ],
            typescript: [
                /function\s+(\w+)\s*\([^)]*\)/,
                /(\w+)\s*\([^)]*\)\s*:\s*\w+/,
                /(\w+)\s*=>\s*/,
            ],
            python: [/def\s+(\w+)\s*\([^)]*\)/],
            java: [/\w+\s+(\w+)\s*\([^)]*\)\s*{/],
            go: [/func\s+(\w+)\s*\([^)]*\)/],
            rust: [/fn\s+(\w+)\s*\([^)]*\)/],
        };
        return patterns[language] || [];
    }
    /**
     * Get class patterns for specific language
     */
    static getClassPatterns(language) {
        const patterns = {
            javascript: [/class\s+(\w+)/],
            typescript: [/class\s+(\w+)/, /interface\s+(\w+)/],
            python: [/class\s+(\w+)/],
            java: [/class\s+(\w+)/, /interface\s+(\w+)/],
            csharp: [/class\s+(\w+)/, /interface\s+(\w+)/],
            go: [/type\s+(\w+)\s+struct/],
            rust: [/struct\s+(\w+)/, /enum\s+(\w+)/, /trait\s+(\w+)/],
        };
        return patterns[language] || [];
    }
    /**
     * Get import patterns for specific language
     */
    static getImportPatterns(language) {
        const patterns = {
            javascript: [/import.*from.*/, /require\s*\(.*/],
            typescript: [/import.*from.*/],
            python: [/import\s+.*/, /from\s+.*\s+import.*/],
            java: [/import\s+.*;/],
            go: [/import\s+.*/],
        };
        return patterns[language] || [];
    }
    /**
     * Get export patterns for specific language
     */
    static getExportPatterns(language) {
        const patterns = {
            javascript: [/export\s+.*/, /module\.exports\s*=.*/],
            typescript: [/export\s+.*/],
        };
        return patterns[language] || [];
    }
    /**
     * Get comment patterns for specific language
     */
    static getCommentPatterns(language) {
        const patterns = {
            javascript: {
                single: [/\/\/.*/],
                multi: [/\/\*[\s\S]*?\*\//],
            },
            typescript: {
                single: [/\/\/.*/],
                multi: [/\/\*[\s\S]*?\*\//],
            },
            python: {
                single: [/#.*/],
                multi: [/"""[\s\S]*?"""/],
            },
            java: {
                single: [/\/\/.*/],
                multi: [/\/\*[\s\S]*?\*\//],
            },
        };
        return patterns[language] || { single: [], multi: [] };
    }
    /**
     * Get complexity patterns for specific language
     */
    static getComplexityPatterns(language) {
        return [
            /\bif\b/,
            /\belse\b/,
            /\bwhile\b/,
            /\bfor\b/,
            /\bswitch\b/,
            /\bcase\b/,
            /\btry\b/,
            /\bcatch\b/,
            /\band\b/,
            /\bor\b/,
            /&&/,
            /\|\|/,
            /\?.*:/,
        ];
    }
    /**
     * Parse function details from matched line
     */
    static parseFunctionDetails(lines, startLine, match, language) {
        const name = match[1] || 'anonymous';
        const line = lines[startLine];
        return {
            name,
            startLine: startLine + 1,
            endLine: startLine + 1, // Simplified - would need better parsing
            parameters: this.extractParameters(line),
            complexity: 1,
            isAsync: line.includes('async'),
            isExported: line.includes('export'),
        };
    }
    /**
     * Parse class details from matched line
     */
    static parseClassDetails(lines, startLine, match, language) {
        const name = match[1] || 'anonymous';
        return {
            name,
            startLine: startLine + 1,
            endLine: startLine + 1, // Simplified
            methods: [],
            properties: [],
        };
    }
    /**
     * Extract function parameters
     */
    static extractParameters(line) {
        const paramMatch = line.match(/\(([^)]*)\)/);
        if (!paramMatch || !paramMatch[1]) {
            return [];
        }
        return paramMatch[1]
            .split(',')
            .map((param) => param.trim())
            .filter((param) => param.length > 0);
    }
}
//# sourceMappingURL=codeParser.js.map