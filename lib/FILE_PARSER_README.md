# 🧪 Intelligent File Parser

A powerful TypeScript file parser that handles CSV and XLSX files with intelligent header mapping and automatic data transformation for the Data Alchemist project.

## ✨ Features

- **Multi-format Support**: Parse CSV, XLSX, and XLS files
- **Intelligent Header Mapping**: Automatically maps column headers to correct fields even with variations
- **Data Transformation**: Converts raw data to properly typed TypeScript interfaces
- **Validation & Error Handling**: Comprehensive validation with detailed error reporting
- **Fuzzy String Matching**: Uses similarity algorithms to map headers with 60%+ confidence
- **Batch Processing**: Process multiple files simultaneously
- **Export Utilities**: Convert processed data back to CSV format
- **Type Safety**: Full TypeScript support with proper type inference

## 🚀 Quick Start

### Basic Usage

```typescript
import { parseFile } from '@/lib/file-parser';

// Parse a single file
const file = new File(/* your file data */, 'clients.csv');
const result = await parseFile(file, 'client');

console.log(`Processed ${result.processedRows}/${result.totalRows} rows`);
console.log('Data:', result.data);
console.log('Errors:', result.errors);
console.log('Header mappings:', result.mappedHeaders);
```

### Multiple Files

```typescript
import { parseMultipleFiles } from '@/lib/file-parser';

const files = {
  clients: clientFile,
  workers: workerFile,
  tasks: taskFile
};

const result = await parseMultipleFiles(files);
console.log('Summary:', result.summary);
```

## 🗺️ Header Mapping Intelligence

The parser automatically maps headers using multiple strategies:

### 1. Exact Matches
```
"ClientID" → "ClientID" (100% confidence)
"Client Name" → "ClientName" (100% confidence)
```

### 2. Case-Insensitive Matches
```
"client_id" → "ClientID" (95% confidence)
"WORKER_NAME" → "WorkerName" (95% confidence)
```

### 3. Fuzzy String Matching
```
"Client Identifier" → "ClientID" (78% confidence)
"Employee Skills" → "Skills" (85% confidence)
```

### 4. Partial Word Matching
```
"Available Time Slots" → "AvailableSlots" (70% confidence)
"Max Load Per Phase" → "MaxLoadPerPhase" (80% confidence)
```

## 📊 Supported Data Entities

### Client Entity
```typescript
interface Client {
  ClientID: string;           // C001, C002, etc.
  ClientName: string;         // Display name
  PriorityLevel: number;      // 1-5 (5 = highest)
  RequestedTaskIDs: string[]; // ["T001", "T002"]
  GroupTag: string;           // "Enterprise", "SMB"
  AttributesJSON: string;     // JSON metadata
}
```

**Supported Header Variations:**
- `ClientID`: "Client ID", "Client_ID", "client_id", "ID"
- `ClientName`: "Client Name", "Client_Name", "client_name", "Name"
- `PriorityLevel`: "Priority", "Priority Level", "Priority_Level"
- `RequestedTaskIDs`: "Requested Tasks", "Tasks", "Requested_Tasks"
- `GroupTag`: "Group", "Group Tag", "Group_Tag"
- `AttributesJSON`: "Attributes", "Attributes JSON", "Attributes_JSON"

### Worker Entity
```typescript
interface Worker {
  WorkerID: string;           // W001, W002, etc.
  WorkerName: string;         // Display name
  Skills: string[];           // ["JavaScript", "React"]
  AvailableSlots: number[];   // [1, 3, 5, 7]
  MaxLoadPerPhase: number;    // 1-10
  WorkerGroup: string;        // "Frontend", "Backend"
  QualificationLevel: number; // 1-5
}
```

**Supported Header Variations:**
- `WorkerID`: "Worker ID", "Worker_ID", "worker_id", "ID"
- `WorkerName`: "Worker Name", "Worker_Name", "Name"
- `Skills`: "Skills Set", "Skills_Set", "Skills"
- `AvailableSlots`: "Available Slots", "Available_Slots", "Slots"
- `MaxLoadPerPhase`: "Max Load", "Max Load Per Phase", "Max_Load_Per_Phase"
- `WorkerGroup`: "Group", "Worker Group", "Worker_Group"
- `QualificationLevel`: "Qualification", "Qualification Level"

