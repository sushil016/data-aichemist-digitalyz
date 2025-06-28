# Data Store - Zustand State Management

A comprehensive Zustand store for managing client, worker, and task data with real-time validation, file upload, inline editing, and undo/redo functionality.

## Features

### 🗄️ **Data Management**
- **Entity Storage**: Centralized storage for Clients, Workers, and Tasks
- **CRUD Operations**: Add, update, delete entities with automatic validation
- **Batch Operations**: Import/export multiple entities at once
- **Real-time Updates**: Immediate validation and UI updates on data changes

### 📁 **File Upload & Processing**
- **Multi-format Support**: CSV and XLSX file parsing
- **Progress Tracking**: Real-time upload progress with visual feedback
- **Error Handling**: Comprehensive error reporting during file processing
- **Entity Type Selection**: Choose target entity type for uploaded data

### ✅ **Validation Engine**
- **Real-time Validation**: Automatic validation on data changes
- **Entity-level Validation**: Individual entity validation with detailed error reporting
- **Cross-entity Validation**: Validate references between entities
- **Validation Summary**: Score calculation and error categorization
- **Field-level Errors**: Specific field validation with visual indicators

### ✏️ **Inline Editing**
- **Click-to-Edit**: Direct table cell editing with immediate validation
- **Change Tracking**: Track editing state and unsaved changes
- **Commit/Cancel**: Keyboard shortcuts (Enter/Escape) for edit operations
- **Visual Feedback**: Error highlighting and validation status

### 🔍 **Search & Filtering**
- **Global Search**: Search across all entity fields
- **Real-time Filtering**: Instant results as you type
- **Entity-specific Filters**: Separate filtered views for each entity type
- **Custom Filters**: Extensible filtering system

### ↩️ **Undo/Redo System**
- **History Tracking**: Complete action history with 50-action limit
- **State Snapshots**: Full state restoration for undo/redo operations
- **Automatic History**: History saved on data modifications
- **Memory Management**: Limited history size to prevent memory leaks

### 🎯 **Selection & UI State**
- **Entity Selection**: Track selected entities across the application
- **UI State Management**: Search queries, filters, and view preferences
- **Persistence**: Store state persisted to localStorage

## Usage

### Basic Setup

```tsx
import { useDataStore, useDataActions, useClients } from '@/lib/store/data-store';

function MyComponent() {
  const clients = useClients();
  const actions = useDataActions();
  
  // Add a new client
  const addClient = () => {
    actions.addClient({
      ClientID: 'C001',
      ClientName: 'Example Client',
      RequestedTaskIDs: 'T001,T002',
      PriorityLevel: 3,
      AttributesJSON: '{}'
    });
  };
  
  return (
    <div>
      <button onClick={addClient}>Add Client</button>
      <div>Total clients: {clients.length}</div>
    </div>
  );
}
```

### File Upload

```tsx
import { useFileUpload, useDataActions } from '@/lib/store/data-store';

function FileUploadComponent() {
  const fileUpload = useFileUpload();
  const actions = useDataActions();
  
  const handleFileUpload = async (file: File) => {
    try {
      await actions.uploadFile(file, 'client');
      console.log('Upload successful!');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        disabled={fileUpload.isUploading}
      />
      {fileUpload.isUploading && (
        <div>Upload progress: {fileUpload.progress}%</div>
      )}
    </div>
  );
}
```

### Validation Integration

```tsx
import { 
  useValidationSummary, 
  useEntityValidationErrors,
  useDataActions 
} from '@/lib/store/data-store';

function ValidationDisplay({ entityType, entityId }) {
  const summary = useValidationSummary();
  const entityErrors = useEntityValidationErrors(entityType, entityId);
  const actions = useDataActions();
  
  return (
    <div>
      <div>Validation Score: {summary.score}/100</div>
      <div>Total Errors: {summary.errors}</div>
      
      {entityErrors.map(error => (
        <div key={error.id} className="text-red-600">
          {error.field}: {error.message}
        </div>
      ))}
      
      <button onClick={actions.validateAll}>
        Re-validate All
      </button>
    </div>
  );
}
```

### Inline Editing

```tsx
import { useEditing, useDataActions } from '@/lib/store/data-store';

function EditableCell({ entityType, entityId, field, value }) {
  const editing = useEditing();
  const actions = useDataActions();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  
  const startEdit = () => {
    setIsEditing(true);
    actions.startEditing(entityType, entityId, field, value);
  };
  
  const commitEdit = () => {
    actions.updateEditingValue(editValue);
    actions.commitEdit();
    setIsEditing(false);
  };
  
  return (
    <div>
      {isEditing ? (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') {
              actions.cancelEdit();
              setIsEditing(false);
            }
          }}
          autoFocus
        />
      ) : (
        <span onClick={startEdit} className="cursor-pointer">
          {value}
        </span>
      )}
    </div>
  );
}
```

