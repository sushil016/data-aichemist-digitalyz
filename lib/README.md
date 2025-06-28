# Data Alchemist - Utility Functions

This directory contains comprehensive utility functions for the Data Alchemist project, a smart web application that processes CSV/XLSX files for resource allocation.

## Overview

The utilities are organized into several specialized modules:

- **`utils.ts`** - Core utilities for class merging, data transformation, and common helpers
- **`validation-utils.ts`** - Specialized validation functions for data entities
- **`data-processing-utils.ts`** - Advanced data transformation and processing functions
- **`search-utils.ts`** - Natural language search and filtering functionality
- **`index.ts`** - Centralized export of all utilities

## Core Utilities (`utils.ts`)

### Class Name Utilities

#### `cn(...inputs: ClassValue[])`
Utility function for merging CSS classes with Tailwind CSS. Combines clsx for conditional classes and tailwind-merge for conflict resolution.

```typescript
import { cn } from "@/lib/utils";

const className = cn(
  "base-class",
  isActive && "active-class",
  hasError && "error-class"
);
```

#### `getValidationClasses(validation: ValidationState)`
Generate dynamic CSS classes based on validation state.

```typescript
const classes = getValidationClasses(entity.validation);
// Returns: "border-red-500 bg-red-50 text-red-900" for errors
```

#### `getSeverityClasses(severity: 'error' | 'warning' | 'info')`
Generate CSS classes for different severity levels.

### Data Transformation Utilities

#### `safeJsonParse<T>(jsonString: string, fallback: T)`
Safe JSON parser with fallback value.

```typescript
const data = safeJsonParse('{"key": "value"}', {});
// Returns parsed object or fallback on error
```

#### `parseArrayFromString(value: string | string[])`
Parse array from string, handling various formats (JSON array, comma-separated).

```typescript
const skills = parseArrayFromString("React, Node.js, TypeScript");
// Returns: ["React", "Node.js", "TypeScript"]
```

#### `parseNumberArrayFromString(value: string | number[])`
Parse number array from string.

```typescript
const phases = parseNumberArrayFromString("[1, 3, 5]");
// Returns: [1, 3, 5]
```

#### `sanitizeEntityId(id: string, prefix: string)`
Sanitize and format entity ID with proper prefix.

```typescript
const clientId = sanitizeEntityId("001", "C");
// Returns: "C001"
```

#### `generateEntityId(entityType: EntityTypeName, existingIds: string[])`
Generate unique entity ID.

```typescript
const newId = generateEntityId("client", ["C001", "C002"]);
// Returns: "C003"
```

### Header Mapping Utilities

#### `calculateStringSimilarity(str1: string, str2: string)`
Calculate similarity between two strings using Levenshtein distance.

```typescript
const similarity = calculateStringSimilarity("Client ID", "ClientID");
// Returns: 0.89 (89% similarity)
```

#### `generateHeaderMappingSuggestions(headers: string[], entityType: EntityTypeName)`
Generate AI-powered header mapping suggestions.

```typescript
const suggestions = generateHeaderMappingSuggestions(
  ["Client Name", "Priority", "Tasks"],
  "client"
);
```

### Data Processing Utilities

#### `removeDuplicates<T>(array: T[], keyFn?: (item: T) => any)`
Remove duplicates from array with optional key function.

#### `groupBy<T>(array: T[], keyFn: (item: T) => string | number)`
Group array items by key.

#### `sortBy<T>(array: T[], sortFns: Array<(item: T) => any>, orders?: Array<'asc' | 'desc'>)`
Sort array by multiple criteria.

#### `filterBy<T>(array: T[], filters: Array<(item: T) => boolean>, operator?: 'and' | 'or')`
Filter array with multiple conditions.

#### `paginate<T>(array: T[], page: number, pageSize: number)`
Paginate array with metadata.

### Performance Utilities

#### `debounce<T>(func: T, wait: number)`
Debounce function execution.

#### `throttle<T>(func: T, limit: number)`
Throttle function execution.

#### `measureExecutionTime<T>(fn: () => T, label?: string)`
Measure and log function execution time.

## Validation Utilities (`validation-utils.ts`)

### Entity Validation Functions

#### `validateClient(client: Partial<Client>, row?: number)`
Comprehensive validation for Client entities.

```typescript
const errors = validateClient({
  ClientID: "C001",
  ClientName: "Acme Corp",
  PriorityLevel: 5
});
```

#### `validateWorker(worker: Partial<Worker>, row?: number)`
Comprehensive validation for Worker entities.

#### `validateTask(task: Partial<Task>, row?: number)`
Comprehensive validation for Task entities.

### Cross-Entity Validation

#### `validateCrossEntityReferences(clients: Client[], workers: Worker[], tasks: Task[])`
Validate references between entities (e.g., requested task IDs exist).

### Batch Validation

#### `validateClientsBatch(clients: Partial<Client>[])`
Validate array of clients with duplicate ID detection.

### Validation State Management

#### `calculateValidationScore(validationState: ValidationState)`
Calculate validation score (0-100) based on errors and warnings.

#### `getValidationSummary(validationState: ValidationState)`
Get human-readable validation summary with status and recommendations.

