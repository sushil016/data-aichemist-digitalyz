/**
 * Data Alchemist - Core Entity Types
 * TypeScript interfaces for client, worker, and task data entities
 * with validation states and supporting types
 */

// ===== CORE ENTITY INTERFACES =====

/**
 * Client Entity (clients.csv)
 * Represents business clients requesting task allocations
 */
export interface Client {
  ClientID: string;           // Unique identifier (C001, C002, etc.)
  ClientName: string;         // Display name
  PriorityLevel: number;      // 1-5 (5 = highest priority)
  RequestedTaskIDs: string[]; // Array of TaskIDs they want ["T001", "T002"]
  GroupTag: string;           // Group classification ("Enterprise", "SMB")
  AttributesJSON: string;     // JSON metadata {"budget": 50000, "deadline": "2024-Q2"}
}

/**
 * Worker Entity (workers.csv)
 * Represents available workers with skills and availability
 */
export interface Worker {
  WorkerID: string;           // Unique identifier (W001, W002, etc.)
  WorkerName: string;         // Display name
  Skills: string[];           // Skill tags ["JavaScript", "React", "Node.js"]
  AvailableSlots: number[];   // Available phases [1, 3, 5, 7]
  MaxLoadPerPhase: number;    // Max tasks per phase (1-10)
  WorkerGroup: string;        // Group classification ("Frontend", "Backend", "FullStack")
  QualificationLevel: number; // Experience level 1-5
}

/**
 * Task Entity (tasks.csv)
 * Represents work tasks to be allocated to workers
 */
export interface Task {
  TaskID: string;             // Unique identifier (T001, T002, etc.)
  TaskName: string;           // Display name
  Category: string;           // Task category ("Development", "Testing", "Design")
  Duration: number;           // Number of phases required (1-10)
  RequiredSkills: string[];   // Required skills ["React", "TypeScript"]
  PreferredPhases: number[];  // Preferred execution phases [2, 3, 4]
  MaxConcurrent: number;      // Max parallel assignments (1-5)
}

// ===== VALIDATION & ERROR HANDLING =====

/**
 * Validation Error Interface
 * Represents data validation issues with suggested fixes
 */
export interface ValidationError {
  id: string;                 // Unique error ID
  entityType: 'client' | 'worker' | 'task';
  entityId: string;           // ClientID/WorkerID/TaskID
  row: number;                // Row index in data
  column: string;             // Column name
  field: string;              // Field name in interface
  message: string;            // Human-readable error message
  severity: 'error' | 'warning' | 'info';
  suggestedFix?: string;      // AI-suggested correction
  autoFixable: boolean;       // Can be auto-corrected
}

/**
 * Validation State for each entity
 * Tracks validation status and errors for data entities
 */
export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  lastValidated: Date;
  autoFixesApplied: number;
}

/**
 * Entity Validation Result
 * Combined entity data with validation state
 */
export interface ValidatedClient extends Client {
  validation: ValidationState;
}

export interface ValidatedWorker extends Worker {
  validation: ValidationState;
}

export interface ValidatedTask extends Task {
  validation: ValidationState;
}

// ===== BUSINESS RULES & CONFIGURATION =====

/**
 * Business Rule Types
 * Enum for different types of business rules
 */
export type BusinessRuleType = 
  | 'coRun' 
  | 'slotRestriction' 
  | 'loadLimit' 
  | 'phaseWindow' 
  | 'patternMatch' 
  | 'precedence';

/**
 * Business Rule Interface
 * Represents configurable business logic rules
 */
export interface BusinessRule {
  id: string;                 // Unique rule ID
  type: BusinessRuleType;     // Rule type
  name: string;               // Human-readable name
  description: string;        // Rule description
  parameters: Record<string, any>; // Rule-specific parameters
  active: boolean;            // Rule enabled/disabled
  priority: number;           // Rule priority (1-10)
  createdBy: 'user' | 'ai';   // Rule creation source
  createdAt: Date;            // Creation timestamp
  modifiedAt: Date;           // Last modification timestamp
}

