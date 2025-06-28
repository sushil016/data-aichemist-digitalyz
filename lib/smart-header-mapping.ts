/**
 * @fileoverview Smart Header Mapping Engine
 * @description AI-powered intelligent header mapping for CSV/XLSX files
 */

import { FIELD_MAPPINGS, EntityTypeName } from '@/types/entities';

// ===== FUZZY STRING MATCHING =====

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0) return len2 === 0 ? 1.0 : 0.0;
  if (len2 === 0) return 0.0;
  
  // Create a matrix for dynamic programming
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len1][len2]) / maxLen;
}

/**
 * Smart header mapping suggestions with scoring
 */
export interface HeaderMappingSuggestion {
  originalHeader: string;
  suggestedField: string;
  confidence: number;
  reason: string;
  alternatives: Array<{
    field: string;
    confidence: number;
  }>;
}

/**
 * Generate header mapping suggestions for an entity type
 */
export function generateHeaderMappings(
  headers: string[],
  entityType: EntityTypeName
): HeaderMappingSuggestion[] {
  const mappings: HeaderMappingSuggestion[] = [];
  const targetFields = Object.keys(FIELD_MAPPINGS[entityType]);
  
  for (const header of headers) {
    const suggestions = findBestMatches(header, targetFields, entityType);
    if (suggestions.length > 0) {
      mappings.push({
        originalHeader: header,
        suggestedField: suggestions[0].field,
        confidence: suggestions[0].confidence,
        reason: getMatchingReason(header, suggestions[0].field, entityType),
        alternatives: suggestions.slice(1, 3) // Top 2 alternatives
      });
    }
  }
  
  return mappings;
}

/**
 * Find best matching fields for a header
 */
