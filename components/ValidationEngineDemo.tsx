/**
 * @fileoverview Validation Engine Demo Component
 * @description Interactive demo showcasing comprehensive validation capabilities
 */

import React, { useState, useCallback } from 'react';
import { ValidationEngine, validateDataSet, getValidationSummary } from '@/lib/validation-engine';
import { Client, Worker, Task, ValidationError } from '@/types/entities';
import { cn } from '@/lib/utils';

interface ValidationDemoProps {
  className?: string;
}

export function ValidationEngineDemo({ className }: ValidationDemoProps) {
  const [sampleData, setSampleData] = useState(generateSampleData());
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'clients' | 'workers' | 'tasks' | 'cross-ref'>('clients');

  // Run validation
  const handleValidation = useCallback(async () => {
    setIsValidating(true);
    
    try {
      const result = validateDataSet(sampleData);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  }, [sampleData]);

  // Generate new sample data with different error patterns
  const handleGenerateData = useCallback((errorType: 'clean' | 'mixed' | 'problematic') => {
    setSampleData(generateSampleData(errorType));
    setValidationResult(null);
  }, []);

  // Auto-fix all fixable issues
  const handleAutoFix = useCallback(() => {
    if (!validationResult) return;
    
    const summary = getValidationSummary(validationResult);
    console.log(`Auto-fixing ${summary.autoFixableIssues.length} issues...`);
    
    // In a real implementation, this would apply the suggested fixes
    // For demo purposes, we'll just re-run validation
    handleValidation();
  }, [validationResult, handleValidation]);

  return (
    <div className={cn("p-6 space-y-6", className)}>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔍 Validation Engine Demo
        </h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Comprehensive validation system for client-worker-task data with duplicate detection, 
          range validation, array validation, JSON validation, and cross-reference checking.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => handleGenerateData('clean')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Generate Clean Data
          </button>
          <button
            onClick={() => handleGenerateData('mixed')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Generate Mixed Data
          </button>
          <button
            onClick={() => handleGenerateData('problematic')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Generate Problematic Data
          </button>
          
          <div className="w-px bg-gray-300 mx-2"></div>
          
          <button
            onClick={handleValidation}
            disabled={isValidating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isValidating ? 'Validating...' : 'Run Validation'}
          </button>
          
          {validationResult && (
            <button
              onClick={handleAutoFix}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Auto-Fix Issues
            </button>
          )}
        </div>
      </div>

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataOverviewCard
          title="Clients"
          count={sampleData.clients.length}
          icon="👥"
          color="blue"
        />
        <DataOverviewCard
          title="Workers"
          count={sampleData.workers.length}
          icon="🔧"
          color="green"
        />
        <DataOverviewCard
          title="Tasks"
          count={sampleData.tasks.length}
          icon="📋"
          color="purple"
        />
      </div>

      {/* Validation Results */}
      {validationResult && (
        <ValidationResultsPanel 
          result={validationResult}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />
      )}

      {/* Sample Data Preview */}
      <SampleDataPreview data={sampleData} />
    </div>
  );
}

// Data Overview Card
interface DataOverviewCardProps {
  title: string;
  count: number;
  icon: string;
  color: 'blue' | 'green' | 'purple';
}

function DataOverviewCard({ title, count, icon, color }: DataOverviewCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };

  return (
    <div className={cn("rounded-lg border p-4 text-center", colorClasses[color])}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm">{title}</div>
    </div>
  );
}

// Validation Results Panel
interface ValidationResultsPanelProps {
  result: any;
  selectedTab: string;
  onTabChange: (tab: 'clients' | 'workers' | 'tasks' | 'cross-ref') => void;
}

function ValidationResultsPanel({ result, selectedTab, onTabChange }: ValidationResultsPanelProps) {
  const summary = getValidationSummary(result);

  return (
    <div className="bg-white rounded-lg border">
      {/* Summary Stats */}
      <div className="border-b p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Validation Results</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.totalEntities}</div>
            <div className="text-sm text-gray-600">Total Entities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.validEntities}</div>
            <div className="text-sm text-gray-600">Valid Entities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.totalErrors}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.totalWarnings}</div>
            <div className="text-sm text-gray-600">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.autoFixableIssues.length}</div>
            <div className="text-sm text-gray-600">Auto-Fixable</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-1 p-2">
          {[
            { id: 'clients', label: 'Clients', count: result.validatedClients.length },
            { id: 'workers', label: 'Workers', count: result.validatedWorkers.length },
            { id: 'tasks', label: 'Tasks', count: result.validatedTasks.length },
            { id: 'cross-ref', label: 'Cross-References', count: result.crossEntityErrors.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedTab === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {selectedTab === 'cross-ref' ? (
          <CrossReferenceErrors errors={result.crossEntityErrors} />
        ) : (
          <EntityValidationResults 
            entities={result[`validated${selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1, -1)}s`] || []}
            entityType={selectedTab}
          />
        )}
      </div>
    </div>
  );
}

// Entity Validation Results
interface EntityValidationResultsProps {
  entities: any[];
  entityType: string;
}

function EntityValidationResults({ entities, entityType }: EntityValidationResultsProps) {
  return (
    <div className="space-y-4">
      {entities.slice(0, 10).map((entity, index) => (
        <EntityCard key={index} entity={entity} entityType={entityType} />
      ))}
      {entities.length > 10 && (
        <div className="text-center text-gray-500 text-sm">
          ... and {entities.length - 10} more {entityType}
        </div>
      )}
    </div>
  );
}

// Entity Card
interface EntityCardProps {
  entity: any;
  entityType: string;
}

function EntityCard({ entity, entityType }: EntityCardProps) {
  const hasErrors = entity.validation.errors.length > 0;
  const hasWarnings = entity.validation.warnings.length > 0;

  const getEntityId = () => {
    switch (entityType) {
      case 'clients': return entity.ClientID;
      case 'workers': return entity.WorkerID;
      case 'tasks': return entity.TaskID;
      default: return 'Unknown';
    }
  };

  const getEntityName = () => {
    switch (entityType) {
      case 'clients': return entity.ClientName;
      case 'workers': return entity.WorkerName;
      case 'tasks': return entity.TaskName;
      default: return 'Unknown';
    }
  };

  return (
    <div className={cn(
      "border rounded-lg p-4",
      hasErrors ? "border-red-200 bg-red-50" : hasWarnings ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-gray-900">
            {getEntityId()} - {getEntityName()}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {entity.validation.errors.length} errors, {entity.validation.warnings.length} warnings
          </div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded text-xs font-medium",
          entity.validation.isValid 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        )}>
          {entity.validation.isValid ? 'Valid' : 'Invalid'}
        </div>
      </div>

      {/* Validation Issues */}
      {(hasErrors || hasWarnings) && (
        <div className="mt-3 space-y-2">
          {[...entity.validation.errors, ...entity.validation.warnings].slice(0, 3).map((issue: ValidationError, index: number) => (
            <ValidationIssue key={index} issue={issue} />
          ))}
          {(entity.validation.errors.length + entity.validation.warnings.length) > 3 && (
            <div className="text-xs text-gray-500">
              +{(entity.validation.errors.length + entity.validation.warnings.length) - 3} more issues...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Validation Issue Component
interface ValidationIssueProps {
  issue: ValidationError;
}

function ValidationIssue({ issue }: ValidationIssueProps) {
  const severityClasses = {
    error: 'text-red-700 bg-red-50 border-red-200',
    warning: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    info: 'text-blue-700 bg-blue-50 border-blue-200'
  };

  return (
    <div className={cn("p-2 rounded border text-xs", severityClasses[issue.severity])}>
      <div className="font-medium">{issue.field}: {issue.message}</div>
      {issue.suggestedFix && (
        <div className="mt-1 text-xs opacity-75">
          💡 {issue.suggestedFix}
        </div>
      )}
    </div>
  );
}

// Cross Reference Errors
interface CrossReferenceErrorsProps {
  errors: ValidationError[];
}

function CrossReferenceErrors({ errors }: CrossReferenceErrorsProps) {
  if (errors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">✅</div>
        <div>No cross-reference errors found!</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errors.map((error, index) => (
        <ValidationIssue key={index} issue={error} />
      ))}
    </div>
  );
}

// Sample Data Preview
interface SampleDataPreviewProps {
  data: any;
}

function SampleDataPreview({ data }: SampleDataPreviewProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Sample Data Preview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Clients (First 2)</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(data.clients.slice(0, 2), null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Workers (First 2)</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(data.workers.slice(0, 2), null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Tasks (First 2)</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(data.tasks.slice(0, 2), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Generate sample data with different error patterns
function generateSampleData(errorType: 'clean' | 'mixed' | 'problematic' = 'mixed') {
  const clients: Client[] = [];
  const workers: Worker[] = [];
  const tasks: Task[] = [];

  // Generate clients
  for (let i = 1; i <= 5; i++) {
    const client: Client = {
      ClientID: errorType === 'problematic' && i === 3 ? 'C001' : `C${i.toString().padStart(3, '0')}`, // Duplicate ID
      ClientName: `Client ${i}`,
      PriorityLevel: errorType === 'problematic' && i === 2 ? 10 : Math.floor(Math.random() * 5) + 1, // Out of range
      RequestedTaskIDs: [`T001`, `T002`],
      GroupTag: i <= 2 ? 'Enterprise' : 'SMB',
      AttributesJSON: errorType === 'problematic' && i === 4 ? '{"invalid": json}' : `{"budget": ${50000 + i * 10000}}`
    };
    clients.push(client);
  }

  // Generate workers
  for (let i = 1; i <= 4; i++) {
    const worker: Worker = {
      WorkerID: `W${i.toString().padStart(3, '0')}`,
      WorkerName: errorType === 'problematic' && i === 2 ? '' : `Worker ${i}`, // Missing name
      Skills: errorType === 'problematic' && i === 3 ? 'not-an-array' as any : ['JavaScript', 'React', 'Node.js'],
      AvailableSlots: [1, 2, 3, 4],
      MaxLoadPerPhase: errorType === 'problematic' && i === 1 ? 15 : 2, // Out of range
      WorkerGroup: 'Frontend',
      QualificationLevel: Math.floor(Math.random() * 5) + 1
    };
    workers.push(worker);
  }

  // Generate tasks
  for (let i = 1; i <= 3; i++) {
    const task: Task = {
      TaskID: `T${i.toString().padStart(3, '0')}`,
      TaskName: `Task ${i}`,
      Category: 'Development',
      Duration: errorType === 'problematic' && i === 2 ? 15 : Math.floor(Math.random() * 5) + 1, // Out of range
      RequiredSkills: errorType === 'problematic' && i === 3 ? ['NonExistentSkill'] : ['JavaScript', 'React'],
      PreferredPhases: [1, 2, 3],
      MaxConcurrent: Math.floor(Math.random() * 3) + 1
    };
    tasks.push(task);
  }

  return { clients, workers, tasks };
}

export default ValidationEngineDemo;
