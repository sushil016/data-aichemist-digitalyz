/**
 * @fileoverview AI Data Modification API Route
 * @description Server-side API for processing natural language data modification commands
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
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
      const result = JSON.parse(content.text);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Unexpected response format' },
      { status: 500 }
    );

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
