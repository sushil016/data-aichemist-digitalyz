/**
 * @fileoverview File Parser for CSV and XLSX
 * @description Intelligent file parsing with automatic header mapping and data transformation
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Client,
  Worker,
  Task,
  DataParsingResult,
  HeaderMappingSuggestion,
  EntityTypeName,
  ValidationError,
  FIELD_MAPPINGS
} from '@/types/entities';
import {
  calculateStringSimilarity,
  parseArrayFromString,
  parseNumberArrayFromString,
  sanitizeEntityId,
  safeJsonParse,
  createValidationError
} from './utils';

// ===== FILE VALIDATION =====

/**
 * Validate file type and size
 */
export function validateFile(file: File): {
  isValid: boolean;
  errors: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    extension: string;
  };
} {
  const errors: string[] = [];
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Check file type
  const supportedTypes = ['csv', 'xlsx', 'xls'];
  if (!supportedTypes.includes(extension)) {
    errors.push(`Unsupported file type: ${extension}. Supported types: CSV, XLSX, XLS`);
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`File size too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: 10MB`);
  }
  
  // Check for empty file
  if (file.size === 0) {
    errors.push('File is empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension
    }
  };
}

// ===== HEADER MAPPING =====

/**
 * Generate intelligent header mapping suggestions
 */
export function generateHeaderMappings(
  headers: string[],
  entityType: EntityTypeName
): {
  mappings: Record<string, string>;
  suggestions: HeaderMappingSuggestion[];
  unmappedHeaders: string[];
} {
  const mappings: Record<string, string> = {};
  const suggestions: HeaderMappingSuggestion[] = [];
  const unmappedHeaders: string[] = [];
  
  const fieldMappings = FIELD_MAPPINGS[entityType] as Record<string, string>;
  const targetFields = Object.values(fieldMappings);
  
  headers.forEach(header => {
    const normalizedHeader = header.trim();
    let bestMatch = '';
    let bestScore = 0;
    let reasoning = '';
    
    // 1. Exact match in predefined mappings
    if (fieldMappings[normalizedHeader]) {
      bestMatch = fieldMappings[normalizedHeader];
      bestScore = 1.0;
      reasoning = 'Exact match in predefined mappings';
    } else {
      // 2. Case-insensitive exact match
      const lowerHeader = normalizedHeader.toLowerCase();
      const exactMatch = Object.keys(fieldMappings).find(key => 
        key.toLowerCase() === lowerHeader
      );
      
      if (exactMatch) {
        bestMatch = fieldMappings[exactMatch];
        bestScore = 0.95;
        reasoning = 'Case-insensitive exact match';
      } else {
        // 3. Fuzzy matching with similarity scoring
        targetFields.forEach(field => {
          const similarity = calculateStringSimilarity(normalizedHeader, field);
          if (similarity > bestScore && similarity > 0.6) {
            bestMatch = field;
            bestScore = similarity;
            reasoning = `Similar field name (${Math.round(similarity * 100)}% match)`;
          }
        });
        
        // 4. Check against predefined mapping keys
        Object.entries(fieldMappings).forEach(([key, value]) => {
          const similarity = calculateStringSimilarity(normalizedHeader, key);
          if (similarity > bestScore && similarity > 0.6) {
            bestMatch = value;
            bestScore = similarity;
            reasoning = `Similar to known header format (${Math.round(similarity * 100)}% match)`;
          }
        });
        
        // 5. Partial word matching
        if (bestScore < 0.6) {
          const headerWords = normalizedHeader.toLowerCase().split(/[\s_-]+/);
          targetFields.forEach(field => {
            const fieldWords = field.toLowerCase().split(/(?=[A-Z])/);
            const commonWords = headerWords.filter(word => 
              fieldWords.some(fWord => fWord.includes(word) || word.includes(fWord))
            );
            
            if (commonWords.length > 0) {
              const partialScore = commonWords.length / Math.max(headerWords.length, fieldWords.length);
              if (partialScore > bestScore && partialScore > 0.4) {
                bestMatch = field;
                bestScore = partialScore;
                reasoning = `Partial word match (${Math.round(partialScore * 100)}% match)`;
              }
            }
          });
        }
      }
    }
    
    if (bestMatch && bestScore > 0.4) {
      mappings[normalizedHeader] = bestMatch;
      suggestions.push({
        originalHeader: normalizedHeader,
        suggestedField: bestMatch,
        confidence: bestScore,
        reasoning,
        accepted: bestScore > 0.8 // Auto-accept high confidence matches
      });
    } else {
      unmappedHeaders.push(normalizedHeader);
      suggestions.push({
        originalHeader: normalizedHeader,
        suggestedField: '',
        confidence: 0,
        reasoning: 'No suitable field match found',
        accepted: false
      });
    }
  });
  
  return {
    mappings,
    suggestions,
    unmappedHeaders
  };
}

