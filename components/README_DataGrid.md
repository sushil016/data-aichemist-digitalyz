# DataGrid Component - AG-Grid Integration

## Overview

The `DataGrid` component is a sophisticated data grid built with AG-Grid Community Edition that provides advanced inline editing, real-time validation highlighting, column sorting, filtering, and seamless integration with the Zustand data store.

## Features

### 🎯 **Core AG-Grid Integration**
- **Professional Data Grid**: Built on AG-Grid Community Edition
- **Alpine Theme**: Modern, clean appearance with consistent styling
- **Responsive Design**: Adapts to different screen sizes and container dimensions
- **High Performance**: Optimized for large datasets with virtual scrolling

### ✏️ **Advanced Inline Editing**
- **Double-Click Editing**: Intuitive editing activation
- **Cell Type Awareness**: Different editors for different data types
- **Array Editing**: Comma-separated value editing for array fields
- **Dropdown Selectors**: Pre-defined options for enum fields
- **Large Text Editor**: Dedicated editor for JSON and long text fields
- **Auto-Save**: Changes are automatically saved to the store

### 🚨 **Real-time Validation Highlighting**
- **Error Borders**: Red borders for validation errors
- **Warning Borders**: Yellow borders for validation warnings
- **Error Badges**: Visual indicators showing error counts
- **Tooltip Messages**: Detailed error descriptions on hover
- **Background Highlighting**: Row-level error state indication

### 🔄 **Real-time Data Updates**
- **Zustand Integration**: Seamless state management integration
- **Automatic Validation**: Triggers validation on cell changes
- **Live Error Updates**: Real-time validation error synchronization
- **Change Tracking**: Monitors and persists all data modifications

### ⚡ **Advanced Grid Features**
- **Column Operations**: Sorting, filtering, resizing, and reordering
- **Row Selection**: Single and multiple row selection
- **Pagination**: Built-in pagination with configurable page sizes
- **Range Selection**: Excel-like range selection and operations
- **Copy/Paste**: Full clipboard support
- **Keyboard Navigation**: Complete keyboard accessibility

## Usage

### Basic Implementation

```tsx
import DataGrid from '@/components/DataGrid';
import { useClients } from '@/lib/store/data-store';

function ClientGrid() {
  const clients = useClients();

  return (
    <div className="h-[500px]">
      <DataGrid
        data={clients}
        entityType="client"
        onCellValueChanged={(event) => {
          console.log('Cell changed:', event);
        }}
      />
    </div>
  );
}
```

### Advanced Usage with Selection

```tsx
import DataGrid from '@/components/DataGrid';
import { useState } from 'react';

function AdvancedGrid() {
  const [selectedRows, setSelectedRows] = useState([]);
  
  return (
    <DataGrid
      data={workers}
      entityType="worker"
      className="custom-grid-styles"
      onSelectionChanged={setSelectedRows}
      onCellValueChanged={(event) => {
        // Handle cell changes
        console.log('Field:', event.colDef.field);
        console.log('Old value:', event.oldValue);
        console.log('New value:', event.newValue);
      }}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `T[]` | Yes | Array of entity data to display |
| `entityType` | `EntityTypeName` | Yes | Type of entity ('client', 'worker', 'task') |
| `className` | `string` | No | Additional CSS classes for styling |
| `onSelectionChanged` | `(rows: T[]) => void` | No | Callback when row selection changes |
| `onCellValueChanged` | `(event: CellValueChangedEvent) => void` | No | Callback when cell value changes |

## Column Definitions

### Client Columns
- **ClientID**: Read-only identifier with bold styling
- **ClientName**: Editable text field
- **PriorityLevel**: Dropdown selector (1-5)
- **RequestedTaskIDs**: Array editor with comma separation
- **GroupTag**: Dropdown with predefined options
- **AttributesJSON**: Large text editor for JSON data

### Worker Columns
- **WorkerID**: Read-only identifier with bold styling
- **WorkerName**: Editable text field
- **Skills**: Array editor for skill lists
- **AvailableSlots**: Array editor for phase numbers
- **MaxLoadPerPhase**: Dropdown selector (1-10)
- **WorkerGroup**: Dropdown with predefined groups
- **QualificationLevel**: Dropdown selector (1-5)

### Task Columns
- **TaskID**: Read-only identifier with bold styling
- **TaskName**: Editable text field
- **Category**: Dropdown with task categories
- **Duration**: Dropdown selector (1-10 phases)
- **RequiredSkills**: Array editor for skill requirements
- **PreferredPhases**: Array editor for phase preferences
- **MaxConcurrent**: Dropdown selector (1-5)

## Validation Integration

### Error Display
The grid automatically displays validation errors from the Zustand store:

```tsx
// Validation errors are automatically highlighted
const validationErrors = useDataStore(state => 
  state.validationErrors.filter(error => error.entityType === entityType)
);
```

### Error Types
- **Critical Errors**: Red borders and background highlighting
- **Warnings**: Yellow borders and background highlighting
- **Field-specific**: Errors are shown for individual fields
- **Entity-level**: Row-level highlighting for entities with errors

### Error Tooltips
Hover over cells with errors to see detailed error messages:
- Multiple errors are concatenated
- Severity levels are indicated
- Suggested fixes are shown when available

## Cell Editors

### Array Cell Editor
Custom editor for array fields that:
- Converts arrays to comma-separated strings for editing
- Handles empty values gracefully
- Trims whitespace and filters empty values
- Supports keyboard navigation (Enter/Escape)

```tsx
// Array fields use the custom ArrayCellEditor
{
  field: 'Skills',
  cellEditor: ArrayCellEditor,
  valueFormatter: (params) => 
    Array.isArray(params.value) ? params.value.join(', ') : params.value,
}
```

### Dropdown Selectors
Predefined options for enum fields:

```tsx
{
  field: 'PriorityLevel',
  cellEditor: 'agSelectCellEditor',
  cellEditorParams: {
    values: [1, 2, 3, 4, 5]
  },
  valueFormatter: (params) => `Level ${params.value}`,
}
```

## Styling and Theming

### CSS Classes
The component uses AG-Grid's Alpine theme with custom enhancements:

```scss
// Base theme
.ag-theme-alpine {
  --ag-background-color: #ffffff;
  --ag-header-background-color: #f8f9fa;
  --ag-row-border-color: #e2e8f0;
}

