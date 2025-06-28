/**
 * @fileoverview Search and Query Utilities
 * @description Natural language search and filtering functionality
 */

import {
  Client,
  Worker,
  Task,
  ValidatedClient,
  ValidatedWorker,
  ValidatedTask,
  SearchQuery,
  SearchFilter,
  SearchResult,
  EntityTypeName
} from "@/types/entities";
import { parseArrayFromString, parseNumberArrayFromString } from "./utils";

// ===== SEARCH QUERY PARSING =====

/**
 * Parse natural language query into structured filters
 */
export function parseNaturalLanguageQuery(query: string): SearchFilter[] {
  const filters: SearchFilter[] = [];
  const lowercaseQuery = query.toLowerCase().trim();

  // Priority level patterns
  if (lowercaseQuery.includes('high priority') || lowercaseQuery.includes('priority 5')) {
    filters.push({ field: 'PriorityLevel', operator: 'equals', value: 5 });
  } else if (lowercaseQuery.includes('low priority') || lowercaseQuery.includes('priority 1')) {
    filters.push({ field: 'PriorityLevel', operator: 'equals', value: 1 });
  } else if (lowercaseQuery.match(/priority\s+(\d)/)) {
    const match = lowercaseQuery.match(/priority\s+(\d)/);
    if (match) {
      filters.push({ field: 'PriorityLevel', operator: 'equals', value: parseInt(match[1]) });
    }
  }

  // Skills patterns
  const skillMatches = lowercaseQuery.match(/with\s+([\w\s,]+)\s+skill/);
  if (skillMatches) {
    const skills = skillMatches[1].split(/\s+and\s+|\s*,\s*/).map(s => s.trim());
    skills.forEach(skill => {
      filters.push({ field: 'Skills', operator: 'contains', value: skill, condition: 'and' });
    });
  }

  // Duration patterns
  const durationMatches = lowercaseQuery.match(/duration\s+(more than|greater than|>)\s+(\d+)/);
  if (durationMatches) {
    filters.push({ field: 'Duration', operator: 'greater', value: parseInt(durationMatches[2]) });
  }

  const durationLessMatches = lowercaseQuery.match(/duration\s+(less than|<)\s+(\d+)/);
  if (durationLessMatches) {
    filters.push({ field: 'Duration', operator: 'less', value: parseInt(durationLessMatches[2]) });
  }

  // Phase patterns
  const phaseMatches = lowercaseQuery.match(/phase\s+(\d+)/g);
  if (phaseMatches) {
    const phases = phaseMatches.map(match => parseInt(match.match(/\d+/)![0]));
    filters.push({ field: 'AvailableSlots', operator: 'in', value: phases });
  }

  // Category patterns
  const categoryMatches = lowercaseQuery.match(/(development|testing|design|frontend|backend)/i);
  if (categoryMatches) {
    filters.push({ field: 'Category', operator: 'contains', value: categoryMatches[1] });
  }

  // Group patterns
  const groupMatches = lowercaseQuery.match(/(enterprise|smb|frontend|backend|fullstack)/i);
  if (groupMatches) {
    const value = groupMatches[1];
    if (['enterprise', 'smb'].includes(value.toLowerCase())) {
      filters.push({ field: 'GroupTag', operator: 'equals', value });
    } else {
      filters.push({ field: 'WorkerGroup', operator: 'equals', value });
    }
  }

  // Qualification level patterns
  const qualificationMatches = lowercaseQuery.match(/qualification\s+level\s+(\d)/);
  if (qualificationMatches) {
    filters.push({ field: 'QualificationLevel', operator: 'equals', value: parseInt(qualificationMatches[1]) });
  }

  // Request count patterns
  const requestMatches = lowercaseQuery.match(/requesting\s+(more than|>\s*)?(\d+)\s+task/);
  if (requestMatches) {
    const count = parseInt(requestMatches[2]);
    filters.push({ field: 'RequestedTaskIDs', operator: 'greater', value: count });
  }

  return filters;
}

/**
 * Generate search suggestions based on available data
 */