/**
 * Apply header mappings to transform raw data
 */
export function applyHeaderMappings(
  rawData: Record<string, any>[],
  mappings: Record<string, string>
): Record<string, any>[] {
  return rawData.map(row => {
    const mappedRow: Record<string, any> = {};
    
    Object.entries(row).forEach(([originalHeader, value]) => {
      const mappedField = mappings[originalHeader] || originalHeader;
      mappedRow[mappedField] = value;
    });
    
    return mappedRow;
  });
}

// ===== DATA TRANSFORMATION =====

/**
 * Transform raw CSV row to Client entity
 */
export function transformToClient(rawRow: Record<string, any>, rowIndex: number): {
  client: Partial<Client>;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  
  try {
    const client: Partial<Client> = {
      ClientID: sanitizeEntityId(rawRow.ClientID || '', 'C'),
      ClientName: String(rawRow.ClientName || '').trim(),
      PriorityLevel: Number(rawRow.PriorityLevel) || 1,
      RequestedTaskIDs: parseArrayFromString(rawRow.RequestedTaskIDs || ''),
      GroupTag: String(rawRow.GroupTag || 'Standard').trim(),
      AttributesJSON: typeof rawRow.AttributesJSON === 'string' 
        ? rawRow.AttributesJSON.trim() 
        : JSON.stringify(rawRow.AttributesJSON || {})
    };
    
    // Validate PriorityLevel range
    if (client.PriorityLevel && (client.PriorityLevel < 1 || client.PriorityLevel > 5)) {
      client.PriorityLevel = Math.max(1, Math.min(5, client.PriorityLevel));
      errors.push(createValidationError(
        'client',
        client.ClientID || `ROW_${rowIndex}`,
        rowIndex,
        'PriorityLevel',
        'PriorityLevel',
        'Priority level adjusted to valid range (1-5)',
        'warning',
        `Set to ${client.PriorityLevel}`
      ));
    }
    
    // Validate JSON format
    if (client.AttributesJSON) {
      const parsed = safeJsonParse(client.AttributesJSON, null);
      if (parsed === null && client.AttributesJSON !== '{}') {
        errors.push(createValidationError(
          'client',
          client.ClientID || `ROW_${rowIndex}`,
          rowIndex,
          'AttributesJSON',
          'AttributesJSON',
          'Invalid JSON format in attributes',
          'error',
          'Check JSON syntax'
        ));
      }
    }
    
    return { client, errors };
  } catch (error) {
    errors.push(createValidationError(
      'client',
      `ROW_${rowIndex}`,
      rowIndex,
      'ALL',
      'processing',
      `Failed to transform client data: ${error}`,
      'error'
    ));
    
    return { client: {}, errors };
  }
}

/**
 * Transform raw CSV row to Worker entity
 */
export function transformToWorker(rawRow: Record<string, any>, rowIndex: number): {
  worker: Partial<Worker>;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  
  try {
    const worker: Partial<Worker> = {
      WorkerID: sanitizeEntityId(rawRow.WorkerID || '', 'W'),
      WorkerName: String(rawRow.WorkerName || '').trim(),
      Skills: parseArrayFromString(rawRow.Skills || ''),
      AvailableSlots: parseNumberArrayFromString(rawRow.AvailableSlots || ''),
      MaxLoadPerPhase: Number(rawRow.MaxLoadPerPhase) || 1,
      WorkerGroup: String(rawRow.WorkerGroup || 'General').trim(),
      QualificationLevel: Number(rawRow.QualificationLevel) || 1
    };
    
    // Validate ranges
    if (worker.MaxLoadPerPhase && (worker.MaxLoadPerPhase < 1 || worker.MaxLoadPerPhase > 10)) {
      worker.MaxLoadPerPhase = Math.max(1, Math.min(10, worker.MaxLoadPerPhase));
      errors.push(createValidationError(
        'worker',
        worker.WorkerID || `ROW_${rowIndex}`,
        rowIndex,
        'MaxLoadPerPhase',
        'MaxLoadPerPhase',
        'Max load per phase adjusted to valid range (1-10)',
        'warning',
        `Set to ${worker.MaxLoadPerPhase}`
      ));
    }
    
    if (worker.QualificationLevel && (worker.QualificationLevel < 1 || worker.QualificationLevel > 5)) {
      worker.QualificationLevel = Math.max(1, Math.min(5, worker.QualificationLevel));
      errors.push(createValidationError(
        'worker',
        worker.WorkerID || `ROW_${rowIndex}`,
        rowIndex,
        'QualificationLevel',
        'QualificationLevel',
        'Qualification level adjusted to valid range (1-5)',
        'warning',
        `Set to ${worker.QualificationLevel}`
      ));
    }
    
    // Validate available slots
    if (worker.AvailableSlots) {
      const validSlots = worker.AvailableSlots.filter(slot => slot >= 1 && slot <= 20);
      if (validSlots.length !== worker.AvailableSlots.length) {
        worker.AvailableSlots = validSlots;
        errors.push(createValidationError(
          'worker',
          worker.WorkerID || `ROW_${rowIndex}`,
          rowIndex,
          'AvailableSlots',
          'AvailableSlots',
          'Some invalid phase numbers removed (must be 1-20)',
          'warning',
          `Kept valid phases: [${validSlots.join(', ')}]`
        ));
      }
    }
    
    return { worker, errors };
  } catch (error) {
    errors.push(createValidationError(
      'worker',
      `ROW_${rowIndex}`,
      rowIndex,
      'ALL',
      'processing',
      `Failed to transform worker data: ${error}`,
      'error'
    ));
    
    return { worker: {}, errors };
  }
}

