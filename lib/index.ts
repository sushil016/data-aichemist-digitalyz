/**
 * @fileoverview Data Alchemist - Utilities Index
 * @description Centralized export of all utility functions
 */

// ===== CORE UTILITIES =====
export {
  // Class name utilities
  cn,
  getValidationClasses,
  getSeverityClasses,

  // Data transformation utilities
  safeJsonParse,
  parseArrayFromString,
  parseNumberArrayFromString,
  sanitizeEntityId,
  generateEntityId,
  deepClone,

  // Header mapping utilities
  calculateStringSimilarity,
  generateHeaderMappingSuggestions,
  applyHeaderMappings,
  findBestFieldMatch,

  // Validation utilities
  createInitialValidationState,
  generateValidationId,
  createValidationError,
  validateRequiredFields,
  validateNumericRange,
  validateArrayFormat,
  validateJsonFormat,
  findDuplicates,
  validateCrossReferences
} from "./utils";

// ===== VALIDATION UTILITIES =====
export {
  // Entity validation functions
  validateClient,
  validateWorker,
  validateTask,

  // Cross-entity validation
  validateCrossEntityReferences,

  // Batch validation
  validateClientsBatch,
  validateWorkersBatch,
  validateTasksBatch,

  // Validation state management
  calculateValidationScore,
  getValidationSummary
} from "./validation-utils";

// ===== DATA PROCESSING UTILITIES =====
export {
  // Data cleaning functions
  cleanClientData,
  cleanWorkerData,
  cleanTaskData,

  // Data parsing and transformation
  processRawData,
  convertToValidatedEntities,

  // Data aggregation and statistics
  calculateDataStatistics,
  generateDataQualityReport,

  // Data export utilities
  convertToCSV,
  prepareDataForExport,

  // Data transformation utilities
  transformDataForVisualization,
  generateSampleData
} from "./data-processing-utils";

// ===== FILE PARSING UTILITIES =====
export {
  // File validation
  validateFile,

  // Header mapping
  generateHeaderMappings,

  // Data transformation
  transformToClient,
  transformToWorker,
  transformToTask,

  // File parsing
  parseCSVFile,
  parseXLSXFile,
  parseFile,
  parseMultipleFiles,

  // Export utilities
  entitiesToCSV,
  downloadAsCSV
} from "./file-parser";

// ===== SEARCH UTILITIES =====
export {
  // Search query parsing
  parseNaturalLanguageQuery,
  generateSearchSuggestions,

  // Search implementation
  searchClients,
  searchWorkers,
  searchTasks,
  universalSearch,

  // Advanced search utilities
  findTasksWithMissingSkills,
  findOverloadedWorkers,
  analyzeSkillGaps,
  generateAutocompleteSuggestions
} from "./search-utils";

// ===== TYPE EXPORTS =====
export type {
  // Core entity types
  Client,
  Worker,
  Task,
  ValidatedClient,
  ValidatedWorker,
  ValidatedTask,

  // Validation types
  ValidationError,
  ValidationState,

  // Business rule types
  BusinessRule,
  BusinessRuleType,
  PriorityWeights,

  // Data processing types
  FileUploadStatus,
  DataParsingResult,
  HeaderMappingSuggestion,
  DataSet,
  DataStatistics,

  // Search types
  SearchQuery,
  SearchFilter,
  SearchResult,

  // Utility types
  Entity,
  ValidatedEntity,
  EntityTypeName,
  PartialClient,
  PartialWorker,
  PartialTask,
  NewClient,
  NewWorker,
  NewTask
} from "@/types/entities";

// ===== CONSTANTS =====
export { VALIDATION_CONSTANTS, FIELD_MAPPINGS } from "@/types/entities";
