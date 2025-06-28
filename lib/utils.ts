/**
 * @fileoverview Data Alchemist - Utility Functions
 * @description Class merging, data transformation, and common helpers for data processing
 * @requirements Support CSV/XLSX processing, validation, header mapping, and data cleanup
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  Client, 
  Worker, 
  Task, 
  ValidationError, 
  ValidationState,
  ValidatedClient,
  ValidatedWorker,
  ValidatedTask,
  HeaderMappingSuggestion,
  Entity,
  EntityTypeName,
  FIELD_MAPPINGS,
  VALIDATION_CONSTANTS
} from "@/types/entities";

// ===== CLASS NAME UTILITIES =====

/**
 * Utility function for merging CSS classes with Tailwind CSS
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate dynamic CSS classes based on validation state
 */
export function getValidationClasses(validation: ValidationState): string {
  if (!validation.isValid && validation.errors.length > 0) {
    return cn(
      "border-red-500 bg-red-50 text-red-900",
      "focus:border-red-500 focus:ring-red-200"
    );
  }
  
  if (validation.warnings.length > 0) {
    return cn(
      "border-yellow-500 bg-yellow-50 text-yellow-900",
      "focus:border-yellow-500 focus:ring-yellow-200"
    );
  }
  
  return cn(
    "border-green-500 bg-green-50 text-green-900",
    "focus:border-green-500 focus:ring-green-200"
  );
}

/**
 * Generate CSS classes for severity levels
 */
export function getSeverityClasses(severity: 'error' | 'warning' | 'info'): string {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
  
  switch (severity) {
    case 'error':
      return cn(baseClasses, "bg-red-100 text-red-800 border border-red-200");
    case 'warning':
      return cn(baseClasses, "bg-yellow-100 text-yellow-800 border border-yellow-200");
    case 'info':
      return cn(baseClasses, "bg-blue-100 text-blue-800 border border-blue-200");
    default:
      return cn(baseClasses, "bg-gray-100 text-gray-800 border border-gray-200");
  }
}

// ===== DATA TRANSFORMATION UTILITIES =====

/**
 * Safe JSON parser with fallback
 */
export function safeJsonParse<T = any>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Parse array from string (handles various formats)
 */
export function parseArrayFromString(value: string | string[]): string[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  
  // Handle different array formats
  const trimmed = value.trim();
  
  // JSON array format
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      // Fallback to comma-separated if JSON parsing fails
      return trimmed.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  
  // Comma-separated format
  return trimmed.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse number array from string
 */
export function parseNumberArrayFromString(value: string | number[]): number[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  
  const stringArray = parseArrayFromString(value);
  return stringArray.map(Number).filter(n => !isNaN(n));
}

/**
 * Sanitize and format entity ID
 */
export function sanitizeEntityId(id: string, prefix: string): string {
  if (!id) return '';
  
  const sanitized = id.toString().trim().toUpperCase();
  
  // Add prefix if not present
  if (!sanitized.startsWith(prefix)) {
    return `${prefix}${sanitized}`;
  }
  
  return sanitized;
}

/**
 * Generate unique entity ID
 */
export function generateEntityId(entityType: EntityTypeName, existingIds: string[]): string {
  const prefixes = {
    client: 'C',
    worker: 'W',
    task: 'T'
  };
  
  const prefix = prefixes[entityType];
  let counter = 1;
  let newId: string;
  
  do {
    newId = `${prefix}${counter.toString().padStart(3, '0')}`;
    counter++;
  } while (existingIds.includes(newId));
  
  return newId;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (Array.isArray(obj)) return obj.map(deepClone) as any;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// ===== HEADER MAPPING UTILITIES =====


/**
 * Generate header mapping suggestions using AI-like logic
 */
export function generateHeaderMappingSuggestions(
  headers: string[], 
  entityType: EntityTypeName
): HeaderMappingSuggestion[] {
  const fieldMappings = FIELD_MAPPINGS[entityType] as Record<string, string>;
  const suggestions: HeaderMappingSuggestion[] = [];
  
  headers.forEach(header => {
    let bestMatch: { field: string; confidence: number } | null = null;
    
    // Check exact matches first
    if (fieldMappings[header]) {
      bestMatch = { field: fieldMappings[header], confidence: 1.0 };
    } else {
      // Find best fuzzy match
      for (const [pattern, field] of Object.entries(fieldMappings)) {
        const similarity = calculateStringSimilarity(header, pattern);
        if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.confidence)) {
          bestMatch = { field, confidence: similarity };
        }
      }
    }
    
    if (bestMatch) {
      suggestions.push({
        originalHeader: header,
        suggestedField: bestMatch.field,
        confidence: bestMatch.confidence,
        reasoning: bestMatch.confidence === 1 
          ? `Exact match found for "${header}"` 
          : `Similar to expected format (${Math.round(bestMatch.confidence * 100)}% confidence)`,
        accepted: bestMatch.confidence > 0.9
      });
    }
  });
  
  return suggestions;
}

