/**
 * @fileoverview DataGrid Component with AG-Grid
 * @description Advanced data grid with inline editing, validation, and real-time updates
 */

'use client';

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridApi,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  CellValueChangedEvent,
  GridReadyEvent,
  ICellRendererParams,
  ICellEditorParams,
  CellClassParams,
  ModuleRegistry,
  AllCommunityModule
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import { 
  useDataActions, 
  useEntityValidationErrors,
  useDataStore
} from '@/lib/store/data-store';
import { Client, Worker, Task, EntityTypeName, ValidationError } from '@/types/entities';
import { cn } from '@/lib/utils';

interface DataGridProps<T> {
  data: T[];
  entityType: EntityTypeName;
  className?: string;
  onSelectionChanged?: (selectedRows: T[]) => void;
  onCellValueChanged?: (params: CellValueChangedEvent) => void;
}

// Custom cell renderer for validation errors
const ValidationCellRenderer = (params: ICellRendererParams & { 
  entityType: EntityTypeName; 
  validationErrors: ValidationError[] 
}) => {
  const { value, colDef, data, entityType, validationErrors } = params;
  const fieldName = colDef?.field;
  
  if (!fieldName) return <span>{value?.toString() || '—'}</span>;
  
  // Get entity ID
  const idField = entityType === 'client' ? 'ClientID' : 
                 entityType === 'worker' ? 'WorkerID' : 'TaskID';
  const entityId = data[idField];
  
  // Find validation errors for this field
  const fieldErrors = validationErrors.filter(
    error => error.entityId === entityId && error.field === fieldName
  );
  
  const hasErrors = fieldErrors.length > 0;
  const hasWarnings = fieldErrors.some(error => error.severity === 'warning');
  const hasCriticalErrors = fieldErrors.some(error => error.severity === 'error');
  
  return (
    <div 
      className={cn(
        "w-full h-full flex items-center px-2",
        hasCriticalErrors && "bg-red-50 border-l-2 border-red-500",
        hasWarnings && !hasCriticalErrors && "bg-yellow-50 border-l-2 border-yellow-500"
      )}
      title={hasErrors ? fieldErrors.map(e => e.message).join(', ') : undefined}
    >
      <span className="flex-1 truncate">
        {Array.isArray(value) ? value.join(', ') : (value?.toString() || '—')}
      </span>
      {hasErrors && (
        <span className={cn(
          "ml-2 text-xs font-bold",
          hasCriticalErrors ? "text-red-600" : "text-yellow-600"
        )}>
          ⚠{fieldErrors.length}
        </span>
      )}
    </div>
  );
};

// Custom cell editor for arrays
const ArrayCellEditor = React.forwardRef<any, ICellEditorParams>((props, ref) => {
  const [value, setValue] = React.useState(
    Array.isArray(props.value) ? props.value.join(', ') : props.value || ''
  );

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle(ref, () => ({
    getValue: () => {
      // Convert comma-separated string back to array
      return value.split(',').map((s: string) => s.trim()).filter(Boolean);
    },
    afterGuiAttached: () => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }));

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full h-full px-2 border-none outline-none bg-white"
      placeholder="Enter comma-separated values"
    />
  );
});

ArrayCellEditor.displayName = 'ArrayCellEditor';

