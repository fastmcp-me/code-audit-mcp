/**
 * Testing auditor for testability and test coverage analysis
 */

import { BaseAuditor } from './base.js';
import type { AuditorConfig } from '../types.js';
import type { OllamaClient } from '../ollama/client.js';
import { ModelManager } from '../ollama/models.js';

export class TestingAuditor extends BaseAuditor {
  constructor(config: AuditorConfig, ollamaClient: OllamaClient, modelManager: ModelManager) {
    super(config, ollamaClient, modelManager);
    this.auditType = 'testing';
  }
}