/**
 * @fileoverview Main Dashboard Component
 * @description Complete data management dashboard with file upload, tabs, validation panel, and responsive design
 */

'use client';

import React, { useState } from 'react';
import { DataTabs } from './DataTabs';
import DataGrid from './DataGrid';
import ValidationPanel from './ValidationPanel';
import DragDropFileUpload from './DragDropFileUpload';
import NaturalLanguageSearch from './NaturalLanguageSearch';
import NaturalLanguageRuleConverter from './NaturalLanguageRuleConverter';
import AIRecommendationsPanel from './AIRecommendationsPanel';
import AdvancedPrioritizationBuilder from './AdvancedPrioritizationBuilder';
import { useDataStore } from '@/lib/store/data-store';
import { EntityTypeName } from '@/types/entities';
import { cn } from '@/lib/utils';

export const DataTabsDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EntityTypeName>('client');
  const [showValidationPanel, setShowValidationPanel] = useState(true);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showBusinessRules, setShowBusinessRules] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [showPrioritization, setShowPrioritization] = useState(false);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  
  const { 
    clients, 
    workers, 
    tasks,
    validationErrors,
    businessRules,
    actions,
    fileUpload,
    filters
  } = useDataStore();

  // Get current entity data based on active tab with search filtering
  const getCurrentData = () => {
    let data;
    switch (activeTab) {
      case 'client':
        data = clients;
        break;
      case 'worker':
        data = workers;
        break;
      case 'task':
        data = tasks;
        break;
      default:
        return [];
    }

    // Apply search filters if they exist
    if (filters.searchResults && filters.searchResults.length > 0) {
      const idField = activeTab === 'client' ? 'ClientID' : 
                     activeTab === 'worker' ? 'WorkerID' : 'TaskID';
      data = data.filter((item: any) => filters.searchResults.includes(item[idField]));
    }

    return data;
  };

  const currentData = getCurrentData();
  const totalEntities = clients.length + workers.length + tasks.length;
  const totalErrors = validationErrors.filter(e => e.severity === 'error').length;
  const totalWarnings = validationErrors.filter(e => e.severity === 'warning').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  🧪 Data Alchemist Dashboard
                </h1>
                <p className="mt-2 text-slate-300">
                  Complete data management with file upload, validation, and real-time editing
                </p>
                
                {/* Stats Summary in Header */}
                <div className="mt-4 flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-indigo-700 font-medium">
                      {totalEntities} Total Entities
                    </span>
                  </div>
                  {totalErrors > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-700 font-medium">
                        {totalErrors} Errors
                      </span>
                    </div>
                  )}
                  {totalWarnings > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-amber-700 font-medium">
                        {totalWarnings} Warnings
                      </span>
                    </div>
                  )}
                  {businessRules.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-cyan-50 rounded-full">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                      <span className="text-cyan-700 font-medium">
                        {businessRules.filter(r => r.active).length}/{businessRules.length} Rules Active
                      </span>
                    </div>
                  )}
                  {fileUpload.isUploading && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                      <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span className="text-blue-700 font-medium">
                        Uploading {Math.round(fileUpload.progress)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Action Buttons */}
                <button
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className={cn(
                    'px-4 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm',
                    showFileUpload
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 focus:ring-emerald-500 shadow-emerald-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 focus:ring-slate-500'
                  )}
                >
                  {showFileUpload ? '📤 Hide Upload' : '📤 Show Upload'}
                </button>
                
                <button
                  onClick={actions.addSampleData}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-medium
                            hover:from-indigo-600 hover:to-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 
                            focus:ring-indigo-500 focus:ring-offset-2 shadow-sm shadow-indigo-200"
                >
                  Add Sample Data
                </button>
                
                <button
                  onClick={actions.exportAll}
                  disabled={totalEntities === 0}
                  className={cn(
                    'px-4 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm',
                    totalEntities === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500 shadow-green-200'
                  )}
                >
                  Export All Data
                </button>
                
                <button
                  onClick={actions.clearAllData}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium
                            hover:from-red-600 hover:to-rose-700 transition-all duration-200 focus:outline-none focus:ring-2 
                            focus:ring-red-500 focus:ring-offset-2 shadow-sm shadow-red-200"
                >
                  Clear All Data
                </button>
                
                <button
                  onClick={() => setShowValidationPanel(!showValidationPanel)}
                  className={cn(
                    'px-4 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm',
                    showValidationPanel
                      ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700 focus:ring-purple-500 shadow-purple-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 focus:ring-slate-500'
                  )}
                >
                  {showValidationPanel ? '🔍 Hide Validation' : '🔍 Show Validation'}
                </button>

                <button
                  onClick={() => setShowBusinessRules(!showBusinessRules)}
                  className={cn(
                    'px-4 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm',
                    showBusinessRules
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500 shadow-cyan-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 focus:ring-slate-500'
                  )}
                >
                  {showBusinessRules ? '🤖 Hide AI Rules' : '🤖 AI Rules'}
                </button>

                <button
                  onClick={() => setShowAIRecommendations(!showAIRecommendations)}
                  className={cn(
                    'px-4 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm',
                    showAIRecommendations
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 focus:ring-amber-500 shadow-amber-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 focus:ring-slate-500'
                  )}
                >
                  {showAIRecommendations ? '💡 Hide Suggestions' : '💡 AI Suggestions'}
                </button>

                <button
                  onClick={() => setShowPrioritization(!showPrioritization)}
                  className={cn(
                    'px-4 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm',
                    showPrioritization
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 focus:ring-purple-500 shadow-purple-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 focus:ring-slate-500'
                  )}
                >
                  {showPrioritization ? '⚖️ Hide Weights' : '⚖️ Prioritization'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Natural Language Search Bar */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-slate-700 mb-1">🤖 AI-Powered Search</h3>
            <p className="text-sm text-slate-600">Ask questions in plain English to find and filter your data</p>
          </div>
          <NaturalLanguageSearch
            onResultsChange={setHasSearchResults}
            className="w-full"
          />
          {hasSearchResults && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                💡 <strong>Tip:</strong> Search results are highlighted in the data grid below. Use the tabs to view specific entity types.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload Section */}
        {showFileUpload && (
          <div className="mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📤</span>
                </div>
                <span>Upload Data Files</span>
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Client Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">👥</span>
                    </div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                      Client Data
                    </h3>
                  </div>
                  <DragDropFileUpload
                    entityType="client"
                    className="h-36 border-2 border-dashed border-blue-300 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                  />
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Upload CSV/XLSX files containing client information and business data
                  </p>
                </div>
                
                {/* Worker Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">👷</span>
                    </div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                      Worker Data
                    </h3>
                  </div>
                  <DragDropFileUpload
                    entityType="worker"
                    className="h-36 border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200"
                  />
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Upload CSV/XLSX files containing worker profiles and skill information
                  </p>
                </div>
                
                {/* Task Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📋</span>
                    </div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent">
                      Task Data
                    </h3>
                  </div>
                  <DragDropFileUpload
                    entityType="task"
                    className="h-36 border-2 border-dashed border-purple-300 bg-purple-50/50 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
                  />
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Upload CSV/XLSX files containing task definitions and requirements
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Rules and AI Section */}
        {(showBusinessRules || showAIRecommendations || showPrioritization) && (
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {/* Natural Language Rule Converter */}
              {showBusinessRules && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🤖</span>
                    </div>
                    <span>AI Rule Builder</span>
                  </h2>
                  
                  <div className="mb-6">
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Create business rules using natural language. Type rules like "Client A must run before Client B" 
                      or "Workers in Frontend group can only work on UI tasks".
                    </p>
                  </div>
                  
                  <NaturalLanguageRuleConverter />
                  
                  {businessRules.length > 0 && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-700">Active Rules ({businessRules.filter(r => r.active).length})</h4>
                        <a 
                          href="/business-rules-demo" 
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Manage All →
                        </a>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {businessRules.slice(0, 3).map((rule) => (
                          <div key={rule.id} className="flex items-center justify-between text-sm">
                            <span className={rule.active ? 'text-slate-700' : 'text-slate-400'}>
                              {rule.name}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {rule.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                        {businessRules.length > 3 && (
                          <div className="text-xs text-slate-500 text-center pt-2">
                            +{businessRules.length - 3} more rules
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Recommendations Panel */}
              {showAIRecommendations && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">💡</span>
                    </div>
                    <span>AI Recommendations</span>
                  </h2>
                  
                  <AIRecommendationsPanel />
                </div>
              )}

              {/* Prioritization & Weights */}
              {showPrioritization && (
                <div className={cn(
                  "bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8",
                  (showBusinessRules || showAIRecommendations) ? "xl:col-span-1" : "lg:col-span-2"
                )}>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">⚖️</span>
                    </div>
                    <span>Prioritization</span>
                  </h2>
                  
                  <div className="mb-6">
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Configure priority profiles and weighting criteria for intelligent resource allocation.
                    </p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    <AdvancedPrioritizationBuilder />
                  </div>
                  
                  <div className="mt-6 p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-700">Full Configuration</span>
                      <a 
                        href="/prioritization-demo" 
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Open Full Editor →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Data Management Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Data Grid Area */}
          <div className={cn(
            'bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden',
            showValidationPanel ? 'lg:col-span-2' : 'lg:col-span-3'
          )}>
            {/* Data Tabs Navigation */}
            <DataTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Data Grid Content */}
            <div className="p-8">
              {totalEntities === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                    <span className="text-4xl">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">
                    No Data Available
                  </h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Upload files or load sample data to get started with the data management platform and explore all features.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={actions.addSampleData}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-medium
                                hover:from-indigo-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-indigo-200"
                    >
                      Load Sample Data
                    </button>
                    <button
                      onClick={() => setShowFileUpload(true)}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium
                                hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg shadow-emerald-200"
                    >
                      Upload Files
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg',
                        activeTab === 'client' && 'bg-gradient-to-r from-blue-500 to-indigo-600',
                        activeTab === 'worker' && 'bg-gradient-to-r from-emerald-500 to-green-600',
                        activeTab === 'task' && 'bg-gradient-to-r from-purple-500 to-violet-600'
                      )}>
                        {activeTab === 'client' && '👥'} 
                        {activeTab === 'worker' && '👷'} 
                        {activeTab === 'task' && '📋'}
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Data
                        <span className="ml-2 text-slate-500 font-normal">({currentData.length} items)</span>
                      </h3>
                    </div>
                    
                    {fileUpload.isUploading && (
                      <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-xl">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <span className="text-blue-700 font-medium">
                          Uploading... {Math.round(fileUpload.progress)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50/50 rounded-xl border border-slate-200/60">
                    <DataGrid
                      entityType={activeTab}
                      data={currentData as any}
                      className="h-96"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation Panel */}
          {showValidationPanel && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🔍</span>
                    </div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent">
                      Validation Status
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {totalErrors > 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                        {totalErrors} errors
                      </span>
                    )}
                    {totalWarnings > 0 && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                        {totalWarnings} warnings
                      </span>
                    )}
                    {totalErrors === 0 && totalWarnings === 0 && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        All Good
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="h-96 overflow-hidden">
                <ValidationPanel />
              </div>
            </div>
          )}
        </div>

        {/* Entity Stats Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl">👥</span>
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Clients</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  {clients.length}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {validationErrors.filter(e => e.entityId?.startsWith('C')).length} validation issues
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl">👷</span>
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Workers</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                  {workers.length}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {validationErrors.filter(e => e.entityId?.startsWith('W')).length} validation issues
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl">📋</span>
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Tasks</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent">
                  {tasks.length}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {validationErrors.filter(e => e.entityId?.startsWith('T')).length} validation issues
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTabsDemo;