/**
 * Transform raw CSV row to Task entity
 */
export function transformToTask(rawRow: Record<string, any>, rowIndex: number): {
  task: Partial<Task>;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  
  try {
    const task: Partial<Task> = {
      TaskID: sanitizeEntityId(rawRow.TaskID || '', 'T'),
      TaskName: String(rawRow.TaskName || '').trim(),
      Category: String(rawRow.Category || 'General').trim(),
      Duration: Number(rawRow.Duration) || 1,
      RequiredSkills: parseArrayFromString(rawRow.RequiredSkills || ''),
      PreferredPhases: parseNumberArrayFromString(rawRow.PreferredPhases || ''),
      MaxConcurrent: Number(rawRow.MaxConcurrent) || 1
    };
    
    // Validate ranges
    if (task.Duration && (task.Duration < 1 || task.Duration > 10)) {
      task.Duration = Math.max(1, Math.min(10, task.Duration));
      errors.push(createValidationError(
        'task',
        task.TaskID || `ROW_${rowIndex}`,
        rowIndex,
        'Duration',
        'Duration',
        'Duration adjusted to valid range (1-10)',
        'warning',
        `Set to ${task.Duration}`
      ));
    }
    
    if (task.MaxConcurrent && (task.MaxConcurrent < 1 || task.MaxConcurrent > 5)) {
      task.MaxConcurrent = Math.max(1, Math.min(5, task.MaxConcurrent));
      errors.push(createValidationError(
        'task',
        task.TaskID || `ROW_${rowIndex}`,
        rowIndex,
        'MaxConcurrent',
        'MaxConcurrent',
        'Max concurrent adjusted to valid range (1-5)',
        'warning',
        `Set to ${task.MaxConcurrent}`
      ));
    }
    
    // Validate preferred phases
    if (task.PreferredPhases) {
      const validPhases = task.PreferredPhases.filter(phase => phase >= 1 && phase <= 20);
      if (validPhases.length !== task.PreferredPhases.length) {
        task.PreferredPhases = validPhases;
        errors.push(createValidationError(
          'task',
          task.TaskID || `ROW_${rowIndex}`,
          rowIndex,
          'PreferredPhases',
          'PreferredPhases',
          'Some invalid phase numbers removed (must be 1-20)',
          'warning',
          `Kept valid phases: [${validPhases.join(', ')}]`
        ));
      }
    }
    
    return { task, errors };
  } catch (error) {
    errors.push(createValidationError(
      'task',
      `ROW_${rowIndex}`,
      rowIndex,
      'ALL',
      'processing',
      `Failed to transform task data: ${error}`,
      'error'
    ));
    
    return { task: {}, errors };
  }
}

// ===== FILE PARSING =====

/**
 * Parse CSV file using Papa Parse
 */
