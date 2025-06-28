/**
 * @fileoverview Business Rule Builder Component
 * @description Interactive UI for creating and managing business rules with 6 rule types
 * @requirements Support co-run, slot restriction, load limit, phase window, pattern match, and precedence rules
 * @integrations Zustand store for rule management, natural language conversion
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { BusinessRule, BusinessRuleType } from '@/types/entities';
import { useDataStore } from '@/lib/store/data-store';

// ===== TYPES =====

export type RuleType = BusinessRuleType;

interface RuleFormData {
  type: RuleType;
  name: string;
  description: string;
  parameters: Record<string, any>;
  active: boolean;
  priority: number;
}

interface BusinessRuleBuilderProps {
  className?: string;
  onRuleCreate?: (rule: BusinessRule) => void;
  onRuleUpdate?: (ruleId: string, updates: Partial<BusinessRule>) => void;
  existingRules?: BusinessRule[];
}

// ===== RULE TYPE CONFIGURATIONS =====

const RULE_TYPES = {
  coRun: {
    label: 'Co-Run Rules',
    description: 'Group tasks to run together',
    icon: '🔗',
    color: 'blue',
    fields: [
      { name: 'taskIds', type: 'multiselect', label: 'Tasks to Group', required: true },
      { name: 'strict', type: 'boolean', label: 'Strict Grouping', default: true },
      { name: 'maxDelay', type: 'number', label: 'Max Delay (phases)', default: 0 }
    ]
  },
  slotRestriction: {
    label: 'Slot Restriction Rules',
    description: 'Define minimum common slots for groups',
    icon: '⏰',
    color: 'purple',
    fields: [
      { name: 'groupType', type: 'select', label: 'Group Type', options: ['ClientGroup', 'WorkerGroup'], required: true },
      { name: 'groupValue', type: 'text', label: 'Group Value', required: true },
      { name: 'minCommonSlots', type: 'number', label: 'Min Common Slots', required: true, min: 1 }
    ]
  },
  loadLimit: {
    label: 'Load Limit Rules',
    description: 'Set maximum load per phase for worker groups',
    icon: '⚖️',
    color: 'orange',
    fields: [
      { name: 'workerGroup', type: 'text', label: 'Worker Group', required: true },
      { name: 'maxSlotsPerPhase', type: 'number', label: 'Max Slots per Phase', required: true, min: 1, max: 20 },
      { name: 'applyToPhases', type: 'multiselect', label: 'Apply to Phases (optional)' }
    ]
  },
  phaseWindow: {
    label: 'Phase Window Rules',
    description: 'Define allowed phase ranges for tasks',
    icon: '📅',
    color: 'green',
    fields: [
      { name: 'taskFilter', type: 'select', label: 'Task Filter', options: ['specific', 'category', 'priority'], required: true },
      { name: 'filterValue', type: 'text', label: 'Filter Value', required: true },
      { name: 'allowedPhases', type: 'range', label: 'Allowed Phase Range', required: true },
      { name: 'strict', type: 'boolean', label: 'Strict Enforcement', default: false }
    ]
  },
  patternMatch: {
    label: 'Pattern Match Rules',
    description: 'Regex patterns for data validation',
    icon: '🔍',
    color: 'indigo',
    fields: [
      { name: 'entityType', type: 'select', label: 'Entity Type', options: ['client', 'worker', 'task'], required: true },
      { name: 'field', type: 'text', label: 'Field Name', required: true },
      { name: 'pattern', type: 'text', label: 'Regex Pattern', required: true },
      { name: 'action', type: 'select', label: 'Action', options: ['validate', 'transform', 'reject'], required: true }
    ]
  },
  precedence: {
    label: 'Precedence Override Rules',
    description: 'Define rule priority and conflict resolution',
    icon: '🏆',
    color: 'red',
    fields: [
      { name: 'higherPriorityRule', type: 'select', label: 'Higher Priority Rule', required: true },
      { name: 'lowerPriorityRule', type: 'select', label: 'Lower Priority Rule', required: true },
      { name: 'conflictResolution', type: 'select', label: 'Conflict Resolution', 
        options: ['override', 'merge', 'reject'], required: true }
    ]
  }
};

// ===== COMPONENT =====

export default function BusinessRuleBuilder({
  className,
  onRuleCreate,
  onRuleUpdate,
  existingRules = []
}: BusinessRuleBuilderProps) {
  const [selectedRuleType, setSelectedRuleType] = useState<RuleType | null>(null);
  const [formData, setFormData] = useState<Partial<RuleFormData>>({
    active: true,
    priority: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get data from store for populating dropdowns
  const { clients, workers, tasks } = useDataStore();

  // Handle rule type selection
  const handleRuleTypeSelect = (type: RuleType) => {
    setSelectedRuleType(type);
    setFormData({
      type,
      name: '',
      description: RULE_TYPES[type].description,
      parameters: {},
      active: true,
      priority: 5
    });
  };

  // Handle form field changes
  const handleFieldChange = (fieldName: string, value: any) => {
    if (fieldName === 'name' || fieldName === 'description' || fieldName === 'active' || fieldName === 'priority') {
      setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        parameters: {
          ...prev.parameters,
          [fieldName]: value
        }
      }));
    }
  };

  // Get dynamic options based on field type and current data
  const getDynamicOptions = (field: any) => {
    switch (field.name) {
      case 'taskIds':
        return tasks.map(task => ({ value: task.TaskID, label: `${task.TaskID} - ${task.TaskName}` }));
      
      case 'workerGroup':
        return [...new Set(workers.map(w => w.WorkerGroup))].filter(Boolean).map(group => ({ value: group, label: group }));
      
      case 'groupValue':
        if (formData.parameters?.groupType === 'ClientGroup') {
          return [...new Set(clients.map(c => c.GroupTag))].filter(Boolean).map(group => ({ value: group, label: group }));
        } else if (formData.parameters?.groupType === 'WorkerGroup') {
          return [...new Set(workers.map(w => w.WorkerGroup))].filter(Boolean).map(group => ({ value: group, label: group }));
        }
        return [];
      
      case 'filterValue':
        if (formData.parameters?.taskFilter === 'specific') {
          return tasks.map(task => ({ value: task.TaskID, label: `${task.TaskID} - ${task.TaskName}` }));
        } else if (formData.parameters?.taskFilter === 'category') {
          return [...new Set(tasks.map(t => t.Category))].filter(Boolean).map(cat => ({ value: cat, label: cat }));
        }
        return field.options?.map((opt: string) => ({ value: opt, label: opt })) || [];
      
      case 'higherPriorityRule':
      case 'lowerPriorityRule':
        return existingRules.map(rule => ({ value: rule.id, label: rule.name }));
      
      default:
        return field.options?.map((opt: string) => ({ value: opt, label: opt })) || [];
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!selectedRuleType || !formData.name?.trim()) return false;
    
    const ruleConfig = RULE_TYPES[selectedRuleType];
    const requiredFields = ruleConfig.fields.filter(field => field.required);
    
    return requiredFields.every(field => {
      const value = formData.parameters?.[field.name];
      return value !== undefined && value !== null && value !== '';
    });
  };

  // Submit rule
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const newRule: BusinessRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedRuleType!,
        name: formData.name!,
        description: formData.description || RULE_TYPES[selectedRuleType!].description,
        parameters: formData.parameters || {},
        active: formData.active ?? true,
        priority: formData.priority ?? 5,
        createdBy: 'user',
        createdAt: new Date(),
        modifiedAt: new Date()
      };

      onRuleCreate?.(newRule);
      
      // Reset form
      setSelectedRuleType(null);
      setFormData({ active: true, priority: 5 });
      
    } catch (error) {
      console.error('Error creating rule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render field input based on type
  const renderFieldInput = (field: any) => {
    const value = formData.parameters?.[field.name] ?? field.default ?? '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value) || 0)}
            min={field.min || 0}
            max={field.max || 100}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600">Enable {field.label}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select {field.label}</option>
            {getDynamicOptions(field).map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const multiselectOptions = getDynamicOptions(field);
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="max-h-32 overflow-y-auto border border-slate-300 rounded-lg p-2">
              {multiselectOptions.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No options available - please add data first</p>
              ) : (
                multiselectOptions.map((option: any) => (
                  <label key={option.value} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...selectedValues, option.value]
                          : selectedValues.filter((v: any) => v !== option.value);
                        handleFieldChange(field.name, newValues);
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))
              )}
            </div>
            {selectedValues.length > 0 && (
              <div className="text-xs text-slate-600">
                Selected: {selectedValues.length} item{selectedValues.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        );

      case 'range':
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value?.start || 1}
              onChange={(e) => handleFieldChange(field.name, { 
                ...value, 
                start: parseInt(e.target.value) || 1 
              })}
              min="1"
              max="50"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start"
            />
            <span className="text-slate-500">to</span>
            <input
              type="number"
              value={value?.end || 10}
              onChange={(e) => handleFieldChange(field.name, { 
                ...value, 
                end: parseInt(e.target.value) || 10 
              })}
              min="1"
              max="50"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="End"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
          <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            ⚙️
          </span>
          Business Rule Builder
        </h2>
        <p className="mt-2 text-slate-600">
          Create custom business rules to control resource allocation logic
        </p>
      </div>

      {/* Rule Type Selection */}
      {!selectedRuleType && (
        <div className="p-6">
          <h3 className="text-lg font-medium text-slate-700 mb-4">Choose Rule Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(RULE_TYPES).map(([type, config]) => (
              <button
                key={type}
                onClick={() => handleRuleTypeSelect(type as RuleType)}
                className={cn(
                  'p-4 border-2 border-dashed rounded-xl text-left transition-all duration-200',
                  'hover:border-solid hover:shadow-md',
                  `border-${config.color}-200 hover:border-${config.color}-400 hover:bg-${config.color}-50`
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{config.icon}</span>
                  <h4 className="font-medium text-slate-800">{config.label}</h4>
                </div>
                <p className="text-sm text-slate-600">{config.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rule Configuration Form */}
      {selectedRuleType && (
        <div className="p-6">
          {/* Rule Type Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{RULE_TYPES[selectedRuleType].icon}</span>
              <div>
                <h3 className="text-lg font-medium text-slate-800">
                  {RULE_TYPES[selectedRuleType].label}
                </h3>
                <p className="text-sm text-slate-600">
                  {RULE_TYPES[selectedRuleType].description}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedRuleType(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a descriptive name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  value={formData.priority || 5}
                  onChange={(e) => handleFieldChange('priority', parseInt(e.target.value) || 5)}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what this rule does"
              />
            </div>

            {/* Rule-Specific Parameters */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-700 border-b border-slate-200 pb-2">
                Rule Parameters
              </h4>
              
              {RULE_TYPES[selectedRuleType].fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderFieldInput(field)}
                </div>
              ))}
            </div>

            {/* Advanced Options */}
            <div className="border-t border-slate-200 pt-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                <span className={cn(
                  'transform transition-transform',
                  showAdvanced ? 'rotate-90' : ''
                )}>
                  ▶
                </span>
                Advanced Options
              </button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active ?? true}
                      onChange={(e) => handleFieldChange('active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="active" className="text-sm text-slate-700">
                      Rule is active
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedRuleType(null)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={!validateForm() || isSubmitting}
                className={cn(
                  'px-6 py-2 rounded-lg font-medium transition-colors',
                  validateForm() && !isSubmitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                )}
              >
                {isSubmitting ? 'Creating...' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
