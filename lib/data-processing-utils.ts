/**
 * @fileoverview Data Processing Utilities
 * @description Advanced data transformation and processing functions
 */

import {
  Client,
  Worker,
  Task,
  ValidatedClient,
  ValidatedWorker,
  ValidatedTask,
  DataParsingResult,
  HeaderMappingSuggestion,
  EntityTypeName,
  DataSet,
  DataStatistics
} from "@/types/entities";
import {
  parseArrayFromString,
  parseNumberArrayFromString,
  sanitizeEntityId,
  generateEntityId,
  deepClone,
  safeJsonParse,
  createInitialValidationState
} from "./utils";
import {
  validateClient,
  validateWorker,
  validateTask,
  validateCrossEntityReferences
} from "./validation-utils";

// ===== DATA CLEANING FUNCTIONS =====

/**
 * Clean and normalize client data
 */
export function cleanClientData(rawClient: Record<string, any>): Client {
  return {
    ClientID: sanitizeEntityId(rawClient.ClientID || '', 'C'),
    ClientName: String(rawClient.ClientName || '').trim(),
    PriorityLevel: Math.max(1, Math.min(5, Number(rawClient.PriorityLevel) || 1)),
    RequestedTaskIDs: parseArrayFromString(rawClient.RequestedTaskIDs),
    GroupTag: String(rawClient.GroupTag || 'Standard').trim(),
    AttributesJSON: typeof rawClient.AttributesJSON === 'string' 
      ? rawClient.AttributesJSON.trim() 
      : JSON.stringify(rawClient.AttributesJSON || {})
  };
}

/**
 * Clean and normalize worker data
 */
export function cleanWorkerData(rawWorker: Record<string, any>): Worker {
  return {
    WorkerID: sanitizeEntityId(rawWorker.WorkerID || '', 'W'),
    WorkerName: String(rawWorker.WorkerName || '').trim(),
    Skills: parseArrayFromString(rawWorker.Skills),
    AvailableSlots: parseNumberArrayFromString(rawWorker.AvailableSlots),
    MaxLoadPerPhase: Math.max(1, Math.min(10, Number(rawWorker.MaxLoadPerPhase) || 1)),
    WorkerGroup: String(rawWorker.WorkerGroup || 'General').trim(),
    QualificationLevel: Math.max(1, Math.min(5, Number(rawWorker.QualificationLevel) || 1))
  };
}

/**
 * Clean and normalize task data
 */
export function cleanTaskData(rawTask: Record<string, any>): Task {
  return {
    TaskID: sanitizeEntityId(rawTask.TaskID || '', 'T'),
    TaskName: String(rawTask.TaskName || '').trim(),
    Category: String(rawTask.Category || 'General').trim(),
    Duration: Math.max(1, Math.min(10, Number(rawTask.Duration) || 1)),
    RequiredSkills: parseArrayFromString(rawTask.RequiredSkills),
    PreferredPhases: parseNumberArrayFromString(rawTask.PreferredPhases),
    MaxConcurrent: Math.max(1, Math.min(5, Number(rawTask.MaxConcurrent) || 1))
  };
}

// ===== DATA PARSING AND TRANSFORMATION =====

/**
 * Process raw CSV data into typed entities with validation
 */