// Generate column definitions for each entity type
function getColumnDefinitions(
  entityType: EntityTypeName,
  validationErrors: ValidationError[]
): ColDef[] {
  const baseColDef: Partial<ColDef> = {
    editable: true,
    sortable: true,
    filter: true,
    resizable: true,
    cellRenderer: (params: ICellRendererParams) => 
      ValidationCellRenderer({ ...params, entityType, validationErrors }),
  };

  switch (entityType) {
    case 'client':
      return [
        {
          ...baseColDef,
          field: 'ClientID',
          headerName: 'Client ID',
          pinned: 'left',
          width: 120,
          editable: false, // IDs shouldn't be editable
          cellStyle: { fontWeight: 'bold' }
        },
        {
          ...baseColDef,
          field: 'ClientName',
          headerName: 'Client Name',
          width: 200,
        },
        {
          ...baseColDef,
          field: 'PriorityLevel',
          headerName: 'Priority Level',
          width: 140,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: [1, 2, 3, 4, 5]
          },
          valueFormatter: (params) => `Level ${params.value}`,
        },
        {
          ...baseColDef,
          field: 'RequestedTaskIDs',
          headerName: 'Requested Tasks',
          width: 200,
          cellEditor: ArrayCellEditor,
          valueFormatter: (params) => 
            Array.isArray(params.value) ? params.value.join(', ') : params.value,
        },
        {
          ...baseColDef,
          field: 'GroupTag',
          headerName: 'Group',
          width: 120,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: ['Enterprise', 'SMB', 'Startup', 'Government']
          }
        },
        {
          ...baseColDef,
          field: 'AttributesJSON',
          headerName: 'Attributes',
          width: 200,
          cellEditor: 'agLargeTextCellEditor',
          valueFormatter: (params) => {
            try {
              const parsed = JSON.parse(params.value || '{}');
              return Object.keys(parsed).length > 0 ? 'JSON Data' : 'Empty';
            } catch {
              return 'Invalid JSON';
            }
          }
        }
      ];

    case 'worker':
      return [
        {
          ...baseColDef,
          field: 'WorkerID',
          headerName: 'Worker ID',
          pinned: 'left',
          width: 120,
          editable: false,
          cellStyle: { fontWeight: 'bold' }
        },
        {
          ...baseColDef,
          field: 'WorkerName',
          headerName: 'Worker Name',
          width: 180,
        },
        {
          ...baseColDef,
          field: 'Skills',
          headerName: 'Skills',
          width: 200,
          cellEditor: ArrayCellEditor,
          valueFormatter: (params) => 
            Array.isArray(params.value) ? params.value.join(', ') : params.value,
        },
        {
          ...baseColDef,
          field: 'AvailableSlots',
          headerName: 'Available Slots',
          width: 150,
          cellEditor: ArrayCellEditor,
          valueFormatter: (params) => 
            Array.isArray(params.value) ? params.value.join(', ') : params.value,
        },
        {
          ...baseColDef,
          field: 'MaxLoadPerPhase',
          headerName: 'Max Load/Phase',
          width: 140,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
          }
        },
        {
          ...baseColDef,
          field: 'WorkerGroup',
          headerName: 'Group',
          width: 120,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: ['Frontend', 'Backend', 'FullStack', 'DevOps', 'QA', 'Design']
          }
        },
        {
          ...baseColDef,
          field: 'QualificationLevel',
          headerName: 'Qualification',
          width: 130,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: [1, 2, 3, 4, 5]
          },
          valueFormatter: (params) => `Level ${params.value}`,
        }
      ];

    case 'task':
      return [
        {
          ...baseColDef,
          field: 'TaskID',
          headerName: 'Task ID',
          pinned: 'left',
          width: 120,
          editable: false,
          cellStyle: { fontWeight: 'bold' }
        },
        {
          ...baseColDef,
          field: 'TaskName',
          headerName: 'Task Name',
          width: 200,
        },
        {
          ...baseColDef,
          field: 'Category',
          headerName: 'Category',
          width: 140,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: ['Development', 'Testing', 'Design', 'DevOps', 'Documentation', 'Research']
          }
        },
        {
          ...baseColDef,
          field: 'Duration',
          headerName: 'Duration',
          width: 120,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
          },
          valueFormatter: (params) => `${params.value} phases`,
        },
        {
          ...baseColDef,
          field: 'RequiredSkills',
          headerName: 'Required Skills',
          width: 200,
          cellEditor: ArrayCellEditor,
          valueFormatter: (params) => 
            Array.isArray(params.value) ? params.value.join(', ') : params.value,
        },
        {
          ...baseColDef,
          field: 'PreferredPhases',
          headerName: 'Preferred Phases',
          width: 160,
          cellEditor: ArrayCellEditor,
          valueFormatter: (params) => 
            Array.isArray(params.value) ? params.value.join(', ') : params.value,
        },
        {
          ...baseColDef,
          field: 'MaxConcurrent',
          headerName: 'Max Concurrent',
          width: 140,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: [1, 2, 3, 4, 5]
          }
        }
      ];

    default:
      return [];
  }
}

