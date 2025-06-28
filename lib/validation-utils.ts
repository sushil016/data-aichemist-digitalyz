/**
 * @fileoverview Data Alchemist - Validation Utilities
 * @description Entity-specific validation functions and business rule enforcement
 */

import { 
  Client, 
  Worker, 
  Task, 
  ValidationError, 
  EntityTypeName,
  VALIDATION_CONSTANTS 
} from "@/types/entities";

import {
  createValidationError,
  validateRequiredFields,
  validateNumericRange,
  validateArrayFormat,
  validateJsonFormat,
  parseArrayFromString,
  parseNumberArrayFromString
} from "./utils";

/**
 * Validate Client entity
 */
export function validateClient(client: Partial<Client>, row: number = 0): ValidationError[] {
  const errors: ValidationError[] = [];
  const clientId = client.ClientID || `CLIENT_${row}`;

  // Required fields validation
  const requiredFields = ['ClientID', 'ClientName', 'RequestedTaskIDs', 'PriorityLevel', 'ClientGroup'];
  errors.push(...validateRequiredFields(client, requiredFields, 'client', clientId, row));

  // PriorityLevel validation
  if (client.PriorityLevel !== undefined) {
    errors.push(...validateNumericRange(
      client.PriorityLevel,
      VALIDATION_CONSTANTS.MIN_PRIORITY_LEVEL,
      VALIDATION_CONSTANTS.MAX_PRIORITY_LEVEL,
      'PriorityLevel',
      'client',
      clientId,
      row
    ));
  }

  // RequestedTaskIDs validation
  if (client.RequestedTaskIDs !== undefined) {
    errors.push(...validateArrayFormat(client.RequestedTaskIDs, 'RequestedTaskIDs', 'client', clientId, row, { allowEmpty: true }));
  }

  // AttributesJSON validation
  if (client.AttributesJSON) {
    errors.push(...validateJsonFormat(client.AttributesJSON, 'AttributesJSON', 'client', clientId, row));
  }

  // Business logic validations
  if (client.RequestedTaskIDs) {
    const taskIds = parseArrayFromString(client.RequestedTaskIDs);
    if (taskIds.length > 20) {
      errors.push(createValidationError(
        'client',
        clientId,
        row,
        'RequestedTaskIDs',
        'RequestedTaskIDs',
        'Client requesting too many tasks (>20), consider breaking into multiple requests',
        'warning'
      ));
    }
  }

  return errors;
}

/**
 * Validate Worker entity
 */
export function validateWorker(worker: Partial<Worker>, row: number = 0): ValidationError[] {
  const errors: ValidationError[] = [];
  const workerId = worker.WorkerID || `WORKER_${row}`;

  // Required fields validation
  const requiredFields = ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'];
  errors.push(...validateRequiredFields(worker, requiredFields, 'worker', workerId, row));

  // Skills validation
  if (worker.Skills !== undefined) {
    errors.push(...validateArrayFormat(worker.Skills, 'Skills', 'worker', workerId, row, { allowEmpty: false }));
  }

  // AvailableSlots validation
  if (worker.AvailableSlots !== undefined) {
    errors.push(...validateArrayFormat(worker.AvailableSlots, 'AvailableSlots', 'worker', workerId, row, { allowEmpty: false }));
    
    // Validate slot numbers are positive integers
    const slots = parseNumberArrayFromString(worker.AvailableSlots);
    if (slots.some(slot => slot < 1 || slot > 50)) {
      errors.push(createValidationError(
        'worker',
        workerId,
        row,
        'AvailableSlots',
        'AvailableSlots',
        'Available slots must be positive integers between 1 and 50',
        'error'
      ));
    }
  }

  // MaxLoadPerPhase validation
  if (worker.MaxLoadPerPhase !== undefined) {
    errors.push(...validateNumericRange(
      worker.MaxLoadPerPhase,
      VALIDATION_CONSTANTS.MIN_MAX_LOAD_PER_PHASE,
      VALIDATION_CONSTANTS.MAX_MAX_LOAD_PER_PHASE,
      'MaxLoadPerPhase',
      'worker',
      workerId,
      row
    ));
  }

  // QualificationLevel validation
  if (worker.QualificationLevel !== undefined) {
    errors.push(...validateNumericRange(
      worker.QualificationLevel,
      VALIDATION_CONSTANTS.MIN_QUALIFICATION_LEVEL,
      VALIDATION_CONSTANTS.MAX_QUALIFICATION_LEVEL,
      'QualificationLevel',
      'worker',
      workerId,
      row
    ));
  }

  // Business logic validations
  if (worker.Skills && worker.AvailableSlots) {
    const skills = parseArrayFromString(worker.Skills);
    const slots = parseNumberArrayFromString(worker.AvailableSlots);
    
    if (skills.length > 10) {
      errors.push(createValidationError(
        'worker',
        workerId,
        row,
        'Skills',
        'Skills',
        'Worker has too many skills (>10), may indicate data quality issues',
        'warning'
      ));
    }
    
    if (slots.length > 30) {
      errors.push(createValidationError(
        'worker',
        workerId,
        row,
        'AvailableSlots',
        'AvailableSlots',
        'Worker available in too many phases (>30), may indicate overcommitment',
        'warning'
      ));
    }
  }

  return errors;
}