/**
 * Priority Weights Configuration
 * Defines importance weights for allocation criteria
 */
export interface PriorityWeights {
  clientPriority: number;     // Weight for client priority level (0-100)
  taskUrgency: number;        // Weight for task urgency (0-100)
  workerEfficiency: number;   // Weight for worker efficiency (0-100)
  fairDistribution: number;   // Weight for fair task distribution (0-100)
  skillMatch: number;         // Weight for skill matching (0-100)
  costOptimization: number;   // Weight for cost optimization (0-100)
}

// ===== DATA PROCESSING & FILE HANDLING =====

/**
 * File Upload Status
 * Tracks file processing state
 */
export interface FileUploadStatus {
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  recordsProcessed: number;
  recordsTotal: number;
}

/**
 * Data Parsing Result
 * Result of CSV/XLSX file parsing
 */
export interface DataParsingResult<T> {
  data: T[];
  headers: string[];
  mappedHeaders: Record<string, string>;
  totalRows: number;
  processedRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: HeaderMappingSuggestion[];
}

/**
 * Header Mapping Suggestion
 * AI-powered header mapping suggestions
 */
export interface HeaderMappingSuggestion {
  originalHeader: string;
  suggestedField: string;
  confidence: number;        // 0-1 confidence score
  reasoning: string;         // AI explanation
  accepted: boolean;         // User accepted suggestion
}

// ===== ENTITY COLLECTIONS =====

/**
 * Complete Dataset
 * All entity data with validation states
 */
export interface DataSet {
  clients: ValidatedClient[];
  workers: ValidatedWorker[];
  tasks: ValidatedTask[];
  globalValidation: {
    isValid: boolean;
    crossEntityErrors: ValidationError[];
    lastValidated: Date;
  };
}

/**
 * Data Statistics
 * Summary statistics for the dataset
 */
export interface DataStatistics {
  totalClients: number;
  totalWorkers: number;
  totalTasks: number;
  totalErrors: number;
  totalWarnings: number;
  validationScore: number;   // 0-100 overall data quality score
  completionPercentage: number;
}

// ===== SEARCH & FILTERING =====

/**
 * Search Query Interface
 * Natural language search functionality
 */
export interface SearchQuery {
  query: string;
  entityType?: 'client' | 'worker' | 'task' | 'all';
  filters: SearchFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search Filter
 * Individual filter conditions
 */
export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'in' | 'between';
  value: any;
  condition?: 'and' | 'or';
}

/**
 * Search Result
 * Results from natural language search
 */
export interface SearchResult<T> {
  results: T[];
  totalCount: number;
  query: SearchQuery;
  executionTime: number;
  suggestions: string[];
}

// ===== EXPORT & CONFIGURATION =====

/**
 * Export Configuration
 * Settings for data export
 */
export interface ExportConfig {
  includeValidationErrors: boolean;
  includeBusinessRules: boolean;
  includePriorityWeights: boolean;
  format: 'csv' | 'xlsx' | 'json';
  filename?: string;
}

/**
 * System Configuration
 * Application-wide settings
 */
export interface SystemConfig {
  maxFileSize: number;       // Maximum file size in bytes
  supportedFormats: string[]; // Supported file formats
  validationRules: string[]; // Enabled validation rules
  aiEnabled: boolean;        // AI features enabled
  autoSaveInterval: number;  // Auto-save interval in seconds
}

// ===== TYPE GUARDS =====

/**
 * Type guard for Client entity
 */
export function isClient(entity: any): entity is Client {
  return entity && 
         typeof entity.ClientID === 'string' &&
         typeof entity.ClientName === 'string' &&
         typeof entity.PriorityLevel === 'number' &&
         Array.isArray(entity.RequestedTaskIDs);
}

/**
 * Type guard for Worker entity
 */
