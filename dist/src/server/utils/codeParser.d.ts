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
    comments: {
        line: number;
        type: 'single' | 'multi';
        content: string;
    }[];
    lineCount: number;
    complexity: number;
}
/**
 * Language detection based on code patterns and syntax
 */
export declare class LanguageDetector {
    private static patterns;
    /**
     * Detect programming _language from code content
     */
    static detectLanguage(code: string, filename?: string): string;
    /**
     * Detect _language from file extension
     */
    private static detectFromExtension;
    /**
     * Check if detected _language is supported
     */
    static isSupported(_language: string): boolean;
}
/**
 * Generic code parser for extracting structure and metrics
 */
export declare class CodeParser {
    /**
     * Parse code structure and extract functions, classes, etc.
     */
    static parseCode(code: string, _language: string): ParsedCode;
    /**
     * Extract function definitions
     */
    private static extractFunctions;
    /**
     * Extract class definitions
     */
    private static extractClasses;
    /**
     * Extract import statements
     */
    private static extractImports;
    /**
     * Extract export statements
     */
    private static extractExports;
    /**
     * Extract comments
     */
    private static extractComments;
    /**
     * Calculate code complexity
     */
    private static calculateComplexity;
    /**
     * Get function patterns for specific _language
     */
    private static getFunctionPatterns;
    /**
     * Get class patterns for specific _language
     */
    private static getClassPatterns;
    /**
     * Get import patterns for specific _language
     */
    private static getImportPatterns;
    /**
     * Get export patterns for specific _language
     */
    private static getExportPatterns;
    /**
     * Get comment patterns for specific _language
     */
    private static getCommentPatterns;
    /**
     * Get complexity patterns for specific _language
     */
    private static getComplexityPatterns;
    /**
     * Parse function details from matched line
     */
    private static parseFunctionDetails;
    /**
     * Parse class details from matched line
     */
    private static parseClassDetails;
    /**
     * Extract function parameters
     */
    private static extractParameters;
}
//# sourceMappingURL=codeParser.d.ts.map