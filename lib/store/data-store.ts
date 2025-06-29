/**
 * @fileoverview Data Alchemist - Zustand Data Store
 * @description Centralized state management for client, worker, task data with validation
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  Client, 
  Worker, 
  Task, 
  ValidationError, 
  EntityTypeName,
  BusinessRule,
  PriorityProfile,
  PriorityFactor,
  WeightingRule
} from '@/types/entities';
import {
  validateClientsBatch,
  validateWorkersBatch,
  validateTasksBatch,
  validateCrossEntityReferences,
  validateClient,
  validateWorker,
  validateTask,
  getValidationSummary
} from '@/lib/validation-utils';
import { parseCSVFile, parseXLSXFile } from '@/lib/file-parser';
import { generateHeaderMappings, HeaderMappingSuggestion } from '@/lib/smart-header-mapping';
import { validateAllRules, detectRuleConflicts, RuleConflict, RuleValidation } from '@/lib/rule-validation';

// ===== TYPES =====

export interface HeaderMappingState {
  isVisible: boolean;
  entityType: EntityTypeName | null;
  originalHeaders: string[];
  mappings: HeaderMappingSuggestion[];
  userMappings: Record<string, string>; // originalHeader -> targetField
  parsedData: any[] | null;
  fileName: string | null;
}

export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  fileName: string | null;
  lastUploadedAt: Date | null;
}

export interface EditingState {
  entityType: EntityTypeName | null;
  entityId: string | null;
  field: string | null;
  originalValue: any;
  currentValue: any;
  hasChanges: boolean;
}

export interface ValidationSummary {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  score: number;
  byEntity: Record<string, number>;
  byField: Record<string, number>;
}

export interface DataState {
  // Entity data
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  businessRules: BusinessRule[];
  
  // Prioritization & Weights
  priorityProfiles: PriorityProfile[];
  weightingRules: WeightingRule[];
  activePriorityProfile: string | null;
  
  // Validation state
  validationErrors: ValidationError[];
  validationSummary: ValidationSummary;
  isValidating: boolean;
  lastValidatedAt: Date | null;
  
  // Business rule validation
  ruleValidation: RuleValidation | null;
  ruleConflicts: RuleConflict[];
  
  // File upload state
  fileUpload: FileUploadState;
  
  // Header mapping state
  headerMapping: HeaderMappingState;
  
  // Editing state
  editing: EditingState;
  
  // UI state
  selectedEntityType: EntityTypeName | null;
  selectedEntityId: string | null;
  searchQuery: string;
  filters: Record<string, any>;
  
  // Undo/Redo state
  history: {
    past: any[];
    present: any;
    future: any[];
  };
  
  // Actions
  actions: {
    // Data management
    setClients: (clients: Client[]) => void;
    setWorkers: (workers: Worker[]) => void;
    setTasks: (tasks: Task[]) => void;
    addClient: (client: Client) => void;
    addWorker: (worker: Worker) => void;
    addTask: (task: Task) => void;
    updateClient: (id: string, updates: Partial<Client>) => void;
    updateWorker: (id: string, updates: Partial<Worker>) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteClient: (id: string) => void;
    deleteWorker: (id: string) => void;
    deleteTask: (id: string) => void;
    
    // Business rule management
    addBusinessRule: (rule: BusinessRule) => void;
    updateBusinessRule: (id: string, updates: Partial<BusinessRule>) => void;
    deleteBusinessRule: (id: string) => void;
    toggleBusinessRule: (id: string) => void;
    validateBusinessRules: () => void;
    generateRulesConfig: () => object;
    
    // Prioritization & Weights management
    addPriorityProfile: (profile: PriorityProfile) => void;
    updatePriorityProfile: (id: string, updates: Partial<PriorityProfile>) => void;
    deletePriorityProfile: (id: string) => void;
    setActivePriorityProfile: (id: string) => void;
    addWeightingRule: (rule: WeightingRule) => void;
    updateWeightingRule: (id: string, updates: Partial<WeightingRule>) => void;
    deleteWeightingRule: (id: string) => void;
    calculateAllocationScores: () => any[];
    
    // File operations
    uploadFile: (file: File, entityType: EntityTypeName) => Promise<void>;
    clearFileUpload: () => void;
    
    // Header mapping operations
    showHeaderMapping: (headers: string[], entityType: EntityTypeName, parsedData: any[], fileName: string) => void;
    updateHeaderMapping: (originalHeader: string, targetField: string) => void;
    acceptHeaderMappings: () => Promise<void>;
    cancelHeaderMapping: () => void;
    
    // Validation operations
    validateAll: () => void;
    validateEntity: (entityType: EntityTypeName, entityId: string) => void;
    clearValidationErrors: () => void;
    
    // Editing operations
    startEditing: (entityType: EntityTypeName, entityId: string, field: string, value: any) => void;
    updateEditingValue: (value: any) => void;
    commitEdit: () => void;
    cancelEdit: () => void;
    
    // Selection and UI
    selectEntity: (entityType: EntityTypeName | null, entityId: string | null) => void;
    setSearchQuery: (query: string) => void;
    setFilters: (filters: Record<string, any>) => void;
    
    // Undo/Redo
    undo: () => void;
    redo: () => void;
    saveToHistory: () => void;
    
    // Bulk operations
    clearAllData: () => void;
    addSampleData: () => void;
    exportData: (format: 'csv' | 'json') => string;
    importData: (data: { clients?: Client[]; workers?: Worker[]; tasks?: Task[] }) => void;

    // Export operations
    exportToCSV: (entityType: EntityTypeName) => void;
    exportValidationReport: () => void;
    exportAll: () => void;
  };
}

// ===== INITIAL STATE =====

const initialFileUploadState: FileUploadState = {
  isUploading: false,
  progress: 0,
  error: null,
  fileName: null,
  lastUploadedAt: null,
};

const initialEditingState: EditingState = {
  entityType: null,
  entityId: null,
  field: null,
  originalValue: null,
  currentValue: null,
  hasChanges: false,
};

const initialValidationSummary: ValidationSummary = {
  total: 0,
  errors: 0,
  warnings: 0,
  info: 0,
  score: 100,
  byEntity: {},
  byField: {},
};

const initialHeaderMappingState: HeaderMappingState = {
  isVisible: false,
  entityType: null,
  originalHeaders: [],
  mappings: [],
  userMappings: {},
  parsedData: null,
  fileName: null,
};

// ===== STORE IMPLEMENTATION =====

export const useDataStore = create<DataState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      clients: [],
      workers: [],
      tasks: [],
      businessRules: [],
      priorityProfiles: [],
      weightingRules: [],
      activePriorityProfile: null,
      validationErrors: [],
      validationSummary: initialValidationSummary,
      isValidating: false,
      lastValidatedAt: null,
      ruleValidation: null,
      ruleConflicts: [],
      fileUpload: initialFileUploadState,
      editing: initialEditingState,
      headerMapping: initialHeaderMappingState,
      selectedEntityType: null,
      selectedEntityId: null,
      searchQuery: '',
      filters: {},
      history: {
        past: [],
        present: null,
        future: [],
      },

      actions: {
        // ===== DATA MANAGEMENT =====
        
        setClients: (clients: Client[]) => {
          set((state) => {
            state.clients = clients;
            state.actions.validateAll();
          });
        },

        setWorkers: (workers: Worker[]) => {
          set((state) => {
            state.workers = workers;
            state.actions.validateAll();
          });
        },

        setTasks: (tasks: Task[]) => {
          set((state) => {
            state.tasks = tasks;
            state.actions.validateAll();
          });
        },

        addClient: (client: Client) => {
          set((state) => {
            state.actions.saveToHistory();
            state.clients.push(client);
            state.actions.validateAll();
          });
        },

        addWorker: (worker: Worker) => {
          set((state) => {
            state.actions.saveToHistory();
            state.workers.push(worker);
            state.actions.validateAll();
          });
        },

        addTask: (task: Task) => {
          set((state) => {
            state.actions.saveToHistory();
            state.tasks.push(task);
            state.actions.validateAll();
          });
        },

        updateClient: (id: string, updates: Partial<Client>) => {
          set((state) => {
            state.actions.saveToHistory();
            const index = state.clients.findIndex(c => c.ClientID === id);
            if (index !== -1) {
              Object.assign(state.clients[index], updates);
              state.actions.validateEntity('client', id);
            }
          });
        },

        updateWorker: (id: string, updates: Partial<Worker>) => {
          set((state) => {
            state.actions.saveToHistory();
            const index = state.workers.findIndex(w => w.WorkerID === id);
            if (index !== -1) {
              Object.assign(state.workers[index], updates);
              state.actions.validateEntity('worker', id);
            }
          });
        },

        updateTask: (id: string, updates: Partial<Task>) => {
          set((state) => {
            state.actions.saveToHistory();
            const index = state.tasks.findIndex(t => t.TaskID === id);
            if (index !== -1) {
              Object.assign(state.tasks[index], updates);
              state.actions.validateEntity('task', id);
            }
          });
        },

        deleteClient: (id: string) => {
          set((state) => {
            state.actions.saveToHistory();
            state.clients = state.clients.filter(c => c.ClientID !== id);
            state.validationErrors = state.validationErrors.filter(e => e.entityId !== id);
            state.actions.validateAll();
          });
        },

        deleteWorker: (id: string) => {
          set((state) => {
            state.actions.saveToHistory();
            state.workers = state.workers.filter(w => w.WorkerID !== id);
            state.validationErrors = state.validationErrors.filter(e => e.entityId !== id);
            state.actions.validateAll();
          });
        },

        deleteTask: (id: string) => {
          set((state) => {
            state.actions.saveToHistory();
            state.tasks = state.tasks.filter(t => t.TaskID !== id);
            state.validationErrors = state.validationErrors.filter(e => e.entityId !== id);
            state.actions.validateAll();
          });
        },

        // ===== BUSINESS RULE MANAGEMENT =====

        addBusinessRule: (rule: BusinessRule) => {
          set((state) => {
            state.actions.saveToHistory();
            state.businessRules.push(rule);
          });
          // Validate rules after adding
          get().actions.validateBusinessRules();
        },

        updateBusinessRule: (id: string, updates: Partial<BusinessRule>) => {
          set((state) => {
            state.actions.saveToHistory();
            const index = state.businessRules.findIndex(r => r.id === id);
            if (index !== -1) {
              Object.assign(state.businessRules[index], {
                ...updates,
                modifiedAt: new Date()
              });
            }
          });
          // Validate rules after updating
          get().actions.validateBusinessRules();
        },

        deleteBusinessRule: (id: string) => {
          set((state) => {
            state.actions.saveToHistory();
            state.businessRules = state.businessRules.filter(r => r.id !== id);
          });
          // Validate rules after deleting
          get().actions.validateBusinessRules();
        },

        toggleBusinessRule: (id: string) => {
          set((state) => {
            state.actions.saveToHistory();
            const rule = state.businessRules.find(r => r.id === id);
            if (rule) {
              rule.active = !rule.active;
              rule.modifiedAt = new Date();
            }
          });
          // Validate rules after toggling
          get().actions.validateBusinessRules();
        },

        validateBusinessRules: () => {
          const state = get();
          const validation = validateAllRules(
            state.businessRules,
            state.clients,
            state.workers,
            state.tasks
          );
          const conflicts = detectRuleConflicts(
            state.businessRules,
            state.clients,
            state.workers,
            state.tasks
          );
          
          set((state) => {
            state.ruleValidation = validation;
            state.ruleConflicts = conflicts;
          });
        },

        generateRulesConfig: () => {
          const state = get();
          return {
            timestamp: new Date().toISOString(),
            version: "1.0",
            totalRules: state.businessRules.length,
            activeRules: state.businessRules.filter(r => r.active).length,
            rules: state.businessRules.map(rule => ({
              id: rule.id,
              type: rule.type,
              name: rule.name,
              description: rule.description,
              parameters: rule.parameters,
              active: rule.active,
              priority: rule.priority,
              createdBy: rule.createdBy,
              createdAt: rule.createdAt,
              modifiedAt: rule.modifiedAt
            }))
          };
        },

        // ===== PRIORITIZATION & WEIGHTS MANAGEMENT =====

        addPriorityProfile: (profile: PriorityProfile) => {
          set((state) => {
            state.actions.saveToHistory();
            state.priorityProfiles.push(profile);
            
            // Set as active if it's the first profile or marked as default
            if (state.priorityProfiles.length === 1 || profile.isDefault) {
              state.activePriorityProfile = profile.id;
            }
          });
        },

        updatePriorityProfile: (id: string, updates: Partial<PriorityProfile>) => {
          set((state) => {
            state.actions.saveToHistory();
            const index = state.priorityProfiles.findIndex(p => p.id === id);
            if (index !== -1) {
              Object.assign(state.priorityProfiles[index], {
                ...updates,
                modifiedAt: new Date()
              });
            }
          });
        },

        deletePriorityProfile: (id: string) => {
          set((state) => {
            state.actions.saveToHistory();
            state.priorityProfiles = state.priorityProfiles.filter(p => p.id !== id);
            
            // If deleted profile was active, switch to another one
            if (state.activePriorityProfile === id) {
              const remaining = state.priorityProfiles.find(p => p.isDefault) || state.priorityProfiles[0];
              state.activePriorityProfile = remaining?.id || null;
            }
          });
        },

        setActivePriorityProfile: (id: string) => {
          set((state) => {
            state.activePriorityProfile = id;
          });
        },

        addWeightingRule: (rule: WeightingRule) => {
          set((state) => {
            state.actions.saveToHistory();
            state.weightingRules.push(rule);
          });
        },

        updateWeightingRule: (id: string, updates: Partial<WeightingRule>) => {
          set((state) => {
            state.actions.saveToHistory();
            const index = state.weightingRules.findIndex(r => r.id === id);
            if (index !== -1) {
              Object.assign(state.weightingRules[index], {
                ...updates,
                modifiedAt: new Date()
              });
            }
          });
        },

        deleteWeightingRule: (id: string) => {
          set((state) => {
            state.actions.saveToHistory();
            state.weightingRules = state.weightingRules.filter(r => r.id !== id);
          });
        },

        calculateAllocationScores: () => {
          const state = get();
          const activeProfile = state.priorityProfiles.find(p => p.id === state.activePriorityProfile);
          
          if (!activeProfile) {
            return [];
          }

          const scores = [];
          
          // Calculate scores for all possible client-worker-task-phase combinations
          for (const client of state.clients) {
            for (const task of state.tasks) {
              // Check if client requested this task
              const requestedTasks = Array.isArray(client.RequestedTaskIDs) 
                ? client.RequestedTaskIDs 
                : [];
              
              if (!requestedTasks.includes(task.TaskID)) continue;
              
              for (const worker of state.workers) {
                for (let phase = 1; phase <= 10; phase++) {
                  let totalScore = 0;
                  const factorScores: Record<string, number> = {};
                  const reasoning = [];
                  
                  // Calculate score for each priority factor
                  for (const factor of activeProfile.factors) {
                    if (!factor.enabled) continue;
                    
                    let factorScore = 0;
                    
                    switch (factor.type) {
                      case 'client_priority':
                        factorScore = (client.PriorityLevel || 1) * 20; // 1-5 -> 20-100
                        reasoning.push(`Client priority: ${client.PriorityLevel}/5`);
                        break;
                        
                      case 'task_duration':
                        factorScore = Math.max(0, 100 - (task.Duration || 1) * 10); // Shorter = higher score
                        reasoning.push(`Task duration: ${task.Duration} phases`);
                        break;
                        
                      case 'worker_qualification':
                        factorScore = (worker.QualificationLevel || 1) * 20; // 1-5 -> 20-100
                        reasoning.push(`Worker qualification: ${worker.QualificationLevel}/5`);
                        break;
                        
                      case 'skill_match_score':
                        const taskSkills = Array.isArray(task.RequiredSkills) ? task.RequiredSkills : [];
                        const workerSkills = Array.isArray(worker.Skills) ? worker.Skills : [];
                        const matchCount = taskSkills.filter(skill => workerSkills.includes(skill)).length;
                        factorScore = taskSkills.length > 0 ? (matchCount / taskSkills.length) * 100 : 50;
                        reasoning.push(`Skill match: ${matchCount}/${taskSkills.length} skills`);
                        break;
                        
                      case 'phase_preference':
                        const preferredPhases = Array.isArray(task.PreferredPhases) ? task.PreferredPhases : [];
                        factorScore = preferredPhases.includes(phase) ? 100 : 50;
                        reasoning.push(`Phase preference: ${preferredPhases.includes(phase) ? 'preferred' : 'not preferred'}`);
                        break;
                        
                      case 'resource_availability':
                        const availableSlots = Array.isArray(worker.AvailableSlots) ? worker.AvailableSlots : [];
                        factorScore = availableSlots.includes(phase) ? 100 : 0;
                        reasoning.push(`Resource availability: ${availableSlots.includes(phase) ? 'available' : 'not available'}`);
                        break;
                        
                      default:
                        factorScore = 50; // Default neutral score
                    }
                    
                    factorScores[factor.id] = factorScore;
                    totalScore += factorScore * (factor.weight / 100);
                  }
                  
                  // Apply weighting rules
                  const appliedRules = [];
                  for (const rule of state.weightingRules.filter(r => r.enabled)) {
                    // Simple condition evaluation (can be enhanced)
                    let applies = false;
                    
                    if (rule.condition.includes('high_priority') && client.PriorityLevel >= 4) {
                      applies = true;
                    }
                    if (rule.condition.includes('urgent') && task.Duration <= 2) {
                      applies = true;
                    }
                    
                    if (applies) {
                      totalScore *= rule.multiplier;
                      appliedRules.push(rule.name);
                      reasoning.push(`Applied rule: ${rule.name} (${rule.multiplier}x)`);
                    }
                  }
                  
                  scores.push({
                    clientId: client.ClientID,
                    workerId: worker.WorkerID,
                    taskId: task.TaskID,
                    phase,
                    totalScore,
                    factorScores,
                    appliedRules,
                    confidence: totalScore > 70 ? 0.9 : totalScore > 50 ? 0.7 : 0.5,
                    reasoning
                  });
                }
              }
            }
          }
          
          return scores.sort((a, b) => b.totalScore - a.totalScore);
        },

        // ===== FILE OPERATIONS =====

        uploadFile: async (file: File, entityType: EntityTypeName) => {
          set((state) => {
            state.fileUpload.isUploading = true;
            state.fileUpload.progress = 0;
            state.fileUpload.error = null;
            state.fileUpload.fileName = file.name;
          });

          try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
              set((state) => {
                if (state.fileUpload.progress < 90) {
                  state.fileUpload.progress += 10;
                }
              });
            }, 100);

            let parseResult;
            if (file.name.endsWith('.csv')) {
              parseResult = await parseCSVFile(file);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
              parseResult = await parseXLSXFile(file);
            } else {
              throw new Error('Unsupported file format');
            }
            
            clearInterval(progressInterval);

            // Instead of directly processing data, show header mapping interface
            if (parseResult.data && parseResult.data.length > 0) {
              const headers = Object.keys(parseResult.data[0]);
              get().actions.showHeaderMapping(headers, entityType, parseResult.data, file.name);
            } else {
              throw new Error('No data found in file');
            }

          } catch (error) {
            set((state) => {
              state.fileUpload.isUploading = false;
              state.fileUpload.error = error instanceof Error ? error.message : 'Upload failed';
              state.fileUpload.progress = 0;
            });
            throw error;
          }
        },

        clearFileUpload: () => {
          set((state) => {
            state.fileUpload = { ...initialFileUploadState };
          });
        },

        // ===== HEADER MAPPING OPERATIONS =====

        showHeaderMapping: (headers: string[], entityType: EntityTypeName, parsedData: any[], fileName: string) => {
          set((state) => {
            const mappings = generateHeaderMappings(headers, entityType);
            state.headerMapping = {
              isVisible: true,
              entityType,
              originalHeaders: headers,
              mappings,
              userMappings: {},
              parsedData,
              fileName,
            };
            // Clear the file upload state since we're now in header mapping phase
            state.fileUpload.isUploading = false;
            state.fileUpload.progress = 100;
          });
        },

        updateHeaderMapping: (originalHeader: string, targetField: string) => {
          set((state) => {
            state.headerMapping.userMappings[originalHeader] = targetField;
          });
        },

        acceptHeaderMappings: async () => {
          const state = get();
          const { headerMapping } = state;
          
          if (!headerMapping.parsedData || !headerMapping.entityType) {
            return;
          }

          try {
            // Apply the header mappings to transform the data
            const transformedData = headerMapping.parsedData.map((row, index) => {
              const transformedRow: any = {};
              
              // Apply user mappings or fallback to AI suggestions
              headerMapping.originalHeaders.forEach(header => {
                const targetField = headerMapping.userMappings[header] || 
                  headerMapping.mappings.find(m => m.originalHeader === header)?.suggestedField;
                
                if (targetField && row[header] !== undefined) {
                  transformedRow[targetField] = row[header];
                }
              });
              
              return transformedRow;
            });

            // Add the transformed data to the appropriate entity store
            set((state) => {
              if (headerMapping.entityType === 'client') {
                const clients = transformedData.map((row, index) => ({
                  ClientID: row.ClientID || `C${String(index + 1).padStart(3, '0')}`,
                  ClientName: row.ClientName || '',
                  RequestedTaskIDs: row.RequestedTaskIDs || '',
                  PriorityLevel: Number(row.PriorityLevel) || 1,
                  GroupTag: row.GroupTag || row.ClientGroup || '',
                  AttributesJSON: row.AttributesJSON || row.Attributes || '',
                } as Client));
                state.clients = [...state.clients, ...clients];
              } else if (headerMapping.entityType === 'worker') {
                const workers = transformedData.map((row, index) => ({
                  WorkerID: row.WorkerID || `W${String(index + 1).padStart(3, '0')}`,
                  WorkerName: row.WorkerName || '',
                  Skills: row.Skills || '',
                  AvailableSlots: row.AvailableSlots || '',
                  MaxLoadPerPhase: Number(row.MaxLoadPerPhase) || 1,
                  WorkerGroup: row.WorkerGroup || '',
                  QualificationLevel: Number(row.QualificationLevel) || 1,
                } as Worker));
                state.workers = [...state.workers, ...workers];
              } else if (headerMapping.entityType === 'task') {
                const tasks = transformedData.map((row, index) => ({
                  TaskID: row.TaskID || `T${String(index + 1).padStart(3, '0')}`,
                  TaskName: row.TaskName || '',
                  Category: row.Category || row.TaskCategory || '',
                  Duration: Number(row.Duration) || 1,
                  RequiredSkills: row.RequiredSkills || '',
                  PreferredPhases: row.PreferredPhases || '',
                  MaxConcurrent: Number(row.MaxConcurrent) || 1,
                } as Task));
                state.tasks = [...state.tasks, ...tasks];
              }
              
              // Clear header mapping and trigger validation
              state.headerMapping = { ...initialHeaderMappingState };
              state.fileUpload.isUploading = false;
              state.fileUpload.progress = 100;
              state.fileUpload.lastUploadedAt = new Date();
              state.actions.validateAll();
            });
          } catch (error) {
            set((state) => {
              state.fileUpload.error = error instanceof Error ? error.message : 'Header mapping failed';
            });
            throw error;
          }
        },

        cancelHeaderMapping: () => {
          set((state) => {
            state.headerMapping = { ...initialHeaderMappingState };
            state.fileUpload = { ...initialFileUploadState };
          });
        },

        // ===== VALIDATION OPERATIONS =====

        validateAll: () => {
          set((state) => {
            state.isValidating = true;
          });

          setTimeout(() => {
            set((state) => {
              const clientErrors = validateClientsBatch(state.clients);
              const workerErrors = validateWorkersBatch(state.workers);
              const taskErrors = validateTasksBatch(state.tasks);
              const crossRefErrors = validateCrossEntityReferences(
                state.clients,
                state.workers,
                state.tasks
              );

              // Import advanced validation functions
              const { 
                validateCircularDependencies,
                validatePhaseSlotSaturation,
                validateSkillCoverageMatrix,
                validateMaxConcurrencyFeasibility,
                validateOverloadedWorkers
              } = require('@/lib/validation-utils');

              // Run advanced validations
              const circularDepErrors = validateCircularDependencies(state.tasks, {});
              const phaseSlotErrors = validatePhaseSlotSaturation(state.workers, state.tasks);
              const skillCoverageErrors = validateSkillCoverageMatrix(state.workers, state.tasks);
              const maxConcurrencyErrors = validateMaxConcurrencyFeasibility(state.workers, state.tasks);
              const overloadErrors = validateOverloadedWorkers(state.workers, state.tasks);

              state.validationErrors = [
                ...clientErrors,
                ...workerErrors,
                ...taskErrors,
                ...crossRefErrors,
                ...circularDepErrors,
                ...phaseSlotErrors,
                ...skillCoverageErrors,
                ...maxConcurrencyErrors,
                ...overloadErrors
              ];

              state.validationSummary = getValidationSummary(state.validationErrors);
              state.isValidating = false;
              state.lastValidatedAt = new Date();
            });
          }, 0);
        },

        validateEntity: (entityType: EntityTypeName, entityId: string) => {
          set((state) => {
            // Remove existing errors for this entity
            state.validationErrors = state.validationErrors.filter(
              e => !(e.entityType === entityType && e.entityId === entityId)
            );

            // Validate the specific entity
            let newErrors: ValidationError[] = [];
            
            if (entityType === 'client') {
              const client = state.clients.find(c => c.ClientID === entityId);
              if (client) {
                const row = state.clients.indexOf(client);
                newErrors = validateClient(client, row);
              }
            } else if (entityType === 'worker') {
              const worker = state.workers.find(w => w.WorkerID === entityId);
              if (worker) {
                const row = state.workers.indexOf(worker);
                newErrors = validateWorker(worker, row);
              }
            } else if (entityType === 'task') {
              const task = state.tasks.find(t => t.TaskID === entityId);
              if (task) {
                const row = state.tasks.indexOf(task);
                newErrors = validateTask(task, row);
              }
            }

            state.validationErrors = [...state.validationErrors, ...newErrors];
            state.validationSummary = getValidationSummary(state.validationErrors);
          });
        },

        clearValidationErrors: () => {
          set((state) => {
            state.validationErrors = [];
            state.validationSummary = initialValidationSummary;
          });
        },

        // ===== EDITING OPERATIONS =====

        startEditing: (entityType: EntityTypeName, entityId: string, field: string, value: any) => {
          set((state) => {
            state.editing = {
              entityType,
              entityId,
              field,
              originalValue: value,
              currentValue: value,
              hasChanges: false,
            };
          });
        },

        updateEditingValue: (value: any) => {
          set((state) => {
            if (state.editing.entityType) {
              state.editing.currentValue = value;
              state.editing.hasChanges = state.editing.originalValue !== value;
            }
          });
        },

        commitEdit: () => {
          const { editing } = get();
          if (!editing.entityType || !editing.entityId || !editing.field || !editing.hasChanges) {
            return;
          }

          set((state) => {
            const updates = { [editing.field!]: editing.currentValue };
            
            if (editing.entityType === 'client' && editing.entityId) {
              state.actions.updateClient(editing.entityId, updates);
            } else if (editing.entityType === 'worker' && editing.entityId) {
              state.actions.updateWorker(editing.entityId, updates);
            } else if (editing.entityType === 'task' && editing.entityId) {
              state.actions.updateTask(editing.entityId, updates);
            }

            state.editing = { ...initialEditingState };
          });
        },

        cancelEdit: () => {
          set((state) => {
            state.editing = { ...initialEditingState };
          });
        },

        // ===== SELECTION AND UI =====

        selectEntity: (entityType: EntityTypeName | null, entityId: string | null) => {
          set((state) => {
            state.selectedEntityType = entityType;
            state.selectedEntityId = entityId;
          });
        },

        setSearchQuery: (query: string) => {
          set((state) => {
            state.searchQuery = query;
          });
        },

        setFilters: (filters: Record<string, any>) => {
          set((state) => {
            state.filters = filters;
          });
        },

        // ===== UNDO/REDO =====

        saveToHistory: () => {
          set((state) => {
            const snapshot = {
              clients: [...state.clients],
              workers: [...state.workers],
              tasks: [...state.tasks],
            };
            
            state.history.past.push(state.history.present || snapshot);
            state.history.present = snapshot;
            state.history.future = [];
            
            // Limit history size
            if (state.history.past.length > 50) {
              state.history.past = state.history.past.slice(-50);
            }
          });
        },

        undo: () => {
          const { history } = get();
          if (history.past.length === 0) return;

          set((state) => {
            const previous = state.history.past.pop()!;
            state.history.future.unshift(state.history.present!);
            state.history.present = previous;
            
            state.clients = previous.clients;
            state.workers = previous.workers;
            state.tasks = previous.tasks;
            
            state.actions.validateAll();
          });
        },

        redo: () => {
          const { history } = get();
          if (history.future.length === 0) return;

          set((state) => {
            const next = state.history.future.shift()!;
            state.history.past.push(state.history.present!);
            state.history.present = next;
            
            state.clients = next.clients;
            state.workers = next.workers;
            state.tasks = next.tasks;
            
            state.actions.validateAll();
          });
        },

        // ===== BULK OPERATIONS =====

        addSampleData: () => {
          set((state) => {
            state.actions.saveToHistory();
            
            // Sample clients
            const sampleClients: Client[] = [
              {
                ClientID: 'C001',
                ClientName: 'Acme Corporation',
                PriorityLevel: 5,
                RequestedTaskIDs: ['T001', 'T002'],
                GroupTag: 'Enterprise',
                AttributesJSON: '{"budget": 150000, "deadline": "2024-Q2"}'
              },
              {
                ClientID: 'C002',
                ClientName: 'TechStart Inc',
                PriorityLevel: 3,
                RequestedTaskIDs: ['T003'],
                GroupTag: 'SMB',
                AttributesJSON: '{"budget": 75000, "deadline": "2024-Q1"}'
              },
              {
                ClientID: 'C003',
                ClientName: 'Global Industries',
                PriorityLevel: 2,
                RequestedTaskIDs: ['T004', 'T005'],
                GroupTag: 'Enterprise',
                AttributesJSON: '{"budget": 200000, "deadline": "2024-Q3"}'
              }
            ];

            // Sample workers
            const sampleWorkers: Worker[] = [
              {
                WorkerID: 'W001',
                WorkerName: 'Alice Johnson',
                Skills: ['JavaScript', 'React', 'Node.js'],
                AvailableSlots: [1, 2, 3],
                MaxLoadPerPhase: 3,
                WorkerGroup: 'Frontend',
                QualificationLevel: 4
              },
              {
                WorkerID: 'W002',
                WorkerName: 'Bob Smith',
                Skills: ['Python', 'Django', 'PostgreSQL'],
                AvailableSlots: [2, 4, 6],
                MaxLoadPerPhase: 2,
                WorkerGroup: 'Backend',
                QualificationLevel: 5
              },
              {
                WorkerID: 'W003',
                WorkerName: 'Carol Davis',
                Skills: ['TypeScript', 'Angular', 'AWS'],
                AvailableSlots: [1, 3, 5, 7],
                MaxLoadPerPhase: 4,
                WorkerGroup: 'FullStack',
                QualificationLevel: 4
              }
            ];

            // Sample tasks
            const sampleTasks: Task[] = [
              {
                TaskID: 'T001',
                TaskName: 'Frontend Development',
                Category: 'Development',
                Duration: 3,
                RequiredSkills: ['JavaScript', 'React'],
                PreferredPhases: [1, 2, 3],
                MaxConcurrent: 2
              },
              {
                TaskID: 'T002',
                TaskName: 'Backend API Development',
                Category: 'Development',
                Duration: 4,
                RequiredSkills: ['Node.js', 'API'],
                PreferredPhases: [2, 3, 4, 5],
                MaxConcurrent: 1
              },
              {
                TaskID: 'T003',
                TaskName: 'Database Design',
                Category: 'Development',
                Duration: 2,
                RequiredSkills: ['PostgreSQL', 'Database'],
                PreferredPhases: [1, 2],
                MaxConcurrent: 1
              },
              {
                TaskID: 'T004',
                TaskName: 'Security Testing',
                Category: 'Testing',
                Duration: 2,
                RequiredSkills: ['Security', 'Testing'],
                PreferredPhases: [6, 7],
                MaxConcurrent: 3
              },
              {
                TaskID: 'T005',
                TaskName: 'Performance Optimization',
                Category: 'Development',
                Duration: 3,
                RequiredSkills: ['Performance', 'Optimization'],
                PreferredPhases: [5, 6, 7],
                MaxConcurrent: 2
              }
            ];

            // Add sample data (avoiding duplicates)
            const existingClientIds = new Set(state.clients.map(c => c.ClientID));
            const existingWorkerIds = new Set(state.workers.map(w => w.WorkerID));
            const existingTaskIds = new Set(state.tasks.map(t => t.TaskID));

            const newClients = sampleClients.filter(c => !existingClientIds.has(c.ClientID));
            const newWorkers = sampleWorkers.filter(w => !existingWorkerIds.has(w.WorkerID));
            const newTasks = sampleTasks.filter(t => !existingTaskIds.has(t.TaskID));

            state.clients = [...state.clients, ...newClients];
            state.workers = [...state.workers, ...newWorkers];
            state.tasks = [...state.tasks, ...newTasks];
            
            // Validate all data after adding
            state.actions.validateAll();
          });
        },

        clearAllData: () => {
          set((state) => {
            state.actions.saveToHistory();
            state.clients = [];
            state.workers = [];
            state.tasks = [];
            state.validationErrors = [];
            state.validationSummary = initialValidationSummary;
            state.selectedEntityType = null;
            state.selectedEntityId = null;
            state.editing = { ...initialEditingState };
          });
        },

        exportData: (format: 'csv' | 'json'): string => {
          const { clients, workers, tasks } = get();
          const data = { clients, workers, tasks };
          
          if (format === 'json') {
            return JSON.stringify(data, null, 2);
          } else {
            // CSV export would need implementation
            throw new Error('CSV export not implemented yet');
          }
        },

        importData: (data: { clients?: Client[]; workers?: Worker[]; tasks?: Task[] }) => {
          set((state) => {
            state.actions.saveToHistory();
            
            if (data.clients) {
              state.clients = [...state.clients, ...data.clients];
            }
            if (data.workers) {
              state.workers = [...state.workers, ...data.workers];
            }
            if (data.tasks) {
              state.tasks = [...state.tasks, ...data.tasks];
            }
            
            state.actions.validateAll();
          });
        },

        // ===== EXPORT OPERATIONS =====

        exportToCSV: (entityType: EntityTypeName) => {
          const state = get();
          let data, filename;
          
          switch (entityType) {
            case 'client':
              data = state.clients;
              filename = 'clients_clean.csv';
              break;
            case 'worker':
              data = state.workers;
              filename = 'workers_clean.csv';
              break;
            case 'task':
              data = state.tasks;
              filename = 'tasks_clean.csv';
              break;
            default:
              return;
          }
          
          if (data.length === 0) {
            alert(`No ${entityType} data to export`);
            return;
          }
          
          // Convert to CSV
          const headers = Object.keys(data[0]);
          const csvContent = [
            headers.join(','),
            ...data.map(row => 
              headers.map(header => {
                const value = (row as any)[header];
                if (Array.isArray(value)) {
                  return `"${value.join(', ')}"`;
                }
                if (typeof value === 'string' && value.includes(',')) {
                  return `"${value}"`;
                }
                return value || '';
              }).join(',')
            )
          ].join('\n');
          
          // Download file
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.click();
        },
        
        exportValidationReport: () => {
          const state = get();
          const report = {
            timestamp: new Date().toISOString(),
            summary: state.validationSummary,
            errors: state.validationErrors,
            totalEntities: {
              clients: state.clients.length,
              workers: state.workers.length,
              tasks: state.tasks.length
            }
          };
          
          const jsonContent = JSON.stringify(report, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'validation_report.json';
          link.click();
        },
        
        exportAll: () => {
          const state = get();
          const actions = state.actions;
          
          // Export all entity types
          actions.exportToCSV('client');
          setTimeout(() => actions.exportToCSV('worker'), 500);
          setTimeout(() => actions.exportToCSV('task'), 1000);
          setTimeout(() => actions.exportValidationReport(), 1500);
          
          // Export business rules configuration
          setTimeout(() => {
            const rulesConfig = actions.generateRulesConfig();
            const jsonContent = JSON.stringify(rulesConfig, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'business_rules.json';
            link.click();
          }, 2000);
          
          // Export prioritization configuration
          setTimeout(() => {
            const prioritizationConfig = {
              timestamp: new Date().toISOString(),
              version: "1.0",
              activePriorityProfile: state.activePriorityProfile,
              profiles: state.priorityProfiles.map(profile => ({
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
            
            const jsonContent = JSON.stringify(prioritizationConfig, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'prioritization_config.json';
            link.click();
          }, 2500);
        },

        exportCompletePackage: () => {
          const state = get();
          
          // Create comprehensive configuration package
          const completePackage = {
            metadata: {
              timestamp: new Date().toISOString(),
              version: "1.0",
              exportedBy: "Data Alchemist",
              description: "Complete resource allocation configuration package"
            },
            data: {
              clients: state.clients,
              workers: state.workers,
              tasks: state.tasks,
              summary: {
                totalClients: state.clients.length,
                totalWorkers: state.workers.length,
                totalTasks: state.tasks.length,
                lastValidated: state.lastValidatedAt
              }
            },
            businessRules: {
              total: state.businessRules.length,
              active: state.businessRules.filter(r => r.active).length,
              rules: state.businessRules.map(rule => ({
                id: rule.id,
                type: rule.type,
                name: rule.name,
                description: rule.description,
                parameters: rule.parameters,
                active: rule.active,
                priority: rule.priority,
                createdBy: rule.createdBy,
                createdAt: rule.createdAt,
                modifiedAt: rule.modifiedAt
              }))
            },
            prioritization: {
              activeProfile: state.activePriorityProfile,
              totalProfiles: state.priorityProfiles.length,
              profiles: state.priorityProfiles.map(profile => ({
                id: profile.id,
                name: profile.name,
                description: profile.description,
                factors: profile.factors.filter(f => f.enabled).map(factor => ({
                  type: factor.type,
                  name: factor.name,
                  weight: factor.weight,
                  configuration: factor.configuration
                })),
                comparisonMethod: profile.comparisonMethod,
                applicableScenarios: profile.applicableScenarios,
                isActive: profile.isActive,
                isPreset: profile.isPreset
              }))
            },
            validation: {
              summary: state.validationSummary,
              ruleConflicts: state.ruleConflicts.length,
              ruleValidation: state.ruleValidation ? {
                isValid: state.ruleValidation.isValid,
                conflictCount: state.ruleValidation.conflicts.length,
                warningCount: state.ruleValidation.warnings.length,
                suggestionCount: state.ruleValidation.suggestions.length
              } : null
            },
            integration: {
              readyForAllocator: true,
              dataFormat: "standardized",
              schemaVersion: "1.0",
              supportedAlgorithms: ["hungarian", "genetic", "constraint_programming", "mixed_integer_programming"],
              notes: [
                "All data has been validated and cleaned",
                "Business rules are in standardized format",
                "Priority weights are normalized to 100%",
                "Configuration is ready for downstream allocators"
              ]
            }
          };
          
          const jsonContent = JSON.stringify(completePackage, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'data_alchemist_complete_package.json';
          link.click();
        },
      },
    })),
    {
      name: 'data-store',
      partialize: (state: DataState) => ({
        clients: state.clients,
        workers: state.workers,
        tasks: state.tasks,
        validationSummary: state.validationSummary,
      }),
    }
  )
);

// ===== SELECTORS =====

export const useClients = () => useDataStore((state) => state.clients);
export const useWorkers = () => useDataStore((state) => state.workers);
export const useTasks = () => useDataStore((state) => state.tasks);
export const useValidationErrors = () => useDataStore((state) => state.validationErrors);
export const useValidationSummary = () => useDataStore((state) => state.validationSummary);
export const useIsValidating = () => useDataStore((state) => state.isValidating);
export const useFileUpload = () => useDataStore((state) => state.fileUpload);
export const useHeaderMapping = () => useDataStore((state) => state.headerMapping);
export const useEditing = () => useDataStore((state) => state.editing);
export const useSelectedEntity = () => useDataStore((state) => ({
  entityType: state.selectedEntityType,
  entityId: state.selectedEntityId,
}));
export const useDataActions = () => useDataStore((state) => state.actions);

// Filtered selectors
export const useFilteredClients = () => {
  return useDataStore((state) => {
    let filtered = state.clients;
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(client =>
        client.ClientName?.toLowerCase().includes(query) ||
        client.ClientID?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  });
};

export const useFilteredWorkers = () => {
  return useDataStore((state) => {
    let filtered = state.workers;
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(worker =>
        worker.WorkerName?.toLowerCase().includes(query) ||
        worker.WorkerID?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  });
};

export const useFilteredTasks = () => {
  return useDataStore((state) => {
    let filtered = state.tasks;
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.TaskName?.toLowerCase().includes(query) ||
        task.TaskID?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  });
};

export const useEntityValidationErrors = (entityType: EntityTypeName, entityId: string) => {
  return useDataStore((state) =>
    state.validationErrors.filter(
      error => error.entityType === entityType && error.entityId === entityId
    )
  );
};
