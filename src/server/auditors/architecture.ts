/**
 * Architecture auditor for design patterns and system structure
 */

import { BaseAuditor } from './base.js';
import type { AuditorConfig } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';

export class ArchitectureAuditor extends BaseAuditor {
  constructor(
    config: AuditorConfig,
    ollamaClient: OllamaClient,
    modelManager: ModelManager
  ) {
    super(config, ollamaClient, modelManager);
    this.auditType = 'architecture';
  }
}