## Data Processing Utilities (`data-processing-utils.ts`)

### Data Cleaning Functions

#### `cleanClientData(rawClient: Record<string, any>)`
Clean and normalize raw client data.

```typescript
const client = cleanClientData({
  "Client ID": "001",
  "Client Name": " Acme Corp ",
  "Priority": "5"
});
// Returns properly formatted Client object
```

#### `cleanWorkerData(rawWorker: Record<string, any>)`
Clean and normalize raw worker data.

#### `cleanTaskData(rawTask: Record<string, any>)`
Clean and normalize raw task data.

### Data Parsing and Transformation

#### `processRawData<T>(rawData: Record<string, any>[], entityType: EntityTypeName, headerMappings: Record<string, string>)`
Process raw CSV data into typed entities with validation.

#### `convertToValidatedEntities<T>(entities: T[], entityType: EntityTypeName)`
Convert entities to validated entities with validation states.

### Data Statistics and Quality

#### `calculateDataStatistics(dataset: DataSet)`
Calculate comprehensive data statistics.

#### `generateDataQualityReport(dataset: DataSet)`
Generate detailed data quality report with recommendations.

### Data Export

#### `convertToCSV<T>(data: T[], headers?: string[])`
Convert dataset to CSV format.

#### `prepareDataForExport(dataset: DataSet)`
Prepare clean data for export, removing validation states.

### Data Visualization

#### `transformDataForVisualization(dataset: DataSet)`
Transform data for charts and visualizations.

#### `generateSampleData()`
Generate sample data for testing and development.

## Search Utilities (`search-utils.ts`)

### Natural Language Search

#### `parseNaturalLanguageQuery(query: string)`
Parse natural language queries into structured filters.

```typescript
const filters = parseNaturalLanguageQuery("Show all high priority clients");
// Returns: [{ field: "PriorityLevel", operator: "equals", value: 5 }]
```

#### `generateSearchSuggestions(clients: Client[], workers: Worker[], tasks: Task[])`
Generate search suggestions based on available data.

### Search Implementation

#### `searchClients(clients: ValidatedClient[], searchQuery: SearchQuery)`
Search clients with natural language query support.

#### `searchWorkers(workers: ValidatedWorker[], searchQuery: SearchQuery)`
Search workers with natural language query support.

#### `searchTasks(tasks: ValidatedTask[], searchQuery: SearchQuery)`
Search tasks with natural language query support.

#### `universalSearch(clients, workers, tasks, searchQuery)`
Search across all entity types simultaneously.

### Advanced Search Analytics

#### `findTasksWithMissingSkills(tasks: ValidatedTask[], workers: ValidatedWorker[])`
Find tasks that require skills not available in workforce.

#### `findOverloadedWorkers(workers: ValidatedWorker[], tasks: ValidatedTask[])`
Find workers that may be overloaded in specific phases.

#### `analyzeSkillGaps(workers: ValidatedWorker[], tasks: ValidatedTask[])`
Analyze skill demand vs supply with recommendations.

#### `generateAutocompleteSuggestions(query: string, clients, workers, tasks)`
Generate autocomplete suggestions for search queries.

## Usage Examples

### Basic Data Processing Pipeline

```typescript
import {
  processRawData,
  validateClientsBatch,
  generateDataQualityReport,
  convertToCSV
} from "@/lib";

// Process raw CSV data
const result = processRawData(rawData, "client", headerMappings);

// Validate the processed data
const validationErrors = validateClientsBatch(result.data);

// Generate quality report
const qualityReport = generateDataQualityReport(dataset);

// Export clean data
const csvData = convertToCSV(result.data);
```

### Natural Language Search

```typescript
import { universalSearch } from "@/lib";

const searchResults = universalSearch(
  clients,
  workers,
  tasks,
  {
    query: "Show all high priority clients with React skills",
    filters: [],
    sortBy: "PriorityLevel",
    sortOrder: "desc"
  }
);
```

### Data Validation and Cleanup

```typescript
import {
  cleanClientData,
  validateClient,
  getValidationSummary
} from "@/lib";

// Clean raw data
const client = cleanClientData(rawClientData);

// Validate
const errors = validateClient(client);

// Get summary
const summary = getValidationSummary({
  isValid: errors.length === 0,
  errors: errors.filter(e => e.severity === 'error'),
  warnings: errors.filter(e => e.severity === 'warning'),
  lastValidated: new Date(),
  autoFixesApplied: 0
});
```

## Type Safety

All utilities are fully TypeScript typed with:
- Generic type parameters where appropriate
- Strict input/output typing
- Proper error handling
- Comprehensive JSDoc documentation

## Performance Considerations

- Debounced and throttled functions for UI responsiveness
- Efficient algorithms for large datasets
- Memory-conscious data transformations
- Performance measurement utilities

## Error Handling

- Safe parsing with fallbacks
- Comprehensive validation error reporting
- Graceful degradation for malformed data
- Retry mechanisms for async operations

## Integration

These utilities integrate seamlessly with:
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- AG-Grid data tables
- Zustand state management

All utilities follow the project's architecture patterns and are designed for the Data Alchemist resource allocation configurator.