/**
 * Apply header mappings to raw data
 */
export function applyHeaderMappings<T extends Record<string, any>>(
  rawData: Record<string, any>[],
  mappings: Record<string, string>
): T[] {
  return rawData.map(row => {
    const mappedRow: Record<string, any> = {};
    
    for (const [originalHeader, value] of Object.entries(row)) {
      const mappedField = mappings[originalHeader] || originalHeader;
      mappedRow[mappedField] = value;
    }
    
    return mappedRow as T;
  });
}

// ===== VALIDATION UTILITIES =====

/**
 * Create initial validation state
 */
export function createInitialValidationState(): ValidationState {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    lastValidated: new Date(),
    autoFixesApplied: 0
  };
}

// ===== VALIDATION ENGINE UTILITIES =====

/**
 * Generate unique validation ID
 */
export function generateValidationId(): string {
  return `val_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create standardized validation error
 */
export function createValidationError(
  entityType: EntityTypeName,
  entityId: string,
  row: number,
  column: string,
  field: string,
  message: string,
  severity: 'error' | 'warning' | 'info' = 'error',
  suggestedFix?: string
): ValidationError {
  return {
    id: generateValidationId(),
    entityType,
    entityId,
    row,
    column,
    field,
    message,
    severity,
    suggestedFix,
    autoFixable: Boolean(suggestedFix && severity !== 'error')
  };
}

/**
 * Validate required fields with comprehensive error reporting
 */
export function validateRequiredFields(
  entity: Record<string, any>,
  requiredFields: string[],
  entityType: EntityTypeName,
  entityId: string,
  row: number = 0
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  requiredFields.forEach(field => {
    const value = entity[field];
    if (value === undefined || value === null || value === '') {
      errors.push(createValidationError(
        entityType,
        entityId,
        row,
        field,
        field,
        `Required field "${field}" is missing or empty`,
        'error',
        `Provide a valid value for ${field}`
      ));
    }
  });
  
  return errors;
}

/**
 * Validate numeric range with type checking
 */
export function validateNumericRange(
  value: any,
  min: number,
  max: number,
  fieldName: string,
  entityType: EntityTypeName,
  entityId: string,
  row: number = 0
): ValidationError[] {
  if (value === undefined || value === null) return [];
  
  if (typeof value !== 'number') {
    return [createValidationError(
      entityType,
      entityId,
      row,
      fieldName,
      fieldName,
      `${fieldName} must be a number, got ${typeof value}`,
      'error',
      `Convert "${value}" to a number between ${min} and ${max}`
    )];
  }
  
  if (value < min || value > max) {
    return [createValidationError(
      entityType,
      entityId,
      row,
      fieldName,
      fieldName,
      `${fieldName} (${value}) must be between ${min} and ${max}`,
      'error',
      `Set ${fieldName} to a value between ${min} and ${max}`
    )];
  }
  
  return [];
}

/**
 * Validate array format with element type checking
 */
export function validateArrayFormat(
  value: any,
  fieldName: string,
  entityType: EntityTypeName,
  entityId: string,
  row: number = 0,
  options: {
    maxLength?: number;
    elementType?: 'string' | 'number';
    allowEmpty?: boolean;
  } = {}
): ValidationError[] {
  if (value === undefined || value === null) {
    return options.allowEmpty ? [] : [createValidationError(
      entityType,
      entityId,
      row,
      fieldName,
      fieldName,
      `${fieldName} is required but is missing`,
      'error',
      `Provide an array for ${fieldName}`
    )];
  }
  
  if (!Array.isArray(value)) {
    return [createValidationError(
      entityType,
      entityId,
      row,
      fieldName,
      fieldName,
      `${fieldName} must be an array, got ${typeof value}`,
      'error',
      `Convert "${value}" to an array format`
    )];
  }
  
  const errors: ValidationError[] = [];
  
  if (options.maxLength && value.length > options.maxLength) {
    errors.push(createValidationError(
      entityType,
      entityId,
      row,
      fieldName,
      fieldName,
      `${fieldName} array too long: ${value.length} items (max ${options.maxLength})`,
      'error',
      `Reduce array size to ${options.maxLength} items`
    ));
  }
  
  // Validate element types
  if (options.elementType) {
    value.forEach((element, index) => {
      if (typeof element !== options.elementType) {
        errors.push(createValidationError(
          entityType,
          entityId,
          row,
          `${fieldName}[${index}]`,
          fieldName,
          `Array element at index ${index} must be ${options.elementType}, got ${typeof element}`,
          'error',
          `Convert "${element}" to ${options.elementType}`
        ));
      }
    });
  }
  
  return errors;
}

/**
 * Validate JSON format with comprehensive error messages
 */
export function validateJsonFormat(
  value: any,
  fieldName: string,
  entityType: EntityTypeName,
  entityId: string,
  row: number = 0,
  maxSize: number = 5000
): ValidationError[] {
  if (value === undefined || value === null) return [];
  
  if (typeof value !== 'string') {
    return [createValidationError(
      entityType,
      entityId,
      row,
      fieldName,
      fieldName,
      `${fieldName} must be a JSON string, got ${typeof value}`,
      'error',
      'Convert to valid JSON string format'
    )];
  }
  
  if (value.length > maxSize) {
    return [createValidationError(
      entityType,
      entityId,
      row,
      fieldName,
      fieldName,
      `${fieldName} JSON too large: ${value.length} characters (max ${maxSize})`,
      'error',
      'Reduce JSON size or split into smaller objects'
    )];
  }
  
  try {
    JSON.parse(value);
    return [];
  } catch (error: any) {
    return [createValidationError(
      entityType,
      entityId,
      row,
      fieldName,
      fieldName,
      `Invalid JSON format: ${error?.message || 'Unknown parsing error'}`,
      'error',
      'Fix JSON syntax errors (check quotes, brackets, commas)'
    )];
  }
}

/**
 * Check for duplicate values in array
 */
export function findDuplicates<T>(array: T[]): T[] {
  return array.filter((item, index) => array.indexOf(item) !== index);
}

/**
 * Validate cross-entity references
 */
export function validateCrossReferences(
  sourceEntityId: string,
  referenceIds: string[],
  targetEntities: any[],
  targetIdField: string,
  fieldName: string,
  entityType: EntityTypeName,
  row: number = 0
): ValidationError[] {
  const errors: ValidationError[] = [];
  const targetIds = new Set(targetEntities.map(entity => entity[targetIdField]));
  
  referenceIds.forEach(refId => {
    if (!targetIds.has(refId)) {
      errors.push(createValidationError(
        entityType,
        sourceEntityId,
        row,
        fieldName,
        fieldName,
        `Referenced ${targetIdField} "${refId}" does not exist`,
        'error',
        `Remove invalid reference or add entity with ${targetIdField} "${refId}"`
      ));
    }
  });
  
  return errors;
}

// ===== FUZZY MATCHING FOR HEADER MAPPING =====

/**
 * Calculate string similarity using Levenshtein distance
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - (matrix[s2.length][s1.length] / maxLength);
}

/**
 * Find best matching field for header using fuzzy matching
 */
export function findBestFieldMatch(
  header: string,
  possibleFields: string[],
  threshold: number = 0.6
): { field: string | null; confidence: number; reasoning: string } {
  let bestMatch = '';
  let bestScore = 0;
  
  possibleFields.forEach(field => {
    const score = calculateStringSimilarity(header, field);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = field;
    }
  });
  
  const reasoning = bestScore >= threshold 
    ? `Header "${header}" matches field "${bestMatch}" with ${Math.round(bestScore * 100)}% confidence`
    : `No good match found for header "${header}" (best: ${bestMatch} at ${Math.round(bestScore * 100)}%)`;
  
  return {
    field: bestScore >= threshold ? bestMatch : null,
    confidence: bestScore,
    reasoning
  };
}
