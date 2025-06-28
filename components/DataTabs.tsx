/**
 * @fileoverview DataTabs Component
 * @description Tabbed interface for switching between clients, workers, and tasks
 * with badges showing row counts and error counts
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/lib/store/data-store';
import { EntityTypeName } from '@/types/entities';

// ===== INTERFACES =====

interface DataTabsProps {
  activeTab: EntityTypeName;
  onTabChange: (tab: EntityTypeName) => void;
  className?: string;
}

interface TabConfig {
  key: EntityTypeName;
  label: string;
  icon: string;
  color: {
    base: string;
    active: string;
    hover: string;
    badge: string;
    errorBadge: string;
  };
}

// ===== TAB CONFIGURATIONS =====

const TAB_CONFIGS: TabConfig[] = [
  {
    key: 'client',
    label: 'Clients',
    icon: '👥',
    color: {
      base: 'text-blue-600 border-blue-200',
      active: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 text-blue-700',
      hover: 'hover:bg-blue-50/70 hover:border-blue-300',
      badge: 'bg-blue-100 text-blue-700',
      errorBadge: 'bg-red-100 text-red-700'
    }
  },
  {
    key: 'worker',
    label: 'Workers',
    icon: '👷',
    color: {
      base: 'text-emerald-600 border-emerald-200',
      active: 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-500 text-emerald-700',
      hover: 'hover:bg-emerald-50/70 hover:border-emerald-300',
      badge: 'bg-emerald-100 text-emerald-700',
      errorBadge: 'bg-red-100 text-red-700'
    }
  },
  {
    key: 'task',
    label: 'Tasks',
    icon: '📋',
    color: {
      base: 'text-purple-600 border-purple-200',
      active: 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-500 text-purple-700',
      hover: 'hover:bg-purple-50/70 hover:border-purple-300',
      badge: 'bg-purple-100 text-purple-700',
      errorBadge: 'bg-red-100 text-red-700'
    }
  }
];

// ===== SUB-COMPONENTS =====

interface TabBadgeProps {
  count: number;
  isError?: boolean;
  color: TabConfig['color'];
  size?: 'sm' | 'md';
}

const TabBadge: React.FC<TabBadgeProps> = ({ 
  count, 
  isError = false, 
  color, 
  size = 'sm' 
}) => {
  if (count === 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[18px]',
    md: 'text-sm px-2 py-1 min-w-[24px]'
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        sizeClasses[size],
        isError ? color.errorBadge : color.badge
      )}
    >
      {count > 999 ? '999+' : count}
    </span>
  );
};

interface TabItemProps {
  config: TabConfig;
  isActive: boolean;
  rowCount: number;
  errorCount: number;
  warningCount: number;
  onClick: () => void;
}

const TabItem: React.FC<TabItemProps> = ({
  config,
  isActive,
  rowCount,
  errorCount,
  warningCount,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 px-4 py-3 border-b-2 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isActive 
          ? cn('border-b-2', config.color.active)
          : cn('border-transparent', config.color.base, config.color.hover)
      )}
    >
      {/* Icon */}
      <span className="text-lg" role="img" aria-label={config.label}>
        {config.icon}
      </span>

      {/* Label */}
      <span className="font-medium">
        {config.label}
      </span>

      {/* Row Count Badge */}
      <TabBadge 
        count={rowCount} 
        color={config.color}
        size="sm"
      />

      {/* Error/Warning Badges */}
      <div className="flex items-center gap-1">
        {errorCount > 0 && (
          <TabBadge 
            count={errorCount} 
            isError={true}
            color={config.color}
            size="sm"
          />
        )}
        {warningCount > 0 && (
          <span 
            className="inline-flex items-center justify-center text-xs px-1.5 py-0.5 min-w-[18px] rounded-full font-medium bg-amber-100 text-amber-700"
          >
            {warningCount > 999 ? '999+' : warningCount}
          </span>
        )}
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current" />
      )}
    </button>
  );
};

// ===== MAIN COMPONENT =====

export const DataTabs: React.FC<DataTabsProps> = ({
  activeTab,
  onTabChange,
  className
}) => {
  const { clients, workers, tasks, validationErrors } = useDataStore();

  // Calculate counts for each entity type
  const getEntityCounts = (entityType: EntityTypeName) => {
    let rowCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    switch (entityType) {
      case 'client':
        rowCount = clients.length;
        break;
      case 'worker':
        rowCount = workers.length;
        break;
      case 'task':
        rowCount = tasks.length;
        break;
    }

    // Count validation errors and warnings for this entity type
    const entityErrors = validationErrors.filter(error => {
      // Extract entity type from error ID or use a different method based on your ValidationError structure
      if (entityType === 'client' && error.entityId?.startsWith('C')) return true;
      if (entityType === 'worker' && error.entityId?.startsWith('W')) return true;
      if (entityType === 'task' && error.entityId?.startsWith('T')) return true;
      return false;
    });

    errorCount = entityErrors.filter(error => error.severity === 'error').length;
    warningCount = entityErrors.filter(error => error.severity === 'warning').length;

    return { rowCount, errorCount, warningCount };
  };

  return (
    <div className={cn('bg-white/80 backdrop-blur-sm border-b border-slate-200/60', className)}>
      <div className="flex items-center justify-between">
        {/* Tab Navigation */}
        <div className="flex" role="tablist">
          {TAB_CONFIGS.map((config) => {
            const { rowCount, errorCount, warningCount } = getEntityCounts(config.key);
            
            return (
              <TabItem
                key={config.key}
                config={config}
                isActive={activeTab === config.key}
                rowCount={rowCount}
                errorCount={errorCount}
                warningCount={warningCount}
                onClick={() => onTabChange(config.key)}
              />
            );
          })}
        </div>

        {/* Summary Information */}
        <div className="flex items-center gap-4 px-6 py-3 text-sm text-slate-600">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            <span className="font-medium text-indigo-700">
              Total: {clients.length + workers.length + tasks.length} entities
            </span>
          </div>
          
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="font-medium text-red-700">
                {validationErrors.filter(e => e.severity === 'error').length} errors,{' '}
                {validationErrors.filter(e => e.severity === 'warning').length} warnings
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== EXPORT =====

export default DataTabs;
