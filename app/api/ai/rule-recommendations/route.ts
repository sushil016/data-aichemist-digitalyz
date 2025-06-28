/**
 * @fileoverview AI Rule Recommendations API Route
 * @description Server-side API for generating intelligent business rule recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json();

    if (!context) {
      return NextResponse.json(
        { error: 'Missing context' },
        { status: 400 }
      );
    }

    const prompt = `
You are an AI assistant analyzing data patterns to recommend business rules for resource allocation.

DATA ANALYSIS:
- Clients: ${context.clients.length} records
- Workers: ${context.workers.length} records  
- Tasks: ${context.tasks.length} records
- Existing Rules: ${context.existingRules.length} rules

CURRENT DATA:
${JSON.stringify(context, null, 2)}

EXISTING RULES:
${JSON.stringify(context.existingRules, null, 2)}

Please analyze patterns in this data and recommend new business rules. Look for:
1. Tasks that frequently appear together (co-run opportunities)
2. Worker groups that are overloaded (load-limit needs)
3. Skills mismatches (phase-window opportunities)
4. Client priority patterns (precedence rules)
5. Resource bottlenecks (slot-restriction needs)

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "type": "rule type (coRun, loadLimit, phaseWindow, slotRestriction, etc.)",
      "confidence": 0-1,
      "title": "short descriptive title",
      "description": "what the rule would do",
      "reasoning": "why you recommend this (what pattern you found)",
      "pattern": "description of the data pattern you detected",
      "parameters": "specific rule parameters",
      "impact": "high|medium|low"
    }
  ]
}

Focus on actionable, high-value recommendations that address real patterns in the data.

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
    console.error('AI Rule Recommendations Error:', error);
    return NextResponse.json(
      {
        recommendations: []
      },
      { status: 500 }
    );
  }
}
