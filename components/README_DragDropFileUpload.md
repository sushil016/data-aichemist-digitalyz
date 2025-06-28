# Drag & Drop File Upload Component

## Overview

The `DragDropFileUpload` component is an advanced file upload interface built with React Dropzone that provides a seamless drag-and-drop experience for uploading CSV and Excel files. It integrates seamlessly with the Zustand data store and includes comprehensive validation, visual feedback, and error handling.

## Features

### 🎯 Smart File Validation
- **File Type Validation**: Only accepts CSV (.csv) and Excel (.xlsx, .xls) files
- **File Size Limits**: Configurable maximum file size (default: 50MB)
- **Empty File Detection**: Prevents upload of empty files
- **Real-time Error Feedback**: Immediate validation feedback during drag operations

### 🎨 Visual Feedback
- **Drag State Indicators**: Visual cues for different drag states (active, accept, reject)
- **Upload Progress Bar**: Real-time upload progress with percentage
- **Success/Error States**: Clear visual feedback for upload results
- **Interactive Hover Effects**: Responsive UI elements with smooth transitions

### 🔄 Data Integration
- **Automatic Data Store Updates**: Seamlessly integrates with Zustand store
- **Real-time Validation**: Triggers validation engine after upload
- **Entity Type Selection**: Support for clients, workers, and tasks
- **Duplicate Handling**: Smart handling of duplicate entries

### ⚡ Advanced Features
- **Upload Queue Management**: Visual queue with progress tracking
- **File Preview Capabilities**: File information display before upload
- **Batch Processing**: Support for multiple file uploads
- **Error Recovery**: Comprehensive error handling and recovery

## Usage

### Basic Usage

```tsx
import DragDropFileUpload from '@/components/DragDropFileUpload';

function MyComponent() {
  const [entityType, setEntityType] = useState<EntityTypeName>('client');

  return (
    <DragDropFileUpload
      entityType={entityType}
      onEntityTypeChange={setEntityType}
      maxSize={50 * 1024 * 1024} // 50MB
      multiple={false}
    />
  );
}
```

### Advanced Usage

```tsx
import DragDropFileUpload from '@/components/DragDropFileUpload';

function AdvancedUpload() {
  return (
    <DragDropFileUpload
      entityType="worker"
      onEntityTypeChange={(type) => console.log('Entity type changed:', type)}
      className="my-custom-class"
      maxSize={100 * 1024 * 1024} // 100MB
      multiple={true}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entityType` | `EntityTypeName` | `'client'` | The type of entity data to upload |
| `onEntityTypeChange` | `(entityType: EntityTypeName) => void` | `undefined` | Callback when entity type changes |
| `className` | `string` | `undefined` | Additional CSS classes |
| `maxSize` | `number` | `50 * 1024 * 1024` | Maximum file size in bytes |
| `multiple` | `boolean` | `false` | Allow multiple file uploads |

## File Format Requirements

### Client Files
Required columns:
- `ClientID`: Unique identifier (e.g., C001, C002)
- `ClientName`: Display name
- `PriorityLevel`: Priority level (1-5)
- `RequestedTaskIDs`: Comma-separated task IDs or JSON array
- `GroupTag`: Group classification
- `AttributesJSON`: JSON metadata

### Worker Files
Required columns:
- `WorkerID`: Unique identifier (e.g., W001, W002)
- `WorkerName`: Display name
- `Skills`: Comma-separated skills or JSON array
- `AvailableSlots`: Available phase numbers
- `MaxLoadPerPhase`: Maximum tasks per phase (1-10)
- `WorkerGroup`: Group classification
- `QualificationLevel`: Experience level (1-5)

### Task Files
Required columns:
- `TaskID`: Unique identifier (e.g., T001, T002)
- `TaskName`: Display name
- `Category`: Task category
- `Duration`: Number of phases required (1-10)
- `RequiredSkills`: Required skills array
- `PreferredPhases`: Preferred execution phases
- `MaxConcurrent`: Maximum parallel assignments (1-5)