/**
 * Validate Task entity
 */
export function validateTask(task: Partial<Task>, row: number = 0): ValidationError[] {
  const errors: ValidationError[] = [];
  const taskId = task.TaskID || `TASK_${row}`;

  // Required fields validation
  const requiredFields = ['TaskID', 'TaskName', 'RequiredSkills', 'Duration', 'MaxConcurrent', 'TaskGroup'];
  errors.push(...validateRequiredFields(task, requiredFields, 'task', taskId, row));

  // Duration validation
  if (task.Duration !== undefined) {
    errors.push(...validateNumericRange(
      task.Duration,
      VALIDATION_CONSTANTS.MIN_DURATION,
      VALIDATION_CONSTANTS.MAX_DURATION,
      'Duration',
      'task',
      taskId,
      row
    ));
  }

  // MaxConcurrent validation
  if (task.MaxConcurrent !== undefined) {
    errors.push(...validateNumericRange(
      task.MaxConcurrent,
      VALIDATION_CONSTANTS.MIN_MAX_CONCURRENT,
      VALIDATION_CONSTANTS.MAX_MAX_CONCURRENT,
      'MaxConcurrent',
      'task',
      taskId,
      row
    ));
  }

  // RequiredSkills validation
  if (task.RequiredSkills !== undefined) {
    errors.push(...validateArrayFormat(task.RequiredSkills, 'RequiredSkills', 'task', taskId, row, { allowEmpty: false }));
  }

  // PreferredPhases validation
  if (task.PreferredPhases !== undefined) {
    errors.push(...validateArrayFormat(task.PreferredPhases, 'PreferredPhases', 'task', taskId, row, { allowEmpty: true }));
    
    // Validate phase numbers are positive integers
    const phases = parseNumberArrayFromString(task.PreferredPhases);
    if (phases.some(phase => phase < 1 || phase > 50)) {
      errors.push(createValidationError(
        'task',
        taskId,
        row,
        'PreferredPhases',
        'PreferredPhases',
        'Preferred phases must be positive integers between 1 and 50',
        'error'
      ));
    }
  }

  // Business logic validations
  if (task.RequiredSkills) {
    const skills = parseArrayFromString(task.RequiredSkills);
    if (skills.length > 5) {
      errors.push(createValidationError(
        'task',
        taskId,
        row,
        'RequiredSkills',
        'RequiredSkills',
        'Task requires too many skills (>5), consider breaking into smaller tasks',
        'warning'
      ));
    }
  }

  return errors;
}

/**
 * Cross-entity validation
 */
