/**
 * Audit-specific prompts for different types of code analysis
 */
import type { AuditType, PromptTemplate, PromptContext } from '../types.js';
/**
 * System prompts for different audit types
 */
export declare const SYSTEM_PROMPTS: Record<AuditType, string>;
/**
 * Language-specific prompt additions
 */
export declare const LANGUAGE_SPECIFIC_PROMPTS: Record<string, Partial<Record<AuditType, string>>>;
/**
 * Framework-specific prompt additions
 */
export declare const FRAMEWORK_SPECIFIC_PROMPTS: Record<string, Partial<Record<AuditType, string>>>;
/**
 * Generate a complete prompt for a specific audit context
 */
export declare function generatePrompt(context: PromptContext): string;
/**
 * Generate a fast mode prompt (security + completeness only)
 */
export declare function generateFastModePrompt(context: PromptContext): string;
/**
 * Prompt templates for specific issue types
 */
export declare const PROMPT_TEMPLATES: Record<string, PromptTemplate>;
/**
 * Get severity guidelines for different audit types
 */
export declare function getSeverityGuidelines(auditType: AuditType): Record<string, string>;
//# sourceMappingURL=prompts.d.ts.map