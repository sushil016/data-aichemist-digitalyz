/**
 * @fileoverview Natural Language Rule Converter
 * @description AI-powered conversion of plain English to structured business rules
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { BusinessRule, BusinessRuleType } from '@/types/entities';
import { useDataStore } from '@/lib/store/data-store';

interface NaturalLanguageRuleConverterProps {
  className?: string;
  onRuleGenerated?: (rule: BusinessRule) => void;
}

interface ParsedRuleIntent {
  confidence: number;
  ruleType: BusinessRuleType;
  parameters: Record<string, any>;
  explanation: string;
  suggestedName: string;
}

export default function NaturalLanguageRuleConverter({
  className,
  onRuleGenerated
}: NaturalLanguageRuleConverterProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedRuleIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { clients, workers, tasks } = useDataStore();

  // Example natural language patterns
  const examplePatterns = [
    {
      text: "Tasks T001 and T002 should always run together",
      explanation: "Creates a co-run rule grouping specific tasks"
    },
    {
      text: "Frontend team shouldn't work more than 3 tasks per phase",
      explanation: "Creates a load limit rule for a worker group"
    },
    {
      text: "High priority tasks must run in first 3 phases",
      explanation: "Creates a phase window rule based on priority"
    },
    {
      text: "Enterprise clients should have minimum 2 common slots",
      explanation: "Creates a slot restriction rule for client groups"
    },
    {
      text: "All task names must match pattern ^[A-Z]\\d{3}$",
      explanation: "Creates a pattern match rule for data validation"
    }
  ];

  // Parse natural language input into rule structure
  const parseNaturalLanguage = (text: string): ParsedRuleIntent | null => {
    const lowerText = text.toLowerCase();
    
    // Co-run rule patterns
    if (lowerText.includes('run together') || lowerText.includes('group') || lowerText.includes('together')) {
      const taskMatches = text.match(/T\d+/g) || [];
      if (taskMatches.length >= 2) {
        return {
          confidence: 0.9,
          ruleType: 'coRun',
          parameters: {
            taskIds: taskMatches,
            strict: true,
            maxDelay: 0
          },
          explanation: `Group tasks ${taskMatches.join(', ')} to run together`,
          suggestedName: `Co-run: ${taskMatches.join(', ')}`
        };
      }
    }

    // Load limit rule patterns
    if (lowerText.includes('shouldn\'t work more than') || lowerText.includes('max') || lowerText.includes('limit')) {
      const numberMatch = text.match(/(\d+)/);
      const groupMatch = text.match(/(frontend|backend|fullstack|[a-zA-Z]+\s+team|[a-zA-Z]+\s+group)/i);
      
      if (numberMatch && groupMatch) {
        const maxSlots = parseInt(numberMatch[1]);
        const group = groupMatch[1].replace(/\s+(team|group)$/i, '');
        
        return {
          confidence: 0.85,
          ruleType: 'loadLimit',
          parameters: {
            workerGroup: group,
            maxSlotsPerPhase: maxSlots
          },
          explanation: `Limit ${group} workers to maximum ${maxSlots} tasks per phase`,
          suggestedName: `Load Limit: ${group} (${maxSlots} tasks/phase)`
        };
      }
    }

    // Phase window rule patterns
    if (lowerText.includes('must run in') || lowerText.includes('phase') || lowerText.includes('first') || lowerText.includes('last')) {
      const priorityMatch = lowerText.match(/(high|low|medium)\s+priority/);
      const phaseMatch = text.match(/(\d+)/g);
      
      if (priorityMatch && phaseMatch) {
        const priority = priorityMatch[1];
        const phases = phaseMatch.map(n => parseInt(n)).filter(n => n <= 50);
        
        return {
          confidence: 0.8,
          ruleType: 'phaseWindow',
          parameters: {
            taskFilter: 'priority',
            filterValue: priority,
            allowedPhases: { start: Math.min(...phases), end: Math.max(...phases) },
            strict: true
          },
          explanation: `Restrict ${priority} priority tasks to phases ${Math.min(...phases)}-${Math.max(...phases)}`,
          suggestedName: `Phase Window: ${priority} priority tasks`
        };
      }
    }

    // Slot restriction rule patterns
    if (lowerText.includes('minimum') && (lowerText.includes('slots') || lowerText.includes('common'))) {
      const numberMatch = text.match(/(\d+)/);
      const groupMatch = text.match(/(enterprise|smb|startup|government|[a-zA-Z]+\s+clients?)/i);
      
      if (numberMatch && groupMatch) {
        const minSlots = parseInt(numberMatch[1]);
        const group = groupMatch[1].replace(/\s+clients?$/i, '');
        
        return {
          confidence: 0.75,
          ruleType: 'slotRestriction',
          parameters: {
            groupType: 'ClientGroup',
            groupValue: group,
            minCommonSlots: minSlots
          },
          explanation: `Ensure ${group} clients have minimum ${minSlots} common slots`,
          suggestedName: `Slot Restriction: ${group} (${minSlots} min slots)`
        };
      }
    }

    // Pattern match rule patterns
    if (lowerText.includes('pattern') || lowerText.includes('match') || lowerText.includes('regex') || text.includes('^') || text.includes('$')) {
      const patternMatch = text.match(/([^\s]+\^[^$]+\$[^\s]*)/);
      const fieldMatch = lowerText.match(/(name|id|task|client|worker)/);
      
      if (patternMatch && fieldMatch) {
        const pattern = patternMatch[1];
        const field = fieldMatch[1];
        
        return {
          confidence: 0.7,
          ruleType: 'patternMatch',
          parameters: {
            entityType: field.includes('task') ? 'task' : field.includes('client') ? 'client' : 'worker',
            field: field.includes('name') ? 'Name' : 'ID',
            pattern: pattern,
            action: 'validate'
          },
          explanation: `Validate ${field} field matches pattern ${pattern}`,
          suggestedName: `Pattern Match: ${field} validation`
        };
      }
    }

    return null;
  };

  // Process natural language input
  const handleProcess = () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);
    setParsedResult(null);

    // Simulate processing delay for AI analysis
    setTimeout(() => {
      try {
        const result = parseNaturalLanguage(input);
        
        if (result) {
          // Validate against current data
          const validation = validateRuleAgainstData(result);
          if (validation.isValid) {
            setParsedResult(result);
          } else {
            setError(validation.error ?? null);
          }
        } else {
          setError('Could not understand the rule intent. Please try rephrasing or use one of the example patterns.');
        }
      } catch (error) {
        setError('Error processing natural language input. Please try again.');
        console.error('NL processing error:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  // Validate parsed rule against current data
  const validateRuleAgainstData = (rule: ParsedRuleIntent): { isValid: boolean; error?: string } => {
    switch (rule.ruleType) {
      case 'coRun':
        const taskIds = rule.parameters.taskIds || [];
        const invalidTasks = taskIds.filter((id: string) => !tasks.find(t => t.TaskID === id));
        if (invalidTasks.length > 0) {
          return {
            isValid: false,
            error: `Tasks not found in current data: ${invalidTasks.join(', ')}`
          };
        }
        break;

      case 'loadLimit':
        const workerGroup = rule.parameters.workerGroup;
        const hasGroup = workers.some(w => w.WorkerGroup?.toLowerCase().includes(workerGroup?.toLowerCase()));
        if (!hasGroup) {
          return {
            isValid: false,
            error: `Worker group "${workerGroup}" not found in current data`
          };
        }
        break;

      case 'slotRestriction':
        if (rule.parameters.groupType === 'ClientGroup') {
          const clientGroup = rule.parameters.groupValue;
          const hasClientGroup = clients.some(c => c.GroupTag?.toLowerCase().includes(clientGroup?.toLowerCase()));
          if (!hasClientGroup) {
            return {
              isValid: false,
              error: `Client group "${clientGroup}" not found in current data`
            };
          }
        }
        break;
    }

    return { isValid: true };
  };

  // Generate and apply the rule
  const handleApplyRule = () => {
    if (!parsedResult) return;

    const newRule: BusinessRule = {
      id: `nl_rule_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: parsedResult.ruleType,
      name: parsedResult.suggestedName,
      description: parsedResult.explanation,
      parameters: parsedResult.parameters,
      active: true,
      priority: 5,
      createdBy: 'ai',
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    onRuleGenerated?.(newRule);
    
    // Reset form
    setInput('');
    setParsedResult(null);
    setError(null);
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
          <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            🤖
          </span>
          Natural Language Rule Converter
        </h3>
        <p className="mt-2 text-slate-600">
          Describe your business rule in plain English and let AI convert it to a structured rule
        </p>
      </div>

      {/* Input Section */}
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Describe your rule in plain English
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="e.g., 'Tasks T001 and T002 should always run together'"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleProcess}
            disabled={!input.trim() || isProcessing}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              !input.trim() || isProcessing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            )}
          >
            {isProcessing ? 'Processing...' : 'Convert to Rule'}
          </button>

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              Analyzing with AI...
            </div>
          )}
        </div>

        {/* Example Patterns */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Example patterns:</h4>
          <div className="space-y-2">
            {examplePatterns.map((pattern, index) => (
              <button
                key={index}
                onClick={() => setInput(pattern.text)}
                className="w-full text-left p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <div className="text-sm font-medium text-slate-700">{pattern.text}</div>
                <div className="text-xs text-slate-500 mt-1">{pattern.explanation}</div>
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
              <h4 className="font-medium text-red-800">Unable to create rule</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Parsed Result */}
      {parsedResult && (
        <div className="mx-6 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <h4 className="font-medium text-green-800">Rule Parsed Successfully</h4>
            </div>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
              {Math.round(parsedResult.confidence * 100)}% confidence
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-green-700">Rule Name:</span>
              <p className="text-sm text-green-600">{parsedResult.suggestedName}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-green-700">Type:</span>
              <p className="text-sm text-green-600 capitalize">{parsedResult.ruleType}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-green-700">Description:</span>
              <p className="text-sm text-green-600">{parsedResult.explanation}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-green-700">Parameters:</span>
              <div className="mt-1 p-2 bg-green-100 rounded text-xs font-mono text-green-800 overflow-x-auto">
                {JSON.stringify(parsedResult.parameters, null, 2)}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-green-200">
              <button
                onClick={handleApplyRule}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Apply Rule
              </button>
              
              <button
                onClick={() => setParsedResult(null)}
                className="px-4 py-2 text-green-600 border border-green-300 rounded-lg font-medium hover:bg-green-50 transition-colors"
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
