/**
 * @fileoverview AI Error Correction Panel
 * @description AI-powered error correction suggestions with one-click fixes
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ValidationError } from '@/types/entities';
import { useDataStore } from '@/lib/store/data-store';
import { generateErrorCorrections, AIErrorCorrectionResponse } from '@/lib/ai-service';

interface AIErrorCorrectionPanelProps {
  className?: string;
  errors: ValidationError[];
}

interface ErrorWithCorrections extends ValidationError {
  corrections?: AIErrorCorrectionResponse;
  isLoadingCorrections?: boolean;
}

export default function AIErrorCorrectionPanel({
  className,
  errors
}: AIErrorCorrectionPanelProps) {
  const [errorsWithCorrections, setErrorsWithCorrections] = useState<ErrorWithCorrections[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const { clients, workers, tasks, actions } = useDataStore();

  // Initialize errors
  useEffect(() => {
    setErrorsWithCorrections(errors.map(error => ({ ...error })));
  }, [errors]);

  // Generate AI corrections for a specific error
  const generateCorrectionsForError = async (errorIndex: number) => {
    const error = errorsWithCorrections[errorIndex];
    if (!error || error.corrections || error.isLoadingCorrections) return;

    // Update loading state
    setErrorsWithCorrections(prev => 
      prev.map((e, i) => i === errorIndex ? { ...e, isLoadingCorrections: true } : e)
    );

    try {
      const corrections = await generateErrorCorrections({
        error,
        context: { clients, workers, tasks }
      });

      setErrorsWithCorrections(prev => 
        prev.map((e, i) => i === errorIndex ? { 
          ...e, 
          corrections, 
          isLoadingCorrections: false 
        } : e)
      );
    } catch (err) {
      console.error('Error generating corrections:', err);
      setErrorsWithCorrections(prev => 
        prev.map((e, i) => i === errorIndex ? { 
          ...e, 
          isLoadingCorrections: false,
          corrections: {
            understood: false,
            confidence: 0,
            suggestions: []
          }
        } : e)
      );
    }
  };

  // Generate corrections for all errors
  const generateAllCorrections = async () => {
    setIsGeneratingAll(true);
    
    for (let i = 0; i < errorsWithCorrections.length; i++) {
      if (!errorsWithCorrections[i].corrections) {
        await generateCorrectionsForError(i);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setIsGeneratingAll(false);
  };

  // Apply a suggested correction
  const applySuggestion = (errorIndex: number, suggestionIndex: number) => {
    const error = errorsWithCorrections[errorIndex];
    const suggestion = error.corrections?.suggestions[suggestionIndex];
    
    if (!suggestion) return;

    try {
      // Apply each change in the suggestion
      suggestion.changes.forEach(change => {
        switch (change.entityType) {
          case 'client':
            actions.updateClient(change.entityId, { [change.field]: change.newValue });
            break;
          case 'worker':
            actions.updateWorker(change.entityId, { [change.field]: change.newValue });
            break;
          case 'task':
            actions.updateTask(change.entityId, { [change.field]: change.newValue });
            break;
        }
      });

      // Remove this error from the list since it should be fixed
      setErrorsWithCorrections(prev => prev.filter((_, i) => i !== errorIndex));
      
    } catch (err) {
      console.error('Error applying suggestion:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '⚪';
    }
  };

  if (errorsWithCorrections.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm p-6', className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Errors Found</h3>
          <p className="text-slate-600">All data validation checks passed successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
              <span className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
                🔧
              </span>
              AI Error Correction ({errorsWithCorrections.length})
            </h3>
            <p className="mt-2 text-slate-600">
              AI-powered suggestions to fix data validation errors
            </p>
          </div>
          
          <button
            onClick={generateAllCorrections}
            disabled={isGeneratingAll}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              isGeneratingAll
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            )}
          >
            <span>🤖</span>
            {isGeneratingAll ? 'Generating...' : 'Get AI Fixes for All'}
          </button>
        </div>
      </div>

      {/* Errors List */}
      <div className="p-6 space-y-4">
        {errorsWithCorrections.map((error, errorIndex) => (
          <div key={error.id} className={cn('border rounded-lg', getSeverityColor(error.severity))}>
            {/* Error Header */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getSeverityIcon(error.severity)}</span>
                  <div>
                    <h4 className="font-semibold">
                      {error.entityType.toUpperCase()} {error.entityId} - {error.field}
                    </h4>
                    <p className="text-sm mt-1">{error.message}</p>
                  </div>
                </div>
                
                {!error.corrections && !error.isLoadingCorrections && (
                  <button
                    onClick={() => generateCorrectionsForError(errorIndex)}
                    className="px-3 py-1 bg-white/50 hover:bg-white/70 rounded-lg text-sm font-medium transition-colors"
                  >
                    Get AI Fix
                  </button>
                )}
              </div>

              {/* Loading State */}
              {error.isLoadingCorrections && (
                <div className="flex items-center gap-2 text-sm mt-3">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  AI is analyzing this error...
                </div>
              )}

              {/* AI Suggestions */}
              {error.corrections && (
                <div className="mt-4 space-y-3">
                  {error.corrections.understood ? (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <span>🤖</span>
                        <span className="font-medium">AI Confidence: {Math.round(error.corrections.confidence * 100)}%</span>
                      </div>
                      
                      {error.corrections.suggestions.map((suggestion, suggestionIndex) => (
                        <div key={suggestionIndex} className="bg-white/50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{suggestion.description}</h5>
                              <p className="text-xs mt-1 text-current/70">{suggestion.reasoning}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {suggestion.autoApplicable && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  Auto-safe
                                </span>
                              )}
                              <button
                                onClick={() => applySuggestion(errorIndex, suggestionIndex)}
                                className="px-3 py-1 bg-current text-white rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                              >
                                Apply Fix
                              </button>
                            </div>
                          </div>
                          
                          {/* Changes Preview */}
                          <div className="space-y-1">
                            {suggestion.changes.map((change, changeIndex) => (
                              <div key={changeIndex} className="text-xs font-mono bg-current/10 p-2 rounded">
                                <strong>{change.entityType.toUpperCase()} {change.entityId}</strong>
                                <br />
                                {change.field}: {JSON.stringify(change.oldValue)} → {JSON.stringify(change.newValue)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-sm bg-white/50 rounded-lg p-3">
                      <span>🤖</span> AI could not understand this error type. Manual intervention required.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