export function generateSearchSuggestions(
  clients: Client[],
  workers: Worker[],
  tasks: Task[]
): string[] {
  const suggestions: string[] = [];

  // Priority suggestions
  suggestions.push('Show all high priority clients');
  suggestions.push('Find clients with priority level 5');

  // Skills suggestions
  const allSkills = new Set(workers.flatMap(w => parseArrayFromString(w.Skills)));
  const popularSkills = Array.from(allSkills).slice(0, 5);
  popularSkills.forEach(skill => {
    suggestions.push(`Find workers with ${skill} skills`);
  });

  // Duration suggestions
  suggestions.push('Tasks with duration more than 3 phases');
  suggestions.push('Show short duration tasks');

  // Category suggestions
  const categories = new Set(tasks.map(t => t.Category));
  Array.from(categories).forEach(category => {
    suggestions.push(`Show all ${category} tasks`);
  });

  // Group suggestions
  suggestions.push('Show Enterprise clients');
  suggestions.push('Find Frontend workers');

  // Phase suggestions
  suggestions.push('Workers available in phase 2');
  suggestions.push('Tasks preferred in phases 1-3');

  // Complex queries
  suggestions.push('High priority clients requesting more than 5 tasks');
  suggestions.push('Workers with React and Node.js skills');
  suggestions.push('Tasks requiring skills that no worker has');

  return suggestions;
}

// ===== FILTERING FUNCTIONS =====

/**
 * Apply a single filter to an entity
 */
function applyFilter<T extends Record<string, any>>(entity: T, filter: SearchFilter): boolean {
  const value = entity[filter.field];
  const filterValue = filter.value;

  switch (filter.operator) {
    case 'equals':
      return value === filterValue;
    
    case 'contains':
      if (Array.isArray(value)) {
        return value.some(item => 
          String(item).toLowerCase().includes(String(filterValue).toLowerCase())
        );
      }
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    
    case 'greater':
      if (filter.field === 'RequestedTaskIDs') {
        const taskIds = parseArrayFromString(value);
        return taskIds.length > filterValue;
      }
      return Number(value) > Number(filterValue);
    
    case 'less':
      if (filter.field === 'RequestedTaskIDs') {
        const taskIds = parseArrayFromString(value);
        return taskIds.length < filterValue;
      }
      return Number(value) < Number(filterValue);
    
    case 'in':
      if (Array.isArray(value)) {
        return value.some(item => filterValue.includes(item));
      }
      return filterValue.includes(value);
    
    case 'between':
      const numValue = Number(value);
      return numValue >= filterValue[0] && numValue <= filterValue[1];
    
    default:
      return true;
  }
}

/**
 * Apply multiple filters to an array of entities
 */
function applyFilters<T extends Record<string, any>>(
  entities: T[],
  filters: SearchFilter[]
): T[] {
  if (filters.length === 0) return entities;

  return entities.filter(entity => {
    let result = true;
    let orGroup: boolean[] = [];

    for (const filter of filters) {
      const filterResult = applyFilter(entity, filter);

      if (filter.condition === 'or') {
        orGroup.push(filterResult);
      } else {
        // Process any pending OR group
        if (orGroup.length > 0) {
          result = result && orGroup.some(Boolean);
          orGroup = [];
        }
        result = result && filterResult;
      }
    }

    // Process final OR group if exists
    if (orGroup.length > 0) {
      result = result && orGroup.some(Boolean);
    }

    return result;
  });
}

// ===== SEARCH IMPLEMENTATION =====

/**
 * Search clients with natural language query
 */
