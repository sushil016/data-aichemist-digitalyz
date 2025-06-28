/**
 * @fileoverview Natural Language Search Engine
 * @description Plain English query processing for data retrieval and filtering
 */

import { Client, Worker, Task, EntityTypeName } from '@/types/entities';

// ===== QUERY PARSING TYPES =====

export interface ParsedQuery {
  entityType: EntityTypeName | 'all';
  conditions: QueryCondition[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  fields?: string[];
}

export interface QueryCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'between';
  value: any;
  secondValue?: any; // For 'between' operator
}

export interface SearchResult<T = any> {
  data: T[];
  totalCount: number;
  query: string;
  parsedQuery: ParsedQuery;
  executionTime: number;
  suggestions: string[];
}

// ===== NATURAL LANGUAGE PATTERNS =====

const ENTITY_PATTERNS = {
  client: ['client', 'clients', 'customer', 'customers'],
  worker: ['worker', 'workers', 'employee', 'employees', 'staff', 'person', 'people'],
  task: ['task', 'tasks', 'job', 'jobs', 'project', 'projects']
};

const FIELD_PATTERNS = {
  // Client fields
  ClientID: ['client id', 'id', 'identifier'],
  ClientName: ['client name', 'name', 'title'],
  PriorityLevel: ['priority', 'priority level', 'importance', 'urgency'],
  RequestedTaskIDs: ['requested tasks', 'tasks', 'task ids', 'assignments'],
  GroupTag: ['group', 'category', 'type', 'tag'],
  AttributesJSON: ['attributes', 'metadata', 'extra data'],
  
  // Worker fields
  WorkerID: ['worker id', 'id', 'identifier'],
  WorkerName: ['worker name', 'name', 'employee name'],
  Skills: ['skills', 'abilities', 'expertise', 'competencies'],
  AvailableSlots: ['available slots', 'availability', 'time slots', 'schedule'],
  MaxLoadPerPhase: ['max load', 'capacity', 'load limit'],
  WorkerGroup: ['group', 'team', 'department'],
  QualificationLevel: ['qualification', 'level', 'experience', 'skill level'],
  
  // Task fields
  TaskID: ['task id', 'id', 'identifier'],
  TaskName: ['task name', 'name', 'title'],
  Category: ['category', 'type', 'classification'],
  Duration: ['duration', 'time', 'phases', 'length'],
  RequiredSkills: ['required skills', 'skills', 'requirements'],
  PreferredPhases: ['preferred phases', 'phases', 'timeline'],
  MaxConcurrent: ['max concurrent', 'concurrent', 'parallel']
};

const OPERATOR_PATTERNS = {
  equals: ['is', 'equals', 'equal to', '=', 'exactly'],
  not_equals: ['is not', 'not equal', 'not equals', '!=', 'different from'],
  greater_than: ['greater than', 'more than', 'above', '>', 'higher than'],
  less_than: ['less than', 'below', 'under', '<', 'lower than'],
  contains: ['contains', 'includes', 'has', 'with'],
  not_contains: ['does not contain', 'without', 'not having'],
  in: ['in', 'among', 'one of'],
  not_in: ['not in', 'not among', 'not one of'],
  between: ['between', 'from', 'ranging']
};

const VALUE_PATTERNS = {
  high: ['high', 'top', 'maximum', 'max'],
  low: ['low', 'bottom', 'minimum', 'min'],
  medium: ['medium', 'average', 'mid'],
  priority_5: ['highest priority', 'top priority', 'critical'],
  priority_4: ['high priority', 'important'],
  priority_3: ['medium priority', 'normal'],
  priority_2: ['low priority'],
  priority_1: ['lowest priority', 'minimal']
};

// ===== QUERY PARSER =====

export class NaturalLanguageSearchEngine {
  private static instance: NaturalLanguageSearchEngine;
  
  static getInstance(): NaturalLanguageSearchEngine {
    if (!NaturalLanguageSearchEngine.instance) {
      NaturalLanguageSearchEngine.instance = new NaturalLanguageSearchEngine();
    }
    return NaturalLanguageSearchEngine.instance;
  }

  /**
   * Parse natural language query into structured query
   */
  parseQuery(query: string): ParsedQuery {
    const normalizedQuery = query.toLowerCase().trim();
    
    return {
      entityType: this.extractEntityType(normalizedQuery),
      conditions: this.extractConditions(normalizedQuery),
      sortBy: this.extractSortField(normalizedQuery),
      sortOrder: this.extractSortOrder(normalizedQuery),
      limit: this.extractLimit(normalizedQuery),
      fields: this.extractFields(normalizedQuery)
    };
  }

