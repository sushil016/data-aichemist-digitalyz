/**
 * @fileoverview Advanced Prioritization & Weights Builder
 * @description Comprehensive interface for configuring resource allocation priorities with multiple input methods
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useDataStore } from '@/lib/store/data-store';
import { PriorityProfile, PriorityFactor, WeightingRule, PriorityFactorType, ComparisonMethod, PairwiseComparison } from '@/types/entities';
import { cn } from '@/lib/utils';

// Preset profile templates
const PRESET_PROFILES: Omit<PriorityProfile, 'id' | 'createdAt' | 'modifiedAt'>[] = [
  {
    name: "Maximize Fulfillment",
    description: "Prioritize fulfilling as many client requests as possible",
    factors: [
      { id: 'fulfillment', type: 'fulfillment_rate', name: 'Fulfillment Rate', description: 'Priority on completing client requests', weight: 40, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'client_priority', type: 'client_priority', name: 'Client Priority Level', description: 'Weight based on client priority', weight: 30, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'skill_match', type: 'skill_match_score', name: 'Skill Match Quality', description: 'How well worker skills match task requirements', weight: 20, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'deadline', type: 'deadline_urgency', name: 'Deadline Urgency', description: 'Time sensitivity of tasks', weight: 10, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() }
    ],
    isDefault: false,
    isActive: false,
    isPreset: true,
    comparisonMethod: 'slider',
    applicableScenarios: ['high_demand', 'customer_satisfaction'],
    createdBy: 'ai'
  },
  {
    name: "Fair Distribution",
    description: "Ensure equitable workload distribution across all workers",
    factors: [
      { id: 'fairness', type: 'fairness_constraint', name: 'Fairness Constraint', description: 'Ensure equitable distribution', weight: 35, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'load_balance', type: 'load_balancing', name: 'Load Balancing', description: 'Distribute work evenly', weight: 25, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'worker_qual', type: 'worker_qualification', name: 'Worker Qualification', description: 'Consider worker experience level', weight: 25, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'resource_avail', type: 'resource_availability', name: 'Resource Availability', description: 'Worker availability and capacity', weight: 15, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() }
    ],
    isDefault: false,
    isActive: false,
    isPreset: true,
    comparisonMethod: 'slider',
    applicableScenarios: ['team_harmony', 'sustainable_workload'],
    createdBy: 'ai'
  },
  {
    name: "Minimize Workload",
    description: "Optimize for efficient resource utilization and minimal total effort",
    factors: [
      { id: 'efficiency', type: 'resource_availability', name: 'Resource Efficiency', description: 'Maximize resource utilization', weight: 40, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'duration', type: 'task_duration', name: 'Task Duration', description: 'Prefer shorter tasks when possible', weight: 25, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'phase_pref', type: 'phase_preference', name: 'Phase Preference', description: 'Optimize phase scheduling', weight: 20, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'skill_match', type: 'skill_match_score', name: 'Skill Match Quality', description: 'Assign tasks to best-suited workers', weight: 15, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() }
    ],
    isDefault: false,
    isActive: false,
    isPreset: true,
    comparisonMethod: 'slider',
    applicableScenarios: ['resource_optimization', 'cost_reduction'],
    createdBy: 'ai'
  },
  {
    name: "Business Value Focus",
    description: "Prioritize high-value clients and strategic initiatives",
    factors: [
      { id: 'business_value', type: 'business_value', name: 'Business Value', description: 'Strategic importance and revenue impact', weight: 45, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'client_priority', type: 'client_priority', name: 'Client Priority Level', description: 'Tier-based client importance', weight: 30, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'deadline', type: 'deadline_urgency', name: 'Deadline Urgency', description: 'Time-critical deliverables', weight: 15, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() },
      { id: 'worker_qual', type: 'worker_qualification', name: 'Worker Qualification', description: 'Assign best workers to high-value work', weight: 10, enabled: true, configuration: {}, createdAt: new Date(), modifiedAt: new Date() }
    ],
    isDefault: false,
    isActive: false,
    isPreset: true,
    comparisonMethod: 'slider',
    applicableScenarios: ['strategic_focus', 'revenue_maximization'],
    createdBy: 'ai'
  }
];

const PRIORITY_FACTOR_TYPES: Record<PriorityFactorType, {
  label: string;
  description: string;
  icon: string;
  defaultWeight: number;
  category: 'client' | 'worker' | 'task' | 'system';
}> = {
  client_priority: { label: 'Client Priority Level', description: 'Importance based on client tier/priority', icon: '👑', defaultWeight: 25, category: 'client' },
  task_duration: { label: 'Task Duration', description: 'Time required to complete tasks', icon: '⏱️', defaultWeight: 15, category: 'task' },
  worker_qualification: { label: 'Worker Qualification', description: 'Experience and skill level of workers', icon: '🎓', defaultWeight: 20, category: 'worker' },
  deadline_urgency: { label: 'Deadline Urgency', description: 'Time sensitivity and deadline pressure', icon: '🚨', defaultWeight: 20, category: 'task' },
  skill_match_score: { label: 'Skill Match Quality', description: 'How well worker skills align with task requirements', icon: '🎯', defaultWeight: 25, category: 'system' },
  phase_preference: { label: 'Phase Preference', description: 'Preferred timing and scheduling phases', icon: '📅', defaultWeight: 10, category: 'task' },
  resource_availability: { label: 'Resource Availability', description: 'Worker capacity and availability', icon: '⚡', defaultWeight: 20, category: 'worker' },
  business_value: { label: 'Business Value', description: 'Strategic importance and revenue impact', icon: '💰', defaultWeight: 30, category: 'client' },
  fairness_constraint: { label: 'Fairness Constraint', description: 'Ensure equitable work distribution', icon: '⚖️', defaultWeight: 15, category: 'system' },
  load_balancing: { label: 'Load Balancing', description: 'Distribute workload evenly across resources', icon: '📊', defaultWeight: 15, category: 'system' },
  fulfillment_rate: { label: 'Fulfillment Rate', description: 'Priority on completing client requests', icon: '✅', defaultWeight: 25, category: 'system' },
  custom: { label: 'Custom Factor', description: 'User-defined priority factor', icon: '🔧', defaultWeight: 10, category: 'system' }
};

interface AdvancedPrioritizationBuilderProps {
  className?: string;
}

const AdvancedPrioritizationBuilder: React.FC<AdvancedPrioritizationBuilderProps> = ({ className }) => {
  const { priorityProfiles, activePriorityProfile, actions } = useDataStore();
  const [activeTab, setActiveTab] = useState<'profiles' | 'builder' | 'matrix' | 'export'>('profiles');
  const [selectedProfile, setSelectedProfile] = useState<PriorityProfile | null>(null);
  const [comparisonMethod, setComparisonMethod] = useState<ComparisonMethod>('slider');
  const [editingFactor, setEditingFactor] = useState<string | null>(null);
  const [draggedFactor, setDraggedFactor] = useState<string | null>(null);
  const [pairwiseData, setPairwiseData] = useState<PairwiseComparison[]>([]);

  // Initialize preset profiles on mount
  useEffect(() => {
    if (priorityProfiles.length === 0) {
      PRESET_PROFILES.forEach(preset => {
        const profile: PriorityProfile = {
          ...preset,
          id: `preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`,
          createdAt: new Date(),
          modifiedAt: new Date()
        };
        actions.addPriorityProfile(profile);
      });
    }
  }, []);

  const createNewProfile = (fromPreset?: typeof PRESET_PROFILES[0]) => {
    const newProfile: PriorityProfile = {
      id: `profile-${Date.now()}`,
      name: fromPreset?.name ? `${fromPreset.name} (Copy)` : 'New Priority Profile',
      description: fromPreset?.description || 'Custom priority profile',
      factors: fromPreset?.factors || [],
      isDefault: false,
      isActive: false,
      isPreset: false,
      comparisonMethod: 'slider',
      applicableScenarios: fromPreset?.applicableScenarios || [],
      createdBy: 'user',
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    actions.addPriorityProfile(newProfile);
    setSelectedProfile(newProfile);
    setActiveTab('builder');
  };

  const updateProfileFactor = (factorId: string, updates: Partial<PriorityFactor>) => {
    if (!selectedProfile) return;

    const updatedFactors = selectedProfile.factors.map(factor =>
      factor.id === factorId ? { ...factor, ...updates, modifiedAt: new Date() } : factor
    );

    actions.updatePriorityProfile(selectedProfile.id, {
      factors: updatedFactors,
      modifiedAt: new Date()
    });

    setSelectedProfile({ ...selectedProfile, factors: updatedFactors });
  };

  const normalizeWeights = () => {
    if (!selectedProfile) return;

    const enabledFactors = selectedProfile.factors.filter(f => f.enabled);
    const totalWeight = enabledFactors.reduce((sum, f) => sum + f.weight, 0);

    if (totalWeight === 0) return;

    const normalizedFactors = selectedProfile.factors.map(factor => ({
      ...factor,
      weight: factor.enabled ? Math.round((factor.weight / totalWeight) * 100) : factor.weight
    }));

    actions.updatePriorityProfile(selectedProfile.id, {
      factors: normalizedFactors,
      modifiedAt: new Date()
    });

    setSelectedProfile({ ...selectedProfile, factors: normalizedFactors });
  };

  const addFactor = (type: PriorityFactorType) => {
    if (!selectedProfile) return;

    const factorConfig = PRIORITY_FACTOR_TYPES[type];
    const newFactor: PriorityFactor = {
      id: `factor-${Date.now()}`,
      type,
      name: factorConfig.label,
      description: factorConfig.description,
      weight: factorConfig.defaultWeight,
      enabled: true,
      configuration: {},
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    const updatedFactors = [...selectedProfile.factors, newFactor];
    actions.updatePriorityProfile(selectedProfile.id, {
      factors: updatedFactors,
      modifiedAt: new Date()
    });

    setSelectedProfile({ ...selectedProfile, factors: updatedFactors });
  };

  const removeFactor = (factorId: string) => {
    if (!selectedProfile) return;

    const updatedFactors = selectedProfile.factors.filter(f => f.id !== factorId);
    actions.updatePriorityProfile(selectedProfile.id, {
      factors: updatedFactors,
      modifiedAt: new Date()
    });

    setSelectedProfile({ ...selectedProfile, factors: updatedFactors });
  };

  const exportPrioritizationConfig = () => {
    const config = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      activePriorityProfile: activePriorityProfile,
      profiles: priorityProfiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        description: profile.description,
        factors: profile.factors.map(factor => ({
          type: factor.type,
          name: factor.name,
          weight: factor.weight,
          enabled: factor.enabled,
          configuration: factor.configuration
        })),
        comparisonMethod: profile.comparisonMethod,
        pairwiseComparisons: profile.pairwiseComparisons,
        applicableScenarios: profile.applicableScenarios,
        isActive: profile.isActive,
        isPreset: profile.isPreset
      }))
    };

    const jsonContent = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'prioritization_config.json';
    link.click();
  };

  const generatePairwiseMatrix = () => {
    if (!selectedProfile) return;

    const enabledFactors = selectedProfile.factors.filter(f => f.enabled);
    const comparisons: PairwiseComparison[] = [];

    for (let i = 0; i < enabledFactors.length; i++) {
      for (let j = i + 1; j < enabledFactors.length; j++) {
        comparisons.push({
          factorA: enabledFactors[i].id,
          factorB: enabledFactors[j].id,
          preference: 1, // Start with equal preference
          consistency: 1
        });
      }
    }

    setPairwiseData(comparisons);
    setComparisonMethod('pairwise');
  };

  const calculateWeightsFromPairwise = () => {
    if (!selectedProfile || pairwiseData.length === 0) return;

    // Simple implementation - in real AHP, this would be more complex
    const factorScores: Record<string, number> = {};
    
    selectedProfile.factors.forEach(factor => {
      factorScores[factor.id] = 0;
    });

    pairwiseData.forEach(comparison => {
      if (comparison.preference > 1) {
        factorScores[comparison.factorA] += comparison.preference;
        factorScores[comparison.factorB] += 1 / comparison.preference;
      } else {
        factorScores[comparison.factorA] += 1;
        factorScores[comparison.factorB] += 1;
      }
    });

    const totalScore = Object.values(factorScores).reduce((sum, score) => sum + score, 0);
    
    const updatedFactors = selectedProfile.factors.map(factor => ({
      ...factor,
      weight: totalScore > 0 ? Math.round((factorScores[factor.id] / totalScore) * 100) : factor.weight
    }));

    actions.updatePriorityProfile(selectedProfile.id, {
      factors: updatedFactors,
      pairwiseComparisons: pairwiseData,
      comparisonMethod: 'pairwise',
      modifiedAt: new Date()
    });

    setSelectedProfile({ ...selectedProfile, factors: updatedFactors });
  };

  const CategoryColors = {
    client: 'bg-blue-50 border-blue-200 text-blue-700',
    worker: 'bg-green-50 border-green-200 text-green-700',
    task: 'bg-purple-50 border-purple-200 text-purple-700',
    system: 'bg-orange-50 border-orange-200 text-orange-700'
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Prioritization & Weights</h2>
          <p className="text-slate-600 mt-1">Configure resource allocation priorities and weighting criteria</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPrioritizationConfig}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            📥 Export Config
          </button>
          <button
            onClick={() => createNewProfile()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            ➕ New Profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'profiles', label: 'Priority Profiles', icon: '📋' },
            { key: 'builder', label: 'Weight Builder', icon: '⚖️' },
            { key: 'matrix', label: 'Pairwise Matrix', icon: '📊' },
            { key: 'export', label: 'Export & Download', icon: '📤' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2',
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Profiles Tab */}
        {activeTab === 'profiles' && (
          <div className="space-y-6">
            {/* Preset Profiles */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Preset Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESET_PROFILES.map((preset, index) => (
                  <div key={index} className="p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">{preset.name}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Preset</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">{preset.description}</p>
                    <div className="space-y-2 mb-4">
                      {preset.factors.slice(0, 3).map((factor) => (
                        <div key={factor.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{factor.name}</span>
                          <span className="font-medium text-slate-800">{factor.weight}%</span>
                        </div>
                      ))}
                      {preset.factors.length > 3 && (
                        <div className="text-xs text-slate-500">+{preset.factors.length - 3} more factors</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => createNewProfile(preset)}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        Use Template
                      </button>
                      <button
                        onClick={() => {
                          const existingProfile = priorityProfiles.find(p => p.name === preset.name && p.isPreset);
                          if (existingProfile) {
                            setSelectedProfile(existingProfile);
                            setActiveTab('builder');
                          }
                        }}
                        className="px-3 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Profiles */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {priorityProfiles.filter(p => !p.isPreset).map((profile) => (
                  <div key={profile.id} className="p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">{profile.name}</h4>
                      <div className="flex gap-2">
                        {profile.isActive && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          profile.createdBy === 'user' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {profile.createdBy === 'user' ? 'Custom' : 'AI'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">{profile.description}</p>
                    <div className="space-y-2 mb-4">
                      {profile.factors.filter(f => f.enabled).slice(0, 3).map((factor) => (
                        <div key={factor.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{factor.name}</span>
                          <span className="font-medium text-slate-800">{factor.weight}%</span>
                        </div>
                      ))}
                      {profile.factors.filter(f => f.enabled).length > 3 && (
                        <div className="text-xs text-slate-500">+{profile.factors.filter(f => f.enabled).length - 3} more factors</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedProfile(profile);
                          setActiveTab('builder');
                        }}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => actions.setActivePriorityProfile(profile.id)}
                        disabled={profile.isActive}
                        className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm disabled:opacity-50"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => actions.deletePriorityProfile(profile.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Builder Tab */}
        {activeTab === 'builder' && selectedProfile && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{selectedProfile.name}</h3>
                <p className="text-slate-600">{selectedProfile.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={comparisonMethod}
                  onChange={(e) => setComparisonMethod(e.target.value as ComparisonMethod)}
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="slider">Sliders</option>
                  <option value="numeric">Numeric Input</option>
                  <option value="ranking">Drag & Drop Ranking</option>
                  <option value="pairwise">Pairwise Comparison</option>
                </select>
                <button
                  onClick={normalizeWeights}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  Normalize (100%)
                </button>
              </div>
            </div>

            {/* Weight Input Methods */}
            <div className="space-y-4">
              {comparisonMethod === 'slider' && (
                <div className="space-y-4">
                  {selectedProfile.factors.map((factor) => (
                    <div key={factor.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{PRIORITY_FACTOR_TYPES[factor.type]?.icon}</span>
                          <div>
                            <h4 className="font-medium text-slate-800">{factor.name}</h4>
                            <p className="text-sm text-slate-600">{factor.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-full border ${CategoryColors[PRIORITY_FACTOR_TYPES[factor.type]?.category || 'system']}`}>
                            {PRIORITY_FACTOR_TYPES[factor.type]?.category}
                          </span>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={factor.enabled}
                              onChange={(e) => updateProfileFactor(factor.id, { enabled: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-sm">Enabled</span>
                          </label>
                          <button
                            onClick={() => removeFactor(factor.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      {factor.enabled && (
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={factor.weight}
                            onChange={(e) => updateProfileFactor(factor.id, { weight: parseInt(e.target.value) })}
                            className="flex-1"
                          />
                          <span className="w-16 text-right font-medium">{factor.weight}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {comparisonMethod === 'numeric' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProfile.factors.map((factor) => (
                    <div key={factor.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl">{PRIORITY_FACTOR_TYPES[factor.type]?.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{factor.name}</h4>
                          <p className="text-xs text-slate-600">{factor.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={factor.weight}
                          onChange={(e) => updateProfileFactor(factor.id, { weight: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                          disabled={!factor.enabled}
                        />
                        <span className="text-sm text-slate-600">%</span>
                        <label className="flex items-center gap-2 ml-auto">
                          <input
                            type="checkbox"
                            checked={factor.enabled}
                            onChange={(e) => updateProfileFactor(factor.id, { enabled: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm">Enabled</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {comparisonMethod === 'ranking' && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 mb-4">Drag factors to reorder by importance (top = highest weight)</p>
                  {selectedProfile.factors
                    .filter(f => f.enabled)
                    .sort((a, b) => b.weight - a.weight)
                    .map((factor, index) => (
                      <div
                        key={factor.id}
                        draggable
                        onDragStart={() => setDraggedFactor(factor.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedFactor && draggedFactor !== factor.id) {
                            // Implement drag and drop logic here
                            console.log('Reorder factors');
                          }
                          setDraggedFactor(null);
                        }}
                        className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl cursor-move hover:shadow-md transition-shadow"
                      >
                        <span className="text-slate-400">⋮⋮</span>
                        <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-xl">{PRIORITY_FACTOR_TYPES[factor.type]?.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{factor.name}</h4>
                          <p className="text-sm text-slate-600">{factor.description}</p>
                        </div>
                        <span className="font-medium text-slate-800">{factor.weight}%</span>
                      </div>
                    ))}
                </div>
              )}

              {comparisonMethod === 'pairwise' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Compare factors pairwise using the Analytic Hierarchy Process (AHP)
                    </p>
                    <button
                      onClick={generatePairwiseMatrix}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                    >
                      Generate Matrix
                    </button>
                  </div>
                  
                  {pairwiseData.length > 0 && (
                    <div className="space-y-3">
                      {pairwiseData.map((comparison, index) => {
                        const factorA = selectedProfile.factors.find(f => f.id === comparison.factorA);
                        const factorB = selectedProfile.factors.find(f => f.id === comparison.factorB);
                        
                        return (
                          <div key={index} className="p-4 bg-white border border-slate-200 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-4">
                                <span className="font-medium text-slate-800">{factorA?.name}</span>
                                <span className="text-slate-400">vs</span>
                                <span className="font-medium text-slate-800">{factorB?.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-slate-600 w-20">{factorA?.name}</span>
                              <input
                                type="range"
                                min="0.11"
                                max="9"
                                step="0.5"
                                value={comparison.preference}
                                onChange={(e) => {
                                  const newData = [...pairwiseData];
                                  newData[index].preference = parseFloat(e.target.value);
                                  setPairwiseData(newData);
                                }}
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-600 w-20 text-right">{factorB?.name}</span>
                            </div>
                            <div className="text-center mt-2">
                              <span className="text-sm font-medium">
                                {comparison.preference > 1 
                                  ? `${factorA?.name} is ${comparison.preference.toFixed(1)}x more important`
                                  : comparison.preference < 1 
                                  ? `${factorB?.name} is ${(1/comparison.preference).toFixed(1)}x more important`
                                  : 'Equal importance'
                                }
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        onClick={calculateWeightsFromPairwise}
                        className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Calculate Weights from Comparisons
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add Factor */}
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
              <h4 className="font-medium text-slate-800 mb-3">Add Priority Factor</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(PRIORITY_FACTOR_TYPES).map(([type, config]) => {
                  const isAlreadyAdded = selectedProfile.factors.some(f => f.type === type);
                  return (
                    <button
                      key={type}
                      onClick={() => !isAlreadyAdded && addFactor(type as PriorityFactorType)}
                      disabled={isAlreadyAdded}
                      className={cn(
                        'p-3 border-2 rounded-lg text-left transition-all',
                        isAlreadyAdded
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : `bg-white border-slate-200 hover:border-blue-300 hover:shadow-md ${CategoryColors[config.category]}`
                      )}
                    >
                      <div className="text-xl mb-1">{config.icon}</div>
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-xs opacity-75">{config.category}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weight Summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h4 className="font-medium text-blue-800 mb-3">Weight Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {selectedProfile.factors.filter(f => f.enabled).reduce((sum, f) => sum + f.weight, 0)}%
                  </div>
                  <div className="text-sm text-blue-600">Total Weight</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {selectedProfile.factors.filter(f => f.enabled).length}
                  </div>
                  <div className="text-sm text-green-600">Active Factors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {Math.max(...selectedProfile.factors.filter(f => f.enabled).map(f => f.weight), 0)}%
                  </div>
                  <div className="text-sm text-purple-600">Highest Weight</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-700">
                    {selectedProfile.comparisonMethod.charAt(0).toUpperCase() + selectedProfile.comparisonMethod.slice(1)}
                  </div>
                  <div className="text-sm text-orange-600">Method Used</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pairwise Matrix Tab */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Analytic Hierarchy Process (AHP)</h3>
              <p className="text-slate-600">
                Compare criteria pairwise to build a consistent weight matrix using the AHP methodology
              </p>
            </div>
            
            {selectedProfile ? (
              <div className="max-w-4xl mx-auto">
                <button
                  onClick={generatePairwiseMatrix}
                  className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors mb-6"
                >
                  Generate Pairwise Comparison Matrix for "{selectedProfile.name}"
                </button>
                
                {pairwiseData.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-4">
                        Use the scale: 1 = Equal, 3 = Moderate, 5 = Strong, 7 = Very Strong, 9 = Extreme preference
                      </p>
                    </div>
                    
                    {/* Matrix visualization would go here */}
                    <div className="p-6 bg-white border border-slate-200 rounded-xl">
                      <h4 className="font-medium text-slate-800 mb-4">Comparison Matrix</h4>
                      <div className="text-sm text-slate-600">
                        Matrix visualization and consistency checking would be implemented here for production use.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600">Select a profile from the Profiles tab to use the pairwise comparison matrix.</p>
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Export Data & Configuration</h3>
              <p className="text-slate-600">
                Download cleaned data and prioritization settings for use with external resource allocators
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Export */}
              <div className="p-6 bg-white border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Cleaned Data Export
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Export validated and cleaned entity data ready for resource allocation algorithms
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => actions.exportToCSV('client')}
                    className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    📄 Export Clients CSV
                  </button>
                  <button
                    onClick={() => actions.exportToCSV('worker')}
                    className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    👷 Export Workers CSV
                  </button>
                  <button
                    onClick={() => actions.exportToCSV('task')}
                    className="w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    📋 Export Tasks CSV
                  </button>
                  <button
                    onClick={() => actions.exportAll()}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    📦 Export All Data
                  </button>
                </div>
              </div>

              {/* Configuration Export */}
              <div className="p-6 bg-white border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span>⚙️</span>
                  Configuration Export
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Export business rules and prioritization settings as JSON configuration files
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => actions.generateRulesConfig()}
                    className="w-full px-4 py-2 bg-cyan-50 text-cyan-600 rounded-lg hover:bg-cyan-100 transition-colors"
                  >
                    🤖 Export Business Rules
                  </button>
                  <button
                    onClick={exportPrioritizationConfig}
                    className="w-full px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    ⚖️ Export Priority Settings
                  </button>
                  <button
                    onClick={() => actions.exportValidationReport()}
                    className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    🔍 Export Validation Report
                  </button>
                  <button
                    onClick={() => {
                      // Export comprehensive configuration
                      const fullConfig = {
                        timestamp: new Date().toISOString(),
                        version: "1.0",
                        data: {
                          clients: actions.exportData('json'),
                          workers: actions.exportData('json'),
                          tasks: actions.exportData('json')
                        },
                        businessRules: actions.generateRulesConfig(),
                        prioritization: {
                          activePriorityProfile,
                          profiles: priorityProfiles
                        },
                        validation: actions.exportValidationReport()
                      };
                      
                      const jsonContent = JSON.stringify(fullConfig, null, 2);
                      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = 'complete_configuration.json';
                      link.click();
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-medium"
                  >
                    🚀 Export Complete Package
                  </button>
                </div>
              </div>
            </div>

            {/* Export Summary */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">Export Package Contents</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-slate-700 mb-2">Data Files (CSV)</h5>
                  <ul className="space-y-1 text-slate-600">
                    <li>• clients_clean.csv</li>
                    <li>• workers_clean.csv</li>
                    <li>• tasks_clean.csv</li>
                    <li>• validation_report.json</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-slate-700 mb-2">Configuration Files</h5>
                  <ul className="space-y-1 text-slate-600">
                    <li>• rules.json</li>
                    <li>• prioritization_config.json</li>
                    <li>• weighting_profiles.json</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-slate-700 mb-2">Integration Ready</h5>
                  <ul className="space-y-1 text-slate-600">
                    <li>• Validated data format</li>
                    <li>• Standardized schemas</li>
                    <li>• Algorithm-ready structure</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedPrioritizationBuilder;
