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
  vocabulary: number;          // n = n1 + n2
  length: number;             // N = N1 + N2
  calculatedLength: number;   // N^ = n1 * log2(n1) + n2 * log2(n2)
  volume: number;             // V = N * log2(n)
  difficulty: number;         // D = (n1/2) * (N2/n2)
  effort: number;             // E = D * V
  timeRequiredToProgram: number; // T = E / 18 seconds
  deliveredBugs: number;      // B = V / 3000
}

/**
 * Cyclomatic complexity calculator
 */
export class CyclomaticComplexityCalculator {
  /**
   * Calculate cyclomatic complexity for code
   * Formula: M = E - N + 2P
   * Where E = edges, N = nodes, P = connected components
   * Simplified: Count decision points + 1
   */
  static calculate(code: string, language: string): number {
    let complexity = 1; // Base complexity

    const decisionPatterns = this.getDecisionPatterns(language);
    
    for (const pattern of decisionPatterns) {
      const matches = code.match(new RegExp(pattern.source, 'gi'));
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Get decision patterns for different languages
   */
  private static getDecisionPatterns(language: string): RegExp[] {
    const basePatterns = [
      /\bif\b/,
      /\belse\s+if\b/,
      /\bwhile\b/,
      /\bfor\b/,
      /\bdo\b/,
      /\bswitch\b/,
      /\bcase\b/,
      /\btry\b/,
      /\bcatch\b/,
      /\bfinally\b/,
      /&&/,
      /\|\|/,
      /\?/  // Ternary operator
    ];

    const languageSpecific: Record<string, RegExp[]> = {
      python: [
        ...basePatterns,
        /\belif\b/,
        /\bexcept\b/,
        /\band\b/,
        /\bor\b/
      ],
      javascript: [
        ...basePatterns,
        /\.then\b/,
        /\.catch\b/
      ],
      typescript: [
        ...basePatterns,
        /\.then\b/,
        /\.catch\b/
      ],
      java: [
        ...basePatterns,
        /\bthrows\b/
      ],
      go: [
        ...basePatterns,
        /\bselect\b/,
        /\bdefer\b/
      ]
    };

    return languageSpecific[language] || basePatterns;
  }
}

/**
 * Cognitive complexity calculator (more human-readable than cyclomatic)
 */
export class CognitiveComplexityCalculator {
  /**
   * Calculate cognitive complexity
   * Focuses on how hard code is to understand
   */
  static calculate(code: string, language: string): number {
    const lines = code.split('\n');
    let complexity = 0;
    let nestingLevel = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Track nesting level
      nestingLevel += this.getNestingChange(trimmedLine, language);
      
      // Add complexity for control structures
      const structureComplexity = this.getStructureComplexity(trimmedLine, language);
      if (structureComplexity > 0) {
        // Add base complexity + nesting bonus
        complexity += structureComplexity + Math.max(0, nestingLevel - 1);
      }
    }

    return complexity;
  }

  /**
   * Get nesting level change for a line
   */
  private static getNestingChange(line: string, language: string): number {
    let change = 0;
    
    // Opening braces/blocks
    change += (line.match(/{/g) || []).length;
    change += (line.match(/\bthen\b/g) || []).length; // Python if/then
    
    // Closing braces/blocks
    change -= (line.match(/}/g) || []).length;
    
    // Python specific (indentation-based)
    if (language === 'python') {
      if (line.match(/^\s*(if|else|elif|while|for|try|except|finally|with|def|class):/)) {
        change += 1;
      }
    }

    return change;
  }

  /**
   * Get complexity score for control structures
   */
  private static getStructureComplexity(line: string, language: string): number {
    const patterns = [
      { pattern: /\bif\b/, score: 1 },
      { pattern: /\belse\s+if\b|\belif\b/, score: 1 },
      { pattern: /\belse\b/, score: 1 },
      { pattern: /\bswitch\b/, score: 1 },
      { pattern: /\bcase\b/, score: 1 },
      { pattern: /\bfor\b/, score: 1 },
      { pattern: /\bwhile\b/, score: 1 },
      { pattern: /\bdo\b/, score: 1 },
      { pattern: /\btry\b/, score: 1 },
      { pattern: /\bcatch\b/, score: 1 },
      { pattern: /\bfinally\b/, score: 1 },
      { pattern: /&&|\|\|/, score: 1 },
      { pattern: /\?.*:/, score: 1 }, // Ternary
      { pattern: /\bgoto\b/, score: 2 }, // Higher penalty for goto
      { pattern: /\bbreak\b/, score: 1 },
      { pattern: /\bcontinue\b/, score: 1 }
    ];

    let totalScore = 0;
    
    for (const { pattern, score } of patterns) {
      if (pattern.test(line)) {
        totalScore += score;
      }
    }

    return totalScore;
  }
}

/**
 * Nesting depth calculator
 */
export class NestingDepthCalculator {
  /**
   * Calculate maximum nesting depth
   */
  static calculate(code: string, language: string): number {
    const lines = code.split('\n');
    let currentDepth = 0;
    let maxDepth = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Track depth changes
      const depthChange = this.getDepthChange(trimmedLine, language);
      currentDepth += depthChange;
      
      maxDepth = Math.max(maxDepth, currentDepth);
      
      // Prevent negative depth
      currentDepth = Math.max(0, currentDepth);
    }

