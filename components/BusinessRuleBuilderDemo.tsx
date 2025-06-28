/**
 * @fileoverview Business Rule Builder Demo Component  
 * @description Complete demo interface with AI recommendations and NL converter
 */

'use client';

import React, { useState } from 'react';
import BusinessRuleBuilder from './BusinessRuleBuilder';
import NaturalLanguageRuleConverter from './NaturalLanguageRuleConverter';
import { BusinessRule } from '@/types/entities';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/lib/store/data-store';

export default function BusinessRuleBuilderDemo() {
  const { businessRules, actions, clients, workers, tasks } = useDataStore();
  const [selectedRule, setSelectedRule] = useState<BusinessRule | null>(null);
  const [showNLConverter, setShowNLConverter] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleRuleCreate = (rule: BusinessRule) => {
    actions.addBusinessRule(rule);
  };

  const handleRuleUpdate = (ruleId: string, updates: Partial<BusinessRule>) => {
    actions.updateBusinessRule(ruleId, updates);
  };

  const handleRuleDelete = (ruleId: string) => {
    actions.deleteBusinessRule(ruleId);
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null);
    }
  };

  const handleRuleToggle = (ruleId: string) => {
    actions.toggleBusinessRule(ruleId);
  };

  const handleGenerateRulesConfig = () => {
    const rulesConfig = actions.generateRulesConfig();

    // Generate and download JSON file
    const jsonContent = JSON.stringify(rulesConfig, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `business-rules-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert(`Successfully generated rules config with ${businessRules.length} rules!`);
  };

  // Generate AI-powered rule recommendations
  const generateRecommendations = () => {
    const recommendations: Array<{
      type: string;
      confidence: number;
      suggestion: string;
      parameters: Record<string, any>;
      reason: string;
    }> = [];

    // Co-run pattern detection based on client groupings
    const tasksByClient = new Map();
    tasks.forEach(task => {
      // Find client for this task
      const client = clients.find(c => {
        if (Array.isArray(c.RequestedTaskIDs)) {
          return c.RequestedTaskIDs.includes(task.TaskID);
        }
        return false;
      });
      if (client?.GroupTag) {
        if (!tasksByClient.has(client.GroupTag)) {
          tasksByClient.set(client.GroupTag, []);
        }
        tasksByClient.get(client.GroupTag).push(task.TaskID);
      }
    });

    tasksByClient.forEach((taskIds, clientGroup) => {
      if (taskIds.length >= 2) {
        recommendations.push({
          type: 'coRun',
          confidence: 0.85,
          suggestion: `Tasks ${taskIds.slice(0, 3).join(', ')} from ${clientGroup} group often run together. Create a co-run rule?`,
          parameters: { taskIds: taskIds.slice(0, 3), strict: true, maxDelay: 0 },
          reason: `Pattern detected: ${taskIds.length} tasks from same client group`
        });
      }
    });

    // Load balancing recommendations
    const workerGroups = new Map();
    workers.forEach(worker => {
      if (worker.WorkerGroup) {
        if (!workerGroups.has(worker.WorkerGroup)) {
          workerGroups.set(worker.WorkerGroup, 0);
        }
        workerGroups.set(worker.WorkerGroup, workerGroups.get(worker.WorkerGroup) + 1);
      }
    });

    workerGroups.forEach((count, group) => {
      if (count > 3) {
        const suggestedLimit = Math.ceil(count * 0.6);
        recommendations.push({
          type: 'loadLimit',
          confidence: 0.75,
          suggestion: `${group} has ${count} workers. Consider setting a load limit of ${suggestedLimit} tasks per phase.`,
          parameters: { workerGroup: group, maxSlotsPerPhase: suggestedLimit },
          reason: `Load balancing: Prevent overallocation in large teams`
        });
      }
    });

    // Phase window recommendations based on task categories
    const tasksByCategory = new Map();
    tasks.forEach(task => {
      if (task.Category) {
        if (!tasksByCategory.has(task.Category)) {
          tasksByCategory.set(task.Category, []);
        }
        tasksByCategory.get(task.Category).push(task);
      }
    });

    tasksByCategory.forEach((categoryTasks, category) => {
      if (categoryTasks.length >= 2) {
        if (category.toLowerCase().includes('test')) {
          recommendations.push({
            type: 'phaseWindow',
            confidence: 0.8,
            suggestion: `${category} tasks should run in later phases. Restrict to phases 5-8?`,
            parameters: { taskFilter: 'category', filterValue: category, allowedPhases: { start: 5, end: 8 } },
            reason: `Best practice: Testing typically happens after development`
          });
        } else if (category.toLowerCase().includes('design')) {
          recommendations.push({
            type: 'phaseWindow',
            confidence: 0.8,
            suggestion: `${category} tasks should run in early phases. Restrict to phases 1-3?`,
            parameters: { taskFilter: 'category', filterValue: category, allowedPhases: { start: 1, end: 3 } },
            reason: `Best practice: Design work typically happens first`
          });
        }
      }
    });

    return recommendations;
  };

  const recommendations = generateRecommendations();

  const getRuleTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      coRun: '🔗',
      slotRestriction: '⏰',
      loadLimit: '⚖️',
      phaseWindow: '📅',
      patternMatch: '🔍',
      precedence: '🏆'
    };
    return icons[type] || '⚙️';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <span className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
                ⚙️
              </span>
              Business Rules Management
            </h1>
            <p className="mt-2 text-slate-600">
              Create, manage, and export business rules for resource allocation
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* AI Features Toggle */}
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                showRecommendations
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-purple-50'
              )}
            >
              <span>🤖</span>
              AI Recommendations
              {recommendations.length > 0 && (
                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  {recommendations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowNLConverter(!showNLConverter)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                showNLConverter
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-green-50'
              )}
            >
              <span>💬</span>
              Natural Language
            </button>

            <button
              onClick={handleGenerateRulesConfig}
              disabled={businessRules.length === 0}
              className={cn(
                'px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                businessRules.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              )}
            >
              <span>📄</span>
              Generate Rules Config
            </button>
          </div>
        </div>
      </div>

      {/* AI Recommendations Panel */}
      {showRecommendations && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
              <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white">
                🤖
              </span>
              AI Rule Recommendations
            </h2>
            <p className="mt-1 text-slate-600">
              Based on your data patterns, here are suggested rules
            </p>
          </div>
          
          <div className="p-6">
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <p className="text-slate-600">No recommendations found. Add more data to get AI suggestions.</p>
                <p className="text-sm text-slate-500 mt-2">
                  Try uploading clients, workers, and tasks to see pattern-based recommendations.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getRuleTypeIcon(rec.type)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">{rec.suggestion}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            <span className="inline-flex items-center gap-1">
                              <span>Confidence: {Math.round(rec.confidence * 100)}%</span>
                              <span className="mx-2">•</span>
                              <span>{rec.reason}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // Auto-create rule from recommendation
                            const rule: BusinessRule = {
                              id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                              type: rec.type as any,
                              name: `AI: ${rec.type} rule`,
                              description: rec.suggestion,
                              parameters: rec.parameters,
                              active: true,
                              priority: Math.round(rec.confidence * 10),
                              createdBy: 'ai',
                              createdAt: new Date(),
                              modifiedAt: new Date()
                            };
                            handleRuleCreate(rule);
                          }}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            // Mark as dismissed (you could track this in state)
                            console.log('Dismissed recommendation:', rec);
                          }}
                          className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Natural Language Converter */}
      {showNLConverter && (
        <NaturalLanguageRuleConverter 
          onRuleGenerated={handleRuleCreate}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rule Builder */}
        <div className="lg:col-span-2">
          <BusinessRuleBuilder
            onRuleCreate={handleRuleCreate}
            onRuleUpdate={handleRuleUpdate}
            existingRules={businessRules}
          />
        </div>

        {/* Rules Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white">
                  📊
                </span>
                Rules Summary ({businessRules.length})
              </h3>
            </div>
            
            <div className="p-6">
              {businessRules.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <p className="text-slate-600 mb-4">No rules created yet</p>
                  <p className="text-sm text-slate-500">
                    Use the rule builder to create your first rule
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {businessRules.filter(r => r.active).length}
                      </div>
                      <div className="text-xs text-green-600 opacity-75">Active</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-slate-600">
                        {businessRules.filter(r => !r.active).length}
                      </div>
                      <div className="text-xs text-slate-600 opacity-75">Inactive</div>
                    </div>
                  </div>

                  {/* Rule List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {businessRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={cn(
                          'p-3 rounded-lg border transition-all cursor-pointer',
                          rule.active
                            ? 'border-green-200 bg-green-50 hover:bg-green-100'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
                          selectedRule?.id === rule.id && 'ring-2 ring-blue-500'
                        )}
                        onClick={() => setSelectedRule(rule)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getRuleTypeIcon(rule.type)}</span>
                            <div>
                              <div className="font-medium text-slate-800 text-sm">
                                {rule.name}
                              </div>
                              <div className="text-xs text-slate-600">
                                {rule.type} • Priority {rule.priority}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRuleToggle(rule.id);
                              }}
                              className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                                rule.active
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-slate-300 text-slate-600 hover:bg-slate-400'
                              )}
                            >
                              {rule.active ? '✓' : '○'}
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRuleDelete(rule.id);
                              }}
                              className="w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rule Details */}
          {selectedRule && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
                  <span className="text-2xl">{getRuleTypeIcon(selectedRule.type)}</span>
                  Rule Details
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <div className="mt-1 text-slate-900">{selectedRule.name}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <div className="mt-1 text-slate-600">{selectedRule.description}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700">Parameters</label>
                  <div className="mt-1 bg-slate-50 rounded-lg p-3">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedRule.parameters, null, 2)}
                    </pre>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-slate-700 font-medium">Priority</label>
                    <div className="text-slate-600">{selectedRule.priority}</div>
                  </div>
                  <div>
                    <label className="text-slate-700 font-medium">Status</label>
                    <div className={selectedRule.active ? 'text-green-600' : 'text-slate-500'}>
                      {selectedRule.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