export function processRawData<T extends Client | Worker | Task>(
  rawData: Record<string, any>[],
  entityType: EntityTypeName,
  headerMappings: Record<string, string>
): DataParsingResult<T> {
  const processedData: T[] = [];
  const suggestions: HeaderMappingSuggestion[] = [];
  const allErrors: any[] = [];
  const allWarnings: any[] = [];

  // Apply header mappings
  const mappedData = rawData.map(row => {
    const mappedRow: Record<string, any> = {};
    for (const [originalHeader, value] of Object.entries(row)) {
      const mappedField = headerMappings[originalHeader] || originalHeader;
      mappedRow[mappedField] = value;
    }
    return mappedRow;
  });

  // Clean and validate each row
  mappedData.forEach((row, index) => {
    try {
      let cleanedEntity: any;
      let validationErrors: any[] = [];

      switch (entityType) {
        case 'client':
          cleanedEntity = cleanClientData(row);
          validationErrors = validateClient(cleanedEntity, index);
          break;
        case 'worker':
          cleanedEntity = cleanWorkerData(row);
          validationErrors = validateWorker(cleanedEntity, index);
          break;
        case 'task':
          cleanedEntity = cleanTaskData(row);
          validationErrors = validateTask(cleanedEntity, index);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      processedData.push(cleanedEntity as T);
      
      // Separate errors and warnings
      const errors = validationErrors.filter(e => e.severity === 'error');
      const warnings = validationErrors.filter(e => e.severity === 'warning');
      
      allErrors.push(...errors);
      allWarnings.push(...warnings);

    } catch (error) {
      console.error(`Error processing row ${index}:`, error);
      allErrors.push({
        id: `processing_error_${index}`,
        entityType,
        entityId: `ROW_${index}`,
        row: index,
        column: 'ALL',
        field: 'processing',
        message: `Failed to process row: ${error}`,
        severity: 'error',
        autoFixable: false
      });
    }
  });

  return {
    data: processedData,
    headers: Object.keys(rawData[0] || {}),
    mappedHeaders: headerMappings,
    totalRows: rawData.length,
    processedRows: processedData.length,
    errors: allErrors,
    warnings: allWarnings,
    suggestions
  };
}

/**
 * Convert entities to validated entities with validation states
 */
export function convertToValidatedEntities<T extends Client | Worker | Task>(
  entities: T[],
  entityType: EntityTypeName
): (ValidatedClient | ValidatedWorker | ValidatedTask)[] {
  return entities.map(entity => {
    let validationErrors: any[] = [];

    switch (entityType) {
      case 'client':
        validationErrors = validateClient(entity as Client);
        break;
      case 'worker':
        validationErrors = validateWorker(entity as Worker);
        break;
      case 'task':
        validationErrors = validateTask(entity as Task);
        break;
    }

    const errors = validationErrors.filter(e => e.severity === 'error');
    const warnings = validationErrors.filter(e => e.severity === 'warning');

    const validationState = {
      isValid: errors.length === 0,
      errors,
      warnings,
      lastValidated: new Date(),
      autoFixesApplied: 0
    };

    return {
      ...entity,
      validation: validationState
    } as ValidatedClient | ValidatedWorker | ValidatedTask;
  });
}

// ===== DATA AGGREGATION AND STATISTICS =====

/**
 * Calculate comprehensive data statistics
 */
export function calculateDataStatistics(dataset: DataSet): DataStatistics {
  const totalClients = dataset.clients.length;
  const totalWorkers = dataset.workers.length;
  const totalTasks = dataset.tasks.length;

  // Count validation issues
  const clientErrors = dataset.clients.reduce((sum, c) => sum + c.validation.errors.length, 0);
  const workerErrors = dataset.workers.reduce((sum, w) => sum + w.validation.errors.length, 0);
  const taskErrors = dataset.tasks.reduce((sum, t) => sum + t.validation.errors.length, 0);
  const totalErrors = clientErrors + workerErrors + taskErrors + dataset.globalValidation.crossEntityErrors.length;

  const clientWarnings = dataset.clients.reduce((sum, c) => sum + c.validation.warnings.length, 0);
  const workerWarnings = dataset.workers.reduce((sum, w) => sum + w.validation.warnings.length, 0);
  const taskWarnings = dataset.tasks.reduce((sum, t) => sum + t.validation.warnings.length, 0);
  const totalWarnings = clientWarnings + workerWarnings + taskWarnings;

  // Calculate validation score
  const totalIssues = totalErrors + totalWarnings;
  const totalEntities = totalClients + totalWorkers + totalTasks;
  const validationScore = totalEntities === 0 ? 100 : Math.max(0, 100 - (totalErrors * 5 + totalWarnings * 2));

  // Calculate completion percentage
  const requiredFieldsPerEntity = 6; // Average required fields
  const totalRequiredFields = totalEntities * requiredFieldsPerEntity;
  const completedFields = totalRequiredFields - (totalErrors * 0.5); // Approximate
  const completionPercentage = totalRequiredFields === 0 ? 100 : Math.max(0, (completedFields / totalRequiredFields) * 100);

  return {
    totalClients,
    totalWorkers,
    totalTasks,
    totalErrors,
    totalWarnings,
    validationScore: Math.round(validationScore),
    completionPercentage: Math.round(completionPercentage)
  };
}

/**
 * Generate data quality report
 */
export function generateDataQualityReport(dataset: DataSet): {
  statistics: DataStatistics;
  summary: {
    status: 'excellent' | 'good' | 'needs-attention' | 'critical';
    message: string;
    recommendations: string[];
  };
  entityBreakdown: {
    clients: { valid: number; withErrors: number; withWarnings: number };
    workers: { valid: number; withErrors: number; withWarnings: number };
    tasks: { valid: number; withErrors: number; withWarnings: number };
  };
} {
  const statistics = calculateDataStatistics(dataset);

  // Entity breakdown
  const entityBreakdown = {
    clients: {
      valid: dataset.clients.filter(c => c.validation.isValid).length,
      withErrors: dataset.clients.filter(c => c.validation.errors.length > 0).length,
      withWarnings: dataset.clients.filter(c => c.validation.warnings.length > 0).length
    },
    workers: {
      valid: dataset.workers.filter(w => w.validation.isValid).length,
      withErrors: dataset.workers.filter(w => w.validation.errors.length > 0).length,
      withWarnings: dataset.workers.filter(w => w.validation.warnings.length > 0).length
    },
    tasks: {
      valid: dataset.tasks.filter(t => t.validation.isValid).length,
      withErrors: dataset.tasks.filter(t => t.validation.errors.length > 0).length,
      withWarnings: dataset.tasks.filter(t => t.validation.warnings.length > 0).length
    }
  };

  // Generate summary and recommendations
  let status: 'excellent' | 'good' | 'needs-attention' | 'critical';
  let message: string;
  const recommendations: string[] = [];

  if (statistics.validationScore >= 95) {
    status = 'excellent';
    message = 'Your data quality is excellent! Ready for processing.';
  } else if (statistics.validationScore >= 80) {
    status = 'good';
    message = 'Your data quality is good with minor issues to address.';
  } else if (statistics.validationScore >= 60) {
    status = 'needs-attention';
    message = 'Your data needs attention before processing.';
  } else {
    status = 'critical';
    message = 'Critical data quality issues must be resolved.';
  }

  // Generate recommendations
  if (statistics.totalErrors > 0) {
    recommendations.push(`Fix ${statistics.totalErrors} critical error${statistics.totalErrors > 1 ? 's' : ''}`);
  }
  if (statistics.totalWarnings > 5) {
    recommendations.push(`Review ${statistics.totalWarnings} warning${statistics.totalWarnings > 1 ? 's' : ''} for data improvement`);
  }
  if (entityBreakdown.clients.withErrors > 0) {
    recommendations.push(`Validate ${entityBreakdown.clients.withErrors} client record${entityBreakdown.clients.withErrors > 1 ? 's' : ''}`);
  }
  if (entityBreakdown.workers.withErrors > 0) {
    recommendations.push(`Validate ${entityBreakdown.workers.withErrors} worker record${entityBreakdown.workers.withErrors > 1 ? 's' : ''}`);
  }
  if (entityBreakdown.tasks.withErrors > 0) {
    recommendations.push(`Validate ${entityBreakdown.tasks.withErrors} task record${entityBreakdown.tasks.withErrors > 1 ? 's' : ''}`);
  }

  return {
    statistics,
    summary: { status, message, recommendations },
    entityBreakdown
  };
}

// ===== DATA EXPORT UTILITIES =====

/**
 * Convert dataset to CSV format
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) return '';

  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = [csvHeaders.join(',')];

  data.forEach(row => {
    const csvRow = csvHeaders.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      
      // Handle arrays
      if (Array.isArray(value)) {
        return `"${value.join(', ')}"`;
      }
      
      // Handle objects
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Handle strings with commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    csvRows.push(csvRow.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Prepare data for export (clean validated entities)
 */
export function prepareDataForExport(dataset: DataSet): {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  metadata: {
    exportDate: Date;
    statistics: DataStatistics;
    validationSummary: any;
  };
} {
  // Extract clean entities (remove validation states)
  const clients = dataset.clients.map(({ validation, ...client }) => client);
  const workers = dataset.workers.map(({ validation, ...worker }) => worker);
  const tasks = dataset.tasks.map(({ validation, ...task }) => task);

  const statistics = calculateDataStatistics(dataset);
  const qualityReport = generateDataQualityReport(dataset);

  return {
    clients,
    workers,
    tasks,
    metadata: {
      exportDate: new Date(),
      statistics,
      validationSummary: qualityReport.summary
    }
  };
}

// ===== DATA TRANSFORMATION UTILITIES =====

/**
 * Transform data for specific use cases
 */
export function transformDataForVisualization(dataset: DataSet): {
  skillsDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  groupDistribution: Record<string, number>;
  phaseUtilization: Record<string, number>;
} {
  // Skills distribution
  const allSkills = dataset.workers.flatMap(w => parseArrayFromString(w.Skills));
  const skillsDistribution = allSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Priority distribution
  const priorityDistribution = dataset.clients.reduce((acc, client) => {
    const priority = `Priority ${client.PriorityLevel}`;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Category distribution
  const categoryDistribution = dataset.tasks.reduce((acc, task) => {
    acc[task.Category] = (acc[task.Category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group distribution
  const groupDistribution = {
    ...dataset.clients.reduce((acc, client) => {
      acc[`Client: ${client.GroupTag}`] = (acc[`Client: ${client.GroupTag}`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    ...dataset.workers.reduce((acc, worker) => {
      acc[`Worker: ${worker.WorkerGroup}`] = (acc[`Worker: ${worker.WorkerGroup}`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // Phase utilization
  const allPhases = dataset.workers.flatMap(w => parseNumberArrayFromString(w.AvailableSlots));
  const phaseUtilization = allPhases.reduce((acc, phase) => {
    acc[`Phase ${phase}`] = (acc[`Phase ${phase}`] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    skillsDistribution,
    priorityDistribution,
    categoryDistribution,
    groupDistribution,
    phaseUtilization
  };
}

/**
 * Generate sample data for testing
 */
export function generateSampleData(): DataSet {
  const clients: ValidatedClient[] = [
    {
      ClientID: 'C001',
      ClientName: 'Acme Corp',
      PriorityLevel: 5,
      RequestedTaskIDs: ['T001', 'T003'],
      GroupTag: 'Enterprise',
      AttributesJSON: '{"budget": 100000, "deadline": "2024-Q2"}',
      validation: createInitialValidationState()
    },
    {
      ClientID: 'C002',
      ClientName: 'TechStart Inc',
      PriorityLevel: 3,
      RequestedTaskIDs: ['T002', 'T004'],
      GroupTag: 'SMB',
      AttributesJSON: '{"budget": 25000, "deadline": "2024-Q3"}',
      validation: createInitialValidationState()
    }
  ];

  const workers: ValidatedWorker[] = [
    {
      WorkerID: 'W001',
      WorkerName: 'John Doe',
      Skills: ['JavaScript', 'React', 'Node.js'],
      AvailableSlots: [1, 2, 3],
      MaxLoadPerPhase: 2,
      WorkerGroup: 'Frontend',
      QualificationLevel: 4,
      validation: createInitialValidationState()
    },
    {
      WorkerID: 'W002',
      WorkerName: 'Jane Smith',
      Skills: ['Python', 'PostgreSQL', 'Docker'],
      AvailableSlots: [2, 3, 4],
      MaxLoadPerPhase: 3,
      WorkerGroup: 'Backend',
      QualificationLevel: 5,
      validation: createInitialValidationState()
    }
  ];

  const tasks: ValidatedTask[] = [
    {
      TaskID: 'T001',
      TaskName: 'Frontend Development',
      Category: 'Development',
      Duration: 3,
      RequiredSkills: ['JavaScript', 'React'],
      PreferredPhases: [1, 2],
      MaxConcurrent: 2,
      validation: createInitialValidationState()
    },
    {
      TaskID: 'T002',
      TaskName: 'Backend API',
      Category: 'Development',
      Duration: 4,
      RequiredSkills: ['Python', 'PostgreSQL'],
      PreferredPhases: [2, 3],
      MaxConcurrent: 1,
      validation: createInitialValidationState()
    }
  ];

  return {
    clients,
    workers,
    tasks,
    globalValidation: {
      isValid: true,
      crossEntityErrors: [],
      lastValidated: new Date()
    }
  };
}
