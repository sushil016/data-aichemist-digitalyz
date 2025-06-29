/**
 * @fileoverview Data Alchemist - AI Service
 * @description Client-side AI service that communicates with API routes
 * @requirements Natural language processing for data modification, error correction, and rule recommendations
 */

import { Client, Worker, Task, ValidationError, BusinessRule } from '@/types/entities';

export interface AIDataModificationRequest {
  command: string;
  context: {
    clients: Client[];
    workers: Worker[];
    tasks: Task[];
  };
}

export interface AIDataModificationResponse {
  understood: boolean;
  confidence: number;
  changes: Array<{
    entityType: 'client' | 'worker' | 'task';
    entityId: string;
    field: string;
    oldValue: any;
    newValue: any;
    reasoning: string;
  }>;
  summary: string;
  warnings: string[];
}

export interface AIErrorCorrectionRequest {
  error: ValidationError;
  context: {
    clients: Client[];
    workers: Worker[];
    tasks: Task[];
  };
}

export interface AIErrorCorrectionResponse {
  understood: boolean;
  confidence: number;
  suggestions: Array<{
    description: string;
    changes: Array<{
      entityType: 'client' | 'worker' | 'task';
      entityId: string;
      field: string;
      oldValue: any;
      newValue: any;
    }>;
    reasoning: string;
    autoApplicable: boolean;
  }>;
}

export interface AIRuleRecommendationRequest {
  context: {
    clients: Client[];
    workers: Worker[];
    tasks: Task[];
    existingRules: BusinessRule[];
  };
}

export interface AIRuleRecommendationResponse {
  recommendations: Array<{
    type: string;
    confidence: number;
    title: string;
    description: string;
    reasoning: string;
    pattern: string;
    parameters: Record<string, any>;
    impact: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Process natural language data modification commands
 */
export async function processDataModification(
  request: AIDataModificationRequest
): Promise<AIDataModificationResponse> {
  try {
    const response = await fetch('/api/ai/data-modification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: request.command,
        context: request.context
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('AI Data Modification Error:', error);
    return {
      understood: false,
      confidence: 0,
      changes: [],
      summary: 'Failed to process command due to AI service error',
      warnings: ['AI service temporarily unavailable']
    };
  }
}

/**
 * Generate error correction suggestions
 */
export async function generateErrorCorrections(
  request: AIErrorCorrectionRequest
): Promise<AIErrorCorrectionResponse> {
  try {
    const response = await fetch('/api/ai/error-correction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: request.error,
        context: request.context
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('AI Error Correction Error:', error);
    return {
      understood: false,
      confidence: 0,
      suggestions: []
    };
  }
}

/**
 * Generate intelligent rule recommendations
 */
export async function generateRuleRecommendations(
  request: AIRuleRecommendationRequest
): Promise<AIRuleRecommendationResponse> {
  try {
    const response = await fetch('/api/ai/rule-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: request.context
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('AI Rule Recommendations Error:', error);
    return {
      recommendations: []
    };
  }
}

/**
 * Test AI service connectivity
 */
export async function testAIConnection(): Promise<boolean> {
  try {
    // During SSR/build, return true to avoid URL parsing errors
    if (typeof window === 'undefined') {
      return true;
    }
    
    const response = await fetch('/api/health');
    return response.ok;
  } catch (error) {
    console.error('AI Connection Test Failed:', error);
    return false;
  }
}
