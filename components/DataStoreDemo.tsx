/**
 * @fileoverview Data Store Demo Component
 * @description Demonstrates the Zustand store functionality with real-time validation
 */

'use client';

import React, { useRef, useState } from 'react';
import { 
  useDataStore,
  useClients,
  useWorkers,
  useTasks,
  useValidationSummary,
  useValidationErrors,
  useFileUpload,
  useEditing,
  useDataActions,
  useFilteredClients,
  useFilteredWorkers,
  useFilteredTasks,
  useEntityValidationErrors
} from '@/lib/store/data-store';
import { Client, Worker, Task, EntityTypeName } from '@/types/entities';
import { cn } from '@/lib/utils';
import DragDropFileUpload from './DragDropFileUpload';
import DataGrid from './DataGrid';

interface EntityTableProps<T> {
  title: string;
  entityType: EntityTypeName;
  data: T[];
  onEdit: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
}

function EntityTable<T extends { [key: string]: any }>({ 
  title, 
  entityType, 
  data, 
  onEdit, 
  onDelete 
}: EntityTableProps<T>) {
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const startEdit = (rowIndex: number, field: string, value: any) => {
    setEditingCell({ row: rowIndex, field });
    setEditValue(value);
  };

  const commitEdit = (item: T) => {
    if (editingCell && editingCell.field) {
      const idField = entityType === 'client' ? 'ClientID' : 
                     entityType === 'worker' ? 'WorkerID' : 'TaskID';
      onEdit(item[idField], editingCell.field, editValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500">No data available. Upload a file to get started.</p>
      </div>
    );
  }

  const fields = Object.keys(data[0]).filter(key => key !== 'id');

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-600">{data.length} items</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {fields.map(field => (
                <th key={field} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => {
              const idField = entityType === 'client' ? 'ClientID' : 
                             entityType === 'worker' ? 'WorkerID' : 'TaskID';
              const entityId = item[idField];
              const errors = useEntityValidationErrors(entityType, entityId);

              return (
                <tr key={entityId} className={cn(
                  "hover:bg-gray-50",
                  errors.length > 0 && "bg-red-50"
                )}>
                  {fields.map(field => {
                    const isEditing = editingCell?.row === rowIndex && editingCell?.field === field;
                    const fieldErrors = errors.filter(e => e.field === field);
                    
                    return (
                      <td 
                        key={field} 
                        className={cn(
                          "px-6 py-4 whitespace-nowrap text-sm",
                          fieldErrors.length > 0 && "border-l-2 border-red-400"
                        )}
                      >
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                              onBlur={() => commitEdit(item)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit(item);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            onClick={() => startEdit(rowIndex, field, item[field])}
                            title={fieldErrors.length > 0 ? fieldErrors.map(e => e.message).join(', ') : 'Click to edit'}
                          >
                            {String(item[field] || '—')}
                            {fieldErrors.length > 0 && (
                              <span className="ml-2 text-red-500 text-xs">
                                ⚠ {fieldErrors.length}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onDelete(entityId)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FileUploadSection() {
  const [selectedEntityType, setSelectedEntityType] = useState<EntityTypeName>('client');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">File Upload</h3>
      <DragDropFileUpload
        entityType={selectedEntityType}
        onEntityTypeChange={setSelectedEntityType}
        maxSize={50 * 1024 * 1024} // 50MB
        multiple={false}
      />
    </div>
  );
}

function ValidationSummarySection() {
  const validationSummary = useValidationSummary();
  const actions = useDataActions();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Validation Summary</h3>
        <button
          onClick={actions.validateAll}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Re-validate
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{validationSummary.score}</div>
          <div className="text-sm text-gray-600">Validation Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{validationSummary.total}</div>
          <div className="text-sm text-gray-600">Total Issues</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-red-600">{validationSummary.errors}</div>
          <div className="text-xs text-gray-600">Errors</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-yellow-600">{validationSummary.warnings}</div>
          <div className="text-xs text-gray-600">Warnings</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-blue-600">{validationSummary.info}</div>
          <div className="text-xs text-gray-600">Info</div>
        </div>
      </div>

      {Object.keys(validationSummary.byEntity).length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Issues by Entity</h4>
          <div className="space-y-1">
            {Object.entries(validationSummary.byEntity).map(([entity, count]) => (
              <div key={entity} className="flex justify-between text-sm">
                <span className="capitalize">{entity}s</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchSection() {
  const actions = useDataActions();
  const searchQuery = useDataStore(state => state.searchQuery);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Search & Filter</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => actions.setSearchQuery(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={actions.clearAllData}
            className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Clear All Data
          </button>
          <button
            onClick={actions.undo}
            className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Undo
          </button>
          <button
            onClick={actions.redo}
            className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Redo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DataStoreDemo() {
  const clients = useFilteredClients();
  const workers = useFilteredWorkers();
  const tasks = useFilteredTasks();
  const actions = useDataActions();

  const handleEdit = (entityType: EntityTypeName) => (id: string, field: string, value: any) => {
    const updates = { [field]: value };
    
    if (entityType === 'client') {
      actions.updateClient(id, updates);
    } else if (entityType === 'worker') {
      actions.updateWorker(id, updates);
    } else if (entityType === 'task') {
      actions.updateTask(id, updates);
    }
  };

  const handleDelete = (entityType: EntityTypeName) => (id: string) => {
    if (entityType === 'client') {
      actions.deleteClient(id);
    } else if (entityType === 'worker') {
      actions.deleteWorker(id);
    } else if (entityType === 'task') {
      actions.deleteTask(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Data Store Demo - Real-time Validation & Editing
        </h1>

        {/* Top Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <FileUploadSection />
          <ValidationSummarySection />
          <SearchSection />
        </div>

        {/* Data Grids */}
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">Clients</h3>
              <p className="text-sm text-gray-600">{clients.length} items</p>
            </div>
            <div className="h-[400px]">
              <DataGrid
                data={clients}
                entityType="client"
                onCellValueChanged={(event) => {
                  console.log('Client cell changed:', event);
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">Workers</h3>
              <p className="text-sm text-gray-600">{workers.length} items</p>
            </div>
            <div className="h-[400px]">
              <DataGrid
                data={workers}
                entityType="worker"
                onCellValueChanged={(event) => {
                  console.log('Worker cell changed:', event);
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">Tasks</h3>
              <p className="text-sm text-gray-600">{tasks.length} items</p>
            </div>
            <div className="h-[400px]">
              <DataGrid
                data={tasks}
                entityType="task"
                onCellValueChanged={(event) => {
                  console.log('Task cell changed:', event);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
