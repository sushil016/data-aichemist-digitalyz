/**
 * @fileoverview Drag & Drop File Upload Demo
 * @description Standalone demo showcasing the advanced drag-and-drop file upload component
 */

'use client';

import React, { useState } from 'react';
import DragDropFileUpload from './DragDropFileUpload';
import { 
  useDataStore,
  useClients,
  useWorkers,
  useTasks,
  useValidationSummary,
  useDataActions
} from '@/lib/store/data-store';
import { EntityTypeName } from '@/types/entities';

export default function FileUploadDemo() {
  const [selectedEntityType, setSelectedEntityType] = useState<EntityTypeName>('client');
  const clients = useClients();
  const workers = useWorkers();
  const tasks = useTasks();
  const validationSummary = useValidationSummary();
  const actions = useDataActions();

  const entityCounts = {
    client: clients.length,
    worker: workers.length,
    task: tasks.length,
  };

  const handleAddSampleData = () => {
    // Add sample client data
    const sampleClients = [
      {
        ClientID: 'C001',
        ClientName: 'TechCorp Solutions',
        RequestedTaskIDs: ['T001', 'T002'],
        PriorityLevel: 5,
        GroupTag: 'Enterprise',
        AttributesJSON: '{"budget": 100000, "deadline": "2024-Q2"}'
      },
      {
        ClientID: 'C002',
        ClientName: 'StartupX',
        RequestedTaskIDs: ['T003'],
        PriorityLevel: 3,
        GroupTag: 'SMB',
        AttributesJSON: '{"budget": 25000, "deadline": "2024-Q1"}'
      }
    ];

    const sampleWorkers = [
      {
        WorkerID: 'W001',
        WorkerName: 'Alice Johnson',
        Skills: ['React', 'TypeScript', 'Node.js'],
        AvailableSlots: [1, 2, 3],
        MaxLoadPerPhase: 3,
        WorkerGroup: 'Frontend',
        QualificationLevel: 4
      },
      {
        WorkerID: 'W002',
        WorkerName: 'Bob Smith',
        Skills: ['Python', 'Django', 'PostgreSQL'],
        AvailableSlots: [2, 3, 4],
        MaxLoadPerPhase: 2,
        WorkerGroup: 'Backend',
        QualificationLevel: 5
      }
    ];

    const sampleTasks = [
      {
        TaskID: 'T001',
        TaskName: 'Frontend Development',
        Category: 'Development',
        Duration: 3,
        RequiredSkills: ['React', 'TypeScript'],
        PreferredPhases: [1, 2],
        MaxConcurrent: 2
      },
      {
        TaskID: 'T002',
        TaskName: 'API Integration',
        Category: 'Development',
        Duration: 2,
        RequiredSkills: ['Node.js', 'REST'],
        PreferredPhases: [2, 3],
        MaxConcurrent: 1
      },
      {
        TaskID: 'T003',
        TaskName: 'Database Migration',
        Category: 'Database',
        Duration: 1,
        RequiredSkills: ['PostgreSQL', 'Python'],
        PreferredPhases: [1],
        MaxConcurrent: 1
      }
    ];

    sampleClients.forEach(client => actions.addClient(client));
    sampleWorkers.forEach(worker => actions.addWorker(worker));
    sampleTasks.forEach(task => actions.addTask(task));
  };

  const handleClearAllData = () => {
    actions.clearAllData();
  };

  const downloadSampleCSV = (entityType: EntityTypeName) => {
    let csvContent = '';
    let filename = '';

    switch (entityType) {
      case 'client':
        csvContent = [
          'ClientID,ClientName,RequestedTaskIDs,PriorityLevel,GroupTag,AttributesJSON',
          'C001,TechCorp Solutions,"[""T001"",""T002""]",5,Enterprise,"{""budget"": 100000}"',
          'C002,StartupX,"[""T003""]",3,SMB,"{""budget"": 25000}"',
          'C003,MegaCorp,"[""T001"",""T003""]",4,Enterprise,"{""budget"": 200000}"'
        ].join('\n');
        filename = 'sample_clients.csv';
        break;
      case 'worker':
        csvContent = [
          'WorkerID,WorkerName,Skills,AvailableSlots,MaxLoadPerPhase,WorkerGroup,QualificationLevel',
          'W001,Alice Johnson,"[""React"",""TypeScript"",""Node.js""]","[1,2,3]",3,Frontend,4',
          'W002,Bob Smith,"[""Python"",""Django"",""PostgreSQL""]","[2,3,4]",2,Backend,5',
          'W003,Carol Davis,"[""React"",""Python"",""AWS""]","[1,3,5]",3,FullStack,4'
        ].join('\n');
        filename = 'sample_workers.csv';
        break;
      case 'task':
        csvContent = [
          'TaskID,TaskName,Category,Duration,RequiredSkills,PreferredPhases,MaxConcurrent',
          'T001,Frontend Development,Development,3,"[""React"",""TypeScript""]","[1,2]",2',
          'T002,API Integration,Development,2,"[""Node.js"",""REST""]","[2,3]",1',
          'T003,Database Migration,Database,1,"[""PostgreSQL"",""Python""]","[1]",1'
        ].join('\n');
        filename = 'sample_tasks.csv';
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced File Upload Demo
          </h1>
          <p className="text-lg text-gray-600">
            Drag & drop CSV/Excel files with real-time validation and visual feedback
          </p>
        </div>

        {/* Current Data Overview */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Data</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{entityCounts.client}</div>
              <div className="text-sm text-gray-600">Clients</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{entityCounts.worker}</div>
              <div className="text-sm text-gray-600">Workers</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{entityCounts.task}</div>
              <div className="text-sm text-gray-600">Tasks</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{validationSummary.score}</div>
              <div className="text-sm text-gray-600">Quality Score</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAddSampleData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Sample Data
            </button>
            <button
              onClick={handleClearAllData}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear All Data
            </button>
          </div>
        </div>

        {/* File Upload Component */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">File Upload</h2>
          <DragDropFileUpload
            entityType={selectedEntityType}
            onEntityTypeChange={setSelectedEntityType}
            maxSize={50 * 1024 * 1024} // 50MB
            multiple={false}
          />
        </div>

        {/* Sample Files Download */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Sample Files</h2>
          <p className="text-gray-600 mb-4">
            Download sample CSV files to test the upload functionality:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['client', 'worker', 'task'] as EntityTypeName[]).map((entityType) => (
              <div key={entityType} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2 capitalize">
                  {entityType}s Sample
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Sample CSV file with example {entityType} data
                </p>
                <button
                  onClick={() => downloadSampleCSV(entityType)}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Download CSV
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Features Showcase */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🎯 Smart File Validation</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• File type validation (CSV, XLSX, XLS)</li>
                <li>• File size limits (configurable)</li>
                <li>• Empty file detection</li>
                <li>• Real-time error feedback</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🎨 Visual Feedback</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Drag state indicators</li>
                <li>• Accept/reject visual cues</li>
                <li>• Upload progress bar</li>
                <li>• Success/error states</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🔄 Data Integration</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatic data store updates</li>
                <li>• Real-time validation</li>
                <li>• Entity type selection</li>
                <li>• Duplicate handling</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">⚡ Advanced Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Upload queue management</li>
                <li>• File preview capabilities</li>
                <li>• Batch processing</li>
                <li>• Error recovery</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
