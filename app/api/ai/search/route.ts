/**
 * @fileoverview AI Natural Language S    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,ch API Route
 * @description Server-side natural language query processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();
    
    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback to basic keyword matching when AI is not available
      return processBasicQuery(query, context);
    }

    // Process natural language query with AI
    const prompt = `
    Convert this natural language query to filter criteria:
    Query: "${query}"
    
    Available data structure:
    - Clients: ClientID, ClientName, PriorityLevel (1-5), RequestedTaskIDs, GroupTag, AttributesJSON
    - Workers: WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel (1-5)
    - Tasks: TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent
    
    Return JSON with:
    {
      "entityType": "client|worker|task",
      "filters": [
        {"field": "fieldName", "operator": "equals|contains|gt|lt|in", "value": "filterValue"}
      ],
      "understood": true/false,
      "confidence": 0.0-1.0
    }
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    // Parse AI response and apply filters
    const textContent = response.content[0];
    const aiText = textContent.type === 'text' ? textContent.text : '';
    const result = parseAIResponse(aiText, context);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Search error:', error);
    // Extract query and context from the original request for fallback
    const body = await request.json().catch(() => ({}));
    return processBasicQuery(body.query || '', body.context || {});
  }
}

function processBasicQuery(query: string, context: any) {
  const lowQuery = query.toLowerCase();
  let results = [];
  let entityType = 'client';

  // Basic keyword matching
  if (lowQuery.includes('high priority') || lowQuery.includes('priority')) {
    results = context.clients?.filter((c: any) => c.PriorityLevel >= 4) || [];
    entityType = 'client';
  } else if (lowQuery.includes('react') || lowQuery.includes('skills')) {
    results = context.workers?.filter((w: any) => 
      w.Skills?.some((skill: string) => skill.toLowerCase().includes('react'))
    ) || [];
    entityType = 'worker';
  } else if (lowQuery.includes('duration') || lowQuery.includes('phases')) {
    const durationMatch = lowQuery.match(/(\d+)/);
    const duration = durationMatch ? parseInt(durationMatch[1]) : 3;
    results = context.tasks?.filter((t: any) => t.Duration > duration) || [];
    entityType = 'task';
  }

  return NextResponse.json({
    results,
    entityType,
    understood: true,
    confidence: 0.6,
    query
  });
}

function parseAIResponse(aiText: string, context: any) {
  try {
    // Try to extract JSON from AI response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Apply filters to context data
      const dataSource = context[parsed.entityType + 's'] || [];
      const filtered = applyFilters(dataSource, parsed.filters || []);
      
      return {
        results: filtered,
        entityType: parsed.entityType,
        understood: parsed.understood,
        confidence: parsed.confidence || 0.7
      };
    }
  } catch (e) {
    console.warn('Failed to parse AI response:', e);
  }
  
  // Fallback
  return {
    results: [],
    entityType: 'client',
    understood: false,
    confidence: 0.3
  };
}

function applyFilters(data: any[], filters: any[]) {
  return data.filter(item => {
    return filters.every(filter => {
      const value = item[filter.field];
      
      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'gt':
          return Number(value) > Number(filter.value);
        case 'lt':
          return Number(value) < Number(filter.value);
        case 'in':
          return Array.isArray(value) && value.includes(filter.value);
        default:
          return true;
      }
    });
  });
}
