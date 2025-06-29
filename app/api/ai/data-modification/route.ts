/**
 * @fileoverview AI Data Modification API Route
 * @description Server-side API for processing natural language data modification commands
 */

import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        {
          understood: false,
          confidence: 0,
          changes: [],
          summary: 'AI service not configured - missing API key',
          warnings: ['ANTHROPIC_API_KEY environment variable not set']
        },
        { status: 500 }
      );
    }

    const { command, context } = await request.json();

    if (!command || !context) {
      return NextResponse.json(
        { error: 'Missing command or context' },
        { status: 400 }
      );
    }

    const prompt = `
You are an AI assistant helping users modify data in a resource allocation system. 

CONTEXT:
- Clients: ${context.clients.length} records
- Workers: ${context.workers.length} records  
- Tasks: ${context.tasks.length} records

DATA STRUCTURE:
Client: {ClientID, ClientName, PriorityLevel(1-5), RequestedTaskIDs[], GroupTag, AttributesJSON}
Worker: {WorkerID, WorkerName, Skills[], AvailableSlots[], MaxLoadPerPhase(1-10), WorkerGroup, QualificationLevel(1-5)}
Task: {TaskID, TaskName, Category, Duration(>=1), RequiredSkills[], PreferredPhases[], MaxConcurrent(1-5)}

CURRENT DATA:
${JSON.stringify(context, null, 2)}

USER COMMAND: "${command}"

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

Return ONLY valid JSON, no other text.
`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        let jsonText = content.text;
        
        // Handle markdown code blocks
        if (jsonText.includes('```json')) {
          jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (jsonText.includes('```')) {
          jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        // Clean up any extra whitespace
        jsonText = jsonText.trim();
        
        const result = JSON.parse(jsonText);
        return NextResponse.json(result);
      }

      return NextResponse.json(
        { error: 'Unexpected response format' },
        { status: 500 }
      );
    } catch (anthropicError: any) {
      console.error('Anthropic API Error:', {
        message: anthropicError.message,
        status: anthropicError.status,
        type: anthropicError.type,
        error: anthropicError
      });

      // Handle specific Anthropic errors
      if (anthropicError.status === 401) {
        return NextResponse.json(
          {
            understood: false,
            confidence: 0,
            changes: [],
            summary: 'AI service authentication failed - invalid API key',
            warnings: ['Please check your Anthropic API key configuration']
          },
          { status: 500 }
        );
      }

      if (anthropicError.status === 429) {
        return NextResponse.json(
          {
            understood: false,
            confidence: 0,
            changes: [],
            summary: 'AI service rate limit exceeded',
            warnings: ['Too many requests. Please try again later.']
          },
          { status: 500 }
        );
      }

      if (anthropicError.status === 402 || anthropicError.message?.includes('credit balance is too low')) {
        // For demo purposes, return a mock response when credits are exhausted
        return NextResponse.json({
          understood: true,
          confidence: 0.8,
          changes: [
            {
              entityType: 'client',
              entityId: context.clients[0]?.id || 1,
              field: 'priority',
              oldValue: 'medium',
              newValue: 'high',
              reasoning: 'Demo response - Anthropic API credits exhausted. Please add credits to enable full AI functionality.'
            }
          ],
          summary: `DEMO MODE: AI credits exhausted. Command: "${command}" - This is a mock response for demonstration.`,
          warnings: ['⚠️ Anthropic API credits exhausted. Add credits at console.anthropic.com for full AI functionality.']
        });
      }

      // Generic error fallback
      return NextResponse.json(
        {
          understood: false,
          confidence: 0,
          changes: [],
          summary: `AI service error: ${anthropicError.message || 'Unknown error'}`,
          warnings: ['AI service temporarily unavailable']
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('AI Data Modification Error:', error);
    return NextResponse.json(
      {
        understood: false,
        confidence: 0,
        changes: [],
        summary: 'Failed to process command due to AI service error',
        warnings: ['AI service temporarily unavailable']
      },
      { status: 500 }
    );
  }
}