  /**
   * Execute search query on data
   */
  search<T extends Client | Worker | Task>(
    query: string,
    data: {
      clients: Client[];
      workers: Worker[];
      tasks: Task[];
    }
  ): SearchResult<T> {
    const startTime = performance.now();
    const parsedQuery = this.parseQuery(query);
    
    let results: any[] = [];
    
    // Select data based on entity type
    switch (parsedQuery.entityType) {
      case 'client':
        results = this.filterData(data.clients, parsedQuery.conditions);
        break;
      case 'worker':
        results = this.filterData(data.workers, parsedQuery.conditions);
        break;
      case 'task':
        results = this.filterData(data.tasks, parsedQuery.conditions);
        break;
      case 'all':
        results = [
          ...this.filterData(data.clients, parsedQuery.conditions),
          ...this.filterData(data.workers, parsedQuery.conditions),
          ...this.filterData(data.tasks, parsedQuery.conditions)
        ];
        break;
    }
    
    // Apply sorting
    if (parsedQuery.sortBy) {
      results.sort((a, b) => {
        const aVal = a[parsedQuery.sortBy!];
        const bVal = b[parsedQuery.sortBy!];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return parsedQuery.sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    // Apply limit
    if (parsedQuery.limit) {
      results = results.slice(0, parsedQuery.limit);
    }
    
    const endTime = performance.now();
    
    return {
      data: results,
      totalCount: results.length,
      query,
      parsedQuery,
      executionTime: endTime - startTime,
      suggestions: this.generateSuggestions(query, parsedQuery)
    };
  }

  /**
   * Extract entity type from query
   */
  private extractEntityType(query: string): EntityTypeName | 'all' {
    for (const [entityType, patterns] of Object.entries(ENTITY_PATTERNS)) {
      if (patterns.some(pattern => query.includes(pattern))) {
        return entityType as EntityTypeName;
      }
    }
    return 'all';
  }

  /**
   * Extract conditions from query
   */
  private extractConditions(query: string): QueryCondition[] {
    const conditions: QueryCondition[] = [];
    
    // Common query patterns
    const patterns = [
      // Priority patterns
      /(?:priority|importance|urgency)\s+(?:is\s+)?(?:level\s+)?(\d+|high|low|medium|top|bottom)/gi,
      /(?:high|low|medium|top|bottom|highest|lowest)\s+priority/gi,
      
      // Duration patterns
      /duration\s+(?:is\s+)?(?:more than|greater than|above|>)\s+(\d+)/gi,
      /duration\s+(?:is\s+)?(?:less than|below|under|<)\s+(\d+)/gi,
      /duration\s+(?:is\s+)?(?:exactly\s+)?(\d+)/gi,
      
      // Skills patterns
      /(?:with|having|contains?)\s+(?:skills?\s+)?(?:like\s+)?([a-zA-Z\s,]+?)(?:\s+(?:and|or|skill)|\s*$)/gi,
      /skills?\s+(?:include|contain|have)\s+([a-zA-Z\s,]+?)(?:\s+(?:and|or)|\s*$)/gi,
      
      // Phase patterns
      /(?:available in|working in|in)\s+phase\s+(\d+)/gi,
      /phase[s]?\s+(\d+(?:\s*(?:and|,)\s*\d+)*)/gi,
      
      // General field = value patterns
      /(\w+)\s+(?:is|equals?|=)\s+([^,\s]+)/gi
    ];
    
    // Extract priority conditions
    const priorityMatch = query.match(/(?:priority|importance|urgency)\s+(?:is\s+)?(?:level\s+)?(\d+|high|low|medium|top|bottom)/i);
    if (priorityMatch) {
      const value = this.normalizePriorityValue(priorityMatch[1]);
      if (value !== null) {
        conditions.push({
          field: 'PriorityLevel',
          operator: 'equals',
          value
        });
      }
    }
    
    // Extract duration conditions
    const durationMoreMatch = query.match(/duration\s+(?:is\s+)?(?:more than|greater than|above|>)\s+(\d+)/i);
    if (durationMoreMatch) {
      conditions.push({
        field: 'Duration',
        operator: 'greater_than',
        value: parseInt(durationMoreMatch[1])
      });
    }
    
    const durationLessMatch = query.match(/duration\s+(?:is\s+)?(?:less than|below|under|<)\s+(\d+)/i);
    if (durationLessMatch) {
      conditions.push({
        field: 'Duration',
        operator: 'less_than',
        value: parseInt(durationLessMatch[1])
      });
    }
    
    // Extract skill conditions
    const skillsMatch = query.match(/(?:with|having|contains?)\s+(?:skills?\s+)?(?:like\s+)?([a-zA-Z\s,]+?)(?:\s+(?:and|or|skill)|\s*$)/i);
    if (skillsMatch) {
      const skills = skillsMatch[1].split(/\s+(?:and|or)\s+|,\s*/).map(s => s.trim()).filter(s => s);
      if (skills.length > 0) {
        conditions.push({
          field: 'Skills',
          operator: 'contains',
          value: skills
        });
      }
    }
    
    return conditions;
  }

  /**
   * Filter data based on conditions
   */
  private filterData<T extends Record<string, any>>(data: T[], conditions: QueryCondition[]): T[] {
    return data.filter(item => {
      return conditions.every(condition => {
        return this.evaluateCondition(item, condition);
      });
    });
  }

  /**
   * Evaluate single condition against data item
   */
  private evaluateCondition(item: Record<string, any>, condition: QueryCondition): boolean {
    const fieldValue = item[condition.field];
    
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      
      case 'not_equals':
        return fieldValue !== condition.value;
      
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      
      case 'contains':
        if (Array.isArray(fieldValue)) {
          if (Array.isArray(condition.value)) {
            return condition.value.some(val => 
              fieldValue.some(item => 
                String(item).toLowerCase().includes(String(val).toLowerCase())
              )
            );
          } else {
            return fieldValue.some(item => 
              String(item).toLowerCase().includes(String(condition.value).toLowerCase())
            );
          }
        } else {
          return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
        }
      
      case 'not_contains':
        if (Array.isArray(fieldValue)) {
          return !fieldValue.some(item => 
            String(item).toLowerCase().includes(String(condition.value).toLowerCase())
          );
        } else {
          return !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
        }
      
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      
      case 'between':
        const numValue = Number(fieldValue);
        return numValue >= Number(condition.value) && numValue <= Number(condition.secondValue);
      
      default:
        return false;
    }
  }

  /**
   * Extract sort field from query
   */
  private extractSortField(query: string): string | undefined {
    const sortMatch = query.match(/(?:sort by|order by)\s+(\w+)/i);
    return sortMatch ? sortMatch[1] : undefined;
  }

  /**
   * Extract sort order from query
   */
  private extractSortOrder(query: string): 'asc' | 'desc' | undefined {
    if (query.includes('descending') || query.includes('desc') || query.includes('highest first')) {
      return 'desc';
    } else if (query.includes('ascending') || query.includes('asc') || query.includes('lowest first')) {
      return 'asc';
    }
    return undefined;
  }

  /**
   * Extract limit from query
   */
  private extractLimit(query: string): number | undefined {
    const limitMatch = query.match(/(?:top|first|limit|show)\s+(\d+)/i);
    return limitMatch ? parseInt(limitMatch[1]) : undefined;
  }

  /**
   * Extract fields from query
   */
  private extractFields(query: string): string[] | undefined {
    const fieldsMatch = query.match(/(?:show|display|get)\s+(?:only\s+)?([^,\s]+(?:\s*,\s*[^,\s]+)*)/i);
    if (fieldsMatch) {
      return fieldsMatch[1].split(',').map(field => field.trim());
    }
    return undefined;
  }

  /**
   * Normalize priority value
   */
  private normalizePriorityValue(value: string): number | null {
    const lowerValue = value.toLowerCase();
    
    if (['high', 'top', 'maximum', 'highest', '5'].includes(lowerValue)) return 5;
    if (['4'].includes(lowerValue)) return 4;
    if (['medium', 'average', 'mid', '3'].includes(lowerValue)) return 3;
    if (['2'].includes(lowerValue)) return 2;
    if (['low', 'bottom', 'minimum', 'lowest', '1'].includes(lowerValue)) return 1;
    
    const numValue = parseInt(value);
    return !isNaN(numValue) && numValue >= 1 && numValue <= 5 ? numValue : null;
  }

  /**
   * Generate query suggestions
   */
  private generateSuggestions(originalQuery: string, parsedQuery: ParsedQuery): string[] {
    const suggestions: string[] = [];
    
    // Suggest entity-specific queries
    if (parsedQuery.entityType === 'all') {
      suggestions.push(
        'Try specifying an entity type: "Show all clients..." or "Find workers..."',
        'Example: "Show all high priority clients"',
        'Example: "Find workers with React skills"'
      );
    }
    
    // Suggest condition improvements
    if (parsedQuery.conditions.length === 0) {
      suggestions.push(
        'Add specific conditions: "with priority level 5"',
        'Filter by attributes: "with React and Node.js skills"',
        'Use comparisons: "duration more than 3 phases"'
      );
    }
    
    // Suggest common queries
    suggestions.push(
      '"Show all high priority clients"',
      '"Find workers with React and Node.js skills"',
      '"Tasks with duration more than 3 phases"',
      '"Workers available in phases 2 and 3"',
      '"Clients requesting more than 5 tasks"'
    );
    
    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }
}

// ===== QUERY EXAMPLES =====

export const EXAMPLE_QUERIES = [
  {
    query: "Show all high priority clients",
    description: "Find clients with priority level 5"
  },
  {
    query: "Find workers with React and Node.js skills",
    description: "Filter workers by specific skills"
  },
  {
    query: "Tasks with duration more than 3 phases",
    description: "Find long-running tasks"
  },
  {
    query: "Workers available in phases 2 and 3",
    description: "Check worker availability"
  },
  {
    query: "Clients requesting more than 5 tasks",
    description: "Find clients with many task requests"
  },
  {
    query: "Tasks requiring skills that no worker has",
    description: "Identify skill gaps"
  },
  {
    query: "Show Frontend workers with qualification level above 3",
    description: "Find experienced frontend developers"
  },
  {
    query: "Development tasks with high priority clients",
    description: "Combine task and client filters"
  }
];

// Export singleton instance
export const naturalLanguageSearch = NaturalLanguageSearchEngine.getInstance();
