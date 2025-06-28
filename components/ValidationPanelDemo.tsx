/**
 * @fileoverview ValidationPanelDemo Component
 * @description Demo component showcasing ValidationPanel features with sample data and errors
 */

'use client';

import React, { useEffect } from 'react';
import { ValidationPanel } from './ValidationPanel';
import { useDataStore } from '@/lib/store/data-store';
import { Client, Worker, Task, ValidationError } from '@/types/entities';

const ValidationPanelDemo: React.FC = () => {
  const { actions } = useDataStore();

  // Sample data with validation issues
  const sampleClients: Client[] = [
    {
      ClientID: 'C001',
      ClientName: 'TechCorp Inc',
      PriorityLevel: 5,
      RequestedTaskIDs: ['T001', 'T002', 'T999'], // T999 doesn't exist - validation error
      GroupTag: 'Enterprise',
      AttributesJSON: '{"budget": 50000, "deadline": "2024-Q2"}'
    },
    {
      ClientID: 'C002',
      ClientName: '', // Empty name - validation error
      PriorityLevel: 10, // Invalid priority (should be 1-5) - validation error
      RequestedTaskIDs: ['T003'],
      GroupTag: 'SMB',
      AttributesJSON: 'invalid json' // Invalid JSON - validation error
    },
    {
      ClientID: 'C003',
      ClientName: 'StartupXYZ',
      PriorityLevel: 3,
      RequestedTaskIDs: [],
      GroupTag: 'startup', // Non-standard group tag - validation warning
      AttributesJSON: '{"budget": 10000}'
    }
  ];

  const sampleWorkers: Worker[] = [
    {
      WorkerID: 'W001',
      WorkerName: 'Alice Johnson',
      Skills: ['JavaScript', 'React', 'Node.js'],
      AvailableSlots: [1, 2, 3],
      MaxLoadPerPhase: 5,
      WorkerGroup: 'Frontend',
      QualificationLevel: 4
    },
    {
      WorkerID: 'W002',
      WorkerName: 'Bob Smith',
      Skills: [], // No skills - validation warning
      AvailableSlots: [15, 20], // Invalid slots (should be 1-10) - validation error
      MaxLoadPerPhase: 0, // Invalid load (should be 1-10) - validation error
      WorkerGroup: 'Backend',
      QualificationLevel: 3
    },
    {
      WorkerID: '', // Empty ID - validation error
      WorkerName: 'Charlie Brown',
      Skills: ['Python', 'Django'],
      AvailableSlots: [4, 5],
      MaxLoadPerPhase: 3,
      WorkerGroup: 'Backend',
      QualificationLevel: 2
    }
  ];

  const sampleTasks: Task[] = [
    {
      TaskID: 'T001',
      TaskName: 'Frontend Development',
      Category: 'Development',
      Duration: 5,
      RequiredSkills: ['React', 'TypeScript'],
      PreferredPhases: [1, 2, 3],
      MaxConcurrent: 2
    },
    {
      TaskID: 'T002',
      TaskName: 'Backend API',
      Category: 'Development',
      Duration: 0, // Invalid duration (should be 1-10) - validation error
      RequiredSkills: ['Node.js', 'Express'],
      PreferredPhases: [20, 25], // Invalid phases (should be 1-10) - validation error
      MaxConcurrent: 1
    },
    {
      TaskID: 'T003',
      TaskName: '', // Empty name - validation error
      Category: 'Testing',
      Duration: 3,
      RequiredSkills: ['COBOL', 'Fortran'], // Unusual skills - validation info
      PreferredPhases: [2, 3],
      MaxConcurrent: 1
    }
  ];

  // Sample validation errors that would be generated
  const sampleValidationErrors: ValidationError[] = [
    {
      id: 'err_c002_name_empty',
      entityType: 'client',
      entityId: 'C002',
      row: 2,
      column: 'ClientName',
      field: 'ClientName',
      message: 'Client name cannot be empty',
      severity: 'error',
      suggestedFix: 'Add a descriptive name for the client',
      autoFixable: false
    },
    {
      id: 'err_c002_priority_invalid',
      entityType: 'client',
      entityId: 'C002',
      row: 2,
      column: 'PriorityLevel',
      field: 'PriorityLevel',
      message: 'Priority level must be between 1 and 5',
      severity: 'error',
      suggestedFix: 'Change priority to 5 (highest priority)',
      autoFixable: true
    },
    {
      id: 'err_c002_json_invalid',
      entityType: 'client',
      entityId: 'C002',
      row: 2,
      column: 'AttributesJSON',
      field: 'AttributesJSON',
      message: 'Invalid JSON format in AttributesJSON field',
      severity: 'error',
      suggestedFix: 'Fix JSON syntax: {"key": "value"}',
      autoFixable: false
    },
    {
      id: 'err_c001_task_ref',
      entityType: 'client',
      entityId: 'C001',
      row: 1,
      column: 'RequestedTaskIDs',
      field: 'RequestedTaskIDs',
      message: 'Referenced task T999 does not exist',
      severity: 'error',
      suggestedFix: 'Remove T999 or create the missing task',
      autoFixable: false
    },
    {
      id: 'warn_c003_group_tag',
      entityType: 'client',
      entityId: 'C003',
      row: 3,
      column: 'GroupTag',
      field: 'GroupTag',
      message: 'Non-standard group tag "startup"',
      severity: 'warning',
      suggestedFix: 'Use standard tags: Enterprise, SMB, Individual',
      autoFixable: true
    },
    {
      id: 'err_w002_skills_empty',
      entityType: 'worker',
      entityId: 'W002',
      row: 2,
      column: 'Skills',
      field: 'Skills',
      message: 'Worker must have at least one skill',
      severity: 'warning',
      suggestedFix: 'Add relevant skills for this worker',
      autoFixable: false
    },
    {
      id: 'err_w002_slots_invalid',
      entityType: 'worker',
      entityId: 'W002',
      row: 2,
      column: 'AvailableSlots',
      field: 'AvailableSlots',
      message: 'Available slots must be between 1 and 10',
      severity: 'error',
      suggestedFix: 'Change slots to valid range: [1, 2, 3, 4, 5]',
      autoFixable: true
    },
    {
      id: 'err_w002_load_invalid',
      entityType: 'worker',
      entityId: 'W002',
      row: 2,
      column: 'MaxLoadPerPhase',
      field: 'MaxLoadPerPhase',
      message: 'Max load per phase must be between 1 and 10',
      severity: 'error',
      suggestedFix: 'Set to recommended value: 3',
      autoFixable: true
    },
    {
      id: 'err_w003_id_empty',
      entityType: 'worker',
      entityId: '',
      row: 3,
      column: 'WorkerID',
      field: 'WorkerID',
      message: 'Worker ID cannot be empty',
      severity: 'error',
      suggestedFix: 'Generate ID: W003',
      autoFixable: true
    },
    {
      id: 'err_t002_duration_invalid',
      entityType: 'task',
      entityId: 'T002',
      row: 2,
      column: 'Duration',
      field: 'Duration',
      message: 'Task duration must be between 1 and 10 phases',
      severity: 'error',
      suggestedFix: 'Set duration to 3 phases',
      autoFixable: true
    },
    {
      id: 'err_t002_phases_invalid',
      entityType: 'task',
      entityId: 'T002',
      row: 2,
      column: 'PreferredPhases',
      field: 'PreferredPhases',
      message: 'Preferred phases must be between 1 and 10',
      severity: 'error',
      suggestedFix: 'Change to valid phases: [2, 3, 4]',
      autoFixable: true
    },
    {
      id: 'err_t003_name_empty',
      entityType: 'task',
      entityId: 'T003',
      row: 3,
      column: 'TaskName',
      field: 'TaskName',
      message: 'Task name cannot be empty',
      severity: 'error',
      suggestedFix: 'Add descriptive task name',
      autoFixable: false
    },
    {
      id: 'info_t003_skills_unusual',
      entityType: 'task',
      entityId: 'T003',
      row: 3,
      column: 'RequiredSkills',
      field: 'RequiredSkills',
      message: 'Unusual skill requirements detected (COBOL, Fortran)',
      severity: 'info',
      suggestedFix: 'Verify these legacy skills are actually needed',
      autoFixable: false
    }
  ];

  // Load sample data on component mount
  useEffect(() => {
    // Set sample data
    actions.setClients(sampleClients);
    actions.setWorkers(sampleWorkers);
    actions.setTasks(sampleTasks);
    
    // Simulate validation errors
    // In real app, these would be generated by validation engine
    // For demo, we'll set them directly
    setTimeout(() => {
      // This is a hack for demo - normally validation errors are generated
      // by the validation engine in the store
      const store = useDataStore.getState();
      store.validationErrors = sampleValidationErrors;
      store.validationSummary = {
        total: sampleValidationErrors.length,
        errors: sampleValidationErrors.filter(e => e.severity === 'error').length,
        warnings: sampleValidationErrors.filter(e => e.severity === 'warning').length,
        info: sampleValidationErrors.filter(e => e.severity === 'info').length,
        score: 65, // 65% validation score
        byEntity: {
          client: sampleValidationErrors.filter(e => e.entityType === 'client').length,
          worker: sampleValidationErrors.filter(e => e.entityType === 'worker').length,
          task: sampleValidationErrors.filter(e => e.entityType === 'task').length
        },
        byField: sampleValidationErrors.reduce((acc, err) => {
          acc[err.field] = (acc[err.field] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      
      // Trigger re-render
      actions.validateAll();
    }, 100);
  }, [actions]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🔍 Validation Panel Demo
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Interactive validation panel showcasing real-time error detection, 
          severity indicators, error grouping, and clickable navigation.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Demo Features:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• <strong>Real-time validation:</strong> Errors update automatically as data changes</li>
            <li>• <strong>Severity indicators:</strong> Errors (🔴), Warnings (🟡), Info (🔵)</li>
            <li>• <strong>Entity grouping:</strong> Errors grouped by Clients, Workers, Tasks</li>
            <li>• <strong>Clickable navigation:</strong> Click any error to navigate to the entity</li>
            <li>• <strong>Auto-fix suggestions:</strong> AI-powered suggestions for common issues</li>
            <li>• <strong>Validation statistics:</strong> Summary counts and validation score</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sample Data Overview */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Sample Data Overview</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">Clients (3 records)</h3>
              <ul className="text-sm text-gray-600 ml-4">
                <li>• C001: Valid enterprise client</li>
                <li>• C002: Multiple validation errors</li>
                <li>• C003: Warning for non-standard group tag</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700">Workers (3 records)</h3>
              <ul className="text-sm text-gray-600 ml-4">
                <li>• W001: Valid frontend worker</li>
                <li>• W002: Invalid slots and load values</li>
                <li>• W003: Missing worker ID</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700">Tasks (3 records)</h3>
              <ul className="text-sm text-gray-600 ml-4">
                <li>• T001: Valid frontend development task</li>
                <li>• T002: Invalid duration and phases</li>
                <li>• T003: Empty name, unusual skills</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Validation Panel */}
        <div className="h-[600px]">
          <ValidationPanel />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Try These Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Navigation</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Click any validation error to navigate to that entity</li>
              <li>• Expand/collapse entity groups using the arrows</li>
              <li>• Use the refresh button to re-run validation</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Error Types</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 🔴 <strong>Errors:</strong> Critical issues that must be fixed</li>
              <li>• 🟡 <strong>Warnings:</strong> Issues that should be reviewed</li>
              <li>• 🔵 <strong>Info:</strong> Informational notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationPanelDemo;
