/**
 * @fileoverview Comprehensive Validation Engine
 * @description Complete validation system for client-worker-task data with cross-reference validation
 */

import {
  Client,
  Worker,
  Task,
  ValidationError,
  ValidationState,
  ValidatedClient,
  ValidatedWorker,
  ValidatedTask,
  EntityTypeName,
  DataSet
} from "@/types/entities";
// UUID generation utility
function generateId(): string {
  return 'val_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// ===== VALIDATION CONSTANTS =====

export const VALIDATION_RULES = {
  PRIORITY_LEVEL: { min: 1, max: 5 },
  DURATION: { min: 1, max: 10 },
  QUALIFICATION_LEVEL: { min: 1, max: 5 },
  MAX_LOAD_PER_PHASE: { min: 1, max: 10 },
  MAX_CONCURRENT: { min: 1, max: 5 },
  PHASE_RANGE: { min: 1, max: 10 },
  MAX_ARRAY_LENGTH: 50,
  MAX_STRING_LENGTH: 1000,
  MAX_JSON_SIZE: 5000
} as const;

// ===== CORE VALIDATION ENGINE =====

export class ValidationEngine {
  private static instance: ValidationEngine;
  private crossReferenceCache: Map<string, Set<string>> = new Map();

  static getInstance(): ValidationEngine {
    if (!ValidationEngine.instance) {
      ValidationEngine.instance = new ValidationEngine();
    }
    return ValidationEngine.instance;
  }

  /**
   * Validate complete dataset with cross-reference checks
   */
  validateDataSet(dataset: {
    clients: Client[];
    workers: Worker[];
    tasks: Task[];
  }): {
    validatedClients: ValidatedClient[];
    validatedWorkers: ValidatedWorker[];
    validatedTasks: ValidatedTask[];
    crossEntityErrors: ValidationError[];
    globalValidation: {
      isValid: boolean;
      totalErrors: number;
      totalWarnings: number;
      crossEntityErrors: ValidationError[];
    };
  } {
    // Clear cache
    this.crossReferenceCache.clear();
    
    // Build cross-reference cache
    this.buildCrossReferenceCache(dataset);

    // Validate individual entities
    const validatedClients = dataset.clients.map((client, index) => 
      this.validateClientEntity(client, index, dataset)
    );
    
    const validatedWorkers = dataset.workers.map((worker, index) => 
      this.validateWorkerEntity(worker, index, dataset)
    );
    
    const validatedTasks = dataset.tasks.map((task, index) => 
      this.validateTaskEntity(task, index, dataset)
    );

    // Perform cross-entity validation
    const crossEntityErrors = this.validateCrossEntityReferences(dataset);

    // Calculate global validation state
    const totalErrors = [
      ...validatedClients.flatMap(c => c.validation.errors),
      ...validatedWorkers.flatMap(w => w.validation.errors),
      ...validatedTasks.flatMap(t => t.validation.errors),
      ...crossEntityErrors.filter(e => e.severity === 'error')
    ].length;

    const totalWarnings = [
      ...validatedClients.flatMap(c => c.validation.warnings),
      ...validatedWorkers.flatMap(w => w.validation.warnings),
      ...validatedTasks.flatMap(t => t.validation.warnings),
      ...crossEntityErrors.filter(e => e.severity === 'warning')
    ].length;

    return {
      validatedClients,
      validatedWorkers,
      validatedTasks,
      crossEntityErrors,
      globalValidation: {
        isValid: totalErrors === 0,
        totalErrors,
        totalWarnings,
        crossEntityErrors
      }
    };
  }

  /**
   * Validate individual client entity
   */
  validateClientEntity(client: Client, row: number, dataset: any): ValidatedClient {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Required fields validation
    errors.push(...this.validateRequiredFields(client, [
      'ClientID', 'ClientName', 'PriorityLevel', 'GroupTag'
    ], 'client', row));

    // 2. Duplicate ID validation
    errors.push(...this.validateDuplicateId(client.ClientID, 'ClientID', 'client', row, dataset.clients));

    // 3. Priority level range validation
    if (client.PriorityLevel !== undefined) {
      errors.push(...this.validateNumericRange(
        client.PriorityLevel,
        VALIDATION_RULES.PRIORITY_LEVEL.min,
        VALIDATION_RULES.PRIORITY_LEVEL.max,
        'PriorityLevel',
        'client',
        row
      ));
    }

    // 4. RequestedTaskIDs array validation
    if (client.RequestedTaskIDs !== undefined) {
      const arrayValidation = this.validateArrayField(
        client.RequestedTaskIDs,
        'RequestedTaskIDs',
        'client',
        row,
        { maxLength: VALIDATION_RULES.MAX_ARRAY_LENGTH }
      );
      errors.push(...arrayValidation.errors);
      warnings.push(...arrayValidation.warnings);
    }

    // 5. AttributesJSON validation
    if (client.AttributesJSON !== undefined) {
      errors.push(...this.validateJsonField(
        client.AttributesJSON,
        'AttributesJSON',
        'client',
        row
      ));
    }

    // 6. String length validation
    errors.push(...this.validateStringLength(client.ClientName, 'ClientName', 'client', row));
    errors.push(...this.validateStringLength(client.GroupTag, 'GroupTag', 'client', row));

    const validation: ValidationState = {
      isValid: errors.length === 0,
      errors,
      warnings,
      lastValidated: new Date(),
      autoFixesApplied: 0
    };

    return { ...client, validation };
  }

  /**
   * Validate individual worker entity
   */
  validateWorkerEntity(worker: Worker, row: number, dataset: any): ValidatedWorker {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Required fields validation
    errors.push(...this.validateRequiredFields(worker, [
      'WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'
    ], 'worker', row));

    // 2. Duplicate ID validation
    errors.push(...this.validateDuplicateId(worker.WorkerID, 'WorkerID', 'worker', row, dataset.workers));

    // 3. Qualification level range validation
    if (worker.QualificationLevel !== undefined) {
      errors.push(...this.validateNumericRange(
        worker.QualificationLevel,
        VALIDATION_RULES.QUALIFICATION_LEVEL.min,
        VALIDATION_RULES.QUALIFICATION_LEVEL.max,
        'QualificationLevel',
        'worker',
        row
      ));
    }

    // 4. MaxLoadPerPhase range validation
    if (worker.MaxLoadPerPhase !== undefined) {
      errors.push(...this.validateNumericRange(
        worker.MaxLoadPerPhase,
        VALIDATION_RULES.MAX_LOAD_PER_PHASE.min,
        VALIDATION_RULES.MAX_LOAD_PER_PHASE.max,
        'MaxLoadPerPhase',
        'worker',
        row
      ));
    }

    // 5. Skills array validation
    if (worker.Skills !== undefined) {
      const arrayValidation = this.validateArrayField(
        worker.Skills,
        'Skills',
        'worker',
        row,
        { maxLength: VALIDATION_RULES.MAX_ARRAY_LENGTH, elementType: 'string' }
      );
      errors.push(...arrayValidation.errors);
      warnings.push(...arrayValidation.warnings);
    }

    // 6. AvailableSlots array validation
    if (worker.AvailableSlots !== undefined) {
      const arrayValidation = this.validateArrayField(
        worker.AvailableSlots,
        'AvailableSlots',
        'worker',
        row,
        { 
          maxLength: VALIDATION_RULES.MAX_ARRAY_LENGTH,
          elementType: 'number',
          elementRange: VALIDATION_RULES.PHASE_RANGE
        }
      );
      errors.push(...arrayValidation.errors);
      warnings.push(...arrayValidation.warnings);

      // 7. Business logic: AvailableSlots vs MaxLoadPerPhase
      if (worker.AvailableSlots.length > 0 && worker.MaxLoadPerPhase && 
          worker.MaxLoadPerPhase > worker.AvailableSlots.length) {
        warnings.push(this.createValidationError(
          'worker',
          worker.WorkerID || `ROW_${row}`,
          row,
          'MaxLoadPerPhase',
          'MaxLoadPerPhase',
          'MaxLoadPerPhase exceeds available slots count',
          'warning',
          `Consider reducing MaxLoadPerPhase to ${worker.AvailableSlots.length}`
        ));
      }
    }

    // 8. String length validation
    errors.push(...this.validateStringLength(worker.WorkerName, 'WorkerName', 'worker', row));
    errors.push(...this.validateStringLength(worker.WorkerGroup, 'WorkerGroup', 'worker', row));

    const validation: ValidationState = {
      isValid: errors.length === 0,
      errors,
      warnings,
      lastValidated: new Date(),
      autoFixesApplied: 0
    };

    return { ...worker, validation };
  }

  /**
   * Validate individual task entity
   */
  validateTaskEntity(task: Task, row: number, dataset: any): ValidatedTask {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Required fields validation
    errors.push(...this.validateRequiredFields(task, [
      'TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'MaxConcurrent'
    ], 'task', row));

    // 2. Duplicate ID validation
    errors.push(...this.validateDuplicateId(task.TaskID, 'TaskID', 'task', row, dataset.tasks));

    // 3. Duration range validation
    if (task.Duration !== undefined) {
      errors.push(...this.validateNumericRange(
        task.Duration,
        VALIDATION_RULES.DURATION.min,
        VALIDATION_RULES.DURATION.max,
        'Duration',
        'task',
        row
      ));
    }

    // 4. MaxConcurrent range validation
    if (task.MaxConcurrent !== undefined) {
      errors.push(...this.validateNumericRange(
        task.MaxConcurrent,
        VALIDATION_RULES.MAX_CONCURRENT.min,
        VALIDATION_RULES.MAX_CONCURRENT.max,
        'MaxConcurrent',
        'task',
        row
      ));
    }

    // 5. RequiredSkills array validation
    if (task.RequiredSkills !== undefined) {
      const arrayValidation = this.validateArrayField(
        task.RequiredSkills,
        'RequiredSkills',
        'task',
        row,
        { maxLength: VALIDATION_RULES.MAX_ARRAY_LENGTH, elementType: 'string' }
      );
      errors.push(...arrayValidation.errors);
      warnings.push(...arrayValidation.warnings);
    }

    // 6. PreferredPhases array validation
    if (task.PreferredPhases !== undefined) {
      const arrayValidation = this.validateArrayField(
        task.PreferredPhases,
        'PreferredPhases',
        'task',
        row,
        { 
          maxLength: VALIDATION_RULES.MAX_ARRAY_LENGTH,
          elementType: 'number',
          elementRange: VALIDATION_RULES.PHASE_RANGE
        }
      );
      errors.push(...arrayValidation.errors);
      warnings.push(...arrayValidation.warnings);
    }

    // 7. String length validation
    errors.push(...this.validateStringLength(task.TaskName, 'TaskName', 'task', row));
    errors.push(...this.validateStringLength(task.Category, 'Category', 'task', row));

    const validation: ValidationState = {
      isValid: errors.length === 0,
      errors,
      warnings,
      lastValidated: new Date(),
      autoFixesApplied: 0
    };

    return { ...task, validation };
  }

  // ===== CROSS-ENTITY VALIDATION =====

  /**
   * Validate cross-entity references
   */
  private validateCrossEntityReferences(dataset: {
    clients: Client[];
    workers: Worker[];
    tasks: Task[];
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    // Build reference maps
    const taskIds = new Set(dataset.tasks.map(t => t.TaskID));
    const workerSkills = new Set(dataset.workers.flatMap(w => w.Skills || []));
    const taskSkills = new Set(dataset.tasks.flatMap(t => t.RequiredSkills || []));

    // 1. Validate RequestedTaskIDs exist in tasks
    dataset.clients.forEach((client, index) => {
      if (client.RequestedTaskIDs) {
        client.RequestedTaskIDs.forEach(taskId => {
          if (!taskIds.has(taskId)) {
            errors.push(this.createValidationError(
              'client',
              client.ClientID,
              index,
              'RequestedTaskIDs',
              'RequestedTaskIDs',
              `Referenced TaskID "${taskId}" does not exist`,
              'error',
              `Remove invalid TaskID or add task with ID "${taskId}"`
            ));
          }
        });
      }
    });

    // 2. Validate task skills have corresponding workers
    const unmatchedSkills = new Set<string>();
    dataset.tasks.forEach((task, index) => {
      if (task.RequiredSkills) {
        task.RequiredSkills.forEach(skill => {
          if (!workerSkills.has(skill)) {
            unmatchedSkills.add(skill);
            errors.push(this.createValidationError(
              'task',
              task.TaskID,
              index,
              'RequiredSkills',
              'RequiredSkills',
              `Required skill "${skill}" not available in any worker`,
              'warning',
              `Add worker with "${skill}" skill or remove requirement`
            ));
          }
        });
      }
    });

    // 3. Check for orphaned worker skills
    dataset.workers.forEach((worker, index) => {
      if (worker.Skills) {
        const unusedSkills = worker.Skills.filter(skill => !taskSkills.has(skill));
        if (unusedSkills.length > 0) {
          errors.push(this.createValidationError(
            'worker',
            worker.WorkerID,
            index,
            'Skills',
            'Skills',
            `Skills [${unusedSkills.join(', ')}] not required by any task`,
            'info',
            'Consider reviewing skill alignment with task requirements'
          ));
        }
      }
    });

    // 4. Validate phase capacity vs task requirements
    const phaseCapacity = this.calculatePhaseCapacity(dataset.workers);
    const phaseRequirements = this.calculatePhaseRequirements(dataset.tasks);

    Object.keys(phaseRequirements).forEach(phase => {
      const capacity = phaseCapacity[phase] || 0;
      const requirement = phaseRequirements[phase] || 0;
      
      if (requirement > capacity) {
        errors.push(this.createValidationError(
          'task',
          'GLOBAL',
          -1,
          'Duration',
          'PhaseCapacity',
          `Phase ${phase} overallocated: ${requirement} tasks needed, ${capacity} slots available`,
          'warning',
          `Add more workers for phase ${phase} or reduce task requirements`
        ));
      }
    });

    return errors;
  }

  // ===== HELPER VALIDATION METHODS =====

  /**
   * Validate required fields
   */
  private validateRequiredFields(
    entity: any,
    requiredFields: string[],
    entityType: EntityTypeName,
    row: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const entityId = entity[`${entityType.charAt(0).toUpperCase() + entityType.slice(1)}ID`] || `ROW_${row}`;

    requiredFields.forEach(field => {
      const value = entity[field];
      if (value === undefined || value === null || value === '') {
        errors.push(this.createValidationError(
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
   * Validate duplicate IDs
   */
  private validateDuplicateId(
    id: string,
    fieldName: string,
    entityType: EntityTypeName,
    row: number,
    entities: any[]
  ): ValidationError[] {
    if (!id) return [];

    const duplicates = entities.filter(entity => entity[fieldName] === id);
    if (duplicates.length > 1) {
      return [this.createValidationError(
        entityType,
        id,
        row,
        fieldName,
        fieldName,
        `Duplicate ${fieldName}: "${id}" appears ${duplicates.length} times`,
        'error',
        `Change ${fieldName} to a unique value`
      )];
    }

    return [];
  }

  /**
   * Validate numeric range
   */
  private validateNumericRange(
    value: any,
    min: number,
    max: number,
    fieldName: string,
    entityType: EntityTypeName,
    row: number
  ): ValidationError[] {
    const entityId = `ROW_${row}`;
    
    if (typeof value !== 'number') {
      return [this.createValidationError(
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
      return [this.createValidationError(
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
   * Validate array field
   */
  private validateArrayField(
    value: any,
    fieldName: string,
    entityType: EntityTypeName,
    row: number,
    options: {
      maxLength?: number;
      elementType?: 'string' | 'number';
      elementRange?: { min: number; max: number };
    } = {}
  ): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const entityId = `ROW_${row}`;

    if (!Array.isArray(value)) {
      errors.push(this.createValidationError(
        entityType,
        entityId,
        row,
        fieldName,
        fieldName,
        `${fieldName} must be an array, got ${typeof value}`,
        'error',
        `Convert "${value}" to an array format`
      ));
      return { errors, warnings };
    }

    // Length validation
    if (options.maxLength && value.length > options.maxLength) {
      errors.push(this.createValidationError(
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

    // Element type validation
    if (options.elementType) {
      value.forEach((element, index) => {
        if (typeof element !== options.elementType) {
          errors.push(this.createValidationError(
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

        // Element range validation for numbers
        if (options.elementType === 'number' && options.elementRange && typeof element === 'number') {
          if (element < options.elementRange.min || element > options.elementRange.max) {
            errors.push(this.createValidationError(
              entityType,
              entityId,
              row,
              `${fieldName}[${index}]`,
              fieldName,
              `Array element ${element} must be between ${options.elementRange.min} and ${options.elementRange.max}`,
              'error',
              `Change ${element} to a value between ${options.elementRange.min} and ${options.elementRange.max}`
            ));
          }
        }
      });
    }

    // Duplicate detection
    const duplicates = value.filter((item, index) => value.indexOf(item) !== index);
    if (duplicates.length > 0) {
      warnings.push(this.createValidationError(
        entityType,
        entityId,
        row,
        fieldName,
        fieldName,
        `${fieldName} contains duplicate values: ${duplicates.join(', ')}`,
        'warning',
        'Remove duplicate entries'
      ));
    }

    return { errors, warnings };
  }

  /**
   * Validate JSON field
   */
  private validateJsonField(
    value: any,
    fieldName: string,
    entityType: EntityTypeName,
    row: number
  ): ValidationError[] {
    const entityId = `ROW_${row}`;

    if (typeof value !== 'string') {
      return [this.createValidationError(
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

    if (value.length > VALIDATION_RULES.MAX_JSON_SIZE) {
      return [this.createValidationError(
        entityType,
        entityId,
        row,
        fieldName,
        fieldName,
        `${fieldName} JSON too large: ${value.length} characters (max ${VALIDATION_RULES.MAX_JSON_SIZE})`,
        'error',
        'Reduce JSON size'
      )];
    }

    try {
      JSON.parse(value);
    } catch (error: any) {
      return [this.createValidationError(
        entityType,
        entityId,
        row,
        fieldName,
        fieldName,
        `Invalid JSON format: ${error?.message || 'Unknown JSON parsing error'}`,
        'error',
        'Fix JSON syntax errors'
      )];
    }

    return [];
  }

  /**
   * Validate string length
   */
  private validateStringLength(
    value: any,
    fieldName: string,
    entityType: EntityTypeName,
    row: number
  ): ValidationError[] {
    if (typeof value !== 'string') return [];

    const entityId = `ROW_${row}`;

    if (value.length > VALIDATION_RULES.MAX_STRING_LENGTH) {
      return [this.createValidationError(
        entityType,
        entityId,
        row,
        fieldName,
        fieldName,
        `${fieldName} too long: ${value.length} characters (max ${VALIDATION_RULES.MAX_STRING_LENGTH})`,
        'error',
        `Shorten ${fieldName} to under ${VALIDATION_RULES.MAX_STRING_LENGTH} characters`
      )];
    }

    return [];
  }

  // ===== UTILITY METHODS =====

  /**
   * Create validation error
   */
  private createValidationError(
    entityType: EntityTypeName,
    entityId: string,
    row: number,
    column: string,
    field: string,
    message: string,
    severity: 'error' | 'warning' | 'info',
    suggestedFix?: string
  ): ValidationError {
    return {
      id: generateId(),
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
   * Build cross-reference cache
   */
  private buildCrossReferenceCache(dataset: any): void {
    // Build task ID cache
    this.crossReferenceCache.set('taskIds', new Set(dataset.tasks.map((t: Task) => t.TaskID)));
    
    // Build worker skills cache
    this.crossReferenceCache.set('workerSkills', 
      new Set(dataset.workers.flatMap((w: Worker) => w.Skills || []))
    );
    
    // Build task skills cache
    this.crossReferenceCache.set('taskSkills', 
      new Set(dataset.tasks.flatMap((t: Task) => t.RequiredSkills || []))
    );
  }

  /**
   * Calculate phase capacity from workers
   */
  private calculatePhaseCapacity(workers: Worker[]): Record<string, number> {
    const capacity: Record<string, number> = {};
    
    workers.forEach(worker => {
      if (worker.AvailableSlots && worker.MaxLoadPerPhase) {
        worker.AvailableSlots.forEach(phase => {
          capacity[phase] = (capacity[phase] || 0) + worker.MaxLoadPerPhase;
        });
      }
    });

    return capacity;
  }

  /**
   * Calculate phase requirements from tasks
   */
  private calculatePhaseRequirements(tasks: Task[]): Record<string, number> {
    const requirements: Record<string, number> = {};
    
    tasks.forEach(task => {
      if (task.PreferredPhases && task.Duration) {
        task.PreferredPhases.forEach(phase => {
          requirements[phase] = (requirements[phase] || 0) + task.Duration;
        });
      }
    });

    return requirements;
  }
}

// ===== EXPORT CONVENIENCE FUNCTIONS =====

/**
 * Validate single entity
 */
export function validateEntity<T extends Client | Worker | Task>(
  entity: T,
  entityType: EntityTypeName,
  row: number = 0,
  dataset?: any
): T & { validation: ValidationState } {
  const engine = ValidationEngine.getInstance();
  
  switch (entityType) {
    case 'client':
      return engine.validateClientEntity(entity as Client, row, dataset || {}) as any;
    case 'worker':
      return engine.validateWorkerEntity(entity as Worker, row, dataset || {}) as any;
    case 'task':
      return engine.validateTaskEntity(entity as Task, row, dataset || {}) as any;
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

/**
 * Validate complete dataset
 */
export function validateDataSet(dataset: {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
}) {
  const engine = ValidationEngine.getInstance();
  return engine.validateDataSet(dataset);
}

/**
 * Check if validation error is auto-fixable
 */
export function isAutoFixable(error: ValidationError): boolean {
  return error.autoFixable && error.suggestedFix !== undefined;
}

/**
 * Get validation summary
 */
export function getValidationSummary(validationResult: any): {
  totalEntities: number;
  validEntities: number;
  totalErrors: number;
  totalWarnings: number;
  criticalIssues: ValidationError[];
  autoFixableIssues: ValidationError[];
} {
  const allEntities = [
    ...validationResult.validatedClients,
    ...validationResult.validatedWorkers,
    ...validationResult.validatedTasks
  ];

  const allErrors = [
    ...allEntities.flatMap(e => e.validation.errors),
    ...validationResult.crossEntityErrors.filter((e: ValidationError) => e.severity === 'error')
  ];

  const allWarnings = [
    ...allEntities.flatMap(e => e.validation.warnings),
    ...validationResult.crossEntityErrors.filter((e: ValidationError) => e.severity === 'warning')
  ];

  return {
    totalEntities: allEntities.length,
    validEntities: allEntities.filter(e => e.validation.isValid).length,
    totalErrors: allErrors.length,
    totalWarnings: allWarnings.length,
    criticalIssues: allErrors.filter(e => e.severity === 'error'),
    autoFixableIssues: [...allErrors, ...allWarnings].filter(isAutoFixable)
  };
}

export default ValidationEngine;
