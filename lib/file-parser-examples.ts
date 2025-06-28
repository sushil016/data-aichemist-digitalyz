/**
 * @fileoverview File Parser Usage Examples
 * @description Complete examples of how to use the file parser
 */

import {
  parseFile,
  parseMultipleFiles,
  validateFile,
  generateHeaderMappings,
  transformToClient,
  transformToWorker,
  transformToTask,
  downloadAsCSV
} from '@/lib/file-parser';
import { EntityTypeName, Client, Worker, Task } from '@/types/entities';

// ===== BASIC FILE PARSING EXAMPLES =====

/**
 * Example 1: Parse a single CSV file with client data
 */
export async function parseClientFile(file: File) {
  try {
    console.log('🔍 Validating file...');
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      console.error('❌ File validation failed:', validation.errors);
      return;
    }
    
    console.log('✅ File valid:', validation.fileInfo);
    
    console.log('📊 Parsing client data...');
    const result = await parseFile(file, 'client');
    
    console.log('📈 Parse Results:');
    console.log(`- Processed: ${result.processedRows}/${result.totalRows} rows`);
    console.log(`- Errors: ${result.errors.length}`);
    console.log(`- Warnings: ${result.warnings.length}`);
    console.log(`- Header mappings:`, result.mappedHeaders);
    
    // Display header mapping suggestions
    console.log('🗺️ Header Mapping Suggestions:');
    result.suggestions.forEach(suggestion => {
      console.log(`  "${suggestion.originalHeader}" → "${suggestion.suggestedField}" (${Math.round(suggestion.confidence * 100)}%)`);
      console.log(`    Reasoning: ${suggestion.reasoning}`);
    });
    
    // Display sample data
    console.log('📋 Sample processed data:');
    console.log(result.data.slice(0, 3));
    
    // Display errors and warnings
    if (result.errors.length > 0) {
      console.log('🚨 Errors:');
      result.errors.forEach(error => {
        console.log(`  Row ${error.row}: ${error.message}`);
      });
    }
    
    if (result.warnings.length > 0) {
      console.log('⚠️ Warnings:');
      result.warnings.forEach(warning => {
        console.log(`  Row ${warning.row}: ${warning.message}`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Parse failed:', error);
    throw error;
  }
}

/**
 * Example 2: Parse multiple files simultaneously
 */
export async function parseAllFiles(files: {
  clients?: File;
  workers?: File;
  tasks?: File;
}) {
  try {
    console.log('🚀 Starting batch file processing...');
    
    const result = await parseMultipleFiles(files);
    
    console.log('📊 Batch Processing Summary:');
    console.log(`- Total files: ${result.summary.totalFiles}`);
    console.log(`- Successful: ${result.summary.successfulFiles}`);
    console.log(`- Failed: ${result.summary.failedFiles.length}`);
    console.log(`- Total entities: ${result.summary.totalEntities}`);
    console.log(`- Total errors: ${result.summary.totalErrors}`);
    console.log(`- Total warnings: ${result.summary.totalWarnings}`);
    
    if (result.summary.failedFiles.length > 0) {
      console.log('❌ Failed files:');
      result.summary.failedFiles.forEach(error => {
        console.log(`  ${error}`);
      });
    }
    
    // Process results for each entity type
    if (result.clients) {
      console.log('👥 Clients processed:', result.clients.processedRows);
    }
    
    if (result.workers) {
      console.log('🔧 Workers processed:', result.workers.processedRows);
    }
    
    if (result.tasks) {
      console.log('📋 Tasks processed:', result.tasks.processedRows);
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Batch processing failed:', error);
    throw error;
  }
}

// ===== HEADER MAPPING EXAMPLES =====

/**
 * Example 3: Demonstrate intelligent header mapping
 */
export function demonstrateHeaderMapping() {
  console.log('🗺️ Header Mapping Examples:');
  
  // Example headers with variations
  const exampleHeaders = {
    client: [
      'Client ID',           // Exact match
      'client_name',         // Case variation  
      'Priority',            // Partial match
      'Requested Tasks',     // Exact match
      'Group',               // Partial match
      'Attributes JSON'      // Exact match
    ],
    worker: [
      'Worker_ID',           // Case variation
      'Name',                // Generic match
      'Skills Set',          // Exact match
      'Available Time Slots', // Similar match
      'Max Load',            // Partial match
      'Team',                // Generic match
      'Experience'           // Similar match
    ],
    task: [
      'task_id',             // Case variation
      'Task_Name',           // Case variation
      'Type',                // Generic match
      'Duration',            // Exact match
      'Skills',              // Generic match
      'Phases',              // Generic match
      'Concurrent'           // Partial match
    ]
  };
  
  (['client', 'worker', 'task'] as EntityTypeName[]).forEach(entityType => {
    console.log(`\n${entityType.toUpperCase()} Headers:`);
    
    const result = generateHeaderMappings(exampleHeaders[entityType], entityType);
    
    console.log('  Mappings:');
    Object.entries(result.mappings).forEach(([original, mapped]) => {
      console.log(`    "${original}" → "${mapped}"`);
    });
    
    console.log('  Suggestions:');
    result.suggestions.forEach(suggestion => {
      console.log(`    "${suggestion.originalHeader}"`);
      console.log(`      → "${suggestion.suggestedField}"`);
      console.log(`      Confidence: ${Math.round(suggestion.confidence * 100)}%`);
      console.log(`      Reasoning: ${suggestion.reasoning}`);
    });
    
    if (result.unmappedHeaders.length > 0) {
      console.log('  Unmapped headers:', result.unmappedHeaders);
    }
  });
}

// ===== DATA TRANSFORMATION EXAMPLES =====

/**
 * Example 4: Transform raw data with various formats
 */
export function demonstrateDataTransformation() {
  console.log('🔄 Data Transformation Examples:');
  
  // Example raw data with various formats
  const rawClientData = {
    ClientID: 'C001',
    ClientName: '  Acme Corp  ',        // Extra whitespace
    PriorityLevel: '5',                 // String number
    RequestedTaskIDs: '["T001", "T002"]', // JSON array
    GroupTag: 'Enterprise',
    AttributesJSON: '{"budget": 50000, "deadline": "2024-Q2"}'
  };
  
  const rawWorkerData = {
    WorkerID: 'w001',                   // Wrong case
    WorkerName: 'John Doe',
    Skills: 'React, Node.js, TypeScript', // Comma-separated
    AvailableSlots: '[1, 3, 5]',        // JSON array
    MaxLoadPerPhase: '3',               // String number
    WorkerGroup: 'Frontend',
    QualificationLevel: '4'             // String number
  };
  
  const rawTaskData = {
    TaskID: 't001',                     // Wrong case
    TaskName: 'Build Dashboard',
    Category: 'Development',
    Duration: '2',                      // String number
    RequiredSkills: 'React,TypeScript', // Comma-separated without spaces
    PreferredPhases: '2,3,4',           // Comma-separated numbers
    MaxConcurrent: '1'                  // String number
  };
  
  console.log('\nClient Transformation:');
  console.log('  Raw:', rawClientData);
  const clientResult = transformToClient(rawClientData, 0);
  console.log('  Transformed:', clientResult.client);
  if (clientResult.errors.length > 0) {
    console.log('  Errors:', clientResult.errors.map(e => e.message));
  }
  
  console.log('\nWorker Transformation:');
  console.log('  Raw:', rawWorkerData);
  const workerResult = transformToWorker(rawWorkerData, 0);
  console.log('  Transformed:', workerResult.worker);
  if (workerResult.errors.length > 0) {
    console.log('  Errors:', workerResult.errors.map(e => e.message));
  }
  
  console.log('\nTask Transformation:');
  console.log('  Raw:', rawTaskData);
  const taskResult = transformToTask(rawTaskData, 0);
  console.log('  Transformed:', taskResult.task);
  if (taskResult.errors.length > 0) {
    console.log('  Errors:', taskResult.errors.map(e => e.message));
  }
}

// ===== FILE FORMAT EXAMPLES =====

/**
 * Example 5: Create sample CSV data for testing
 */
export function createSampleCSVData() {
  console.log('📝 Creating sample CSV data...');
  
  const sampleClients = [
    {
      ClientID: 'C001',
      ClientName: 'Acme Corporation',
      PriorityLevel: 5,
      RequestedTaskIDs: ['T001', 'T002', 'T003'],
      GroupTag: 'Enterprise',
      AttributesJSON: '{"budget": 100000, "deadline": "2024-Q2", "contact": "john@acme.com"}'
    },
    {
      ClientID: 'C002',
      ClientName: 'Beta Industries',
      PriorityLevel: 3,
      RequestedTaskIDs: ['T002', 'T004'],
      GroupTag: 'SMB',
      AttributesJSON: '{"budget": 25000, "deadline": "2024-Q3"}'
    },
    {
      ClientID: 'C003',
      ClientName: 'Gamma Solutions',
      PriorityLevel: 4,
      RequestedTaskIDs: ['T001', 'T005'],
      GroupTag: 'Enterprise',
      AttributesJSON: '{"budget": 75000, "deadline": "2024-Q2", "priority": "high"}'
    }
  ];
  
  const sampleWorkers = [
    {
      WorkerID: 'W001',
      WorkerName: 'Alice Johnson',
      Skills: ['React', 'TypeScript', 'Node.js'],
      AvailableSlots: [1, 3, 5, 7],
      MaxLoadPerPhase: 3,
      WorkerGroup: 'Frontend',
      QualificationLevel: 5
    },
    {
      WorkerID: 'W002',
      WorkerName: 'Bob Smith',
      Skills: ['Python', 'Django', 'PostgreSQL'],
      AvailableSlots: [2, 4, 6],
      MaxLoadPerPhase: 2,
      WorkerGroup: 'Backend',
      QualificationLevel: 4
    },
    {
      WorkerID: 'W003',
      WorkerName: 'Carol Davis',
      Skills: ['React', 'Python', 'AWS'],
      AvailableSlots: [1, 2, 3, 4, 5],
      MaxLoadPerPhase: 4,
      WorkerGroup: 'FullStack',
      QualificationLevel: 5
    }
  ];
  
  const sampleTasks = [
    {
      TaskID: 'T001',
      TaskName: 'User Authentication System',
      Category: 'Development',
      Duration: 3,
      RequiredSkills: ['React', 'Node.js'],
      PreferredPhases: [1, 2, 3],
      MaxConcurrent: 2
    },
    {
      TaskID: 'T002',
      TaskName: 'Payment Processing',
      Category: 'Development',
      Duration: 2,
      RequiredSkills: ['Python', 'Django'],
      PreferredPhases: [2, 3],
      MaxConcurrent: 1
    },
    {
      TaskID: 'T003',
      TaskName: 'Data Analytics Dashboard',
      Category: 'Development',
      Duration: 4,
      RequiredSkills: ['React', 'TypeScript', 'Python'],
      PreferredPhases: [3, 4, 5],
      MaxConcurrent: 2
    }
  ];
  
  // Download sample files
  downloadAsCSV(sampleClients, 'client', 'sample_clients.csv');
  downloadAsCSV(sampleWorkers, 'worker', 'sample_workers.csv');
  downloadAsCSV(sampleTasks, 'task', 'sample_tasks.csv');
  
  console.log('✅ Sample CSV files downloaded!');
  
  return {
    clients: sampleClients,
    workers: sampleWorkers,
    tasks: sampleTasks
  };
}

// ===== COMPREHENSIVE DEMO FUNCTION =====

/**
 * Run all examples
 */
export function runFileParserDemo() {
  console.log('🚀 Starting File Parser Demo...\n');
  
  try {
    // Demonstrate header mapping
    demonstrateHeaderMapping();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Demonstrate data transformation
    demonstrateDataTransformation();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Create sample data
    const sampleData = createSampleCSVData();
    
    console.log('\n✅ File Parser Demo completed successfully!');
    console.log('📁 Sample files have been downloaded for testing.');
    console.log('🔧 Use the parseFile() or parseMultipleFiles() functions with actual File objects.');
    
    return sampleData;
    
  } catch (error) {
    console.error('💥 Demo failed:', error);
    throw error;
  }
}

// Export for use in other files
export default {
  parseClientFile,
  parseAllFiles,
  demonstrateHeaderMapping,
  demonstrateDataTransformation,
  createSampleCSVData,
  runFileParserDemo
};