### Task Entity
```typescript
interface Task {
  TaskID: string;             // T001, T002, etc.
  TaskName: string;           // Display name
  Category: string;           // "Development", "Testing"
  Duration: number;           // 1-10 phases
  RequiredSkills: string[];   // ["React", "TypeScript"]
  PreferredPhases: number[];  // [2, 3, 4]
  MaxConcurrent: number;      // 1-5
}
```

**Supported Header Variations:**
- `TaskID`: "Task ID", "Task_ID", "task_id", "ID"
- `TaskName`: "Task Name", "Task_Name", "Name"
- `Category`: "Category", "Task Category", "Task_Category"
- `Duration`: "Duration", "Task Duration", "Task_Duration"
- `RequiredSkills`: "Required Skills", "Required_Skills", "Skills"
- `PreferredPhases`: "Preferred Phases", "Preferred_Phases", "Phases"
- `MaxConcurrent`: "Max Concurrent", "Max_Concurrent", "Concurrent"

## 🔄 Data Transformation

The parser handles various data formats automatically:

### Array Parsing
```typescript
// JSON format
"[\"React\", \"Node.js\", \"TypeScript\"]" → ["React", "Node.js", "TypeScript"]

// Comma-separated
"React, Node.js, TypeScript" → ["React", "Node.js", "TypeScript"]

// Number arrays
"[1, 3, 5]" → [1, 3, 5]
"1,3,5" → [1, 3, 5]
```

### Number Validation
```typescript
// Range validation with auto-correction
PriorityLevel: "10" → 5 (clamped to 1-5)
QualificationLevel: "0" → 1 (clamped to 1-5)
Duration: "15" → 10 (clamped to 1-10)
```

### ID Sanitization
```typescript
// Automatic prefix addition
ClientID: "001" → "C001"
WorkerID: "w001" → "W001" (case correction)
TaskID: "t001" → "T001" (case correction)
```

### JSON Validation
```typescript
// JSON parsing with validation
AttributesJSON: '{"budget": 50000}' → Valid JSON
AttributesJSON: '{invalid json}' → Error reported
```

## 🚨 Error Handling & Validation

### Error Types
- **Error**: Critical issues that prevent processing
- **Warning**: Issues that were auto-corrected
- **Info**: Informational messages

### Common Validations
1. **Missing Required Fields**
2. **Duplicate ID Detection** 
3. **Data Type Validation**
4. **Range Validation**
5. **Array Format Validation**
6. **JSON Format Validation**
7. **Reference Integrity**

### Example Error Handling
```typescript
const result = await parseFile(file, 'client');

// Check for errors
if (result.errors.length > 0) {
  console.log('Critical errors found:');
  result.errors.forEach(error => {
    console.log(`Row ${error.row}: ${error.message}`);
    if (error.suggestedFix) {
      console.log(`Suggested fix: ${error.suggestedFix}`);
    }
  });
}

// Check for warnings
if (result.warnings.length > 0) {
  console.log('Warnings (auto-corrected):');
  result.warnings.forEach(warning => {
    console.log(`Row ${warning.row}: ${warning.message}`);
  });
}
```

## 📁 File Format Support

### CSV Files
- UTF-8 encoding
- Header row required
- Comma-separated values
- Quoted strings for values containing commas
- Empty lines automatically skipped

### XLSX Files
- Excel 2007+ format
- First sheet used by default
- Header row in first row
- Empty cells converted to empty strings
- Multiple sheets supported (first sheet used)

### File Size Limits
- Maximum file size: 10MB
- Automatic file validation before processing
- Detailed error messages for unsupported files

## 🔧 Advanced Usage