export function isWorker(entity: any): entity is Worker {
  return entity && 
         typeof entity.WorkerID === 'string' &&
         typeof entity.WorkerName === 'string' &&
         Array.isArray(entity.Skills) &&
         Array.isArray(entity.AvailableSlots);
}

/**
 * Type guard for Task entity
 */
export function isTask(entity: any): entity is Task {
  return entity && 
         typeof entity.TaskID === 'string' &&
         typeof entity.TaskName === 'string' &&
         typeof entity.Category === 'string' &&
         typeof entity.Duration === 'number';
}

// ===== UTILITY TYPES =====

/**
 * Entity Types Union
 */
export type Entity = Client | Worker | Task;

/**
 * Validated Entity Types Union
 */
export type ValidatedEntity = ValidatedClient | ValidatedWorker | ValidatedTask;

/**
 * Entity Type Names
 */
export type EntityTypeName = 'client' | 'worker' | 'task';

/**
 * Partial Entity for Updates
 */
export type PartialClient = Partial<Client> & { ClientID: string };
export type PartialWorker = Partial<Worker> & { WorkerID: string };
export type PartialTask = Partial<Task> & { TaskID: string };

/**
 * Entity Creation Types (without ID for new entities)
 */
export type NewClient = Omit<Client, 'ClientID'>;
export type NewWorker = Omit<Worker, 'WorkerID'>;
export type NewTask = Omit<Task, 'TaskID'>;

// ===== CONSTANTS =====

/**
 * Validation Constants
 */
export const VALIDATION_CONSTANTS = {
  MIN_PRIORITY_LEVEL: 1,
  MAX_PRIORITY_LEVEL: 5,
  MIN_QUALIFICATION_LEVEL: 1,
  MAX_QUALIFICATION_LEVEL: 5,
  MIN_DURATION: 1,
  MAX_DURATION: 10,
  MIN_MAX_LOAD_PER_PHASE: 1,
  MAX_MAX_LOAD_PER_PHASE: 10,
  MIN_MAX_CONCURRENT: 1,
  MAX_MAX_CONCURRENT: 5,
} as const;

/**
 * Entity Field Mappings
 * Common header variations to standard field names
 */
export const FIELD_MAPPINGS = {
  client: {
    'Client ID': 'ClientID',
    'Client_ID': 'ClientID',
    'client_id': 'ClientID',
    'ID': 'ClientID',
    'Client Name': 'ClientName',
    'Client_Name': 'ClientName',
    'client_name': 'ClientName',
    'Name': 'ClientName',
    'Priority': 'PriorityLevel',
    'Priority Level': 'PriorityLevel',
    'Priority_Level': 'PriorityLevel',
    'priority_level': 'PriorityLevel',
    'Requested Tasks': 'RequestedTaskIDs',
    'Requested_Tasks': 'RequestedTaskIDs',
    'requested_tasks': 'RequestedTaskIDs',
    'Tasks': 'RequestedTaskIDs',
    'Group': 'GroupTag',
    'Group Tag': 'GroupTag',
    'Group_Tag': 'GroupTag',
    'group_tag': 'GroupTag',
    'Attributes': 'AttributesJSON',
    'Attributes JSON': 'AttributesJSON',
    'Attributes_JSON': 'AttributesJSON',
    'attributes_json': 'AttributesJSON',
  },
  worker: {
    'Worker ID': 'WorkerID',
    'Worker_ID': 'WorkerID',
    'worker_id': 'WorkerID',
    'ID': 'WorkerID',
    'Worker Name': 'WorkerName',
    'Worker_Name': 'WorkerName',
    'worker_name': 'WorkerName',
    'Name': 'WorkerName',
    'Skills Set': 'Skills',
    'Skills_Set': 'Skills',
    'skills_set': 'Skills',
    'Skills': 'Skills',
    'Available Slots': 'AvailableSlots',
    'Available_Slots': 'AvailableSlots',
    'available_slots': 'AvailableSlots',
    'Slots': 'AvailableSlots',
    'Max Load': 'MaxLoadPerPhase',
    'Max Load Per Phase': 'MaxLoadPerPhase',
    'Max_Load_Per_Phase': 'MaxLoadPerPhase',
    'max_load_per_phase': 'MaxLoadPerPhase',
    'Group': 'WorkerGroup',
    'Worker Group': 'WorkerGroup',
    'Worker_Group': 'WorkerGroup',
    'worker_group': 'WorkerGroup',
    'Qualification': 'QualificationLevel',
    'Qualification Level': 'QualificationLevel',
    'Qualification_Level': 'QualificationLevel',
    'qualification_level': 'QualificationLevel',
  },
  task: {
    'Task ID': 'TaskID',
    'Task_ID': 'TaskID',
    'task_id': 'TaskID',
    'ID': 'TaskID',
    'Task Name': 'TaskName',
    'Task_Name': 'TaskName',
    'task_name': 'TaskName',
    'Name': 'TaskName',
    'Category': 'Category',
    'Task Category': 'Category',
    'Task_Category': 'Category',
    'task_category': 'Category',
    'Duration': 'Duration',
    'Task Duration': 'Duration',
    'Task_Duration': 'Duration',
    'task_duration': 'Duration',
    'Required Skills': 'RequiredSkills',
    'Required_Skills': 'RequiredSkills',
    'required_skills': 'RequiredSkills',
    'Skills': 'RequiredSkills',
    'Preferred Phases': 'PreferredPhases',
    'Preferred_Phases': 'PreferredPhases',
    'preferred_phases': 'PreferredPhases',
    'Phases': 'PreferredPhases',
    'Max Concurrent': 'MaxConcurrent',
    'Max_Concurrent': 'MaxConcurrent',
    'max_concurrent': 'MaxConcurrent',
    'Concurrent': 'MaxConcurrent',
  },
} as const;

