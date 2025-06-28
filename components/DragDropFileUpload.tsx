/**
 * @fileoverview Drag & Drop File Upload Component
 * @description Advanced file upload with drag-and-drop, visual feedback, and data store integration
 */

'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDataActions, useFileUpload, useHeaderMapping } from '@/lib/store/data-store';
import { EntityTypeName } from '@/types/entities';
import { cn } from '@/lib/utils';
import HeaderMappingSuggestions from "@/components/HeaderMappingSuggestions";

interface DragDropFileUploadProps {
  entityType?: EntityTypeName;
  onEntityTypeChange?: (entityType: EntityTypeName) => void;
  className?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
  entityType?: EntityTypeName;
}

export default function DragDropFileUpload({
  entityType = 'client',
  onEntityTypeChange,
  className,
  maxSize = 50 * 1024 * 1024, // 50MB default
  multiple = false
}: DragDropFileUploadProps) {
  const actions = useDataActions();
  const fileUpload = useFileUpload();
  const headerMapping = useHeaderMapping();
  const [selectedEntityType, setSelectedEntityType] = useState<EntityTypeName>(entityType);
  const [dragError, setDragError] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<FileWithPreview[]>([]);

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv',
      '.xlsx',
      '.xls'
    ];
    
    const isValidType = validTypes.some(type => 
      file.type === type || file.name.toLowerCase().endsWith(type)
    );
    
    if (!isValidType) {
      return 'Only CSV and Excel files (.csv, .xlsx, .xls) are supported';
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check if file is empty
    if (file.size === 0) {
      return 'File appears to be empty';
    }

    return null;
  }, [maxSize]);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragError(null);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      );
      setDragError(errors.join('; '));
      return;
    }

    // Validate accepted files
    const validationErrors: string[] = [];
    const validFiles: FileWithPreview[] = [];

    acceptedFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(`${file.name}: ${error}`);
      } else {
        const fileWithPreview: FileWithPreview = Object.assign(file, {
          entityType: selectedEntityType,
          preview: URL.createObjectURL(file)
        });
        validFiles.push(fileWithPreview);
      }
    });

    if (validationErrors.length > 0) {
      setDragError(validationErrors.join('; '));
      return;
    }

    // Add to upload queue
    setUploadQueue(prev => [...prev, ...validFiles]);

    // Start uploading files
    for (const file of validFiles) {
      try {
        await actions.uploadFile(file, selectedEntityType);
        // Remove from queue after successful upload
        setUploadQueue(prev => prev.filter(f => f !== file));
      } catch (error) {
        console.error('Upload failed:', error);
        setDragError(`Upload failed for ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Remove from queue even if failed
        setUploadQueue(prev => prev.filter(f => f !== file));
      }
    }
  }, [actions, selectedEntityType, validateFile]);

  // Dropzone configuration
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    isFocused
  } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize,
    multiple,
    disabled: fileUpload.isUploading
  });

  // Handle entity type change
  const handleEntityTypeChange = (newEntityType: EntityTypeName) => {
    setSelectedEntityType(newEntityType);
    onEntityTypeChange?.(newEntityType);
  };

  // Clear errors
  const clearError = () => {
    setDragError(null);
    actions.clearFileUpload();
  };

  // Remove file from queue
  const removeFromQueue = (fileToRemove: FileWithPreview) => {
    setUploadQueue(prev => prev.filter(f => f !== fileToRemove));
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Entity Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data Type
        </label>
        <div className="flex gap-2">
          {(['client', 'worker', 'task'] as EntityTypeName[]).map((type) => (
            <button
              key={type}
              onClick={() => handleEntityTypeChange(type)}
              disabled={fileUpload.isUploading}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                selectedEntityType === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300",
                fileUpload.isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
          "hover:border-blue-400 hover:bg-blue-50",
          isDragActive && "border-blue-500 bg-blue-50",
          isDragAccept && "border-green-500 bg-green-50",
          isDragReject && "border-red-500 bg-red-50",
          isFocused && "border-blue-500 bg-blue-50",
          fileUpload.isUploading && "opacity-50 cursor-not-allowed",
          dragError && "border-red-500 bg-red-50"
        )}
      >
        <input {...getInputProps()} />
        
        {/* Upload Icon */}
        <div className="mx-auto w-12 h-12 mb-4">
          {fileUpload.isUploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          ) : isDragActive ? (
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>

        {/* Upload Text */}
        <div className="space-y-2">
          {fileUpload.isUploading ? (
            <>
              <p className="text-lg font-medium text-blue-600">
                Uploading {fileUpload.fileName}...
              </p>
              <p className="text-sm text-gray-600">
                {fileUpload.progress}% complete
              </p>
            </>
          ) : isDragActive ? (
            <>
              <p className="text-lg font-medium text-blue-600">
                Drop your files here!
              </p>
              <p className="text-sm text-gray-600">
                Release to upload {selectedEntityType} data
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-gray-600">
                Supports CSV and Excel files (.csv, .xlsx, .xls)
              </p>
              <p className="text-xs text-gray-500">
                Max file size: {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upload Progress Bar */}
      {fileUpload.isUploading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${fileUpload.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Uploading {fileUpload.fileName}</span>
            <span>{fileUpload.progress}%</span>
          </div>
        </div>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Upload Queue</h4>
          <div className="space-y-1">
            {uploadQueue.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {file.entityType}
                  </p>
                </div>
                <button
                  onClick={() => removeFromQueue(file)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {(dragError || fileUpload.error) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex justify-between items-start">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Upload Error
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {dragError || fileUpload.error}
                </p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {fileUpload.lastUploadedAt && !fileUpload.isUploading && !dragError && !fileUpload.error && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Upload Successful
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {fileUpload.fileName} was uploaded successfully at {fileUpload.lastUploadedAt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Mapping Interface */}
      {headerMapping.isVisible && (
        <HeaderMappingSuggestions />
      )}

      {/* File Format Guide */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">File Format Guide</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p><strong>Clients:</strong> ClientID, ClientName, PriorityLevel, RequestedTaskIDs, GroupTag, AttributesJSON</p>
          <p><strong>Workers:</strong> WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel</p>
          <p><strong>Tasks:</strong> TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent</p>
        </div>
      </div>
    </div>
  );
}
