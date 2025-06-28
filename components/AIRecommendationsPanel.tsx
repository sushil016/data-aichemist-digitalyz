/**
 * @fileoverview AI Recommendations Panel
 * @description Enhanced AI-powered analysis using Anthropic Claude for intelligent business rule recommendations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useDataStore } from '@/lib/store/data-store';
import { BusinessRule } from '@/types/entities';
import { generateRuleRecommendations, AIRuleRecommendationResponse } from '@/lib/ai-service';
import { cn } from '@/lib/utils';

interface EnhancedAIRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  reasoning?: string;
  pattern?: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  parameters?: Record<string, any>;
  suggestedRule?: Partial<BusinessRule>;
  actionLabel?: string;
}

const AIRecommendationsPanel: React.FC = () => {
  const { clients, workers, tasks, businessRules, actions } = useDataStore();
  const [recommendations, setRecommendations] = useState<EnhancedAIRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [aiEnabled, setAiEnabled] = useState(true);

  // Generate AI recommendations using Claude
  const generateAIRecommendations = async () => {
    if (!aiEnabled || clients.length === 0 && workers.length === 0 && tasks.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await generateRuleRecommendations({
        context: { clients, workers, tasks, existingRules: businessRules }
      });

      const enhancedRecommendations: EnhancedAIRecommendation[] = response.recommendations.map((rec, index) => ({
        id: `ai-rec-${Date.now()}-${index}`,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        reasoning: rec.reasoning,
        pattern: rec.pattern,
        confidence: rec.confidence,
        impact: rec.impact,
        parameters: rec.parameters,
        suggestedRule: {
          type: rec.type as any,
          name: rec.title,
          description: rec.description,
          parameters: rec.parameters,
          active: true,
          priority: rec.impact === 'high' ? 8 : rec.impact === 'medium' ? 5 : 3,
          createdBy: 'ai' as const
        }
      }));

      setRecommendations(enhancedRecommendations);
    } catch (error) {
      console.error('AI recommendations error:', error);
      // Fallback to basic pattern detection
      generateBasicRecommendations();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fallback basic recommendations when AI is unavailable
  const generateBasicRecommendations = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const newRecommendations: EnhancedAIRecommendation[] = [];

      // Rule recommendations based on data patterns
      if (clients.length > 0 && workers.length > 0 && tasks.length > 0) {
        // Check for co-run opportunities
        const highPriorityClients = clients.filter(c => c.PriorityLevel >= 4);
        if (highPriorityClients.length >= 2) {
          newRecommendations.push({
            id: 'corun-high-priority',
            type: 'rule',
            title: 'Co-run High Priority Clients',
            description: `Found ${highPriorityClients.length} high-priority clients that could benefit from parallel execution to reduce overall completion time.`,
            confidence: 85,
            impact: 'high',
            suggestedRule: {
              type: 'coRun',
              name: 'High Priority Co-run',
              description: 'Allow high priority clients to run concurrently',
              parameters: {
                clientGroups: highPriorityClients.map(c => c.ClientID),
                maxConcurrent: Math.min(3, highPriorityClients.length)
              },
              priority: 5,
              active: false
            },
            actionLabel: 'Create Co-run Rule'
          });
        }

        // Check for load balancing opportunities
        const overloadedWorkers = workers.filter(w => {
          const assignedTasks = tasks.filter(t => 
            t.RequiredSkills.some(skill => w.Skills.includes(skill))
          );
          return assignedTasks.length > w.MaxLoadPerPhase;
        });

        if (overloadedWorkers.length > 0) {
          newRecommendations.push({
            id: 'load-limit-warning',
            type: 'warning',
            title: 'Worker Overload Detected',
            description: `${overloadedWorkers.length} workers may be overloaded. Consider load limits or redistributing tasks.`,
            confidence: 92,
            impact: 'high',
            suggestedRule: {
              type: 'loadLimit',
              name: 'Prevent Worker Overload',
              description: 'Limit maximum concurrent tasks per worker',
              parameters: {
                workerGroup: 'all',
                maxLoad: Math.max(1, Math.floor(workers.reduce((sum, w) => sum + w.MaxLoadPerPhase, 0) / workers.length))
              },
              priority: 4,
              active: false
            },
            actionLabel: 'Create Load Limit'
          });
        }

        // Check for skill coverage gaps
        const allRequiredSkills = [...new Set(tasks.flatMap(t => t.RequiredSkills))];
        const availableSkills = [...new Set(workers.flatMap(w => w.Skills))];
        const missingSkills = allRequiredSkills.filter(skill => !availableSkills.includes(skill));

        if (missingSkills.length > 0) {
          newRecommendations.push({
            id: 'skill-gap-insight',
            type: 'insight',
            title: 'Skill Coverage Gap',
            description: `Missing skills: ${missingSkills.join(', ')}. Consider training workers or hiring specialists.`,
            confidence: 78,
            impact: 'medium',
            actionLabel: 'View Details'
          });
        }

        // Check for optimization opportunities
        const underutilizedWorkers = workers.filter(w => {
          const relevantTasks = tasks.filter(t => 
            t.RequiredSkills.some(skill => w.Skills.includes(skill))
          );
          return relevantTasks.length < w.MaxLoadPerPhase * 0.5;
        });

        if (underutilizedWorkers.length > 0) {
          newRecommendations.push({
            id: 'utilization-optimization',
            type: 'optimization',
            title: 'Improve Worker Utilization',
            description: `${underutilizedWorkers.length} workers are underutilized. Consider cross-training or task redistribution.`,
            confidence: 72,
            impact: 'medium',
            actionLabel: 'Analyze Utilization'
          });
        }

        // Check for phase window optimization
        const longRunningTasks = tasks.filter(t => t.Duration > 3);
        if (longRunningTasks.length > 0) {
          newRecommendations.push({
            id: 'phase-window-optimization',
            type: 'rule',
            title: 'Optimize Long-Running Tasks',
            description: `${longRunningTasks.length} tasks have long durations. Consider phase windows to improve scheduling flexibility.`,
            confidence: 68,
            impact: 'medium',
            suggestedRule: {
              type: 'phaseWindow',
              name: 'Long Task Phase Windows',
              description: 'Allow flexible scheduling for long-running tasks',
              parameters: {
                taskCategory: 'Development',
                phases: [1, 2, 3, 4, 5],
                flexibility: 'high'
              },
              priority: 3,
              active: false
            },
            actionLabel: 'Create Phase Rule'
          });
        }
      }

      // If no data, show onboarding recommendations
      if (clients.length === 0 || workers.length === 0 || tasks.length === 0) {
        newRecommendations.push({
          id: 'onboarding-data',
          type: 'insight',
          title: 'Get Started with Data',
          description: 'Upload your client, worker, and task data to receive personalized AI recommendations.',
          confidence: 100,
          impact: 'high',
          actionLabel: 'Upload Data'
        });
      }

      setRecommendations(newRecommendations);
      setIsAnalyzing(false);
    }, 1500);
  };

  useEffect(() => {
    generateAIRecommendations();
  }, [clients.length, workers.length, tasks.length, businessRules.length]);

  const handleApplyRecommendation = (recommendation: EnhancedAIRecommendation) => {
    if (recommendation.suggestedRule) {
      const rule: BusinessRule = {
        id: `ai-${Date.now()}`,
        type: recommendation.suggestedRule.type!,
        name: recommendation.suggestedRule.name!,
        description: recommendation.suggestedRule.description!,
        parameters: recommendation.suggestedRule.parameters || {},
        priority: recommendation.suggestedRule.priority || 3,
        active: true,
        createdBy: 'ai',
        createdAt: new Date(),
        modifiedAt: new Date()
      };

      actions.addBusinessRule(rule);
      
      // Remove the applied recommendation
      setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.type === selectedCategory);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rule': return '🔧';
      case 'optimization': return '⚡';
      case 'warning': return '⚠️';
      case 'insight': return '💡';
      default: return '📊';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          AI analyzing your data patterns...
        </div>
        <button
          onClick={generateAIRecommendations}
          disabled={isAnalyzing}
          className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          {isAnalyzing ? (
            <>
              <span className="animate-spin inline-block w-3 h-3 border border-blue-600 border-t-transparent rounded-full mr-2"></span>
              Analyzing...
            </>
          ) : (
            '🔄 Refresh'
          )}
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: recommendations.length },
          { key: 'rule', label: 'Rules', count: recommendations.filter(r => r.type === 'rule').length },
          { key: 'optimization', label: 'Optimizations', count: recommendations.filter(r => r.type === 'optimization').length },
          { key: 'warning', label: 'Warnings', count: recommendations.filter(r => r.type === 'warning').length },
          { key: 'insight', label: 'Insights', count: recommendations.filter(r => r.type === 'insight').length }
        ].map((category) => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key as any)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all',
              selectedCategory === category.key
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {category.label} {category.count > 0 && `(${category.count})`}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {isAnalyzing ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Analyzing data patterns...</p>
          </div>
        ) : filteredRecommendations.length > 0 ? (
          filteredRecommendations.map((recommendation) => (
            <div key={recommendation.id} className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(recommendation.type)}</span>
                  <div>
                    <h4 className="font-semibold text-slate-800">{recommendation.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(recommendation.impact)}`}>
                        {recommendation.impact.toUpperCase()} IMPACT
                      </span>
                      <span className="text-xs text-slate-500">
                        {recommendation.confidence}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                
                {recommendation.suggestedRule && (
                  <button
                    onClick={() => handleApplyRecommendation(recommendation)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    {recommendation.actionLabel || 'Apply'}
                  </button>
                )}
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed">
                {recommendation.description}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-slate-600">No recommendations available.</p>
            <p className="text-sm text-slate-500 mt-1">
              Add more data to receive AI-powered suggestions.
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {recommendations.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              {recommendations.filter(r => r.type === 'rule').length} rule suggestions, 
              {recommendations.filter(r => r.type === 'warning').length} warnings
            </span>
            <span>
              Avg. confidence: {Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendationsPanel;
