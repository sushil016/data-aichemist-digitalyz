/**
 * @fileoverview ValidationPanel Component
 * @description Displays all validation errors grouped by entity type with severity indicators,
 * clickable error navigation, and real-time updates from Zustand store
 */

'use client';

import React, { useMemo, useState } from 'react';
import { useDataStore } from '@/lib/store/data-store';
import { ValidationError } from '@/types/entities';

// ===== INTERFACES =====

interface GroupedValidationErrors {
  client: ValidationError[];
  worker: ValidationError[];
  task: ValidationError[];
}

interface ValidationStatsProps {
  errors: number;
  warnings: number;
  info: number;
  total: number;
}

interface ErrorItemProps {
  error: ValidationError;
  onClick: (error: ValidationError) => void;
}

interface EntityGroupProps {
  entityType: 'client' | 'worker' | 'task';
  errors: ValidationError[];
  onErrorClick: (error: ValidationError) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

// ===== HELPER FUNCTIONS =====

const getSeverityIcon = (severity: ValidationError['severity']): string => {
  switch (severity) {
    case 'error': return '🔴';
    case 'warning': return '🟡';
    case 'info': return '🔵';
    default: return '⚪';
  }
};

const getSeverityColor = (severity: ValidationError['severity']): string => {
  switch (severity) {
    case 'error': return 'text-red-600 bg-red-50';
    case 'warning': return 'text-yellow-600 bg-yellow-50';
    case 'info': return 'text-blue-600 bg-blue-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const getEntityTypeLabel = (entityType: string): string => {
  switch (entityType) {
    case 'client': return 'Clients';
    case 'worker': return 'Workers';
    case 'task': return 'Tasks';
    default: return entityType;
  }
};

const getEntityTypeIcon = (entityType: string): string => {
  switch (entityType) {
    case 'client': return '👥';
    case 'worker': return '👷';
    case 'task': return '📋';
    default: return '📄';
  }
};

// ===== SUB-COMPONENTS =====

const ValidationStats: React.FC<ValidationStatsProps> = ({
  errors,
  warnings,
  info,
  total
}) => (
  <div className="grid grid-cols-4 gap-4 mb-6">
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold text-red-600">{errors}</div>
      <div className="text-sm text-red-600">Errors</div>
    </div>
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold text-yellow-600">{warnings}</div>
      <div className="text-sm text-yellow-600">Warnings</div>
    </div>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold text-blue-600">{info}</div>
      <div className="text-sm text-blue-600">Info</div>
    </div>
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold text-gray-600">{total}</div>
      <div className="text-sm text-gray-600">Total</div>
    </div>
  </div>
);

const ErrorItem: React.FC<ErrorItemProps> = ({ error, onClick }) => (
  <div
    className={`p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${
      error.severity === 'error' 
        ? 'border-red-500 bg-red-50' 
        : error.severity === 'warning'
        ? 'border-yellow-500 bg-yellow-50'
        : 'border-blue-500 bg-blue-50'
    }`}
    onClick={() => onClick(error)}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{getSeverityIcon(error.severity)}</span>
          <span className="font-medium text-sm text-gray-800">
            {error.entityId} - {error.field}
          </span>
          {error.autoFixable && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
              Auto-fixable
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-1">{error.message}</p>
        {error.suggestedFix && (
          <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            💡 Suggested: {error.suggestedFix}
          </p>
        )}
      </div>
      <div className="text-xs text-gray-400 ml-4">
        Row {error.row}
      </div>
    </div>
  </div>
);

const EntityGroup: React.FC<EntityGroupProps> = ({
  entityType,
  errors,
  onErrorClick,
  isExpanded,
  onToggle
}) => {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const infoCount = errors.filter(e => e.severity === 'info').length;

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <div
        className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{getEntityTypeIcon(entityType)}</span>
            <h3 className="font-semibold text-gray-800">
              {getEntityTypeLabel(entityType)}
            </h3>
            <span className="text-sm text-gray-500">
              ({errors.length} issue{errors.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="flex items-center gap-4">
            {errorCount > 0 && (
              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
            {infoCount > 0 && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {infoCount} info
              </span>
            )}
            <span className="text-gray-400 text-sm">
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {errors.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              ✅ No validation issues found
            </div>
          ) : (
            errors
              .sort((a, b) => {
                // Sort by severity first (error > warning > info), then by row
                const severityOrder = { error: 3, warning: 2, info: 1 };
                const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
                return severityDiff !== 0 ? severityDiff : a.row - b.row;
              })
              .map((error) => (
                <ErrorItem
                  key={error.id}
                  error={error}
                  onClick={onErrorClick}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
};

// ===== MAIN COMPONENT =====

interface ValidationPanelProps {
  className?: string;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ className }) => {
  const { 
    validationErrors, 
    validationSummary, 
    isValidating,
    lastValidatedAt,
    actions 
  } = useDataStore();

  // Local state for expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    client: true,
    worker: true,
    task: true
  });

  // Group validation errors by entity type
  const groupedErrors = useMemo<GroupedValidationErrors>(() => {
    const grouped: GroupedValidationErrors = {
      client: [],
      worker: [],
      task: []
    };

    validationErrors.forEach(error => {
      grouped[error.entityType].push(error);
    });

    return grouped;
  }, [validationErrors]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const errors = validationErrors.filter(e => e.severity === 'error').length;
    const warnings = validationErrors.filter(e => e.severity === 'warning').length;
    const info = validationErrors.filter(e => e.severity === 'info').length;
    const total = validationErrors.length;

    return { errors, warnings, info, total };
  }, [validationErrors]);

  // Handle error click - navigate to entity
  const handleErrorClick = (error: ValidationError) => {
    actions.selectEntity(error.entityType, error.entityId);
    
    // Scroll to the entity in the data grid (if visible)
    // This could be enhanced to emit an event that the DataGrid listens to
    console.log(`Navigating to ${error.entityType} ${error.entityId}, field: ${error.field}`);
  };

  // Handle group toggle
  const toggleGroup = (entityType: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [entityType]: !prev[entityType]
    }));
  };

  // Handle validation refresh
  const handleRefreshValidation = () => {
    actions.validateAll();
  };

  // Handle clear all errors
  const handleClearErrors = () => {
    actions.clearValidationErrors();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Validation Panel</h2>
            <p className="text-sm text-gray-600">
              Real-time validation results and error navigation
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshValidation}
            disabled={isValidating}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? '🔄 Validating...' : '🔄 Refresh'}
          </button>
          
          {validationErrors.length > 0 && (
            <button
              onClick={handleClearErrors}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Validation Status */}
      {lastValidatedAt && (
        <div className="mb-4 text-sm text-gray-600">
          Last validated: {lastValidatedAt.toLocaleString()}
        </div>
      )}

      {/* Loading State */}
      {isValidating && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin">🔄</div>
            <span className="text-blue-700">Running validation checks...</span>
          </div>
        </div>
      )}

      {/* Statistics */}
      <ValidationStats {...stats} />

      {/* Validation Results */}
      <div className="flex-1 overflow-y-auto">
        {validationErrors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              All data is valid!
            </h3>
            <p className="text-gray-600">
              No validation errors, warnings, or issues found in your data.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(['client', 'worker', 'task'] as const).map(entityType => (
              <EntityGroup
                key={entityType}
                entityType={entityType}
                errors={groupedErrors[entityType]}
                onErrorClick={handleErrorClick}
                isExpanded={expandedGroups[entityType]}
                onToggle={() => toggleGroup(entityType)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {validationErrors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <span>
                Validation Score: <strong>{validationSummary.score}%</strong>
              </span>
              <span>
                {stats.errors === 0 ? (
                  <span className="text-green-600">✅ No critical errors</span>
                ) : (
                  <span className="text-red-600">
                    ⚠️ {stats.errors} error{stats.errors !== 1 ? 's' : ''} need attention
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;