### Search & Filtering

```tsx
import { 
  useFilteredClients,
  useDataActions 
} from '@/lib/store/data-store';

function SearchableClientList() {
  const filteredClients = useFilteredClients();
  const actions = useDataActions();
  
  return (
    <div>
      <input
        type="text"
        placeholder="Search clients..."
        onChange={(e) => actions.setSearchQuery(e.target.value)}
      />
      
      <div>
        {filteredClients.map(client => (
          <div key={client.ClientID}>
            {client.ClientName}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Undo/Redo

```tsx
import { useDataActions } from '@/lib/store/data-store';

function UndoRedoControls() {
  const actions = useDataActions();
  
  return (
    <div>
      <button onClick={actions.undo}>Undo</button>
      <button onClick={actions.redo}>Redo</button>
      <button onClick={actions.clearAllData}>Clear All</button>
    </div>
  );
}
```

## API Reference

### Core Selectors

- `useClients()` - Get all clients
- `useWorkers()` - Get all workers  
- `useTasks()` - Get all tasks
- `useValidationErrors()` - Get all validation errors
- `useValidationSummary()` - Get validation summary with scores
- `useFileUpload()` - Get file upload state
- `useEditing()` - Get current editing state
- `useDataActions()` - Get all available actions

### Filtered Selectors

- `useFilteredClients()` - Get clients filtered by search query
- `useFilteredWorkers()` - Get workers filtered by search query
- `useFilteredTasks()` - Get tasks filtered by search query
- `useEntityValidationErrors(entityType, entityId)` - Get errors for specific entity

### Actions

#### Data Management
- `setClients(clients)` - Replace all clients
- `addClient(client)` - Add single client
- `updateClient(id, updates)` - Update specific client
- `deleteClient(id)` - Delete client by ID

#### File Operations
- `uploadFile(file, entityType)` - Upload and parse file
- `clearFileUpload()` - Clear upload state

#### Validation
- `validateAll()` - Validate all entities
- `validateEntity(entityType, entityId)` - Validate specific entity
- `clearValidationErrors()` - Clear all validation errors

#### Editing
- `startEditing(entityType, entityId, field, value)` - Start editing session
- `updateEditingValue(value)` - Update current edit value
- `commitEdit()` - Save changes and end editing
- `cancelEdit()` - Cancel changes and end editing

#### UI & Navigation
- `selectEntity(entityType, entityId)` - Select entity for details view
- `setSearchQuery(query)` - Set global search query
- `setFilters(filters)` - Set custom filters

#### History
- `undo()` - Undo last action
- `redo()` - Redo last undone action
- `saveToHistory()` - Manually save state to history

#### Bulk Operations
- `clearAllData()` - Remove all data
- `exportData(format)` - Export data to JSON/CSV
- `importData(data)` - Import data from object

## Architecture

The store uses:

- **Zustand** for state management
- **Immer** for immutable updates
- **DevTools** for development debugging
- **LocalStorage** for state persistence

### State Structure

```typescript
interface DataState {
  // Entity data
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  
  // Validation state
  validationErrors: ValidationError[];
  validationSummary: ValidationSummary;
  isValidating: boolean;
  
  // File upload state
  fileUpload: FileUploadState;
  
  // Editing state
  editing: EditingState;
  
  // UI state
  selectedEntityType: EntityTypeName | null;
  selectedEntityId: string | null;
  searchQuery: string;
  filters: Record<string, any>;
  
  // History for undo/redo
  history: {
    past: any[];
    present: any;
    future: any[];
  };
}
```

## Performance Considerations

- **Selective Updates**: Only components using specific selectors re-render
- **Debounced Validation**: Validation runs asynchronously to avoid blocking UI
- **History Limits**: Undo history limited to 50 actions to prevent memory leaks
- **Efficient Filtering**: Filtered selectors use optimized algorithms
- **Memoized Computations**: Validation summaries and filtered results are cached

## Best Practices

1. **Use Specific Selectors**: Import only the data you need
2. **Batch Updates**: Group related changes together
3. **Handle Errors**: Always handle async operations with try/catch
4. **Validate Early**: Run validation after data changes
5. **Save History**: Call `saveToHistory()` before major operations
6. **Clean Up**: Clear file upload state and editing sessions when done

## Error Handling

The store includes comprehensive error handling:

- File upload errors are stored in `fileUpload.error`
- Validation errors are collected in `validationErrors`
- Async operations should be wrapped in try/catch blocks
- All errors include descriptive messages and suggested fixes
