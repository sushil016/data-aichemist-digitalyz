/**
 * @fileoverview DataGrid Demo Component
 * @description Showcase AG-Grid integration with validation and editing features
 */

'use client';

import React, { useState } from 'react';
import DataGrid from './DataGrid';
import { 
  useClients,
  useWorkers,
  useTasks,
  useValidationSummary,
  useDataActions
} from '@/lib/store/data-store';
import { EntityTypeName } from '@/types/entities';
import { cn } from '@/lib/utils';

export default function DataGridDemo() {
  const [activeTab, setActiveTab] = useState<EntityTypeName>('client');
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  
  const clients = useClients();
  const workers = useWorkers();
  const tasks = useTasks();
  const validationSummary = useValidationSummary();
  const actions = useDataActions();

  const tabs: { key: EntityTypeName; label: string; count: number }[] = [
    { key: 'client', label: 'Clients', count: clients.length },
    { key: 'worker', label: 'Workers', count: workers.length },
    { key: 'task', label: 'Tasks', count: tasks.length },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'client': return clients;
      case 'worker': return workers;
      case 'task': return tasks;
      default: return [];
    }
  };

  const handleAddSampleData = () => {
    // Add sample data for demonstration
    if (activeTab === 'client') {
      const sampleClients = [
        {
          ClientID: `C${String(clients.length + 1).padStart(3, '0')}`,
          ClientName: 'Sample Client',
          RequestedTaskIDs: ['T001', 'T002'],
          PriorityLevel: 3,
          GroupTag: 'Enterprise',
          AttributesJSON: '{"budget": 50000}'
        }
      ];
      sampleClients.forEach(client => actions.addClient(client));
    } else if (activeTab === 'worker') {
      const sampleWorkers = [
        {
          WorkerID: `W${String(workers.length + 1).padStart(3, '0')}`,
          WorkerName: 'Sample Worker',
          Skills: ['React', 'TypeScript'],
          AvailableSlots: [1, 2, 3],
          MaxLoadPerPhase: 3,
          WorkerGroup: 'Frontend',
          QualificationLevel: 4
        }
      ];
      sampleWorkers.forEach(worker => actions.addWorker(worker));
    } else if (activeTab === 'task') {
      const sampleTasks = [
        {
          TaskID: `T${String(tasks.length + 1).padStart(3, '0')}`,
          TaskName: 'Sample Task',
          Category: 'Development',
          Duration: 3,
          RequiredSkills: ['React', 'TypeScript'],
          PreferredPhases: [1, 2],
          MaxConcurrent: 2
        }
      ];
      sampleTasks.forEach(task => actions.addTask(task));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) return;
    
    const confirmed = window.confirm(`Delete ${selectedRows.length} selected rows?`);
    if (!confirmed) return;

    selectedRows.forEach(row => {
      if (activeTab === 'client') {
        actions.deleteClient(row.ClientID);
      } else if (activeTab === 'worker') {
        actions.deleteWorker(row.WorkerID);
      } else if (activeTab === 'task') {
        actions.deleteTask(row.TaskID);
      }
    });
    
    setSelectedRows([]);
  };

  const handleExportData = () => {
    const data = getCurrentData();
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}s.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        }
        return `"${value || ''}"`;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            DataGrid Demo - AG-Grid Integration
          </h1>
          <p className="text-lg text-gray-600">
            Advanced data grid with inline editing, validation highlighting, and real-time updates
          </p>
        </div>

        {/* Validation Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Data Quality Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{validationSummary.score}</div>
              <div className="text-sm text-gray-600">Quality Score</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{validationSummary.errors}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{validationSummary.warnings}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{validationSummary.total}</div>
              <div className="text-sm text-gray-600">Total Issues</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleAddSampleData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Sample {activeTab === 'client' ? 'Client' : activeTab === 'worker' ? 'Worker' : 'Task'}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedRows.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Selected ({selectedRows.length})
              </button>
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export CSV
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={actions.validateAll}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Re-validate All
              </button>
              <button
                onClick={actions.clearAllData}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>

        {/* Entity Tabs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm",
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* DataGrid */}
          <div className="h-[600px] p-6">
            <DataGrid
              data={getCurrentData()}
              entityType={activeTab}
              onSelectionChanged={setSelectedRows}
              onCellValueChanged={(event) => {
                console.log('Cell value changed:', event);
              }}
            />
          </div>
        </div>

        {/* Grid Features Info */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Grid Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🎯 Inline Editing</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Double-click cells to edit</li>
                <li>• Dropdown selectors for enums</li>
                <li>• Array editing with comma separation</li>
                <li>• JSON editing for attributes</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🚨 Validation Highlighting</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Red borders for errors</li>
                <li>• Yellow borders for warnings</li>
                <li>• Error counts in cells</li>
                <li>• Tooltip error messages</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">⚡ Real-time Updates</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatic validation on change</li>
                <li>• Zustand store integration</li>
                <li>• Instant UI updates</li>
                <li>• Error state synchronization</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🔍 Grid Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Column sorting and filtering</li>
                <li>• Row selection and pagination</li>
                <li>• Resizable columns</li>
                <li>• Copy/paste support</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🎨 Visual Design</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Alpine theme integration</li>
                <li>• Responsive layout</li>
                <li>• Error state styling</li>
                <li>• Professional appearance</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🔧 Advanced Options</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Range selection</li>
                <li>• Fill handle</li>
                <li>• Context menus</li>
                <li>• Keyboard navigation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