export async function parseCSVFile(file: File): Promise<{
  data: Record<string, any>[];
  headers: string[];
  meta: any;
  errors: string[];
}> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
      complete: (results) => {
        resolve({
          data: results.data as Record<string, any>[],
          headers: results.meta.fields || [],
          meta: results.meta,
          errors: results.errors.map(error => error.message)
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

/**
 * Parse XLSX file using SheetJS
 */
export async function parseXLSXFile(file: File): Promise<{
  data: Record<string, any>[];
  headers: string[];
  meta: any;
  errors: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('No sheets found in XLSX file'));
          return;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        }) as any[][];
        
        if (jsonData.length === 0) {
          reject(new Error('No data found in XLSX file'));
          return;
        }
        
        // Extract headers and data
        const headers = jsonData[0].map((header: any) => String(header).trim());
        const dataRows = jsonData.slice(1);
        
        // Convert to objects
        const objectData = dataRows.map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
          });
          return obj;
        });
        
        resolve({
          data: objectData,
          headers,
          meta: {
            sheetName,
            totalSheets: workbook.SheetNames.length,
            sheetNames: workbook.SheetNames
          },
          errors: []
        });
        
      } catch (error) {
        reject(new Error(`XLSX parsing failed: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read XLSX file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Main file parsing function
 */
export async function parseFile(
  file: File,
  entityType: EntityTypeName
): Promise<DataParsingResult<Client | Worker | Task>> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
  }
  
  const extension = validation.fileInfo.extension;
  let parseResult: {
    data: Record<string, any>[];
    headers: string[];
    meta: any;
    errors: string[];
  };
  
  // Parse based on file type
  try {
    if (extension === 'csv') {
      parseResult = await parseCSVFile(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      parseResult = await parseXLSXFile(file);
    } else {
      throw new Error(`Unsupported file type: ${extension}`);
    }
  } catch (error) {
    throw new Error(`File parsing failed: ${error}`);
  }
  
  // Generate header mappings
  const mappingResult = generateHeaderMappings(parseResult.headers, entityType);
  
  // Apply header mappings
  const mappedData = applyHeaderMappings(parseResult.data, mappingResult.mappings);
  
  // Transform data to entities
  const entities: (Client | Worker | Task)[] = [];
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  
  mappedData.forEach((row, index) => {
    let transformResult: { 
      client?: Partial<Client>; 
      worker?: Partial<Worker>; 
      task?: Partial<Task>; 
      errors: ValidationError[] 
    };
    
    switch (entityType) {
      case 'client':
        transformResult = transformToClient(row, index);
        if (transformResult.client && Object.keys(transformResult.client).length > 0) {
          entities.push(transformResult.client as Client);
        }
        break;
      case 'worker':
        transformResult = transformToWorker(row, index);
        if (transformResult.worker && Object.keys(transformResult.worker).length > 0) {
          entities.push(transformResult.worker as Worker);
        }
        break;
      case 'task':
        transformResult = transformToTask(row, index);
        if (transformResult.task && Object.keys(transformResult.task).length > 0) {
          entities.push(transformResult.task as Task);
        }
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    // Separate errors and warnings
    const errors = transformResult.errors.filter(e => e.severity === 'error');
    const warnings = transformResult.errors.filter(e => e.severity === 'warning');
    
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  });
  
  return {
    data: entities,
    headers: parseResult.headers,
    mappedHeaders: mappingResult.mappings,
    totalRows: parseResult.data.length,
    processedRows: entities.length,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: mappingResult.suggestions
  };
}

/**
 * Parse multiple files simultaneously
 */
export async function parseMultipleFiles(files: {
  clients?: File;
  workers?: File;
  tasks?: File;
}): Promise<{
  clients?: DataParsingResult<Client>;
  workers?: DataParsingResult<Worker>;
  tasks?: DataParsingResult<Task>;
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: string[];
    totalEntities: number;
    totalErrors: number;
    totalWarnings: number;
  };
}> {
  const results: any = {};
  const failedFiles: string[] = [];
  let totalEntities = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  
  // Parse each file type
  for (const [entityType, file] of Object.entries(files)) {
    if (file) {
      try {
        const result = await parseFile(file, entityType as EntityTypeName);
        results[entityType] = result;
        totalEntities += result.processedRows;
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
      } catch (error) {
        failedFiles.push(`${file.name}: ${error}`);
      }
    }
  }
  
  return {
    ...results,
    summary: {
      totalFiles: Object.keys(files).length,
      successfulFiles: Object.keys(results).length,
      failedFiles,
      totalEntities,
      totalErrors,
      totalWarnings
    }
  };
}

// ===== EXPORT UTILITIES =====

/**
 * Convert entities back to CSV format
 */
export function entitiesToCSV<T extends Record<string, any>>(
  entities: T[],
  entityType: EntityTypeName
): string {
  if (entities.length === 0) return '';
  
  // Get all unique fields from the entities
  const allFields = new Set<string>();
  entities.forEach(entity => {
    Object.keys(entity).forEach(key => allFields.add(key));
  });
  
  const headers = Array.from(allFields);
  
  const csvContent = [
    headers.join(','),
    ...entities.map(entity => 
      headers.map(header => {
        const value = entity[header];
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        } else if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

/**
 * Download processed data as CSV
 */
export function downloadAsCSV<T extends Record<string, any>>(
  entities: T[],
  entityType: EntityTypeName,
  filename?: string
): void {
  const csvContent = entitiesToCSV(entities, entityType);
  
  // Check if we're in browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || `${entityType}s_processed.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } else {
    // Node.js environment - just log the CSV content
    console.log(`\n📄 ${filename || `${entityType}s_processed.csv`}:`);
    console.log('CSV Content (first 500 chars):');
    console.log(csvContent.substring(0, 500) + (csvContent.length > 500 ? '...' : ''));
    console.log(`\nTotal CSV length: ${csvContent.length} characters`);
  }
}
