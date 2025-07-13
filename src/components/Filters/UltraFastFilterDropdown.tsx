'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { MultiSelectFilter } from './MultiSelectFilter';
import { useUltraFastFilter } from '@/context/UltraFastFilterContext';
import { FilterOption } from '@/types';

interface UltraFastFilterDropdownProps {
  column: string;
  label: string;
}

// Performance constants
const MAX_VISIBLE_OPTIONS = 100;
const SMALL_DATASET_THRESHOLD = 500;
const SEARCH_DEBOUNCE_MS = 100; // Reduced for faster response
const FRAME_BUDGET_MS = 16; // 60fps frame budget

// Pre-computed constants for better performance
const EMPTY_ARRAY: FilterOption[] = [];
const EMPTY_STRING_ARRAY: string[] = [];

export const UltraFastFilterDropdown: React.FC<UltraFastFilterDropdownProps> = React.memo(({ 
  column, 
  label
}) => {
  const { state, dispatch, getAvailableFilterOptions, getFilterOptions } = useUltraFastFilter();
  const { filters, data } = state;
  const selectedValues = filters[column] || EMPTY_STRING_ARRAY;
  
  // Optimized state management
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const frameRef = useRef<number | undefined>(undefined);
  const lastSearchRef = useRef<string>('');
  const optionsCacheRef = useRef<Map<string, FilterOption[]>>(new Map());
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);
  
  // Ultra-fast column metadata with minimal recalculation
  const columnMeta = useMemo(() => {
    const isIdOrNumber = column === 'id' || column === 'number';
    const dataLength = data.length;
    const isSmallDataset = dataLength <= SMALL_DATASET_THRESHOLD;
    
    return {
      isIdOrNumber,
      isSmallDataset,
      dataLength,
      cacheKey: `${column}-${dataLength}-${isIdOrNumber}`
    };
  }, [column, data.length]);

  // Hyper-optimized allOptions with aggressive caching
  const allOptions = useMemo(() => {
    const { isIdOrNumber, isSmallDataset, cacheKey } = columnMeta;
    
    // Skip expensive computation for large ID/Number columns
    if (isIdOrNumber && !isSmallDataset) {
      return EMPTY_ARRAY;
    }
    
    // Check cache first
    if (optionsCacheRef.current.has(cacheKey)) {
      return optionsCacheRef.current.get(cacheKey)!;
    }
    
    try {
      const options = getFilterOptions(column);
      optionsCacheRef.current.set(cacheKey, options);
      return options;
    } catch (error) {
      console.error(`Error getting all options for column "${column}":`, error);
      return EMPTY_ARRAY;
    }
  }, [getFilterOptions, column, columnMeta]);

  // Ultra-optimized available options with time-slicing
  const availableOptions = useMemo(() => {
    const { isIdOrNumber, isSmallDataset, dataLength } = columnMeta;
    const startTime = performance.now();
    
    try {
      if (isIdOrNumber && !isSmallDataset) {
        // High-performance ID/Number column handling with early exit
        const options: FilterOption[] = [];
        
        if (debouncedSearch) {
          // Optimized numeric search
          const searchNum = Number(debouncedSearch);
          if (!isNaN(searchNum) && searchNum >= 1 && searchNum <= dataLength) {
            options.push({ 
              value: searchNum.toString(), 
              label: searchNum.toString(), 
              count: 1 
            });
          }
          
          // Time-budgeted partial string search
          if (debouncedSearch.length > 0 && performance.now() - startTime < FRAME_BUDGET_MS) {
            const searchStr = debouncedSearch.toLowerCase();
            const limit = Math.min(MAX_VISIBLE_OPTIONS, dataLength);
            const optionValues = new Set(options.map(opt => opt.value));
            
            for (let i = 1; i <= limit; i++) {
              if (performance.now() - startTime > FRAME_BUDGET_MS) break;
              
              const valueStr = i.toString();
              if (valueStr.includes(searchStr) && !optionValues.has(valueStr)) {
                options.push({ value: valueStr, label: valueStr, count: 1 });
                if (options.length >= MAX_VISIBLE_OPTIONS) break;
              }
            }
          }
        } else {
          // Pre-allocated array for better performance
          const limit = Math.min(MAX_VISIBLE_OPTIONS, dataLength);
          options.length = limit;
          
          for (let i = 0; i < limit; i++) {
            const value = (i + 1).toString();
            options[i] = { value, label: value, count: 1 };
          }
        }
        
        // Batch include selected values
        if (selectedValues.length > 0) {
          const optionValuesSet = new Set(options.map(opt => opt.value));
          const missingSelected = selectedValues.filter(val => !optionValuesSet.has(val));
          
          missingSelected.forEach(val => {
            options.push({ value: val, label: val, count: 1 });
          });
        }
        
        return options;
      } else {
        // Optimized categorical filtering with early termination
        let opts = getAvailableFilterOptions(column);
        
        if (debouncedSearch && opts.length > 0) {
          const searchLower = debouncedSearch.toLowerCase();
          opts = opts.filter(opt => {
            if (performance.now() - startTime > FRAME_BUDGET_MS) return true;
            return opt.label.toLowerCase().includes(searchLower);
          });
        }
        
        return opts.slice(0, MAX_VISIBLE_OPTIONS);
      }
    } catch (error) {
      console.error(`Error processing available options for column "${column}":`, error);
      return EMPTY_ARRAY;
    }
  }, [
    getAvailableFilterOptions, 
    column, 
    debouncedSearch, 
    columnMeta, 
    selectedValues
  ]);

  // Memoized filter status with shallow comparison optimization
  const filterStatus = useMemo(() => {
    const hasActiveFilter = selectedValues.length > 0;
    const hasOtherActiveFilters = Object.keys(filters).some(
      col => col !== column && filters[col]?.length > 0
    );
    const availableCount = availableOptions.length;
    const totalCount = allOptions.length;
    const isDependentFiltering = hasOtherActiveFilters && 
      availableCount < totalCount && 
      totalCount > 0;
    
    return {
      hasActiveFilter,
      hasOtherActiveFilters,
      isDependentFiltering,
      selectedCount: selectedValues.length,
      availableCount,
      totalCount
    };
  }, [
    selectedValues.length, 
    filters, 
    column, 
    availableOptions.length, 
    allOptions.length
  ]);

  // Optimized debounced search with frame scheduling
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    
    // Skip if same value
    if (lastSearchRef.current === value) return;
    lastSearchRef.current = value;
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => void }).requestIdleCallback?.(() => {
        setDebouncedSearch(value);
      }, { timeout: SEARCH_DEBOUNCE_MS });
    } else {
      searchTimeoutRef.current = setTimeout(() => {
        setDebouncedSearch(value);
      }, SEARCH_DEBOUNCE_MS);
    }
  }, []);

  // Ultra-fast filter update with double buffering
  const handleSelectionChange = useCallback((values: string[]) => {
    // Cancel any pending frame
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    
    // Schedule update in next frame
    frameRef.current = requestAnimationFrame(() => {
      dispatch({
        type: 'UPDATE_FILTER',
        payload: { column, values },
      });
    });
  }, [dispatch, column]);

  // Batch clear operations
  const handleClearFilter = useCallback(() => {
    // Batch all state updates
    setSearch('');
    setDebouncedSearch('');
    lastSearchRef.current = '';
    
    // Clear timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    
    // Clear filter
    dispatch({ type: 'CLEAR_FILTER', payload: column });
  }, [dispatch, column]);

  // Pre-computed strings for better performance
  const placeholderText = useMemo(() => `Select ${label.toLowerCase()}...`, [label]);
  const searchPlaceholderText = useMemo(() => `Search ${label.toLowerCase()}...`, [label]);
  const clearAriaLabel = useMemo(() => `Clear ${label} filter`, [label]);
  const searchAriaLabel = useMemo(() => `Search ${label}`, [label]);

  return (
    <div className="flex flex-col space-y-2">
      {/* Optimized header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="flex items-center space-x-2">
          {/* Dependent filtering indicator */}
          {filterStatus.isDependentFiltering && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                Filtered
              </span>
            </div>
          )}
          
          {/* Clear filter button */}
          {filterStatus.hasActiveFilter && (
            <button
              onClick={handleClearFilter}
              className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors duration-150 hover:scale-105 active:scale-95"
              aria-label={clearAriaLabel}
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Optimized search input */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        Type to search, then select from the dropdown.
      </div>
      <div className="relative">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
          placeholder={searchPlaceholderText}
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          aria-label={searchAriaLabel}
          autoComplete="off"
          spellCheck={false}
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Clear search"
            tabIndex={-1}
            type="button"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Multi-select filter component */}
      <MultiSelectFilter
        options={availableOptions}
        selectedValues={selectedValues}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholderText}
        searchable={false}
        disabled={availableOptions.length === 0}
      />
      
      {/* Filter status information */}
      {filterStatus.hasActiveFilter && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>
            {filterStatus.selectedCount} of {filterStatus.availableCount} selected
          </span>
          <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
            ⚡ instant
          </span>
        </div>
      )}
      
      {/* Dependent filtering status */}
      {filterStatus.isDependentFiltering && (
        <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-md border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <span className="font-medium">Smart Filtering Active</span>
            <span className="text-purple-500">🔗</span>
          </div>
          <div className="mt-1">
            Showing {filterStatus.availableCount} of {filterStatus.totalCount} options based on other filters
          </div>
        </div>
      )}
      
      {/* No options available state */}
      {availableOptions.length === 0 && !filterStatus.hasOtherActiveFilters && (
        <div className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-2">
          No options available
        </div>
      )}
    </div>
  );
});

// Set display name for debugging
UltraFastFilterDropdown.displayName = 'UltraFastFilterDropdown';

