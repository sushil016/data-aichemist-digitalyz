/**
 * @fileoverview AI Error Correction API Route
 * @description Server-side API for generating error correction suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { error, context } = await request.json();

    if (!error || !context) {
      return NextResponse.json(
        { error: 'Missing error or context' },
        { status: 400 }
      );
    }

    const prompt = `
You are an AI assistant helping users fix data validation errors in a resource allocation system.

ERROR DETAILS:
- Type: ${error.entityType}
- Entity ID: ${error.entityId}
- Field: ${error.field}
- Message: ${error.message}
- Severity: ${error.severity}

CONTEXT DATA:
${JSON.stringify(context, null, 2)}

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

Return ONLY valid JSON, no other text.
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
      const result = JSON.parse(content.text);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Unexpected response format' },
      { status: 500 }
    );

  } catch (error) {
    console.error('AI Error Correction Error:', error);
    return NextResponse.json(
      {
        understood: false,
        confidence: 0,
        suggestions: []
      },
      { status: 500 }
    );
  }
}