export default function DataGrid<T extends Client | Worker | Task>({
  data,
  entityType,
  className,
  onSelectionChanged,
  onCellValueChanged
}: DataGridProps<T>) {
  const gridRef = useRef<AgGridReact>(null);
  const actions = useDataActions();
  
  // Get validation errors for this entity type using a stable selector
  const validationErrors = useDataStore((state) => state.validationErrors);
  const allValidationErrors = useMemo(() => 
    validationErrors.filter((error: ValidationError) => error.entityType === entityType),
    [validationErrors, entityType]
  );

  // Column definitions
  const columnDefs = useMemo(
    () => getColumnDefinitions(entityType, allValidationErrors),
    [entityType, allValidationErrors]
  );

  // Default column definition
  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 100,
    editable: true,
    sortable: true,
    filter: true,
    resizable: true,
    cellStyle: (params: CellClassParams) => {
      const fieldName = params.colDef?.field;
      if (!fieldName) return null;
      
      const idField = entityType === 'client' ? 'ClientID' : 
                     entityType === 'worker' ? 'WorkerID' : 'TaskID';
      const entityId = params.data?.[idField];
      
      if (!entityId) return null;
      
      const fieldErrors = allValidationErrors.filter(
        (error: ValidationError) => error.entityId === entityId && error.field === fieldName
      );
      
      if (fieldErrors.some((error: ValidationError) => error.severity === 'error')) {
        return { borderLeft: '3px solid #ef4444' };
      }
      if (fieldErrors.some((error: ValidationError) => error.severity === 'warning')) {
        return { borderLeft: '3px solid #f59e0b' };
      }
      return null;
    }
  }), [entityType, allValidationErrors]);

  // Handle cell value changes
  const onCellValueChangedCallback = useCallback((event: CellValueChangedEvent) => {
    const { data: rowData, colDef, newValue } = event;
    const fieldName = colDef.field!;
    const idField = entityType === 'client' ? 'ClientID' : 
                   entityType === 'worker' ? 'WorkerID' : 'TaskID';
    const entityId = rowData[idField];

    // Update the store
    const updates = { [fieldName]: newValue };
    
    if (entityType === 'client') {
      actions.updateClient(entityId, updates);
    } else if (entityType === 'worker') {
      actions.updateWorker(entityId, updates);
    } else if (entityType === 'task') {
      actions.updateTask(entityId, updates);
    }

    // Call external callback if provided
    onCellValueChanged?.(event);
  }, [entityType, actions, onCellValueChanged]);

  // Handle selection changes
  const onSelectionChangedCallback = useCallback(() => {
    if (!gridRef.current) return;
    
    const selectedRows = gridRef.current.api.getSelectedRows();
    onSelectionChanged?.(selectedRows);
  }, [onSelectionChanged]);

  // Handle grid ready
  const onGridReady = useCallback((params: GridReadyEvent) => {
    // Auto-size columns to fit content
    params.api.sizeColumnsToFit();
  }, []);

  // Auto-resize columns when data changes
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.sizeColumnsToFit();
    }
  }, [data]);

  // Refresh cells when validation errors change
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.refreshCells({ force: true });
    }
  }, [allValidationErrors]);

  return (
    <div className={cn("ag-theme-alpine h-full w-full", className)}>
      <AgGridReact
        ref={gridRef}
        theme="legacy"
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChangedCallback}
        onSelectionChanged={onSelectionChangedCallback}
        
        // Enable features
        rowSelection="multiple"
        enableCellTextSelection={true}
        ensureDomOrder={true}
        animateRows={true}
        
        // Pagination
        pagination={true}
        paginationPageSize={50}
        paginationPageSizeSelector={[25, 50, 100, 200]}
        
        // Styling
        rowHeight={40}
        headerHeight={45}
        
        // Grid options
        stopEditingWhenCellsLoseFocus={true}
        singleClickEdit={false}
        
        // Loading
        loadingOverlayComponent="agLoadingOverlay"
        noRowsOverlayComponent={() => (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <div className="text-lg font-medium mb-2">No data available</div>
            <div className="text-sm">Upload a file to get started</div>
          </div>
        )}
        
        // Performance
        suppressAnimationFrame={false}
      />
    </div>
  );
}
