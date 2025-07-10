/**
 * Code parsing utilities for _language detection and analysis
 */

export interface ParsedFunction {
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  returnType?: string;
  complexity: number;
  isAsync: boolean;
  isExported: boolean;
}

export interface ParsedClass {
  name: string;
  startLine: number;
  endLine: number;
  methods: ParsedFunction[];
  properties: string[];
  extends?: string;
  implements?: string[];
}

export interface ParsedCode {
  _language: string;
  functions: ParsedFunction[];
  classes: ParsedClass[];
  imports: string[];
  exports: string[];
  comments: { line: number; type: 'single' | 'multi'; content: string }[];
  lineCount: number;
  complexity: number;
}

/**
 * Language detection based on code patterns and syntax
 */
export class LanguageDetector {
  private static patterns: Record<string, RegExp[]> = {
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
   * Detect programming _language from code content
   */
  static detectLanguage(code: string, filename?: string): string {
    // First try to detect from filename extension
    if (filename) {
      const langFromExt = this.detectFromExtension(filename);
      if (langFromExt) {
        return langFromExt;
      }
    }

    // Then analyze code patterns
    const scores: Record<string, number> = {};

    for (const [_language, patterns] of Object.entries(this.patterns)) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = code.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      scores[_language] = score;
    }

    // Return _language with highest score
    const bestMatch = Object.entries(scores).reduce((a, b) =>
      scores[a[0]] > scores[b[0]] ? a : b
    );

    return bestMatch[1] > 0 ? bestMatch[0] : 'unknown';
  }

  /**
   * Detect _language from file extension
   */
  private static detectFromExtension(filename: string): string | null {
    const ext = filename.toLowerCase().split('.').pop();

    const extensionMap: Record<string, string> = {
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
   * Check if detected _language is supported
   */
  static isSupported(_language: string): boolean {
    return Object.keys(this.patterns).includes(_language);
  }
}

/**
 * Generic code parser for extracting structure and metrics
 */
export class CodeParser {
  /**
   * Parse code structure and extract functions, classes, etc.
   */
  static parseCode(code: string, _language: string): ParsedCode {
    const lines = code.split('\n');

    return {
      _language,
      functions: this.extractFunctions(code, _language),
      classes: this.extractClasses(code, _language),
      imports: this.extractImports(code, _language),
      exports: this.extractExports(code, _language),
      comments: this.extractComments(code, _language),
      lineCount: lines.length,
      complexity: this.calculateComplexity(code, _language),
    };
  }

  /**
   * Extract function definitions
   */
  private static extractFunctions(
    code: string,
    _language: string
  ): ParsedFunction[] {
    const functions: ParsedFunction[] = [];
    const lines = code.split('\n');

    const functionPatterns = this.getFunctionPatterns(_language);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of functionPatterns) {
        const match = line.match(pattern);
        if (match) {
          const func = this.parseFunctionDetails(lines, i, match, _language);
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
  private static extractClasses(
    code: string,
    _language: string
  ): ParsedClass[] {
    const classes: ParsedClass[] = [];
    const lines = code.split('\n');

    const classPatterns = this.getClassPatterns(_language);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of classPatterns) {
        const match = line.match(pattern);
        if (match) {
          const cls = this.parseClassDetails(lines, i, match, _language);
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
  private static extractImports(code: string, _language: string): string[] {
    const imports: string[] = [];
    const importPatterns = this.getImportPatterns(_language);

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
  private static extractExports(code: string, _language: string): string[] {
    const exports: string[] = [];
    const exportPatterns = this.getExportPatterns(_language);

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
  private static extractComments(
    code: string,
    _language: string
  ): { line: number; type: 'single' | 'multi'; content: string }[] {
    const comments: {
      line: number;
      type: 'single' | 'multi';
      content: string;
    }[] = [];
    const lines = code.split('\n');

    const commentPatterns = this.getCommentPatterns(_language);

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
  private static calculateComplexity(code: string, _language: string): number {
    let complexity = 1; // Base complexity

    const complexityPatterns = this.getComplexityPatterns(_language);

    for (const pattern of complexityPatterns) {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Get function patterns for specific _language
   */
  private static getFunctionPatterns(_language: string): RegExp[] {
    const patterns: Record<string, RegExp[]> = {
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

    return patterns[_language] || [];
  }

  /**
   * Get class patterns for specific _language
   */
  private static getClassPatterns(_language: string): RegExp[] {
    const patterns: Record<string, RegExp[]> = {
      javascript: [/class\s+(\w+)/],
      typescript: [/class\s+(\w+)/, /interface\s+(\w+)/],
      python: [/class\s+(\w+)/],
      java: [/class\s+(\w+)/, /interface\s+(\w+)/],
      csharp: [/class\s+(\w+)/, /interface\s+(\w+)/],
      go: [/type\s+(\w+)\s+struct/],
      rust: [/struct\s+(\w+)/, /enum\s+(\w+)/, /trait\s+(\w+)/],
    };

    return patterns[_language] || [];
  }

  /**
   * Get import patterns for specific _language
   */
  private static getImportPatterns(_language: string): RegExp[] {
    const patterns: Record<string, RegExp[]> = {
      javascript: [/import.*from.*/, /require\s*\(.*/],
      typescript: [/import.*from.*/],
      python: [/import\s+.*/, /from\s+.*\s+import.*/],
      java: [/import\s+.*;/],
      go: [/import\s+.*/],
    };

    return patterns[_language] || [];
  }

  /**
   * Get export patterns for specific _language
   */
  private static getExportPatterns(_language: string): RegExp[] {
    const patterns: Record<string, RegExp[]> = {
      javascript: [/export\s+.*/, /module\.exports\s*=.*/],
      typescript: [/export\s+.*/],
    };

    return patterns[_language] || [];
  }

  /**
   * Get comment patterns for specific _language
   */
  private static getCommentPatterns(_language: string): {
    single: RegExp[];
    multi: RegExp[];
  } {
    const patterns: Record<string, { single: RegExp[]; multi: RegExp[] }> = {
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

    return patterns[_language] || { single: [], multi: [] };
  }

  /**
   * Get complexity patterns for specific _language
   */
  private static getComplexityPatterns(_language: string): RegExp[] {
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
  private static parseFunctionDetails(
    lines: string[],
    startLine: number,
    match: RegExpMatchArray,
    _language: string
  ): ParsedFunction | null {
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
  private static parseClassDetails(
    lines: string[],
    startLine: number,
    match: RegExpMatchArray,
    _language: string
  ): ParsedClass | null {
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
  private static extractParameters(line: string): string[] {
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
