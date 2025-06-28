/**
 * @fileoverview Prioritization & Weights Builder Component
 * @description Interactive UI for creating and managing priority profiles and weighting rules
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { PriorityProfile, PriorityFactor, WeightingRule, PriorityFactorType } from '@/types/entities';
import { useDataStore } from '@/lib/store/data-store';

interface PrioritizationBuilderProps {
  className?: string;
}

// Available priority factor types with configurations
const PRIORITY_FACTOR_TYPES: Record<PriorityFactorType, {
  label: string;
  description: string;
  icon: string;
  defaultWeight: number;
  configFields?: Array<{
    name: string;
    type: 'number' | 'select' | 'boolean';
    label: string;
    options?: string[];
    default?: any;
  }>;
}> = {
  client_priority: {
    label: 'Client Priority',
    description: 'Weight based on client priority level (1-5)',
    icon: '👑',
    defaultWeight: 25
  },
  task_duration: {
    label: 'Task Duration',
    description: 'Prefer shorter or longer duration tasks',
    icon: '⏱️',
    defaultWeight: 15,
    configFields: [
      { name: 'preference', type: 'select', label: 'Preference', options: ['shorter', 'longer'], default: 'shorter' }
    ]
  },
  worker_qualification: {
    label: 'Worker Qualification',
    description: 'Weight based on worker qualification level',
    icon: '🎓',
    defaultWeight: 20
  },
  deadline_urgency: {
    label: 'Deadline Urgency',
    description: 'Higher priority for tasks with tight deadlines',
    icon: '🚨',
    defaultWeight: 15
  },
  skill_match_score: {
    label: 'Skill Match Score',
    description: 'How well worker skills match task requirements',
    icon: '🎯',
    defaultWeight: 25
  },
  phase_preference: {
    label: 'Phase Preference',
    description: 'Preference for specific phases',
    icon: '📅',
    defaultWeight: 10
  },
  resource_availability: {
    label: 'Resource Availability',
    description: 'Worker availability in specific time slots',
    icon: '📋',
    defaultWeight: 20
  },
  business_value: {
    label: 'Business Value',
    description: 'Expected business value or revenue impact',
    icon: '💰',
    defaultWeight: 15,
    configFields: [
      { name: 'valueMetric', type: 'select', label: 'Value Metric', options: ['revenue', 'strategic', 'cost_savings'], default: 'revenue' }
    ]
  },
  custom: {
    label: 'Custom Factor',
    description: 'Define your own priority calculation',
    icon: '⚙️',
    defaultWeight: 10,
    configFields: [
      { name: 'formula', type: 'select', label: 'Formula', options: ['linear', 'exponential', 'threshold'], default: 'linear' }
    ]
  },
  fairness_constraint: {
    label: 'Fairness Constraint',
    description: 'Ensure fair distribution of tasks across workers',
    icon: '⚖️',
    defaultWeight: 15,
    configFields: [
      { name: 'method', type: 'select', label: 'Method', options: ['equal_distribution', 'skill_based', 'workload_based'], default: 'equal_distribution' }
    ]
  },
  load_balancing: {
    label: 'Load Balancing',
    description: 'Balance workload across available resources',
    icon: '📊',
    defaultWeight: 20,
    configFields: [
      { name: 'strategy', type: 'select', label: 'Strategy', options: ['round_robin', 'least_loaded', 'capacity_based'], default: 'least_loaded' }
    ]
  },
  fulfillment_rate: {
    label: 'Fulfillment Rate',
    description: 'Consider historical task completion rates',
    icon: '📈',
    defaultWeight: 15,
    configFields: [
      { name: 'timeWindow', type: 'select', label: 'Time Window', options: ['7_days', '30_days', '90_days'], default: '30_days' }
    ]
  }
};

export default function PrioritizationBuilder({ className }: PrioritizationBuilderProps) {
  const { priorityProfiles, weightingRules, activePriorityProfile, actions } = useDataStore();
  const [selectedProfile, setSelectedProfile] = useState<PriorityProfile | null>(null);
  const [editingFactor, setEditingFactor] = useState<PriorityFactor | null>(null);
  const [showWeightingRules, setShowWeightingRules] = useState(false);

  const activeProfile = priorityProfiles.find(p => p.id === activePriorityProfile);

  // Create new priority profile
  const createNewProfile = () => {
    const newProfile: PriorityProfile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: 'New Priority Profile',
      description: 'Custom priority profile',
      isDefault: false,           // Add this
      isActive: false,            // Add this  
      isPreset: false,
      comparisonMethod: 'slider',
      applicableScenarios: [],    // Add this
      createdBy: 'user',          // Add this
      factors: [
        {
          id: `factor_${Date.now()}_1`,
          type: 'client_priority',
          name: 'Client Priority',
          description: PRIORITY_FACTOR_TYPES.client_priority.description,
          weight: 25,
          enabled: true,
          configuration: {},
          createdAt: new Date(),
          modifiedAt: new Date()
        },
        {
          id: `factor_${Date.now()}_2`,
          type: 'skill_match_score',
          name: 'Skill Match',
          description: PRIORITY_FACTOR_TYPES.skill_match_score.description,
          weight: 25,
          enabled: true,
          configuration: {},
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      ],
      // Add other required properties based on your PriorityProfile interface
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    actions.addPriorityProfile(newProfile);
    setSelectedProfile(newProfile);
  };

  // Add factor to profile
  const addFactor = (type: PriorityFactorType) => {
    if (!selectedProfile) return;

    const config = PRIORITY_FACTOR_TYPES[type];
    const newFactor: PriorityFactor = {
      id: `factor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: config.label,
      description: config.description,
      weight: config.defaultWeight,
      enabled: true,
      configuration: {},
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    const updatedProfile = {
      ...selectedProfile,
      factors: [...selectedProfile.factors, newFactor],
      modifiedAt: new Date()
    };

    actions.updatePriorityProfile(selectedProfile.id, updatedProfile);
    setSelectedProfile(updatedProfile);
  };

  // Update factor weight and normalize
  const updateFactorWeight = (factorId: string, newWeight: number) => {
    if (!selectedProfile) return;

    const updatedFactors = selectedProfile.factors.map(f => 
      f.id === factorId ? { ...f, weight: newWeight, modifiedAt: new Date() } : f
    );

    // Normalize weights to sum to 100
    const totalWeight = updatedFactors.reduce((sum, f) => sum + (f.enabled ? f.weight : 0), 0);
    if (totalWeight !== 100 && totalWeight > 0) {
      const normalizedFactors = updatedFactors.map(f => ({
        ...f,
        weight: f.enabled ? Math.round((f.weight / totalWeight) * 100) : f.weight
      }));
      
      const updatedProfile = {
        ...selectedProfile,
        factors: normalizedFactors,
        modifiedAt: new Date()
      };
      
      actions.updatePriorityProfile(selectedProfile.id, updatedProfile);
      setSelectedProfile(updatedProfile);
    }
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
              <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                ⚖️
              </span>
              Prioritization & Weights
            </h2>
            <p className="mt-2 text-slate-600">
              Define how resource allocation decisions are prioritized
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWeightingRules(!showWeightingRules)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                showWeightingRules
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-orange-50'
              )}
            >
              Weighting Rules
            </button>
            
            <button
              onClick={createNewProfile}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + New Profile
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Profile List */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700">Priority Profiles</h3>
          
          {priorityProfiles.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚖️</span>
              </div>
              <p className="text-slate-600 mb-4">No priority profiles yet</p>
              <button
                onClick={createNewProfile}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Create your first priority profile
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {priorityProfiles.map(profile => (
                <div
                  key={profile.id}
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-all',
                    selectedProfile?.id === profile.id
                      ? 'border-indigo-200 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300',
                    profile.id === activePriorityProfile && 'ring-2 ring-green-200'
                  )}
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-800">{profile.name}</h4>
                      <p className="text-sm text-slate-600">{profile.factors.length} factors</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {profile.id === activePriorityProfile && (
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                      
                      {profile.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Editor */}
        <div className="lg:col-span-2">
          {selectedProfile ? (
            <div className="space-y-6">
              {/* Profile Details */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-800">{selectedProfile.name}</h3>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => actions.setActivePriorityProfile(selectedProfile.id)}
                      disabled={selectedProfile.id === activePriorityProfile}
                      className={cn(
                        'px-3 py-1 text-sm rounded-lg transition-colors',
                        selectedProfile.id === activePriorityProfile
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      )}
                    >
                      {selectedProfile.id === activePriorityProfile ? 'Active' : 'Set Active'}
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">{selectedProfile.description}</p>
                
                {/* Weight Distribution Chart */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Weight Distribution</span>
                    <span className="text-slate-500">
                      {selectedProfile.factors.reduce((sum, f) => sum + (f.enabled ? f.weight : 0), 0)}%
                    </span>
                  </div>
                  
                  <div className="flex h-2 bg-slate-200 rounded-full overflow-hidden">
                    {selectedProfile.factors.filter(f => f.enabled).map((factor, index) => (
                      <div
                        key={factor.id}
                        className={cn(
                          'h-full transition-all',
                          `bg-${['indigo', 'purple', 'blue', 'green', 'yellow', 'red', 'pink'][index % 7]}-500`
                        )}
                        style={{ width: `${factor.weight}%` }}
                        title={`${factor.name}: ${factor.weight}%`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority Factors */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-700">Priority Factors</h4>
                  
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addFactor(e.target.value as PriorityFactorType);
                        e.target.value = '';
                      }
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">+ Add Factor</option>
                    {Object.entries(PRIORITY_FACTOR_TYPES).map(([type, config]) => (
                      <option key={type} value={type}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {selectedProfile.factors.map((factor) => (
                    <div
                      key={factor.id}
                      className="border border-slate-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{PRIORITY_FACTOR_TYPES[factor.type]?.icon}</span>
                          <div>
                            <h5 className="font-medium text-slate-800">{factor.name}</h5>
                            <p className="text-sm text-slate-600">{factor.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={factor.enabled}
                              onChange={(e) => {
                                // Update factor enabled state
                                const updatedFactors = selectedProfile.factors.map(f =>
                                  f.id === factor.id 
                                    ? { ...f, enabled: e.target.checked, modifiedAt: new Date() }
                                    : f
                                );
                                
                                actions.updatePriorityProfile(selectedProfile.id, {
                                  factors: updatedFactors,
                                  modifiedAt: new Date()
                                });
                                
                                setSelectedProfile({
                                  ...selectedProfile,
                                  factors: updatedFactors
                                });
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-slate-600">Enabled</span>
                          </label>
                        </div>
                      </div>
                      
                      {factor.enabled && (
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Weight: {factor.weight}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={factor.weight}
                              onChange={(e) => updateFactorWeight(factor.id, parseInt(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-slate-600">Select a priority profile to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
