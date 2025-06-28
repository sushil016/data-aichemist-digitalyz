/**
 * @fileoverview Natural Language Search Component
 * @description AI-powered search interface for plain English queries
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDataStore, useDataActions } from '@/lib/store/data-store';
import { naturalLanguageSearch } from '@/lib/natural-language-search';

// ===== TYPES =====

interface SearchSuggestion {
  text: string;
  description: string;
  example: boolean;
}

// ===== COMPONENT =====

interface NaturalLanguageSearchProps {
  className?: string;
  placeholder?: string;
  onResultsChange?: (hasResults: boolean) => void;
}

export default function NaturalLanguageSearch({ 
  className, 
  placeholder = "Ask anything... (e.g., 'Show all high priority clients' or 'Workers with JavaScript skills')",
  onResultsChange 
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { clients, workers, tasks } = useDataStore();
  const actions = useDataActions();

  // Enhanced sample queries with context-aware suggestions
  const getContextualSuggestions = () => {
    const suggestions: SearchSuggestion[] = [
      // Basic examples
      {
        text: "Show all high priority clients",
        description: "Find clients with priority level 4 or 5",
        example: true
      },
      {
        text: "Workers with JavaScript skills",
        description: "Filter workers by specific skills",
        example: true
      },
      {
        text: "Tasks longer than 5 phases",
        description: "Find tasks by duration",
        example: true
      },
      {
        text: "Frontend workers available in phase 2", 
        description: "Complex filtering by group and availability",
        example: true
      },
      {
        text: "Clients in Enterprise group",
        description: "Filter by group tags",
        example: true
      },
      {
        text: "Tasks requiring skills that no worker has",
        description: "Find potential skill gaps",
        example: true
      },
      {
        text: "Workers available in phases 2 and 3",
        description: "Multi-phase availability filtering",
        example: true
      },
      {
        text: "Clients requesting more than 5 tasks", 
        description: "High-demand clients",
        example: true
      }
    ];

    // Add dynamic suggestions based on current data
    if (clients.length > 0) {
      const uniqueGroups = [...new Set(clients.map(c => c.GroupTag))];
      uniqueGroups.forEach(group => {
        if (group) {
          suggestions.push({
            text: `Show ${group} clients`,
            description: `Filter clients by ${group} group`,
            example: false
          });
        }
      });
    }

    if (workers.length > 0) {
      const uniqueSkills = [...new Set(workers.flatMap(w => {
        if (Array.isArray(w.Skills)) {
          return w.Skills;
        } else if (typeof w.Skills === 'string') {
          return (w.Skills as string).split(',').map((s: string) => s.trim());
        }
        return [];
      }))];
      uniqueSkills.slice(0, 5).forEach(skill => {
        if (skill && skill.trim()) {
          suggestions.push({
            text: `Workers with ${skill.trim()} skills`,
            description: `Find workers skilled in ${skill.trim()}`,
            example: false
          });
        }
      });
    }

    if (tasks.length > 0) {
      const uniqueCategories = [...new Set(tasks.map(t => t.Category))];
      uniqueCategories.forEach(category => {
        if (category) {
          suggestions.push({
            text: `Show ${category} tasks`,
            description: `Filter tasks by ${category} category`,
            example: false
          });
        }
      });
    }

    return suggestions;
  };

  // Update suggestions when data changes
  React.useEffect(() => {
    setSmartSuggestions(getContextualSuggestions());
  }, [clients.length, workers.length, tasks.length]);

  // Sample queries for suggestions - keeping the original as fallback
  const sampleQueries: SearchSuggestion[] = getContextualSuggestions();

  // Handle search execution with history tracking
  const executeSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      onResultsChange?.(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = naturalLanguageSearch.search(searchQuery, {
        clients,
        workers,
        tasks
      });

      setSearchResult(result);
      setShowSuggestions(false);
      onResultsChange?.(result.totalCount > 0);

      // Add to search history (keep last 10 searches)
      setSearchHistory(prev => {
        const newHistory = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 10);
        // Save to localStorage for persistence
        try {
          localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        } catch (e) {
          console.warn('Could not save search history:', e);
        }
        return newHistory;
      });

      // Update store filters to show search results in data grid
      if (result.totalCount > 0) {
        // Apply search results as filters to the data store
        const searchFilters: Record<string, any> = {
          searchResults: result.data.map((item: any) => item.ClientID || item.WorkerID || item.TaskID),
          searchQuery: searchQuery,
          entityType: result.parsedQuery.entityType
        };
        actions.setFilters(searchFilters);
      } else {
        // Clear filters if no results
        actions.setFilters({});
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult(null);
      onResultsChange?.(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Load search history on mount
  React.useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.warn('Could not load search history:', e);
    }
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSearchResult(null);
      onResultsChange?.(false);
    }
  };

  // Handle key presses
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch(query);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    executeSearch(suggestion.text);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setSearchResult(null);
    setShowSuggestions(false);
    onResultsChange?.(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-slate-400 text-lg">🔍</span>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => query.length === 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200',
            'bg-white/80 backdrop-blur-sm',
            'placeholder:text-slate-400 text-slate-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'transition-all duration-200',
            isSearching && 'animate-pulse'
          )}
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="text-lg">✕</span>
          </button>
        )}

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          
          {/* Search History Section */}
          {searchHistory.length > 0 && (
            <>
              <div className="p-3 border-b border-slate-100">
                <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <span>🕒</span>
                  Recent searches
                </h3>
              </div>
              
              {searchHistory.slice(0, 5).map((historyQuery, index) => (
                <button
                  key={`history-${index}`}
                  onClick={() => handleSuggestionClick({ text: historyQuery, description: 'Recent search', example: false })}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-50"
                >
                  <div className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="text-slate-400">↻</span>
                    {historyQuery}
                  </div>
                </button>
              ))}
            </>
          )}
          
          {/* Example Queries Section */}
          <div className="p-3 border-b border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span>💡</span>
              {searchHistory.length > 0 ? 'Try these examples:' : 'Example queries:'}
            </h3>
          </div>
          
          {sampleQueries.filter(s => s.example).slice(0, 6).map((suggestion, index) => (
            <button
              key={`example-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
            >
              <div className="text-sm font-medium text-slate-700">
                {suggestion.text}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {suggestion.description}
              </div>
            </button>
          ))}

          {/* Smart Suggestions Section */}
          {smartSuggestions.filter(s => !s.example).length > 0 && (
            <>
              <div className="p-3 border-b border-slate-100">
                <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <span>🧠</span>
                  Smart suggestions (based on your data)
                </h3>
              </div>
              
              {smartSuggestions.filter(s => !s.example).slice(0, 5).map((suggestion, index) => (
                <button
                  key={`smart-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                >
                  <div className="text-sm font-medium text-emerald-700">
                    {suggestion.text}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    {suggestion.description}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Search Results Summary */}
      {searchResult && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-medium">
                {searchResult.totalCount} result{searchResult.totalCount !== 1 ? 's' : ''} found
              </span>
              {searchResult.executionTime && (
                <span className="text-xs text-blue-500">
                  ({searchResult.executionTime}ms)
                </span>
              )}
            </div>
            
            <button
              onClick={clearSearch}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear
            </button>
          </div>
          
          {searchResult.parsedQuery && (
            <div className="mt-2 text-xs text-blue-600">
              <span className="font-medium">Query:</span> {searchResult.query}
            </div>
          )}

          {searchResult.suggestions && searchResult.suggestions.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-blue-600 font-medium mb-1">Suggestions:</div>
              <div className="flex flex-wrap gap-1">
                {searchResult.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick({ text: suggestion, description: '', example: false })}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