function findBestMatches(
  header: string,
  targetFields: string[],
  entityType: EntityTypeName
): Array<{ field: string; confidence: number }> {
  const matches: Array<{ field: string; confidence: number }> = [];
  
  for (const field of targetFields) {
    const confidence = calculateHeaderConfidence(header, field, entityType);
    if (confidence > 0.3) { // Minimum threshold
      matches.push({ field, confidence });
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calculate confidence score for header-field matching
 */
function calculateHeaderConfidence(
  header: string,
  field: string,
  entityType: EntityTypeName
): number {
  const normalizedHeader = normalizeHeader(header);
  const normalizedField = normalizeHeader(field);
  
  // Direct similarity
  let confidence = calculateSimilarity(normalizedHeader, normalizedField);
  
  // Boost confidence for known patterns
  const patterns = getKnownPatterns(field, entityType);
  for (const pattern of patterns) {
    const patternSimilarity = calculateSimilarity(normalizedHeader, pattern);
    confidence = Math.max(confidence, patternSimilarity);
  }
  
  // Boost for exact word matches
  const headerWords = normalizedHeader.split(/[_\s-]+/);
  const fieldWords = normalizedField.split(/[_\s-]+/);
  
  const commonWords = headerWords.filter(word => 
    fieldWords.some(fieldWord => calculateSimilarity(word, fieldWord) > 0.8)
  );
  
  if (commonWords.length > 0) {
    confidence += 0.2 * (commonWords.length / Math.max(headerWords.length, fieldWords.length));
  }
  
  return Math.min(confidence, 1.0);
}

/**
 * Normalize header for comparison
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Get known patterns for field mapping
 */
function getKnownPatterns(field: string, entityType: EntityTypeName): string[] {
  const patterns: Record<string, string[]> = {
    // Client patterns
    ClientID: ['client_id', 'clientid', 'client id', 'id', 'client_identifier'],
    ClientName: ['client_name', 'clientname', 'client name', 'name', 'client_title'],
    PriorityLevel: ['priority_level', 'prioritylevel', 'priority level', 'priority', 'prio'],
    RequestedTaskIDs: ['requested_task_ids', 'requestedtaskids', 'requested task ids', 'tasks', 'task_ids', 'taskids'],
    GroupTag: ['group_tag', 'grouptag', 'group tag', 'group', 'category', 'type'],
    AttributesJSON: ['attributes_json', 'attributesjson', 'attributes json', 'attributes', 'metadata', 'extra'],
    
    // Worker patterns
    WorkerID: ['worker_id', 'workerid', 'worker id', 'id', 'worker_identifier'],
    WorkerName: ['worker_name', 'workername', 'worker name', 'name', 'employee_name'],
    Skills: ['skills', 'skill_set', 'skillset', 'abilities', 'expertise', 'competencies'],
    AvailableSlots: ['available_slots', 'availableslots', 'available slots', 'slots', 'availability', 'time_slots'],
    MaxLoadPerPhase: ['max_load_per_phase', 'maxloadperphase', 'max load per phase', 'max_load', 'capacity'],
    WorkerGroup: ['worker_group', 'workergroup', 'worker group', 'group', 'team', 'department'],
    QualificationLevel: ['qualification_level', 'qualificationlevel', 'qualification level', 'level', 'experience'],
    
    // Task patterns
    TaskID: ['task_id', 'taskid', 'task id', 'id', 'task_identifier'],
    TaskName: ['task_name', 'taskname', 'task name', 'name', 'title'],
    Category: ['category', 'task_category', 'type', 'classification'],
    Duration: ['duration', 'time', 'length', 'phases', 'duration_phases'],
    RequiredSkills: ['required_skills', 'requiredskills', 'required skills', 'skills', 'skill_requirements'],
    PreferredPhases: ['preferred_phases', 'preferredphases', 'preferred phases', 'phases', 'timeline'],
    MaxConcurrent: ['max_concurrent', 'maxconcurrent', 'max concurrent', 'concurrent', 'parallel']
  };
  
  return patterns[field] || [];
}

/**
 * Get human-readable reason for mapping suggestion
 */
function getMatchingReason(header: string, field: string, entityType: EntityTypeName): string {
  const similarity = calculateSimilarity(normalizeHeader(header), normalizeHeader(field));
  
  if (similarity > 0.9) {
    return `Exact match with field name`;
  } else if (similarity > 0.7) {
    return `High similarity to field name`;
  } else {
    const patterns = getKnownPatterns(field, entityType);
    for (const pattern of patterns) {
      if (calculateSimilarity(normalizeHeader(header), pattern) > 0.7) {
        return `Matches known pattern: "${pattern}"`;
      }
    }
    return `Fuzzy match based on field analysis`;
  }
}

/**
 * Apply automatic header mapping to data
 */
export function applyHeaderMapping(
  data: Record<string, any>[],
  mappings: HeaderMappingSuggestion[],
  threshold: number = 0.7
): {
  mappedData: Record<string, any>[];
  appliedMappings: string[];
  skippedHeaders: string[];
} {
  const appliedMappings: string[] = [];
  const skippedHeaders: string[] = [];
  
  const mappedData = data.map(row => {
    const newRow: Record<string, any> = {};
    
    for (const [originalHeader, value] of Object.entries(row)) {
      const mapping = mappings.find(m => m.originalHeader === originalHeader);
      
      if (mapping && mapping.confidence >= threshold) {
        newRow[mapping.suggestedField] = value;
        if (!appliedMappings.includes(`${originalHeader} → ${mapping.suggestedField}`)) {
          appliedMappings.push(`${originalHeader} → ${mapping.suggestedField}`);
        }
      } else {
        newRow[originalHeader] = value;
        if (mapping && !skippedHeaders.includes(originalHeader)) {
          skippedHeaders.push(originalHeader);
        }
      }
    }
    
    return newRow;
  });
  
  return {
    mappedData,
    appliedMappings,
    skippedHeaders
  };
}

/**
 * Validate mapping completeness for entity type
 */
export function validateMappingCompleteness(
  mappings: HeaderMappingSuggestion[],
  entityType: EntityTypeName
): {
  isComplete: boolean;
  missingRequired: string[];
  suggestions: string[];
} {
  const requiredFields = {
    client: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag'],
    worker: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
    task: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent']
  };
  
  const mappedFields = mappings.map(m => m.suggestedField);
  const missingRequired = requiredFields[entityType].filter(field => !mappedFields.includes(field));
  
  const suggestions = missingRequired.map(field => 
    `Missing required field: ${field}. Check if any unmapped headers could represent this data.`
  );
  
  return {
    isComplete: missingRequired.length === 0,
    missingRequired,
    suggestions
  };
}
