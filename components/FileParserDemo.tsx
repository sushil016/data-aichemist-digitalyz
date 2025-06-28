/**
 * @fileoverview File Parser Demo Component
 * @description Example usage of the intelligent file parser
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  parseFile,
  parseMultipleFiles,
  validateFile,
  generateHeaderMappings,
  downloadAsCSV
} from '@/lib/file-parser';
import {
  Client,
  Worker,
  Task,
  EntityTypeName,
  DataParsingResult,
  HeaderMappingSuggestion
} from '@/types/entities';
import { cn } from '@/lib/utils';

interface FileParserDemoProps {
  className?: string;
}

interface ParsedFileInfo {
  file: File;
  entityType: EntityTypeName;
  result?: DataParsingResult<Client | Worker | Task>;
  error?: string;
  isProcessing: boolean;
}

export function FileParserDemo({ className }: FileParserDemoProps) {
  const [files, setFiles] = useState<Record<EntityTypeName, ParsedFileInfo | null>>({
    client: null,
    worker: null,
    task: null
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalResult, setGlobalResult] = useState<any>(null);

  // Handle file drop for specific entity type
  const handleFileDrop = useCallback(async (acceptedFiles: File[], entityType: EntityTypeName) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate file first
    const validation = validateFile(file);
    if (!validation.isValid) {
      setFiles(prev => ({
        ...prev,
        [entityType]: {
          file,
          entityType,
          error: validation.errors.join(', '),
          isProcessing: false
        }
      }));
      return;
    }
    
    // Set processing state
    setFiles(prev => ({
      ...prev,
      [entityType]: {
        file,
        entityType,
        isProcessing: true
      }
    }));
    
    try {
      // Parse the file
      const result = await parseFile(file, entityType);
      
      setFiles(prev => ({
        ...prev,
        [entityType]: {
          file,
          entityType,
          result,
          isProcessing: false
        }
      }));
    } catch (error) {
      setFiles(prev => ({
        ...prev,
        [entityType]: {
          file,
          entityType,
          error: String(error),
          isProcessing: false
        }
      }));
    }
  }, []);

  // Process all files together
  const handleProcessAll = useCallback(async () => {
    setIsProcessing(true);
    
    const fileMap: Record<string, File> = {};
    Object.entries(files).forEach(([entityType, fileInfo]) => {
      if (fileInfo?.file) {
        fileMap[entityType] = fileInfo.file;
      }
    });
    
    if (Object.keys(fileMap).length === 0) {
      setIsProcessing(false);
      return;
    }
    
    try {
      const result = await parseMultipleFiles(fileMap as any);
      setGlobalResult(result);
    } catch (error) {
      console.error('Failed to process files:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  // Download processed data
  const handleDownload = useCallback((entityType: EntityTypeName) => {
    const fileInfo = files[entityType];
    if (!fileInfo?.result) return;
    
    downloadAsCSV(
      fileInfo.result.data,
      entityType,
      `${entityType}s_processed.csv`
    );
  }, [files]);

  // Reset all files
  const handleReset = useCallback(() => {
    setFiles({
      client: null,
      worker: null,
      task: null
    });
    setGlobalResult(null);
  }, []);

  return (
    <div className={cn("p-6 space-y-6", className)}>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 File Parser Demo
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload CSV or XLSX files to see intelligent header mapping and data transformation in action.
          The parser automatically detects field mappings even if column names are slightly different.
        </p>
      </div>

      {/* File Upload Areas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['client', 'worker', 'task'] as EntityTypeName[]).map(entityType => (
          <FileUploadCard
            key={entityType}
            entityType={entityType}
            fileInfo={files[entityType]}
            onFileDrop={(files) => handleFileDrop(files, entityType)}
            onDownload={() => handleDownload(entityType)}
            onReset={() => setFiles(prev => ({ ...prev, [entityType]: null }))}
          />
        ))}
      </div>

      {/* Global Actions */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleProcessAll}
          disabled={isProcessing || Object.values(files).every(f => !f?.file)}
          className={cn(
            "px-6 py-3 rounded-lg font-medium transition-colors",
            "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          )}
        >
          {isProcessing ? 'Processing...' : 'Process All Files'}
        </button>
        
        <button
          onClick={handleReset}
          className="px-6 py-3 rounded-lg font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700"
        >
          Reset All
        </button>
      </div>

      {/* Global Results */}
      {globalResult && (
        <GlobalResultsPanel result={globalResult} />
      )}
    </div>
  );
}

// File Upload Card Component
interface FileUploadCardProps {
  entityType: EntityTypeName;
  fileInfo: ParsedFileInfo | null;
  onFileDrop: (files: File[]) => void;
  onDownload: () => void;
  onReset: () => void;
}