## Example CSV Files

### Clients Example
```csv
ClientID,ClientName,RequestedTaskIDs,PriorityLevel,GroupTag,AttributesJSON
C001,TechCorp Solutions,"[""T001"",""T002""]",5,Enterprise,"{""budget"": 100000}"
C002,StartupX,"[""T003""]",3,SMB,"{""budget"": 25000}"
```

### Workers Example
```csv
WorkerID,WorkerName,Skills,AvailableSlots,MaxLoadPerPhase,WorkerGroup,QualificationLevel
W001,Alice Johnson,"[""React"",""TypeScript""]","[1,2,3]",3,Frontend,4
W002,Bob Smith,"[""Python"",""Django""]","[2,3,4]",2,Backend,5
```

### Tasks Example
```csv
TaskID,TaskName,Category,Duration,RequiredSkills,PreferredPhases,MaxConcurrent
T001,Frontend Development,Development,3,"[""React"",""TypeScript""]","[1,2]",2
T002,API Integration,Development,2,"[""Node.js"",""REST""]","[2,3]",1
```

## State Management Integration

The component integrates with the Zustand data store through these actions:

- `uploadFile(file, entityType)`: Upload and process file
- `clearFileUpload()`: Clear upload state
- `validateAll()`: Trigger validation after upload

## Error Handling

The component handles various error scenarios:

1. **Invalid File Types**: Shows clear error message for unsupported formats
2. **File Size Exceeded**: Displays size limit with clear guidance
3. **Empty Files**: Prevents upload of empty files
4. **Upload Failures**: Provides detailed error information
5. **Network Issues**: Graceful handling of connection problems

## Visual States

### Drag States
- **Default**: Gray dashed border with upload icon
- **Drag Active**: Blue border and background with animated icon
- **Drag Accept**: Green border indicating valid file
- **Drag Reject**: Red border indicating invalid file
- **Uploading**: Progress bar with percentage and spinner

### Feedback Messages
- **Success**: Green background with checkmark icon
- **Error**: Red background with warning icon
- **Info**: Blue background with information icon

## Accessibility

The component includes accessibility features:

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG compliant color combinations

## Testing

You can test the component using the provided demo pages:

1. **Main Demo**: Available at `/` - Integrated with full data store
2. **Upload Demo**: Available at `/upload-demo` - Focused on upload features

## Dependencies

- `react-dropzone`: Drag and drop functionality
- `zustand`: State management
- `@/lib/store/data-store`: Data store integration
- `@/types/entities`: Type definitions
- `@/lib/utils`: Utility functions

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Performance Considerations

- **File Size Limits**: Default 50MB limit prevents browser crashes
- **Progress Tracking**: Real-time feedback for large files
- **Memory Management**: Proper cleanup of file previews
- **Batch Processing**: Sequential upload for multiple files

## Customization

### Styling
The component uses Tailwind CSS classes and can be customized by:

1. **CSS Classes**: Add custom classes via the `className` prop
2. **Theme Variables**: Modify color scheme through CSS variables
3. **Component Override**: Extend the component for custom layouts

### Validation
Custom validation can be added by:

1. **File Validators**: Extend the `validateFile` function
2. **Content Validation**: Add custom data validation
3. **Business Rules**: Implement domain-specific validation

## Troubleshooting

### Common Issues

1. **Files Not Uploading**
   - Check file format (CSV, XLSX, XLS only)
   - Verify file size is under limit
   - Ensure stable network connection

2. **Validation Errors**
   - Check required columns are present
   - Verify data format matches requirements
   - Review field validation rules

3. **Performance Issues**
   - Reduce file size if upload is slow
   - Check browser memory usage
   - Consider batch size for multiple files

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'dragdrop:*');
```

## Contributing

When contributing to this component:

1. **Follow TypeScript**: Maintain strict type safety
2. **Add Tests**: Include unit tests for new features
3. **Update Documentation**: Keep this README current
4. **Performance**: Consider impact on upload performance
5. **Accessibility**: Maintain WCAG compliance
