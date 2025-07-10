/**
 * Export all auditors
 */

export { BaseAuditor } from './base.js';
export { SecurityAuditor } from './security.js';
export { CompletenessAuditor } from './completeness.js';
export { PerformanceAuditor } from './performance.js';
export { QualityAuditor } from './quality.js';
export { ArchitectureAuditor } from './architecture.js';
export { TestingAuditor } from './testing.js';
export { DocumentationAuditor } from './documentation.js';

import type { AuditType, AuditorConfig } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';
import { BaseAuditor } from './base.js';
import { SecurityAuditor } from './security.js';
import { CompletenessAuditor } from './completeness.js';
import { PerformanceAuditor } from './performance.js';
import { QualityAuditor } from './quality.js';
import { ArchitectureAuditor } from './architecture.js';
import { TestingAuditor } from './testing.js';
import { DocumentationAuditor } from './documentation.js';

/**
 * Constructor interface for auditor classes
 */
interface AuditorConstructor {
  new (config: AuditorConfig, ollamaClient: OllamaClient, modelManager: ModelManager): BaseAuditor;
}

/**
 * Factory for creating auditor instances
 */
export class AuditorFactory {
  private static auditorClasses: Record<Exclude<AuditType, 'all'>, AuditorConstructor> = {
    security: SecurityAuditor,
    completeness: CompletenessAuditor,
    performance: PerformanceAuditor,
    quality: QualityAuditor,
    architecture: ArchitectureAuditor,
    testing: TestingAuditor,
    documentation: DocumentationAuditor
  };

  static createAuditor(
    auditType: AuditType,
    config: AuditorConfig,
    ollamaClient: OllamaClient,
    modelManager: ModelManager
  ): BaseAuditor {
    if (auditType === 'all') {
      throw new Error('Cannot create auditor for type "all". Use specific audit types.');
    }

    const AuditorClass = this.auditorClasses[auditType as Exclude<AuditType, 'all'>];
    if (!AuditorClass) {
      throw new Error(`Unknown audit type: ${auditType}`);
    }

    return new AuditorClass(config, ollamaClient, modelManager);
  }

  static createAllAuditors(
    configs: Record<AuditType, AuditorConfig>,
    ollamaClient: OllamaClient,
    modelManager: ModelManager
  ): Record<AuditType, BaseAuditor> {
    const auditors: Partial<Record<AuditType, BaseAuditor>> = {};

    const auditTypes: AuditType[] = [
      'security',
      'completeness', 
      'performance',
      'quality',
      'architecture',
      'testing',
      'documentation'
    ];

    for (const auditType of auditTypes) {
      const config = configs[auditType];
      if (config && config.enabled) {
        auditors[auditType] = this.createAuditor(auditType, config, ollamaClient, modelManager);
      }
    }

    return auditors as Record<AuditType, BaseAuditor>;
  }

  static getSupportedAuditTypes(): AuditType[] {
    return Object.keys(this.auditorClasses).filter(type => type !== 'all') as AuditType[];
  }
}