function FileUploadCard({ 
  entityType, 
  fileInfo, 
  onFileDrop, 
  onDownload, 
  onReset 
}: FileUploadCardProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFileDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const entityLabels = {
    client: { title: 'Clients', icon: '👥', color: 'blue' },
    worker: { title: 'Workers', icon: '🔧', color: 'green' },
    task: { title: 'Tasks', icon: '📋', color: 'purple' }
  };

  const { title, icon, color } = entityLabels[entityType];

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
      <div className="text-center">
        <div className="text-4xl mb-2">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        
        {!fileInfo ? (
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <div className={cn(
              "p-4 rounded-lg border-2 border-dashed transition-colors",
              isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
            )}>
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop file here...' : 'Drop CSV/XLSX or click to select'}
              </p>
            </div>
          </div>
        ) : (
          <FileInfoDisplay 
            fileInfo={fileInfo}
            onDownload={onDownload}
            onReset={onReset}
          />
        )}
      </div>
    </div>
  );
}

// File Info Display Component
interface FileInfoDisplayProps {
  fileInfo: ParsedFileInfo;
  onDownload: () => void;
  onReset: () => void;
}

function FileInfoDisplay({ fileInfo, onDownload, onReset }: FileInfoDisplayProps) {
  if (fileInfo.isProcessing) {
    return (
      <div className="space-y-2">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-sm text-gray-600">Processing...</p>
      </div>
    );
  }

  if (fileInfo.error) {
    return (
      <div className="space-y-2">
        <div className="text-red-600 text-2xl">❌</div>
        <p className="text-sm text-red-600">{fileInfo.error}</p>
        <button
          onClick={onReset}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (fileInfo.result) {
    return (
      <div className="space-y-3">
        <div className="text-green-600 text-2xl">✅</div>
        <div className="text-sm space-y-1">
          <p><strong>File:</strong> {fileInfo.file.name}</p>
          <p><strong>Rows:</strong> {fileInfo.result.processedRows}/{fileInfo.result.totalRows}</p>
          <p><strong>Errors:</strong> {fileInfo.result.errors.length}</p>
          <p><strong>Warnings:</strong> {fileInfo.result.warnings.length}</p>
        </div>
        
        {/* Header Mappings */}
        {fileInfo.result.suggestions.length > 0 && (
          <HeaderMappingsDisplay suggestions={fileInfo.result.suggestions} />
        )}
        
        {/* Sample Data */}
        {fileInfo.result.data.length > 0 && (
          <SampleDataDisplay data={fileInfo.result.data.slice(0, 3)} />
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={onDownload}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Download
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Header Mappings Display
interface HeaderMappingsDisplayProps {
  suggestions: HeaderMappingSuggestion[];
}

function HeaderMappingsDisplay({ suggestions }: HeaderMappingsDisplayProps) {
  return (
    <div className="text-left">
      <p className="text-xs font-medium text-gray-700 mb-1">Header Mappings:</p>
      <div className="space-y-1 max-h-20 overflow-y-auto">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <div key={index} className="text-xs">
            <span className="text-gray-600">"{suggestion.originalHeader}"</span>
            <span className="mx-1">→</span>
            <span className="font-medium">{suggestion.suggestedField || 'unmapped'}</span>
            {suggestion.confidence > 0 && (
              <span className="ml-1 text-gray-500">
                ({Math.round(suggestion.confidence * 100)}%)
              </span>
            )}
          </div>
        ))}
        {suggestions.length > 3 && (
          <p className="text-xs text-gray-500">+{suggestions.length - 3} more...</p>
        )}
      </div>
    </div>
  );
}

// Sample Data Display
interface SampleDataDisplayProps {
  data: any[];
}

function SampleDataDisplay({ data }: SampleDataDisplayProps) {
  return (
    <div className="text-left">
      <p className="text-xs font-medium text-gray-700 mb-1">Sample Data:</p>
      <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
        {data.map((item, index) => (
          <div key={index} className="truncate">
            {Object.entries(item).slice(0, 2).map(([key, value]) => (
              <span key={key} className="mr-2">
                <span className="text-gray-600">{key}:</span>
                <span className="ml-1">{String(value)}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Global Results Panel
interface GlobalResultsPanelProps {
  result: any;
}

function GlobalResultsPanel({ result }: GlobalResultsPanelProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 Processing Summary
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{result.summary.totalFiles}</div>
          <div className="text-sm text-gray-600">Total Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{result.summary.successfulFiles}</div>
          <div className="text-sm text-gray-600">Successful</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{result.summary.totalEntities}</div>
          <div className="text-sm text-gray-600">Total Entities</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{result.summary.totalErrors}</div>
          <div className="text-sm text-gray-600">Total Errors</div>
        </div>
      </div>
      
      {result.summary.failedFiles.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-800 mb-1">Failed Files:</p>
          {result.summary.failedFiles.map((error: string, index: number) => (
            <p key={index} className="text-sm text-red-600">{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileParserDemo;
