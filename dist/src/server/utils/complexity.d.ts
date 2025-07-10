/**
 * Code complexity analysis utilities
 */
export interface ComplexityMetrics {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    nestingDepth: number;
    linesOfCode: number;
    maintainabilityIndex: number;
    halsteadMetrics?: HalsteadMetrics;
}
export interface HalsteadMetrics {
    vocabulary: number;
    length: number;
    calculatedLength: number;
    volume: number;
    difficulty: number;
    effort: number;
    timeRequiredToProgram: number;
    deliveredBugs: number;
}
/**
 * Cyclomatic complexity calculator
 */
export declare class CyclomaticComplexityCalculator {
    /**
     * Calculate cyclomatic complexity for code
     * Formula: M = E - N + 2P
     * Where E = edges, N = nodes, P = connected components
     * Simplified: Count decision points + 1
     */
    static calculate(code: string, language: string): number;
    /**
     * Get decision patterns for different languages
     */
    private static getDecisionPatterns;
}
/**
 * Cognitive complexity calculator (more human-readable than cyclomatic)
 */
export declare class CognitiveComplexityCalculator {
    /**
     * Calculate cognitive complexity
     * Focuses on how hard code is to understand
     */
    static calculate(code: string, language: string): number;
    /**
     * Get nesting level change for a line
     */
    private static getNestingChange;
    /**
     * Get complexity score for control structures
     */
    private static getStructureComplexity;
}
/**
 * Nesting depth calculator
 */
export declare class NestingDepthCalculator {
    /**
     * Calculate maximum nesting depth
     */
    static calculate(code: string, language: string): number;
    /**
     * Get depth change for a line
     */
    private static getDepthChange;
    /**
     * Calculate depth change for Python (indentation-based)
     */
    private static calculatePythonDepthChange;
}
/**
 * Halstead complexity calculator
 */
export declare class HalsteadComplexityCalculator {
    /**
     * Calculate Halstead metrics
     */
    static calculate(code: string, language: string): HalsteadMetrics;
    /**
     * Extract operators from code
     */
    private static extractOperators;
    /**
     * Extract operands from code
     */
    private static extractOperands;
    /**
     * Get operator patterns for language
     */
    private static getOperatorPatterns;
    /**
     * Get operand patterns for language
     */
    private static getOperandPatterns;
}
/**
 * Maintainability index calculator
 */
export declare class MaintainabilityIndexCalculator {
    /**
     * Calculate maintainability index
     * Formula: MI = 171 - 5.2 * ln(HV) - 0.23 * CC - 16.2 * ln(LOC)
     * Where HV = Halstead Volume, CC = Cyclomatic Complexity, LOC = Lines of Code
     */
    static calculate(halsteadVolume: number, cyclomaticComplexity: number, linesOfCode: number, commentRatio?: number): number;
}
/**
 * Main complexity analyzer
 */
export declare class ComplexityAnalyzer {
    /**
     * Analyze all complexity metrics for code
     */
    static analyze(code: string, language: string): ComplexityMetrics;
    /**
     * Count comment lines in code
     */
    private static countCommentLines;
    /**
     * Get comment patterns for language
     */
    private static getCommentPatterns;
    /**
     * Get complexity rating
     */
    static getComplexityRating(complexity: number, type: 'cyclomatic' | 'cognitive'): string;
    /**
     * Get maintainability rating
     */
    static getMaintainabilityRating(index: number): string;
}
//# sourceMappingURL=complexity.d.ts.map