/**
 * @fileoverview Enhanced AI Recommendations Panel
 * @description Advanced AI-powered analysis using Anthropic Claude for intelligent business rule recommendations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useDataStore } from '@/lib/store/data-store';
import { BusinessRule } from '@/types/entities';
import { generateRuleRecommendations } from '@/lib/ai-service';
import { cn } from '@/lib/utils';

interface EnhancedAIRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  reasoning: string;
  pattern: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  parameters: Record<string, any>;
  suggestedRule?: Partial<BusinessRule>;
}

const EnhancedAIRecommendationsPanel: React.FC = () => {
  const { clients, workers, tasks, businessRules, actions } = useDataStore();
  const [recommendations, setRecommendations] = useState<EnhancedAIRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [aiEnabled, setAiEnabled] = useState(true);

  // Generate AI recommendations using Claude
  const generateAIRecommendations = async () => {
    if (!aiEnabled || (clients.length === 0 && workers.length === 0 && tasks.length === 0)) {
      generateBasicRecommendations();
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
      const basicRecommendations: EnhancedAIRecommendation[] = [];

      // Basic pattern detection
      if (clients.length > 0 && workers.length > 0 && tasks.length > 0) {
        // High priority clients co-run opportunity
        const highPriorityClients = clients.filter(c => c.PriorityLevel >= 4);
        if (highPriorityClients.length >= 2) {
          basicRecommendations.push({
            id: 'basic-corun-high-priority',
            type: 'coRun',
            title: 'Co-run High Priority Clients',
            description: `Found ${highPriorityClients.length} high-priority clients that could benefit from parallel execution.`,
            reasoning: 'High priority clients often have similar requirements and can be processed in parallel to reduce overall completion time.',
            pattern: `${highPriorityClients.length} clients with priority level ≥ 4 detected`,
            confidence: 0.85,
            impact: 'high',
            parameters: {
              clientIds: highPriorityClients.map(c => c.ClientID),
              maxConcurrent: Math.min(3, highPriorityClients.length)
            },
            suggestedRule: {
              type: 'coRun',
              name: 'High Priority Co-run',
              description: 'Allow high priority clients to run concurrently',
              parameters: {
                clientGroups: highPriorityClients.map(c => c.ClientID),
                maxConcurrent: Math.min(3, highPriorityClients.length)
              }
            }
          });
        }

        // Worker overload detection
        const overloadedWorkers = workers.filter(w => {
          const assignedTasks = tasks.filter(t => 
            t.RequiredSkills.some(skill => w.Skills.includes(skill))
          );
          return assignedTasks.length > w.MaxLoadPerPhase;
        });

        if (overloadedWorkers.length > 0) {
          basicRecommendations.push({
            id: 'basic-load-limit',
            type: 'loadLimit',
            title: 'Prevent Worker Overload',
            description: `${overloadedWorkers.length} workers may be overloaded. Load limits recommended.`,
            reasoning: 'Workers with too many assigned tasks may experience reduced efficiency and quality.',
            pattern: `${overloadedWorkers.length} workers with task count > MaxLoadPerPhase`,
            confidence: 0.92,
            impact: 'high',
            parameters: {
              workerGroup: 'all',
              maxLoad: Math.max(1, Math.floor(workers.reduce((sum, w) => sum + w.MaxLoadPerPhase, 0) / workers.length))
            },
            suggestedRule: {
              type: 'loadLimit',
              name: 'Prevent Worker Overload',
              description: 'Limit maximum concurrent tasks per worker'
            }
          });
        }

        // Skill gap analysis
        const allRequiredSkills = [...new Set(tasks.flatMap(t => t.RequiredSkills))];
        const availableSkills = [...new Set(workers.flatMap(w => w.Skills))];
        const missingSkills = allRequiredSkills.filter(skill => !availableSkills.includes(skill));

        if (missingSkills.length > 0) {
          basicRecommendations.push({
            id: 'basic-skill-gap',
            type: 'insight',
            title: 'Skill Coverage Gap Detected',
            description: `Missing skills: ${missingSkills.join(', ')}. Consider training or hiring.`,
            reasoning: 'Tasks requiring unavailable skills cannot be properly allocated.',
            pattern: `${missingSkills.length} required skills not available in worker pool`,
            confidence: 0.95,
            impact: 'medium',
            parameters: {
              missingSkills,
              affectedTasks: tasks.filter(t => t.RequiredSkills.some(skill => missingSkills.includes(skill))).length
            }
          });
        }
      }

      // Onboarding recommendation if no data
      if (clients.length === 0 || workers.length === 0 || tasks.length === 0) {
        basicRecommendations.push({
          id: 'basic-onboarding',
          type: 'insight',
          title: 'Upload Data to Get Started',
          description: 'Upload your client, worker, and task data to receive personalized AI recommendations.',
          reasoning: 'AI analysis requires complete data to provide meaningful recommendations.',
          pattern: 'Insufficient data for analysis',
          confidence: 1.0,
          impact: 'high',
          parameters: {
            missingData: [
              clients.length === 0 ? 'clients' : null,
              workers.length === 0 ? 'workers' : null,
              tasks.length === 0 ? 'tasks' : null
            ].filter(Boolean)
          }
        });
      }

      setRecommendations(basicRecommendations);
      setIsAnalyzing(false);
    }, 1000);
  };

  useEffect(() => {
    generateAIRecommendations();
  }, [clients.length, workers.length, tasks.length, businessRules.length]);

  const handleApplyRecommendation = (recommendation: EnhancedAIRecommendation) => {
    if (recommendation.suggestedRule) {
      const rule: BusinessRule = {
        id: `ai-${Date.now()}`,
        type: recommendation.suggestedRule.type as any,
        name: recommendation.suggestedRule.name || recommendation.title,
        description: recommendation.suggestedRule.description || recommendation.description,
        parameters: recommendation.suggestedRule.parameters || recommendation.parameters,
        priority: recommendation.suggestedRule.priority || (recommendation.impact === 'high' ? 8 : recommendation.impact === 'medium' ? 5 : 3),
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
    : recommendations.filter(r => r.impact === selectedCategory);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'coRun': return '🔗';
      case 'loadLimit': return '⚖️';
      case 'phaseWindow': return '📅';
      case 'slotRestriction': return '⏰';
      case 'insight': return '💡';
      default: return '🤖';
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
              <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white">
                🤖
              </span>
              Enhanced AI Recommendations ({recommendations.length})
            </h3>
            <p className="mt-2 text-slate-600">
              AI-powered analysis of your data patterns and optimization opportunities
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                aiEnabled 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              )}
            >
              {aiEnabled ? '🤖 AI Enhanced' : '🔧 Basic Mode'}
            </button>
            
            <button
              onClick={generateAIRecommendations}
              disabled={isAnalyzing}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                isAnalyzing
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              )}
            >
              {isAnalyzing ? 'Analyzing...' : '🔄 Refresh Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All', count: recommendations.length },
            { key: 'high', label: 'High Impact', count: recommendations.filter(r => r.impact === 'high').length },
            { key: 'medium', label: 'Medium Impact', count: recommendations.filter(r => r.impact === 'medium').length },
            { key: 'low', label: 'Low Impact', count: recommendations.filter(r => r.impact === 'low').length }
          ].map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key as any)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all',
                selectedCategory === category.key
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {category.label} {category.count > 0 && `(${category.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="p-6">
        {isAnalyzing ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">
              {aiEnabled ? 'AI is analyzing your data patterns...' : 'Analyzing data patterns...'}
            </p>
          </div>
        ) : filteredRecommendations.length > 0 ? (
          <div className="space-y-4">
            {filteredRecommendations.map((recommendation) => (
              <div key={recommendation.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
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
                          {Math.round(recommendation.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {recommendation.suggestedRule && (
                    <button
                      onClick={() => handleApplyRecommendation(recommendation)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                    >
                      Apply Rule
                    </button>
                  )}
                </div>
                
                <p className="text-slate-600 mb-3">{recommendation.description}</p>
                
                {aiEnabled && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Pattern Detected:</span>
                      <p className="text-slate-600">{recommendation.pattern}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">AI Reasoning:</span>
                      <p className="text-slate-600">{recommendation.reasoning}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-slate-600">No recommendations available.</p>
            <p className="text-sm text-slate-500 mt-2">
              Upload more data or adjust your filters to see AI suggestions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAIRecommendationsPanel;