/**
 * Prioritization and Weighting System Types
 */

export type PriorityFactorType = 
  | 'client_priority' 
  | 'task_duration' 
  | 'worker_qualification' 
  | 'deadline_urgency' 
  | 'skill_match_score' 
  | 'phase_preference' 
  | 'resource_availability'
  | 'business_value'
  | 'fairness_constraint'
  | 'load_balancing'
  | 'fulfillment_rate'
  | 'custom';

export type ComparisonMethod = 'slider' | 'numeric' | 'ranking' | 'pairwise';

export interface PairwiseComparison {
  factorA: string;
  factorB: string;
  preference: number; // 1-9 scale (1=equal, 9=extreme preference for A)
  consistency: number; // Consistency ratio
}

export interface PriorityFactor {
  id: string;
  type: PriorityFactorType;
  name: string;
  description: string;
  weight: number; // 0-100, percentage of total weight
  enabled: boolean;
  configuration: Record<string, any>;
  createdAt: Date;
  modifiedAt: Date;
}

export interface PriorityProfile {
  id: string;
  name: string;
  description: string;
  factors: PriorityFactor[];
  isDefault: boolean;
  isActive: boolean;
  isPreset: boolean; // Whether this is a system preset
  comparisonMethod: ComparisonMethod;
  pairwiseComparisons?: PairwiseComparison[];
  applicableScenarios: string[]; // ["high_priority_clients", "tight_deadlines", etc.]
  createdBy: 'user' | 'ai';
  createdAt: Date;
  modifiedAt: Date;
}

export interface WeightingRule {
  id: string;
  name: string;
  condition: string; // Natural language or JSON condition
  priorityAdjustments: Record<string, number>; // factorId -> weight adjustment
  multiplier: number; // Overall priority multiplier (0.5 - 2.0)
  enabled: boolean;
  priority: number; // Rule application order
  createdAt: Date;
  modifiedAt: Date;
}

export interface AllocationScore {
  clientId: string;
  workerId: string;
  taskId: string;
  phase: number;
  totalScore: number;
  factorScores: Record<string, number>;
  appliedRules: string[];
  confidence: number;
  reasoning: string[];
}