### Custom Header Mappings
```typescript
import { generateHeaderMappings } from '@/lib/file-parser';

const headers = ['Client Identifier', 'Company Name', 'Priority'];
const mappings = generateHeaderMappings(headers, 'client');

console.log('Mappings:', mappings.mappings);
console.log('Suggestions:', mappings.suggestions);
console.log('Unmapped:', mappings.unmappedHeaders);
```

### Manual Data Transformation
```typescript
import { transformToClient } from '@/lib/file-parser';

const rawData = {
  ClientID: 'C001',
  ClientName: 'Acme Corp',
  PriorityLevel: '5'
};

const { client, errors } = transformToClient(rawData, 0);
```

### Export Processed Data
```typescript
import { downloadAsCSV } from '@/lib/file-parser';

// Download as CSV file
downloadAsCSV(processedClients, 'client', 'cleaned_clients.csv');
```

## 🎯 Best Practices

### 1. File Preparation
- Include header row as first row
- Use consistent naming conventions
- Avoid special characters in headers
- Ensure UTF-8 encoding for CSV files

### 2. Data Quality
- Provide ID fields for all entities
- Use consistent array formats
- Validate JSON strings before upload
- Keep numeric values within expected ranges

### 3. Error Handling
```typescript
try {
  const result = await parseFile(file, entityType);
  
  // Process successful results
  if (result.errors.length === 0) {
    // All good, proceed with data
    processData(result.data);
  } else {
    // Handle errors appropriately
    handleErrors(result.errors);
  }
  
} catch (error) {
  // Handle parsing failures
  console.error('Parse failed:', error);
}
```

### 4. Performance
- Process files individually for better error isolation
- Use batch processing for multiple related files
- Monitor memory usage with large files
- Implement progress indicators for user feedback

## 📖 API Reference

### Core Functions

#### `parseFile(file: File, entityType: EntityTypeName)`
Parse a single file and return typed entities.

**Parameters:**
- `file`: File object to parse
- `entityType`: 'client' | 'worker' | 'task'

**Returns:** `DataParsingResult<T>`

#### `parseMultipleFiles(files: Record<string, File>)`
Parse multiple files simultaneously.

**Parameters:**
- `files`: Object with entity type keys and File values

**Returns:** Batch processing result with summary

#### `validateFile(file: File)`
Validate file type, size, and basic format.

**Parameters:**
- `file`: File object to validate

**Returns:** Validation result with errors

#### `generateHeaderMappings(headers: string[], entityType: EntityTypeName)`
Generate intelligent header mapping suggestions.

**Parameters:**
- `headers`: Array of header strings from file
- `entityType`: Target entity type

**Returns:** Mappings, suggestions, and unmapped headers

### Transformation Functions

#### `transformToClient(rawRow: Record<string, any>, rowIndex: number)`
Transform raw data to Client entity.

#### `transformToWorker(rawRow: Record<string, any>, rowIndex: number)`
Transform raw data to Worker entity.

#### `transformToTask(rawRow: Record<string, any>, rowIndex: number)`
Transform raw data to Task entity.

### Export Functions

#### `entitiesToCSV<T>(entities: T[], entityType: EntityTypeName)`
Convert entities to CSV string.

#### `downloadAsCSV<T>(entities: T[], entityType: EntityTypeName, filename?: string)`
Download entities as CSV file.

## 🧪 Testing & Examples

### Run Demo
```typescript
import { runFileParserDemo } from '@/lib/file-parser-examples';

// Run comprehensive demo
runFileParserDemo();

// Create sample data files
createSampleCSVData();
```

### Sample Data Structure
The parser includes sample data generators for testing:
- 3 sample clients with various priority levels
- 3 sample workers with different skill sets
- 3 sample tasks with different requirements

## 🤝 Contributing

When extending the parser:

1. **Add new entity types** by updating the `EntityTypeName` union type
2. **Extend field mappings** in `FIELD_MAPPINGS` constant
3. **Create transformation functions** following the existing patterns
4. **Add validation rules** in the transformation functions
5. **Update tests** to cover new functionality

## 📄 License

Part of the Data Alchemist project - AI-powered resource allocation configurator.