    return maxDepth;
  }

  /**
   * Get depth change for a line
   */
  private static getDepthChange(line: string, language: string): number {
    if (language === 'python') {
      return this.calculatePythonDepthChange(line);
    }
    
    // For brace-based languages
    let change = 0;
    change += (line.match(/{/g) || []).length;
    change -= (line.match(/}/g) || []).length;
    
    return change;
  }

  /**
   * Calculate depth change for Python (indentation-based)
   */
  private static calculatePythonDepthChange(line: string): number {
    // Simplified Python depth calculation
    if (line.match(/^\s*(if|else|elif|while|for|try|except|finally|with|def|class):/)) {
      return 1;
    }
    
    // This is a simplification - real Python would need proper indentation analysis
    return 0;
  }
}

/**
 * Halstead complexity calculator
 */
export class HalsteadComplexityCalculator {
  /**
   * Calculate Halstead metrics
   */
  static calculate(code: string, language: string): HalsteadMetrics {
    const operators = this.extractOperators(code, language);
    const operands = this.extractOperands(code, language);
    
    const n1 = new Set(operators).size; // Unique operators
    const n2 = new Set(operands).size;  // Unique operands
    const N1 = operators.length;        // Total operators
    const N2 = operands.length;         // Total operands
    
    const n = n1 + n2;                  // Vocabulary
    const N = N1 + N2;                  // Length
    
    const calculatedLength = n1 * Math.log2(n1) + n2 * Math.log2(n2);
    const volume = N * Math.log2(n);
    const difficulty = (n1 / 2) * (N2 / (n2 || 1));
    const effort = difficulty * volume;
    const timeRequiredToProgram = effort / 18;
    const deliveredBugs = volume / 3000;

    return {
      vocabulary: n,
      length: N,
      calculatedLength,
      volume,
      difficulty,
      effort,
      timeRequiredToProgram,
      deliveredBugs
    };
  }

  /**
   * Extract operators from code
   */
  private static extractOperators(code: string, language: string): string[] {
    const operatorPatterns = this.getOperatorPatterns(language);
    const operators: string[] = [];
    
    for (const pattern of operatorPatterns) {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        operators.push(...matches);
      }
    }
    