export function validateCrossEntityReferences(
  clients: Partial<Client>[],
  workers: Partial<Worker>[],
  tasks: Partial<Task>[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Create ID sets for quick lookup
  const taskIds = new Set(tasks.map(task => task.TaskID).filter(Boolean));
  const workerIds = new Set(workers.map(worker => worker.WorkerID).filter(Boolean));
  const clientIds = new Set(clients.map(client => client.ClientID).filter(Boolean));

  // Validate client references to tasks
  clients.forEach((client, clientIndex) => {
    if (client.RequestedTaskIDs) {
      const requestedIds = parseArrayFromString(client.RequestedTaskIDs);
      requestedIds.forEach(taskId => {
        if (!taskIds.has(taskId)) {
          errors.push(createValidationError(
            'client',
            client.ClientID || `CLIENT_${clientIndex}`,
            clientIndex,
            'RequestedTaskIDs',
            'RequestedTaskIDs',
            `Referenced task "${taskId}" does not exist`,
            'error',
            `Remove invalid task reference or add task with ID "${taskId}"`
          ));
        }
      });
    }
  });

  // Validate worker skills against task requirements
  tasks.forEach((task, taskIndex) => {
    if (task.RequiredSkills) {
      const requiredSkills = parseArrayFromString(task.RequiredSkills);
      const availableSkills = new Set(
        workers.flatMap(worker => 
          worker.Skills ? parseArrayFromString(worker.Skills) : []
        )
      );
      
      requiredSkills.forEach(skill => {
        if (!availableSkills.has(skill)) {
          errors.push(createValidationError(
            'task',
            task.TaskID || `TASK_${taskIndex}`,
            taskIndex,
            'RequiredSkills',
            'RequiredSkills',
            `Required skill "${skill}" is not available in any worker`,
            'warning',
            `Add workers with skill "${skill}" or remove this requirement`
          ));
        }
      });
    }
  });

  return errors;
}

/**
 * Batch validation for clients
 */
export function validateClientsBatch(clients: Partial<Client>[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for duplicate IDs
  const seenIds = new Set<string>();
  clients.forEach((client, index) => {
    if (client.ClientID) {
      if (seenIds.has(client.ClientID)) {
        errors.push(createValidationError(
          'client',
          client.ClientID,
          index,
          'ClientID',
          'ClientID',
          `Duplicate client ID: ${client.ClientID}`,
          'error'
        ));
      } else {
        seenIds.add(client.ClientID);
      }
    }
  });

  // Individual validations
  clients.forEach((client, index) => {
    errors.push(...validateClient(client, index));
  });

  return errors;
}

/**
 * Batch validation for workers
 */
export function validateWorkersBatch(workers: Partial<Worker>[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for duplicate IDs
  const seenIds = new Set<string>();
  workers.forEach((worker, index) => {
    if (worker.WorkerID) {
      if (seenIds.has(worker.WorkerID)) {
        errors.push(createValidationError(
          'worker',
          worker.WorkerID,
          index,
          'WorkerID',
          'WorkerID',
          `Duplicate worker ID: ${worker.WorkerID}`,
          'error'
        ));
      } else {
        seenIds.add(worker.WorkerID);
      }
    }
  });

  // Individual validations
  workers.forEach((worker, index) => {
    errors.push(...validateWorker(worker, index));
  });

  return errors;
}

/**
 * Batch validation for tasks
 */
export function validateTasksBatch(tasks: Partial<Task>[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for duplicate IDs
  const seenIds = new Set<string>();
  tasks.forEach((task, index) => {
    if (task.TaskID) {
      if (seenIds.has(task.TaskID)) {
        errors.push(createValidationError(
          'task',
          task.TaskID,
          index,
          'TaskID',
          'TaskID',
          `Duplicate task ID: ${task.TaskID}`,
          'error'
        ));
      } else {
        seenIds.add(task.TaskID);
      }
    }
  });

  // Individual validations
  tasks.forEach((task, index) => {
    errors.push(...validateTask(task, index));
  });

  return errors;
}

/**
 * Calculate validation score (0-100)
 */
export function calculateValidationScore(errors: ValidationError[]): number {
  if (errors.length === 0) return 100;
  
  const errorWeights = { error: 10, warning: 5, info: 1 };
  const totalDeductions = errors.reduce((sum, error) => 
    sum + (errorWeights[error.severity] || 5), 0
  );
  
  return Math.max(0, 100 - totalDeductions);
}

/**
 * Get validation summary
 */
export function getValidationSummary(errors: ValidationError[]) {
  const summary = {
    total: errors.length,
    errors: errors.filter(e => e.severity === 'error').length,
    warnings: errors.filter(e => e.severity === 'warning').length,
    info: errors.filter(e => e.severity === 'info').length,
    score: calculateValidationScore(errors),
    byEntity: {} as Record<string, number>,
    byField: {} as Record<string, number>
  };

  // Count by entity type
  errors.forEach(error => {
    summary.byEntity[error.entityType] = (summary.byEntity[error.entityType] || 0) + 1;
    summary.byField[error.field] = (summary.byField[error.field] || 0) + 1;
  });

  return summary;
}

// ===== ADVANCED BUSINESS LOGIC VALIDATIONS =====

/**
 * Validate circular dependency detection in co-run groups
 */
export function validateCircularDependencies(
  tasks: Task[],
  coRunGroups: Record<string, string[]>
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const [groupId, taskIds] of Object.entries(coRunGroups)) {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCircularDependency = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        return true; // Circular dependency found
      }
      
      if (visited.has(taskId)) {
        return false;
      }
      
      visited.add(taskId);
      recursionStack.add(taskId);
      
      // Check dependencies for this task
      const dependentTasks = taskIds.filter(id => id !== taskId);
      for (const depTaskId of dependentTasks) {
        if (hasCircularDependency(depTaskId)) {
          return true;
        }
      }
      
      recursionStack.delete(taskId);
      return false;
    };
    
    for (const taskId of taskIds) {
      if (hasCircularDependency(taskId)) {
        errors.push(createValidationError(
          'task',
          taskId,
          0,
          'CoRunGroup',
          'CoRunGroup',
          `Circular dependency detected in co-run group ${groupId}`,
          'error'
        ));
        break; // Only report once per group
      }
    }
  }
  
  return errors;
}

/**
 * Validate phase-slot saturation
 */
export function validatePhaseSlotSaturation(
  workers: Worker[],
  tasks: Task[],
  assignments: Record<string, string[]> = {}
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Calculate available slots per phase
  const phaseSlots: Record<number, number> = {};
  
  workers.forEach(worker => {
    const availableSlots = parseNumberArrayFromString(worker.AvailableSlots);
    availableSlots.forEach(phase => {
      phaseSlots[phase] = (phaseSlots[phase] || 0) + (worker.MaxLoadPerPhase || 1);
    });
  });
  
  // Calculate required slots per phase
  const requiredSlots: Record<number, number> = {};
  
  tasks.forEach(task => {
    const preferredPhases = parseNumberArrayFromString(task.PreferredPhases);
    const duration = task.Duration || 1;
    const maxConcurrent = task.MaxConcurrent || 1;
    
    preferredPhases.forEach(phase => {
      for (let i = 0; i < duration; i++) {
        const currentPhase = phase + i;
        requiredSlots[currentPhase] = (requiredSlots[currentPhase] || 0) + maxConcurrent;
      }
    });
  });
  
  // Check for oversaturation
  Object.entries(requiredSlots).forEach(([phase, required]) => {
    const available = phaseSlots[parseInt(phase)] || 0;
    const utilizationRate = required / Math.max(available, 1);
    
    if (utilizationRate > 1.0) {
      errors.push(createValidationError(
        'task',
        'SYSTEM',
        0,
        'PhaseSlots',
        'PhaseSlots',
        `Phase ${phase} is oversaturated: ${required} slots required but only ${available} available (${Math.round(utilizationRate * 100)}% utilization)`,
        'error'
      ));
    } else if (utilizationRate > 0.8) {
      errors.push(createValidationError(
        'task',
        'SYSTEM',
        0,
        'PhaseSlots',
        'PhaseSlots',
        `Phase ${phase} is near capacity: ${required} slots required out of ${available} available (${Math.round(utilizationRate * 100)}% utilization)`,
        'warning'
      ));
    }
  });
  
  return errors;
}

/**
 * Validate skill-coverage matrix
 */
export function validateSkillCoverageMatrix(
  workers: Worker[],
  tasks: Task[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Build skill availability matrix
  const skillAvailability: Record<string, Worker[]> = {};
  
  workers.forEach(worker => {
    const skills = parseArrayFromString(worker.Skills);
    skills.forEach(skill => {
      if (!skillAvailability[skill]) {
        skillAvailability[skill] = [];
      }
      skillAvailability[skill].push(worker);
    });
  });
  
  // Check task skill requirements
  tasks.forEach((task, index) => {
    const requiredSkills = parseArrayFromString(task.RequiredSkills);
    const uncoveredSkills: string[] = [];
    const underCoveredSkills: string[] = [];
    
    requiredSkills.forEach(skill => {
      const availableWorkers = skillAvailability[skill] || [];
      
      if (availableWorkers.length === 0) {
        uncoveredSkills.push(skill);
      } else if (availableWorkers.length < (task.MaxConcurrent || 1)) {
        underCoveredSkills.push(skill);
      }
    });
    
    if (uncoveredSkills.length > 0) {
      errors.push(createValidationError(
        'task',
        task.TaskID,
        index,
        'RequiredSkills',
        'RequiredSkills',
        `Task requires skills that no worker has: ${uncoveredSkills.join(', ')}`,
        'error'
      ));
    }
    
    if (underCoveredSkills.length > 0) {
      errors.push(createValidationError(
        'task',
        task.TaskID,
        index,
        'RequiredSkills',
        'RequiredSkills',
        `Task may have insufficient skill coverage for max concurrency: ${underCoveredSkills.join(', ')}`,
        'warning'
      ));
    }
  });
  
  // Check for unused skills
  const usedSkills = new Set<string>();
  tasks.forEach(task => {
    const requiredSkills = parseArrayFromString(task.RequiredSkills);
    requiredSkills.forEach(skill => usedSkills.add(skill));
  });
  
  Object.keys(skillAvailability).forEach(skill => {
    if (!usedSkills.has(skill)) {
      const workersWithSkill = skillAvailability[skill];
      if (workersWithSkill.length > 0) {
        errors.push(createValidationError(
          'worker',
          'SYSTEM',
          0,
          'Skills',
          'Skills',
          `Skill "${skill}" is available but not required by any task (${workersWithSkill.length} workers have this skill)`,
          'info'
        ));
      }
    }
  });
  
  return errors;
}

/**
 * Validate max-concurrency feasibility
 */
export function validateMaxConcurrencyFeasibility(
  workers: Worker[],
  tasks: Task[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  tasks.forEach((task, index) => {
    const requiredSkills = parseArrayFromString(task.RequiredSkills);
    const maxConcurrent = task.MaxConcurrent || 1;
    
    // Find workers who can do this task
    const capableWorkers = workers.filter(worker => {
      const workerSkills = parseArrayFromString(worker.Skills);
      return requiredSkills.every(requiredSkill => 
        workerSkills.some(workerSkill => 
          workerSkill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
          requiredSkill.toLowerCase().includes(workerSkill.toLowerCase())
        )
      );
    });
    
    if (capableWorkers.length < maxConcurrent) {
      errors.push(createValidationError(
        'task',
        task.TaskID,
        index,
        'MaxConcurrent',
        'MaxConcurrent',
        `Max concurrency (${maxConcurrent}) exceeds available workers (${capableWorkers.length}) with required skills`,
        'error'
      ));
    }
    
    // Check if workers are available in preferred phases
    const preferredPhases = parseNumberArrayFromString(task.PreferredPhases);
    preferredPhases.forEach(phase => {
      const availableInPhase = capableWorkers.filter(worker => {
        const availableSlots = parseNumberArrayFromString(worker.AvailableSlots);
        return availableSlots.includes(phase);
      });
      
      if (availableInPhase.length < maxConcurrent) {
        errors.push(createValidationError(
          'task',
          task.TaskID,
          index,
          'MaxConcurrent',
          'MaxConcurrent',
          `Max concurrency (${maxConcurrent}) exceeds workers available in phase ${phase} (${availableInPhase.length} available)`,
          'warning'
        ));
      }
    });
  });
  
  return errors;
}

/**
 * Validate overloaded workers
 */
export function validateOverloadedWorkers(
  workers: Worker[],
  tasks: Task[],
  assignments: Record<string, string[]> = {}
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  workers.forEach((worker, index) => {
    const availableSlots = parseNumberArrayFromString(worker.AvailableSlots);
    const maxLoadPerPhase = worker.MaxLoadPerPhase || 1;
    
    // Check if available slots can support max load
    const totalCapacity = availableSlots.length * maxLoadPerPhase;
    
    // Calculate current assignments (if provided)
    const assignedTasks = assignments[worker.WorkerID] || [];
    let totalAssignedPhases = 0;
    
    assignedTasks.forEach(taskId => {
      const task = tasks.find(t => t.TaskID === taskId);
      if (task) {
        totalAssignedPhases += task.Duration || 1;
      }
    });
    
    // Check for overload conditions
    if (totalAssignedPhases > totalCapacity) {
      errors.push(createValidationError(
        'worker',
        worker.WorkerID,
        index,
        'MaxLoadPerPhase',
        'MaxLoadPerPhase',
        `Worker is overloaded: ${totalAssignedPhases} phases assigned but only ${totalCapacity} capacity available`,
        'error'
      ));
    }
    
    // Check if close to capacity (warning)
    if (totalAssignedPhases > totalCapacity * 0.8) {
      errors.push(createValidationError(
        'worker',
        worker.WorkerID,
        index,
        'MaxLoadPerPhase',
        'MaxLoadPerPhase',
        `Worker approaching capacity: ${totalAssignedPhases}/${totalCapacity} phases (${Math.round((totalAssignedPhases / totalCapacity) * 100)}%)`,
        'warning'
      ));
    }
  });
  
  return errors;
}
