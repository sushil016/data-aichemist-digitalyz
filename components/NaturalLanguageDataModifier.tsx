/**
 * @fileoverview Natural Language Data Modifier
 * @description AI-powered data modification using plain English commands
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/lib/store/data-store';
import { processDataModification, AIDataModificationResponse } from '@/lib/ai-service';

interface NaturalLanguageDataModifierProps {
  className?: string;
}

export default function NaturalLanguageDataModifier({
  className
}: NaturalLanguageDataModifierProps) {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AIDataModificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { clients, workers, tasks, actions } = useDataStore();

  // Example commands for user guidance
  const exampleCommands = [
    {
      text: "Set all Enterprise clients to priority level 5",
      explanation: "Bulk update priority for all clients in Enterprise group"
    },
    {
      text: "Remove React skill from workers who don't have JavaScript",
      explanation: "Conditional skill removal based on dependencies"
    },
    {
      text: "Increase duration by 1 for all Testing category tasks",
      explanation: "Bulk increment duration for specific task category"
    },
    {
      text: "Move all Frontend workers to FullStack group",
      explanation: "Bulk group reassignment for workers"
    },
    {
      text: "Add TypeScript skill to all React developers",
      explanation: "Conditional skill addition based on existing skills"
    }
  ];

  // Process the natural language command
  const handleProcess = async () => {
    if (!command.trim()) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await processDataModification({
        command: command.trim(),
        context: { clients, workers, tasks }
      });

      if (response.understood) {
        setResult(response);
        setShowConfirmation(true);
      } else {
        setError('Could not understand the command. Please try rephrasing or use one of the example patterns.');
      }
    } catch (err) {
      setError('Failed to process command. Please try again.');
      console.error('Data modification error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply the suggested changes
  const handleApplyChanges = () => {
    if (!result) return;

    try {
      // Group changes by entity type and apply them
      const clientUpdates = result.changes.filter(c => c.entityType === 'client');
      const workerUpdates = result.changes.filter(c => c.entityType === 'worker');
      const taskUpdates = result.changes.filter(c => c.entityType === 'task');

      // Apply client updates
      clientUpdates.forEach(change => {
        const client = clients.find(c => c.ClientID === change.entityId);
        if (client) {
          actions.updateClient(change.entityId, { [change.field]: change.newValue });
        }
      });

      // Apply worker updates
      workerUpdates.forEach(change => {
        const worker = workers.find(w => w.WorkerID === change.entityId);
        if (worker) {
          actions.updateWorker(change.entityId, { [change.field]: change.newValue });
        }
      });

      // Apply task updates
      taskUpdates.forEach(change => {
        const task = tasks.find(t => t.TaskID === change.entityId);
        if (task) {
          actions.updateTask(change.entityId, { [change.field]: change.newValue });
        }
      });

      // Reset state
      setCommand('');
      setResult(null);
      setShowConfirmation(false);
      setError(null);

    } catch (err) {
      setError('Failed to apply changes. Please try again.');
      console.error('Apply changes error:', err);
    }
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
          <span className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            ✏️
          </span>
          Natural Language Data Modifier
        </h3>
        <p className="mt-2 text-slate-600">
          Modify your data using plain English commands. AI will analyze and suggest changes.
        </p>
      </div>

      {/* Input Section */}
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Describe what you want to change
          </label>
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="e.g., 'Set all Enterprise clients to priority level 5'"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleProcess}
            disabled={!command.trim() || isProcessing}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              !command.trim() || isProcessing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            )}
          >
            {isProcessing ? 'Analyzing...' : 'Analyze Command'}
          </button>

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
              AI is analyzing your command...
            </div>
          )}
        </div>

        {/* Example Commands */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Example commands:</h4>
          <div className="space-y-2">
            {exampleCommands.map((example, index) => (
              <button
                key={index}
                onClick={() => setCommand(example.text)}
                className="w-full text-left p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <div className="text-sm font-medium text-slate-700">{example.text}</div>
                <div className="text-xs text-slate-500 mt-1">{example.explanation}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <div>
              <h4 className="font-medium text-red-800">Unable to process command</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && result && (
        <div className="mx-6 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">🤖</span>
              <h4 className="font-medium text-blue-800">AI Analysis Complete</h4>
            </div>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              {Math.round(result.confidence * 100)}% confidence
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-blue-700">Summary:</span>
              <p className="text-sm text-blue-600 mt-1">{result.summary}</p>
            </div>

            {result.warnings.length > 0 && (
              <div>
                <span className="text-sm font-medium text-orange-700">Warnings:</span>
                <ul className="text-sm text-orange-600 mt-1 list-disc list-inside">
                  {result.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-blue-700">Changes ({result.changes.length}):</span>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {result.changes.map((change, index) => (
                  <div key={index} className="p-2 bg-blue-100 rounded text-xs">
                    <div className="font-mono">
                      <strong>{change.entityType.toUpperCase()} {change.entityId}</strong>
                    </div>
                    <div className="text-blue-800">
                      {change.field}: {JSON.stringify(change.oldValue)} → {JSON.stringify(change.newValue)}
                    </div>
                    <div className="text-blue-600 italic mt-1">{change.reasoning}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-blue-200">
              <button
                onClick={handleApplyChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Apply Changes ({result.changes.length})
              </button>
              
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setResult(null);
                }}
                className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
