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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              {/* Title Section */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">DA</span>
                  </div>
                  Data Alchemist Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Intelligent data management with AI-powered validation and processing
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-blue-700 font-medium">
                    {totalEntities} Entities
                  </span>
                </div>
                {totalErrors > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-700 font-medium">
                      {totalErrors} Errors
                    </span>
                  </div>
                )}
                {totalWarnings > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-700 font-medium">
                      {totalWarnings} Warnings
                    </span>
                  </div>
                )}
                {businessRules.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">
                      {businessRules.filter(r => r.active).length} Rules
                    </span>
                  </div>
                )}
                {fileUpload.isUploading && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                    <div className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-blue-700 font-medium">
                      {Math.round(fileUpload.progress)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  showFileUpload
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                )}
              >
                {showFileUpload ? 'Hide' : 'Show'} Upload
              </button>
              
              <button
                onClick={actions.addSampleData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200"
              >
                Sample Data
              </button>
              
              <button
                onClick={actions.exportAll}
                disabled={totalEntities === 0}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  totalEntities === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                )}
              >
                Export Data
              </button>
              
              <button
                onClick={actions.clearAllData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200"
              >
                Clear All
              </button>
              
              <div className="w-px h-6 bg-gray-300 mx-2"></div>
              
              <button
                onClick={() => setShowValidationPanel(!showValidationPanel)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  showValidationPanel
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                )}
              >
                Validation
              </button>

              <button
                onClick={() => setShowBusinessRules(!showBusinessRules)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  showBusinessRules
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                )}
              >
                AI Rules
              </button>

              <button
                onClick={() => setShowAIRecommendations(!showAIRecommendations)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  showAIRecommendations
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                )}
              >
                Suggestions
              </button>

              <button
                onClick={() => setShowPrioritization(!showPrioritization)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  showPrioritization
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                )}
              >
                Prioritization
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Natural Language Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI-Powered Search
            </h3>
            <p className="text-sm text-gray-600">
              Ask questions in plain English to find and filter your data
            </p>
          </div>
          <NaturalLanguageSearch
            onResultsChange={setHasSearchResults}
            className="w-full"
          />
          {hasSearchResults && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>Tip:</strong> Search results are highlighted in the data grid below.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload Section */}
        {showFileUpload && (
          <div className="mb-[900px]">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">UP</span>
                </div>
                Upload Data Files
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">C</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Client Data</h3>
                  </div>
                  <DragDropFileUpload
                    entityType="client"
                    className="h-32 border-2 border-dashed border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all duration-200 rounded-lg"
                  />
                  <p className="text-sm text-gray-600">
                    Upload CSV/XLSX files containing client information
                  </p>
                </div>
                
                {/* Worker Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">W</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Worker Data</h3>
                  </div>
                  <DragDropFileUpload
                    entityType="worker"
                    className="h-32 border-2 border-dashed border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all duration-200 rounded-lg"
                  />
                  <p className="text-sm text-gray-600">
                    Upload CSV/XLSX files containing worker profiles
                  </p>
                </div>
                
                {/* Task Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Task Data</h3>
                  </div>
                  <DragDropFileUpload
                    entityType="task"
                    className="h-32 border-2 border-dashed border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all duration-200 rounded-lg"
                  />
                  <p className="text-sm text-gray-600">
                    Upload CSV/XLSX files containing task definitions
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Rules and AI Section */}
        {(showBusinessRules || showAIRecommendations || showPrioritization) && (
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Natural Language Rule Converter */}
              {showBusinessRules && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    AI Rule Builder
                  </h2>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 text-sm">
                      Create business rules using natural language. Type rules like "Client A must run before Client B".
                    </p>
                  </div>
                  
                  <NaturalLanguageRuleConverter />
                  
                  {businessRules.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Active Rules ({businessRules.filter(r => r.active).length})</h4>
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
                            <span className={rule.active ? 'text-gray-700' : 'text-gray-400'}>
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
                          <div className="text-xs text-gray-500 text-center pt-2">
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">REC</span>
                    </div>
                    AI Recommendations
                  </h2>
                  
                  <AIRecommendationsPanel />
                </div>
              )}

              {/* Prioritization & Weights */}
              {showPrioritization && (
                <div className={cn(
                  "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                  (showBusinessRules || showAIRecommendations) ? "xl:col-span-1" : "lg:col-span-2"
                )}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">PRI</span>
                    </div>
                    Prioritization
                  </h2>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 text-sm">
                      Configure priority profiles and weighting criteria for intelligent resource allocation.
                    </p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    <AdvancedPrioritizationBuilder />
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Full Configuration</span>
                      <a 
                        href="/prioritization-demo" 
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Data Grid Area */}
          <div className={cn(
            'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
            showValidationPanel ? 'lg:col-span-2' : 'lg:col-span-3'
          )}>
            {/* Data Tabs Navigation */}
            <DataTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Data Grid Content */}
            <div className="p-6">
              {totalEntities === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-lg">DATA</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No Data Available
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Upload files or load sample data to get started with the data management platform and explore all features.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={actions.addSampleData}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
                    >
                      Load Sample Data
                    </button>
                    <button
                      onClick={() => setShowFileUpload(true)}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200"
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
                        'w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold',
                        activeTab === 'client' && 'bg-blue-600',
                        activeTab === 'worker' && 'bg-blue-600',
                        activeTab === 'task' && 'bg-blue-600'
                      )}>
                        {activeTab === 'client' && 'C'} 
                        {activeTab === 'worker' && 'W'} 
                        {activeTab === 'task' && 'T'}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Data
                        <span className="ml-2 text-gray-500 font-normal">({currentData.length} items)</span>
                      </h3>
                    </div>
                    
                    {fileUpload.isUploading && (
                      <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="text-blue-700 font-medium">
                          Uploading... {Math.round(fileUpload.progress)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg border border-gray-200">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">VAL</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
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
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                        {totalWarnings} warnings
                      </span>
                    )}
                    {totalErrors === 0 && totalWarnings === 0 && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">C</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900">
                  {clients.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {validationErrors.filter(e => e.entityId?.startsWith('C')).length} validation issues
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">W</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Workers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {workers.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {validationErrors.filter(e => e.entityId?.startsWith('W')).length} validation issues
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">T</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">
                  {tasks.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">
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
