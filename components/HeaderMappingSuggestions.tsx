/**
 * @fileoverview Header Mapping Suggestions Component
 * @description Interactive UI for reviewing and confirming AI-suggested column mappings
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { EntityTypeName } from '@/types/entities';
import { useHeaderMapping, useDataActions } from '@/lib/store/data-store';

interface HeaderMappingSuggestionsProps {
  className?: string;
}

function HeaderMappingSuggestions({
  className
}: HeaderMappingSuggestionsProps) {
  const headerMapping = useHeaderMapping();
  const actions = useDataActions();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  if (!headerMapping.isVisible || !headerMapping.mappings || headerMapping.mappings.length === 0) {
    return null;
  }

  const handleAcceptMapping = (originalHeader: string, suggestedField: string) => {
    actions.updateHeaderMapping(originalHeader, suggestedField);
  };

  const handleRejectMapping = (originalHeader: string) => {
    actions.updateHeaderMapping(originalHeader, '');
  };

  const handleFinalize = async () => {
    try {
      await actions.acceptHeaderMappings();
    } catch (error) {
      console.error('Failed to finalize mappings:', error);
    }
  };

  const handleCancel = () => {
    actions.cancelHeaderMapping();
  };

  const mappedCount = Object.keys(headerMapping.userMappings).filter(key => headerMapping.userMappings[key]).length;

  return (
    <div className={cn('bg-white border border-slate-200 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">
          Smart Header Mapping for {headerMapping.entityType}s
        </h3>
        <p className="text-sm text-slate-600">
          {headerMapping.mappings.length} column{headerMapping.mappings.length !== 1 ? 's' : ''} detected
        </p>
      </div>

      {/* Mapping List */}
      <div className="max-h-96 overflow-y-auto">
        {headerMapping.mappings.map((mapping) => {
          const userMapping = headerMapping.userMappings[mapping.originalHeader];
          const isAccepted = userMapping === mapping.suggestedField;
          const isRejected = userMapping === '';
          
          return (
            <div key={mapping.originalHeader} className="border-b border-slate-100 last:border-b-0">
              <div className="px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {mapping.originalHeader}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {mapping.suggestedField}
                      </span>
                      <span className="text-xs text-slate-500">
                        {Math.round(mapping.confidence * 100)}%
                      </span>
                    </div>
                    
                    <div className="mt-1 text-xs">
                      {isAccepted ? (
                        <span className="text-green-600">✓ Accepted</span>
                      ) : isRejected ? (
                        <span className="text-red-600">✗ Rejected</span>
                      ) : (
                        <span className="text-slate-500">⏳ Pending</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptMapping(mapping.originalHeader, mapping.suggestedField)}
                      disabled={isAccepted}
                      className={cn(
                        "px-2 py-1 text-xs font-medium rounded transition-colors",
                        isAccepted
                          ? "bg-green-100 text-green-600 cursor-not-allowed"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      )}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectMapping(mapping.originalHeader)}
                      disabled={isRejected}
                      className={cn(
                        "px-2 py-1 text-xs font-medium rounded transition-colors",
                        isRejected
                          ? "bg-red-100 text-red-600 cursor-not-allowed"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      )}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {mappedCount} of {headerMapping.mappings.length} columns mapped
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalize}
              disabled={mappedCount === 0}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                mappedCount === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              Import Data ({mappedCount} columns)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { HeaderMappingSuggestions };
export default HeaderMappingSuggestions;
