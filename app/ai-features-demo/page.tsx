/**
 * @fileoverview AI Features Demo Page
 * @description Showcase all Milestone 3 AI capabilities
 */

'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useDataStore } from '@/lib/store/data-store';
import NaturalLanguageDataModifier from '@/components/NaturalLanguageDataModifier';
import AIErrorCorrectionPanel from '@/components/AIErrorCorrectionPanel';
import EnhancedAIRecommendationsPanel from '@/components/EnhancedAIRecommendationsPanel';
import { testAIConnection } from '@/lib/ai-service';
import { cn } from '@/lib/utils';

// Import validation utilities
const ValidationPanel = dynamic(() => import('@/components/ValidationPanel'), {
  ssr: false
});

export default function AIFeaturesPage() {
  const [activeTab, setActiveTab] = useState<'modifier' | 'corrections' | 'recommendations'>('modifier');
  const [aiStatus, setAiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const { clients, workers, tasks, validationErrors } = useDataStore();

  // Test AI connection on component mount
  useState(() => {
    testAIConnection().then(connected => {
      setAiStatus(connected ? 'connected' : 'error');
    });
  });

  const tabs = [
    {
      id: 'modifier',
      label: 'Data Modification',
      icon: '✏️',
      description: 'Modify data using natural language commands'
    },
    {
      id: 'corrections',
      label: 'Error Correction',
      icon: '🔧',
      description: 'AI-powered error fixing suggestions'
    },
    {
      id: 'recommendations',
      label: 'Rule Recommendations',
      icon: '🤖',
      description: 'Intelligent business rule suggestions'
    }
  ] as const;

  const getDataStats = () => {
    return {
      clients: clients.length,
      workers: workers.length,
      tasks: tasks.length,
      errors: validationErrors.length
    };
  };

  const stats = getDataStats();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-4">

              AI Features Showcase
            </h1>
            <p className="mt-3 text-white/90 text-lg">
              Milestone 3: Advanced AI capabilities powered by Anthropic Claude
            </p>
          </div>
          
          {/* AI Status Indicator */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium',
              aiStatus === 'connected' ? 'bg-green-100 text-green-700' :
              aiStatus === 'error' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                aiStatus === 'connected' ? 'bg-green-500' :
                aiStatus === 'error' ? 'bg-red-500' :
                'bg-yellow-500 animate-pulse'
              )}></div>
              {aiStatus === 'connected' ? 'AI Connected' :
               aiStatus === 'error' ? 'AI Unavailable' :
               'Checking AI...'}
            </div>
          </div>
        </div>

        {/* Data Overview */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.clients}</div>
            <div className="text-white/80 text-sm">Clients</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.workers}</div>
            <div className="text-white/80 text-sm">Workers</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.tasks}</div>
            <div className="text-white/80 text-sm">Tasks</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.errors}</div>
            <div className="text-white/80 text-sm">Validation Errors</div>
          </div>
        </div>
      </div>

      {/* Feature Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 px-6 py-4 text-left border-b-2 transition-all',
                  activeTab === tab.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-transparent hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tab.icon}</span>
                  <div>
                    <div className={cn(
                      'font-semibold',
                      activeTab === tab.id ? 'text-purple-700' : 'text-slate-700'
                    )}>
                      {tab.label}
                    </div>
                    <div className="text-sm text-slate-500">{tab.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'modifier' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  🎯 Natural Language Data Modification
                </h3>
                <p className="text-blue-700 text-sm">
                  Use plain English to modify your data. Examples: "Set all Enterprise clients to priority 5", 
                  "Add TypeScript skill to React developers", "Increase duration by 1 for Testing tasks".
                </p>
              </div>
              <NaturalLanguageDataModifier />
            </div>
          )}

          {activeTab === 'corrections' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-2">
                  🔧 AI Error Correction
                </h3>
                <p className="text-orange-700 text-sm">
                  AI analyzes validation errors and provides smart fix suggestions with one-click application.
                  {stats.errors === 0 ? ' No errors found - upload some data with issues to see this in action!' : 
                   ` Found ${stats.errors} validation errors that can be automatically fixed.`}
                </p>
              </div>
              <AIErrorCorrectionPanel errors={validationErrors} />
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">
                  🤖 Enhanced AI Rule Recommendations
                </h3>
                <p className="text-purple-700 text-sm">
                  Advanced pattern analysis using AI to recommend business rules based on your data patterns.
                  The AI looks for co-run opportunities, load balancing needs, and optimization possibilities.
                </p>
              </div>
              <EnhancedAIRecommendationsPanel />
            </div>
          )}
        </div>
      </div>

      
      
    </div>
  );
}
