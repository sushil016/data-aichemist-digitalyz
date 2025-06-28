/**
 * @fileoverview Data Alchemist - AI Service
 * @description Anthropic Claude integration for advanced AI features
 * @requirements Natural language processing for data modification, error correction, and rule recommendations
 */

import Anthropic from '@anthropic-ai/sdk';
import { Client, Worker, Task, ValidationError, BusinessRule } from '@/types/entities';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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
    const prompt = `
You are an AI assistant helping users modify data in a resource allocation system. 

CONTEXT:
- Clients: ${request.context.clients.length} records
- Workers: ${request.context.workers.length} records  
- Tasks: ${request.context.tasks.length} records

DATA STRUCTURE:
Client: {ClientID, ClientName, PriorityLevel(1-5), RequestedTaskIDs[], GroupTag, AttributesJSON}
Worker: {WorkerID, WorkerName, Skills[], AvailableSlots[], MaxLoadPerPhase(1-10), WorkerGroup, QualificationLevel(1-5)}
Task: {TaskID, TaskName, Category, Duration(>=1), RequiredSkills[], PreferredPhases[], MaxConcurrent(1-5)}

CURRENT DATA:
${JSON.stringify(request.context, null, 2)}

USER COMMAND: "${request.command}"

Please analyze this command and provide a JSON response with:
1. understood: boolean (can you understand the intent?)
2. confidence: number (0-1, how confident are you?)
3. changes: array of specific changes to make
4. summary: human-readable summary of what will happen
5. warnings: any potential issues or concerns

For changes, specify:
- entityType: 'client'|'worker'|'task'
- entityId: the specific ID
- field: the field to change
- oldValue: current value
- newValue: proposed new value
- reasoning: why this change makes sense

IMPORTANT: Only suggest changes that are safe and make sense. If the command is ambiguous or dangerous, set understood=false.
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }

    throw new Error('Unexpected response format');
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
    const prompt = `
You are an AI assistant helping users fix data validation errors in a resource allocation system.

ERROR DETAILS:
- Type: ${request.error.entityType}
- Entity ID: ${request.error.entityId}
- Field: ${request.error.field}
- Message: ${request.error.message}
- Severity: ${request.error.severity}

CONTEXT DATA:
${JSON.stringify(request.context, null, 2)}

Please analyze this error and provide correction suggestions in JSON format:
1. understood: boolean (can you understand the error?)
2. confidence: number (0-1, how confident are your suggestions?)
3. suggestions: array of potential fixes

For each suggestion:
- description: human-readable explanation
- changes: specific field changes needed
- reasoning: why this fix makes sense
- autoApplicable: boolean (is it safe to auto-apply?)

Focus on practical, safe solutions. Consider:
- Data consistency across entities
- Business logic constraints
- Common patterns in the existing data
- Potential side effects of changes
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }

    throw new Error('Unexpected response format');
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
    const prompt = `
You are an AI assistant analyzing data patterns to recommend business rules for resource allocation.

DATA ANALYSIS:
- Clients: ${request.context.clients.length} records
- Workers: ${request.context.workers.length} records  
- Tasks: ${request.context.tasks.length} records
- Existing Rules: ${request.context.existingRules.length} rules

CURRENT DATA:
${JSON.stringify(request.context, null, 2)}

EXISTING RULES:
${JSON.stringify(request.context.existingRules, null, 2)}

Please analyze patterns in this data and recommend new business rules. Look for:
1. Tasks that frequently appear together (co-run opportunities)
2. Worker groups that are overloaded (load-limit needs)
3. Skills mismatches (phase-window opportunities)
4. Client priority patterns (precedence rules)
5. Resource bottlenecks (slot-restriction needs)

Provide recommendations in JSON format:
- type: rule type (coRun, loadLimit, phaseWindow, slotRestriction, etc.)
- confidence: 0-1 (how confident is this recommendation?)
- title: short descriptive title
- description: what the rule would do
- reasoning: why you recommend this (what pattern you found)
- pattern: description of the data pattern you detected
- parameters: specific rule parameters
- impact: 'high'|'medium'|'low' (expected impact on allocation)

Focus on actionable, high-value recommendations that address real patterns in the data.
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }

    throw new Error('Unexpected response format');
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
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: 'Respond with "AI service is working" if you can see this message.'
      }]
    });

    const content = response.content[0];
    return content.type === 'text' && content.text.includes('AI service is working');
  } catch (error) {
    console.error('AI Connection Test Failed:', error);
    return false;
  }
}