// Validation styling
.validation-error {
  border-left: 3px solid #ef4444;
  background-color: #fef2f2;
}

.validation-warning {
  border-left: 3px solid #f59e0b;
  background-color: #fffbeb;
}
```

### Custom Cell Renderer
The `ValidationCellRenderer` provides:
- Error state visualization
- Tooltip integration
- Badge indicators for error counts
- Consistent styling across entity types

## Performance Optimizations

### Virtual Scrolling
- Only renders visible rows for large datasets
- Smooth scrolling with automatic row height calculation
- Memory-efficient handling of thousands of rows

### Change Detection
- Uses React.useMemo for column definitions
- Efficient validation error filtering
- Minimal re-renders on data changes

### Grid Features
```tsx
// Performance settings
<AgGridReact
  suppressAnimationFrame={false}
  animateRows={true}
  enableCellTextSelection={true}
  rowHeight={40}
  pagination={true}
  paginationPageSize={50}
/>
```

## Event Handling

### Cell Value Changes
```tsx
const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
  const { data, colDef, newValue } = event;
  const fieldName = colDef.field!;
  const entityId = data[getIdField(entityType)];

  // Update Zustand store
  const updates = { [fieldName]: newValue };
  actions.updateEntity(entityType, entityId, updates);
}, [entityType, actions]);
```

### Selection Changes
```tsx
const onSelectionChanged = useCallback(() => {
  const selectedRows = gridRef.current?.api.getSelectedRows() || [];
  onSelectionChanged?.(selectedRows);
}, [onSelectionChanged]);
```

## Grid API Integration

### Programmatic Control
```tsx
const gridRef = useRef<AgGridReact>(null);

// Auto-size columns
useEffect(() => {
  if (gridRef.current) {
    gridRef.current.api.sizeColumnsToFit();
  }
}, [data]);

// Refresh validation highlighting
useEffect(() => {
  if (gridRef.current) {
    gridRef.current.api.refreshCells({ force: true });
  }
}, [validationErrors]);
```

## Accessibility Features

### Keyboard Navigation
- Full keyboard support for all grid operations
- Tab navigation between cells and controls
- Arrow key navigation within the grid
- Enter/Escape for editing operations

### Screen Reader Support
- Proper ARIA labels and descriptions
- Column header announcements
- Cell content reading
- Error state announcements

### Focus Management
- Clear focus indicators
- Logical tab order
- Focus restoration after editing

## Integration Examples

### With File Upload
```tsx
// DataGrid updates automatically when new data is uploaded
function FileUploadWithGrid() {
  return (
    <div>
      <DragDropFileUpload entityType="client" />
      <DataGrid data={useClients()} entityType="client" />
    </div>
  );
}
```

### With Search and Filtering
```tsx
// Grid displays filtered results from Zustand store
function FilteredGrid() {
  const filteredClients = useFilteredClients();
  
  return (
    <DataGrid 
      data={filteredClients} 
      entityType="client" 
    />
  );
}
```

### With Validation Summary
```tsx
// Grid validation state integrates with summary component
function GridWithValidation() {
  return (
    <div>
      <ValidationSummary />
      <DataGrid data={clients} entityType="client" />
    </div>
  );
}
```

## Demo Pages

### Main Demo
Available at `/` - Integrated with complete data store functionality

### DataGrid Demo
Available at `/datagrid-demo` - Focused demonstration of grid features:
- Entity type switching
- Sample data generation
- Bulk operations
- Export functionality
- Feature showcase

## Dependencies

### Required Packages
```json
{
  "ag-grid-community": "^31.0.0",
  "ag-grid-react": "^31.0.0"
}
```

### Peer Dependencies
- React 18+
- TypeScript 4.9+
- Zustand state management
- Entity type definitions

## Browser Compatibility

- **Chrome**: 88+
- **Firefox**: 90+
- **Safari**: 14+
- **Edge**: 88+

## Troubleshooting

### Common Issues

1. **Grid Not Rendering**
   - Ensure container has defined height
   - Check AG-Grid CSS imports
   - Verify data prop is not undefined

2. **Validation Not Showing**
   - Check Zustand store connection
   - Verify validation errors format
   - Ensure entity IDs match

3. **Editing Not Working**
   - Check column editable property
   - Verify cell editor configuration
   - Check for JavaScript errors

### Debug Mode
Enable AG-Grid debug logging:
```javascript
localStorage.setItem('ag-grid-debug', 'true');
```

## Future Enhancements

### Planned Features
- Custom context menus
- Advanced filtering UI
- Column grouping
- Export to Excel
- Print functionality
- Custom aggregations

### Performance Improvements
- Server-side operations for large datasets
- Incremental data loading
- Advanced caching strategies
- WebWorker integration for heavy operations

## Contributing

When contributing to the DataGrid component:

1. **Maintain AG-Grid compatibility**
2. **Follow TypeScript strict mode**
3. **Add comprehensive tests**
4. **Update documentation**
5. **Consider accessibility impact**
6. **Test validation integration**
