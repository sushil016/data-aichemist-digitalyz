/**
 * @fileoverview Advanced Business Rules Validation and Conflict Detection
 * @description Provides sophisticated validation logic for business rules including conflict detection, dependency analysis, and optimization suggestions
 */

import { BusinessRule, Client, Worker, Task } from '@/types/entities';

export interface RuleConflict {
  id: string;
  type: 'direct' | 'indirect' | 'performance' | 'logical';
  severity: 'error' | 'warning' | 'info';
  rules: string[];
  description: string;
  suggestion?: string;
}

export interface RuleValidation {
  isValid: boolean;
  conflicts: RuleConflict[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validate a single business rule for internal consistency
 */
export function validateBusinessRule(rule: BusinessRule): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic validation
  if (!rule.name?.trim()) {
    errors.push('Rule name is required');
  }

  if (!rule.description?.trim()) {
    errors.push('Rule description is required');
  }

  if (!rule.type) {
    errors.push('Rule type is required');
  }

  // Type-specific validation
  switch (rule.type) {
    case 'coRun':
      if (!rule.parameters.clientGroups || rule.parameters.clientGroups.length < 2) {
        errors.push('Co-run rules require at least 2 client groups');
      }
      if (!rule.parameters.maxConcurrent || rule.parameters.maxConcurrent < 1) {
        errors.push('Co-run rules require a valid maxConcurrent value');
      }
      break;

    case 'slotRestriction':
      if (!rule.parameters.workerGroup || !rule.parameters.allowedSlots) {
        errors.push('Slot restriction rules require worker group and allowed slots');
      }
      if (rule.parameters.allowedSlots && rule.parameters.allowedSlots.length === 0) {
        errors.push('Allowed slots cannot be empty');
      }
      break;

    case 'loadLimit':
      if (!rule.parameters.workerGroup || !rule.parameters.maxLoad) {
        errors.push('Load limit rules require worker group and max load');
      }
      if (rule.parameters.maxLoad && rule.parameters.maxLoad < 1) {
        errors.push('Max load must be at least 1');
      }
      break;

    case 'phaseWindow':
      if (!rule.parameters.taskCategory || !rule.parameters.phases) {
        errors.push('Phase window rules require task category and phases');
      }
      if (rule.parameters.phases && rule.parameters.phases.length === 0) {
        errors.push('Phases cannot be empty');
      }
      break;

    case 'patternMatch':
      if (!rule.parameters.pattern || !rule.parameters.action) {
        errors.push('Pattern match rules require pattern and action');
      }
      break;

    case 'precedence':
      if (!rule.parameters.higherPriorityGroup || !rule.parameters.lowerPriorityGroup) {
        errors.push('Precedence rules require both priority groups');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Detect conflicts between business rules
 */
export function detectRuleConflicts(
  rules: BusinessRule[],
  clients: Client[],
  workers: Worker[],
  tasks: Task[]
): RuleConflict[] {
  const conflicts: RuleConflict[] = [];
  const activeRules = rules.filter(r => r.active);

  // Check for direct conflicts
  for (let i = 0; i < activeRules.length; i++) {
    for (let j = i + 1; j < activeRules.length; j++) {
      const rule1 = activeRules[i];
      const rule2 = activeRules[j];
      
      const conflict = checkDirectConflict(rule1, rule2);
      if (conflict) {
        conflicts.push(conflict);
      }
    }
  }

  // Check for resource conflicts
  const resourceConflicts = checkResourceConflicts(activeRules, workers);
  conflicts.push(...resourceConflicts);

  // Check for logical inconsistencies
  const logicalConflicts = checkLogicalConsistency(activeRules, clients, tasks);
  conflicts.push(...logicalConflicts);

  // Check for performance implications
  const performanceConflicts = checkPerformanceImplications(activeRules, clients, workers, tasks);
  conflicts.push(...performanceConflicts);

  return conflicts;
}

/**
 * Check for direct conflicts between two rules
 */
function checkDirectConflict(rule1: BusinessRule, rule2: BusinessRule): RuleConflict | null {
  // Co-run vs Slot Restriction conflicts
  if (rule1.type === 'coRun' && rule2.type === 'slotRestriction') {
    const coRunClients = rule1.parameters.clientGroups || [];
    const restrictedWorkers = rule2.parameters.workerGroup;
    
    if (coRunClients.length > 0 && restrictedWorkers) {
      return {
        id: `conflict-${rule1.id}-${rule2.id}`,
        type: 'direct',
        severity: 'warning',
        rules: [rule1.id, rule2.id],
        description: `Co-run rule "${rule1.name}" may conflict with slot restrictions from "${rule2.name}"`,
        suggestion: 'Consider adjusting slot restrictions to accommodate co-run requirements'
      };
    }
  }

  // Load Limit vs Co-run conflicts
  if (rule1.type === 'loadLimit' && rule2.type === 'coRun') {
    const maxLoad = rule1.parameters.maxLoad;
    const maxConcurrent = rule2.parameters.maxConcurrent;
    
    if (maxLoad && maxConcurrent && maxLoad < maxConcurrent) {
      return {
        id: `conflict-${rule1.id}-${rule2.id}`,
        type: 'direct',
        severity: 'error',
        rules: [rule1.id, rule2.id],
        description: `Load limit (${maxLoad}) is lower than co-run requirement (${maxConcurrent})`,
        suggestion: 'Increase load limit or reduce co-run concurrency'
      };
    }
  }

  // Precedence conflicts
  if (rule1.type === 'precedence' && rule2.type === 'precedence') {
    const group1Higher = rule1.parameters.higherPriorityGroup;
    const group1Lower = rule1.parameters.lowerPriorityGroup;
    const group2Higher = rule2.parameters.higherPriorityGroup;
    const group2Lower = rule2.parameters.lowerPriorityGroup;
    
    if (group1Higher === group2Lower && group1Lower === group2Higher) {
      return {
        id: `conflict-${rule1.id}-${rule2.id}`,
        type: 'logical',
        severity: 'error',
        rules: [rule1.id, rule2.id],
        description: 'Circular precedence detected',
        suggestion: 'Remove one of the conflicting precedence rules'
      };
    }
  }

  return null;
}

/**
 * Check for resource allocation conflicts
 */
function checkResourceConflicts(rules: BusinessRule[], workers: Worker[]): RuleConflict[] {
  const conflicts: RuleConflict[] = [];
  
  // Group rules by worker group
  const workerGroupRules = new Map<string, BusinessRule[]>();
  
  rules.forEach(rule => {
    if (rule.parameters.workerGroup) {
      const group = rule.parameters.workerGroup;
      if (!workerGroupRules.has(group)) {
        workerGroupRules.set(group, []);
      }
      workerGroupRules.get(group)!.push(rule);
    }
  });

  // Check for over-constraint
  workerGroupRules.forEach((groupRules, groupName) => {
    const loadLimitRules = groupRules.filter(r => r.type === 'loadLimit');
    const slotRestrictionRules = groupRules.filter(r => r.type === 'slotRestriction');
    
    if (loadLimitRules.length > 1) {
      const minLoad = Math.min(...loadLimitRules.map(r => r.parameters.maxLoad || Infinity));
      conflicts.push({
        id: `resource-conflict-${groupName}`,
        type: 'indirect',
        severity: 'warning',
        rules: loadLimitRules.map(r => r.id),
        description: `Multiple load limits applied to ${groupName} group, effective limit: ${minLoad}`,
        suggestion: 'Consolidate load limit rules for clarity'
      });
    }

    if (slotRestrictionRules.length > 1) {
      conflicts.push({
        id: `slot-conflict-${groupName}`,
        type: 'indirect',
        severity: 'info',
        rules: slotRestrictionRules.map(r => r.id),
        description: `Multiple slot restrictions applied to ${groupName} group`,
        suggestion: 'Consider merging slot restriction rules'
      });
    }
  });

  return conflicts;
}

/**
 * Check for logical consistency issues
 */
function checkLogicalConsistency(rules: BusinessRule[], clients: Client[], tasks: Task[]): RuleConflict[] {
  const conflicts: RuleConflict[] = [];
  
  // Check if co-run rules reference existing clients
  const coRunRules = rules.filter(r => r.type === 'coRun');
  const clientIds = new Set(clients.map(c => c.ClientID));
  
  coRunRules.forEach(rule => {
    const clientGroups = rule.parameters.clientGroups || [];
    const invalidClients = clientGroups.filter((id: string) => !clientIds.has(id));
    
    if (invalidClients.length > 0) {
      conflicts.push({
        id: `logical-${rule.id}`,
        type: 'logical',
        severity: 'error',
        rules: [rule.id],
        description: `Co-run rule references non-existent clients: ${invalidClients.join(', ')}`,
        suggestion: 'Update rule to reference valid client IDs or add missing clients'
      });
    }
  });

  // Check if phase window rules reference existing task categories
  const phaseWindowRules = rules.filter(r => r.type === 'phaseWindow');
  const taskCategories = new Set(tasks.map(t => t.Category));
  
  phaseWindowRules.forEach(rule => {
    const taskCategory = rule.parameters.taskCategory;
    if (taskCategory && !taskCategories.has(taskCategory)) {
      conflicts.push({
        id: `logical-${rule.id}`,
        type: 'logical',
        severity: 'warning',
        rules: [rule.id],
        description: `Phase window rule references non-existent task category: ${taskCategory}`,
        suggestion: 'Update rule to reference valid task category'
      });
    }
  });

  return conflicts;
}

/**
 * Check for performance implications
 */
function checkPerformanceImplications(
  rules: BusinessRule[],
  clients: Client[],
  workers: Worker[],
  tasks: Task[]
): RuleConflict[] {
  const conflicts: RuleConflict[] = [];
  
  // Check for excessive restrictions
  const restrictiveRules = rules.filter(r => 
    r.type === 'slotRestriction' || r.type === 'loadLimit'
  );
  
  if (restrictiveRules.length > workers.length * 0.5) {
    conflicts.push({
      id: 'performance-over-restriction',
      type: 'performance',
      severity: 'warning',
      rules: restrictiveRules.map(r => r.id),
      description: 'High number of restrictive rules may impact scheduling flexibility',
      suggestion: 'Consider consolidating restrictions or using more flexible rule types'
    });
  }

  // Check for potential deadlocks
  const precedenceRules = rules.filter(r => r.type === 'precedence');
  if (precedenceRules.length > 3) {
    conflicts.push({
      id: 'performance-precedence-complexity',
      type: 'performance',
      severity: 'info',
      rules: precedenceRules.map(r => r.id),
      description: 'Complex precedence rules may lead to scheduling delays',
      suggestion: 'Simplify precedence hierarchy where possible'
    });
  }

  return conflicts;
}

/**
 * Validate all business rules together
 */
export function validateAllRules(
  rules: BusinessRule[],
  clients: Client[],
  workers: Worker[],
  tasks: Task[]
): RuleValidation {
  const conflicts = detectRuleConflicts(rules, clients, workers, tasks);
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Collect warnings and suggestions from conflicts
  conflicts.forEach(conflict => {
    if (conflict.severity === 'warning') {
      warnings.push(conflict.description);
    }
    if (conflict.suggestion) {
      suggestions.push(conflict.suggestion);
    }
  });

  // Additional validation checks
  const activeRules = rules.filter(r => r.active);
  if (activeRules.length === 0 && rules.length > 0) {
    warnings.push('No active rules found. Consider activating relevant rules.');
  }

  if (activeRules.length > 10) {
    warnings.push('Large number of active rules may impact performance. Consider rule optimization.');
  }

  const hasErrors = conflicts.some(c => c.severity === 'error');

  return {
    isValid: !hasErrors,
    conflicts,
    warnings,
    suggestions
  };
}

/**
 * Get optimization suggestions for rule set
 */
export function getOptimizationSuggestions(
  rules: BusinessRule[],
  clients: Client[],
  workers: Worker[],
  tasks: Task[]
): string[] {
  const suggestions: string[] = [];
  
  // Analyze rule distribution
  const ruleTypeCount = rules.reduce((acc, rule) => {
    acc[rule.type] = (acc[rule.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Suggest missing rule types
  if (!ruleTypeCount.loadLimit && workers.length > 5) {
    suggestions.push('Consider adding load limit rules to prevent worker overload');
  }

  if (!ruleTypeCount.coRun && clients.length > 3) {
    suggestions.push('Co-run rules could improve throughput for compatible clients');
  }

  if (!ruleTypeCount.phaseWindow && tasks.some(t => t.Duration > 3)) {
    suggestions.push('Phase window rules could improve scheduling for long-running tasks');
  }

  // Suggest rule consolidation
  if (ruleTypeCount.slotRestriction > 3) {
    suggestions.push('Consider consolidating multiple slot restriction rules');
  }

  if (ruleTypeCount.loadLimit > 2) {
    suggestions.push('Multiple load limit rules could be simplified');
  }

  return suggestions;
}