    return operators;
  }

  /**
   * Extract operands from code
   */
  private static extractOperands(code: string, language: string): string[] {
    const operandPatterns = this.getOperandPatterns(language);
    const operands: string[] = [];
    
    for (const pattern of operandPatterns) {
      const matches = code.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        operands.push(...matches);
      }
    }
    
    return operands;
  }

  /**
   * Get operator patterns for language
   */
  private static getOperatorPatterns(language: string): RegExp[] {
    return [
      /\+/g, /-/g, /\*/g, /\//g, /%/g,
      /==/g, /!=/g, /</g, />/g, /<=/g, />=/g,
      /&&/g, /\|\|/g, /!/g,
      /&/g, /\|/g, /\^/g, /~/g, /<</g, />>/g,
      /=/g, /\+=/g, /-=/g, /\*=/g, /\/=/g,
      /\+\+/g, /--/g,
      /\./g, /->/g, /::/g
    ];
  }

  /**
   * Get operand patterns for language
   */
  private static getOperandPatterns(language: string): RegExp[] {
    return [
      /\b\w+\b/g,           // Identifiers
      /\b\d+\b/g,           // Numbers
      /"[^"]*"/g,           // String literals
      /'[^']*'/g,           // Character literals
      /`[^`]*`/g            // Template literals
    ];
  }
}

/**
 * Maintainability index calculator
 */
export class MaintainabilityIndexCalculator {
  /**
   * Calculate maintainability index
   * Formula: MI = 171 - 5.2 * ln(HV) - 0.23 * CC - 16.2 * ln(LOC)
   * Where HV = Halstead Volume, CC = Cyclomatic Complexity, LOC = Lines of Code
   */
  static calculate(
    halsteadVolume: number,
    cyclomaticComplexity: number,
    linesOfCode: number,
    commentRatio: number = 0
  ): number {
    const base = 171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(linesOfCode);
    
    // Add comment bonus
    const commentBonus = 50 * Math.sin(Math.sqrt(2.4 * commentRatio));
    
    const mi = Math.max(0, (base + commentBonus) * 100 / 171);
    
    return Math.round(mi);
  }
}

/**
 * Main complexity analyzer
 */
export class ComplexityAnalyzer {
  /**
   * Analyze all complexity metrics for code
   */
  static analyze(code: string, language: string): ComplexityMetrics {
    const lines = code.split('\n');
    const linesOfCode = lines.filter(line => line.trim().length > 0).length;
    
    const cyclomaticComplexity = CyclomaticComplexityCalculator.calculate(code, language);
    const cognitiveComplexity = CognitiveComplexityCalculator.calculate(code, language);
    const nestingDepth = NestingDepthCalculator.calculate(code, language);
    const halsteadMetrics = HalsteadComplexityCalculator.calculate(code, language);
    
    // Calculate comment ratio
    const commentLines = this.countCommentLines(code, language);
    const commentRatio = commentLines / Math.max(linesOfCode, 1);
    
    const maintainabilityIndex = MaintainabilityIndexCalculator.calculate(
      halsteadMetrics.volume,
      cyclomaticComplexity,
      linesOfCode,
      commentRatio
    );

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      nestingDepth,
      linesOfCode,
      maintainabilityIndex,
      halsteadMetrics
    };
  }

  /**
   * Count comment lines in code
   */
  private static countCommentLines(code: string, language: string): number {
    const lines = code.split('\n');
    let commentLines = 0;
    
    const commentPatterns = this.getCommentPatterns(language);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      for (const pattern of commentPatterns) {
        if (pattern.test(trimmedLine)) {
          commentLines++;
          break;
        }
      }
    }
    
    return commentLines;
  }

  /**
   * Get comment patterns for language
   */
  private static getCommentPatterns(language: string): RegExp[] {
    const patterns: Record<string, RegExp[]> = {
      javascript: [/^\/\//, /^\/\*/, /^\*/],
      typescript: [/^\/\//, /^\/\*/, /^\*/],
      python: [/^#/, /^"""/, /^'''/],
      java: [/^\/\//, /^\/\*/, /^\*/],
      csharp: [/^\/\//, /^\/\*/, /^\*/],
      go: [/^\/\//, /^\/\*/, /^\*/],
      rust: [/^\/\//, /^\/\*/, /^\*/],
      php: [/^\/\//, /^\/\*/, /^#/],
      ruby: [/^#/],
      sql: [/^--/, /^\/\*/]
    };
    
    return patterns[language] || [/^\/\//, /^#/];
  }

  /**
   * Get complexity rating
   */
  static getComplexityRating(complexity: number, type: 'cyclomatic' | 'cognitive'): string {
    if (type === 'cyclomatic') {
      if (complexity <= 10) return 'Low';
      if (complexity <= 20) return 'Moderate';
      if (complexity <= 50) return 'High';
      return 'Very High';
    } else {
      if (complexity <= 5) return 'Low';
      if (complexity <= 10) return 'Moderate';
      if (complexity <= 15) return 'High';
      return 'Very High';
    }
  }

  /**
   * Get maintainability rating
   */
  static getMaintainabilityRating(index: number): string {
    if (index >= 85) return 'Excellent';
    if (index >= 70) return 'Good';
    if (index >= 50) return 'Moderate';
    if (index >= 25) return 'Poor';
    return 'Very Poor';
  }
}