export function searchClients(
  clients: ValidatedClient[],
  searchQuery: SearchQuery
): SearchResult<ValidatedClient> {
  const startTime = performance.now();

  // Parse natural language query if provided
  let filters = [...searchQuery.filters];
  if (searchQuery.query && searchQuery.query.trim()) {
    const naturalLanguageFilters = parseNaturalLanguageQuery(searchQuery.query);
    filters.push(...naturalLanguageFilters);
  }

  // Apply filters
  let results = applyFilters(clients, filters);

  // Apply sorting
  if (searchQuery.sortBy) {
    results.sort((a, b) => {
      const aValue = (a as any)[searchQuery.sortBy!];
      const bValue = (b as any)[searchQuery.sortBy!];
      
      if (aValue < bValue) return searchQuery.sortOrder === 'desc' ? 1 : -1;
      if (aValue > bValue) return searchQuery.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  const executionTime = performance.now() - startTime;

  return {
    results,
    totalCount: results.length,
    query: searchQuery,
    executionTime,
    suggestions: generateSearchSuggestions(
      clients.map(({ validation, ...client }) => client),
      [],
      []
    ).slice(0, 5)
  };
}

/**
 * Search workers with natural language query
 */
export function searchWorkers(
  workers: ValidatedWorker[],
  searchQuery: SearchQuery
): SearchResult<ValidatedWorker> {
  const startTime = performance.now();

  // Parse natural language query if provided
  let filters = [...searchQuery.filters];
  if (searchQuery.query && searchQuery.query.trim()) {
    const naturalLanguageFilters = parseNaturalLanguageQuery(searchQuery.query);
    filters.push(...naturalLanguageFilters);
  }

  // Apply filters
  let results = applyFilters(workers, filters);

  // Apply sorting
  if (searchQuery.sortBy) {
    results.sort((a, b) => {
      const aValue = (a as any)[searchQuery.sortBy!];
      const bValue = (b as any)[searchQuery.sortBy!];
      
      if (aValue < bValue) return searchQuery.sortOrder === 'desc' ? 1 : -1;
      if (aValue > bValue) return searchQuery.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  const executionTime = performance.now() - startTime;

  return {
    results,
    totalCount: results.length,
    query: searchQuery,
    executionTime,
    suggestions: generateSearchSuggestions(
      [],
      workers.map(({ validation, ...worker }) => worker),
      []
    ).slice(0, 5)
  };
}

/**
 * Search tasks with natural language query
 */
export function searchTasks(
  tasks: ValidatedTask[],
  searchQuery: SearchQuery
): SearchResult<ValidatedTask> {
  const startTime = performance.now();

  // Parse natural language query if provided
  let filters = [...searchQuery.filters];
  if (searchQuery.query && searchQuery.query.trim()) {
    const naturalLanguageFilters = parseNaturalLanguageQuery(searchQuery.query);
    filters.push(...naturalLanguageFilters);
  }

  // Apply filters
  let results = applyFilters(tasks, filters);

  // Apply sorting
  if (searchQuery.sortBy) {
    results.sort((a, b) => {
      const aValue = (a as any)[searchQuery.sortBy!];
      const bValue = (b as any)[searchQuery.sortBy!];
      
      if (aValue < bValue) return searchQuery.sortOrder === 'desc' ? 1 : -1;
      if (aValue > bValue) return searchQuery.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  const executionTime = performance.now() - startTime;

  return {
    results,
    totalCount: results.length,
    query: searchQuery,
    executionTime,
    suggestions: generateSearchSuggestions(
      [],
      [],
      tasks.map(({ validation, ...task }) => task)
    ).slice(0, 5)
  };
}

/**
 * Universal search across all entity types
 */
export function universalSearch(
  clients: ValidatedClient[],
  workers: ValidatedWorker[],
  tasks: ValidatedTask[],
  searchQuery: SearchQuery
): {
  clients: SearchResult<ValidatedClient>;
  workers: SearchResult<ValidatedWorker>;
  tasks: SearchResult<ValidatedTask>;
  totalResults: number;
  executionTime: number;
} {
  const startTime = performance.now();

  const clientResults = searchClients(clients, searchQuery);
  const workerResults = searchWorkers(workers, searchQuery);
  const taskResults = searchTasks(tasks, searchQuery);

  const totalResults = clientResults.totalCount + workerResults.totalCount + taskResults.totalCount;
  const executionTime = performance.now() - startTime;

  return {
    clients: clientResults,
    workers: workerResults,
    tasks: taskResults,
    totalResults,
    executionTime
  };
}

// ===== ADVANCED SEARCH UTILITIES =====

/**
 * Find entities with missing skills
 */
export function findTasksWithMissingSkills(
  tasks: ValidatedTask[],
  workers: ValidatedWorker[]
): {
  tasksWithMissingSkills: ValidatedTask[];
  missingSkillsMap: Record<string, string[]>;
} {
  const workerSkills = new Set(
    workers.flatMap(w => parseArrayFromString(w.Skills))
  );

  const tasksWithMissingSkills: ValidatedTask[] = [];
  const missingSkillsMap: Record<string, string[]> = {};

  tasks.forEach(task => {
    const requiredSkills = parseArrayFromString(task.RequiredSkills);
    const missingSkills = requiredSkills.filter(skill => !workerSkills.has(skill));
    
    if (missingSkills.length > 0) {
      tasksWithMissingSkills.push(task);
      missingSkillsMap[task.TaskID] = missingSkills;
    }
  });

  return {
    tasksWithMissingSkills,
    missingSkillsMap
  };
}

/**
 * Find overloaded workers in specific phases
 */
export function findOverloadedWorkers(
  workers: ValidatedWorker[],
  tasks: ValidatedTask[]
): {
  overloadedWorkers: ValidatedWorker[];
  phaseLoadMap: Record<string, Record<number, number>>;
} {
  const overloadedWorkers: ValidatedWorker[] = [];
  const phaseLoadMap: Record<string, Record<number, number>> = {};

  workers.forEach(worker => {
    const availableSlots = parseNumberArrayFromString(worker.AvailableSlots);
    phaseLoadMap[worker.WorkerID] = {};

    // Calculate potential load per phase
    availableSlots.forEach(phase => {
      const phaseTasks = tasks.filter(task => {
        const preferredPhases = parseNumberArrayFromString(task.PreferredPhases);
        return preferredPhases.includes(phase);
      });

      phaseLoadMap[worker.WorkerID][phase] = phaseTasks.length;

      if (phaseTasks.length > worker.MaxLoadPerPhase) {
        if (!overloadedWorkers.includes(worker)) {
          overloadedWorkers.push(worker);
        }
      }
    });
  });

  return {
    overloadedWorkers,
    phaseLoadMap
  };
}

/**
 * Find skill gaps in the workforce
 */
export function analyzeSkillGaps(
  workers: ValidatedWorker[],
  tasks: ValidatedTask[]
): {
  skillDemand: Record<string, number>;
  skillSupply: Record<string, number>;
  skillGaps: Record<string, number>;
  recommendations: string[];
} {
  // Calculate skill demand from tasks
  const skillDemand: Record<string, number> = {};
  tasks.forEach(task => {
    const requiredSkills = parseArrayFromString(task.RequiredSkills);
    requiredSkills.forEach(skill => {
      skillDemand[skill] = (skillDemand[skill] || 0) + 1;
    });
  });

  // Calculate skill supply from workers
  const skillSupply: Record<string, number> = {};
  workers.forEach(worker => {
    const skills = parseArrayFromString(worker.Skills);
    skills.forEach(skill => {
      skillSupply[skill] = (skillSupply[skill] || 0) + 1;
    });
  });

  // Calculate skill gaps
  const skillGaps: Record<string, number> = {};
  Object.keys(skillDemand).forEach(skill => {
    const demand = skillDemand[skill];
    const supply = skillSupply[skill] || 0;
    if (demand > supply) {
      skillGaps[skill] = demand - supply;
    }
  });

  // Generate recommendations
  const recommendations: string[] = [];
  Object.entries(skillGaps).forEach(([skill, gap]) => {
    if (gap > 3) {
      recommendations.push(`Critical shortage: Need ${gap} more workers with ${skill} skills`);
    } else if (gap > 0) {
      recommendations.push(`Minor shortage: Need ${gap} more workers with ${skill} skills`);
    }
  });

  return {
    skillDemand,
    skillSupply,
    skillGaps,
    recommendations
  };
}

/**
 * Generate auto-complete suggestions for search queries
 */
export function generateAutocompleteSuggestions(
  query: string,
  clients: ValidatedClient[],
  workers: ValidatedWorker[],
  tasks: ValidatedTask[]
): string[] {
  const suggestions: string[] = [];
  const lowercaseQuery = query.toLowerCase();

  // Entity-specific suggestions
  if (lowercaseQuery.includes('client')) {
    const groups = new Set(clients.map(c => c.GroupTag));
    groups.forEach(group => {
      suggestions.push(`Show all ${group} clients`);
    });
  }

  if (lowercaseQuery.includes('worker')) {
    const groups = new Set(workers.map(w => w.WorkerGroup));
    groups.forEach(group => {
      suggestions.push(`Find ${group} workers`);
    });
  }

  if (lowercaseQuery.includes('task')) {
    const categories = new Set(tasks.map(t => t.Category));
    categories.forEach(category => {
      suggestions.push(`Show ${category} tasks`);
    });
  }

  // Skill-based suggestions
  if (lowercaseQuery.includes('skill')) {
    const skills = new Set(workers.flatMap(w => parseArrayFromString(w.Skills)));
    Array.from(skills).slice(0, 5).forEach(skill => {
      suggestions.push(`Workers with ${skill} skills`);
    });
  }

  return suggestions.slice(0, 10);
}
