'use client';

import React, { useMemo, useCallback, useRef } from 'react';
import { MultiSelectFilter } from './MultiSelectFilter';
import { useUltraFastFilter } from '@/context/UltraFastFilterContext';
import { FilterOption } from '@/types';

interface UltraFastFilterDropdownProps {
  column: string;
  label: string;
}

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
  const frameRef = useRef<number | undefined>(undefined);
  const optionsCacheRef = useRef<Map<string, FilterOption[]>>(new Map());
  
  // Ultra-fast column metadata with minimal recalculation
  const columnMeta = useMemo(() => {
    const isIdOrNumber = column === 'id' || column === 'number';
    const dataLength = data.length;
    
    return {
      isIdOrNumber,
      dataLength,
      cacheKey: `${column}-${dataLength}-${isIdOrNumber}`
    };
  }, [column, data.length]);

  // Hyper-optimized allOptions with aggressive caching
  const allOptions = useMemo(() => {
    const { isIdOrNumber, dataLength, cacheKey } = columnMeta;
    
    // Check cache first
    if (optionsCacheRef.current.has(cacheKey)) {
      return optionsCacheRef.current.get(cacheKey)!;
    }
    
    try {
      if (isIdOrNumber) {
        // Generate ALL ID/Number options for complete dropdown
        const options: FilterOption[] = [];
        options.length = dataLength; // Pre-allocate for better performance
        
        for (let i = 0; i < dataLength; i++) {
          const value = (i + 1).toString();
          options[i] = { value, label: value, count: 1 };
        }
        
        optionsCacheRef.current.set(cacheKey, options);
        return options;
      } else {
        // For categorical columns, use existing logic
        const options = getFilterOptions(column);
        optionsCacheRef.current.set(cacheKey, options);
        return options;
      }
    } catch (error) {
      console.error(`Error getting all options for column "${column}":`, error);
      return EMPTY_ARRAY;
    }
  }, [getFilterOptions, column, columnMeta]);

  // Ultra-optimized available options
  const availableOptions = useMemo(() => {
    const { isIdOrNumber } = columnMeta;
    
    try {
      if (isIdOrNumber) {
        // Show ALL ID/Number values
        const options = [...allOptions];
        
        // Always include selected values even if not in filtered results
        if (selectedValues.length > 0) {
          const optionValuesSet = new Set(options.map(opt => opt.value));
          const missingSelected = selectedValues.filter(val => !optionValuesSet.has(val));
          
          missingSelected.forEach(val => {
            options.push({ value: val, label: val, count: 1 });
          });
        }
        
        return options;
      } else {
        // Optimized categorical filtering
        return getAvailableFilterOptions(column);
      }
    } catch (error) {
      console.error(`Error processing available options for column "${column}":`, error);
      return EMPTY_ARRAY;
    }
  }, [
    getAvailableFilterOptions, 
    column, 
    columnMeta, 
    selectedValues,
    allOptions
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
    // Clear any pending frame
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    
    // Clear filter
    dispatch({ type: 'CLEAR_FILTER', payload: column });
  }, [dispatch, column]);

  // Pre-computed strings for better performance
  const placeholderText = useMemo(() => `Select ${label.toLowerCase()}...`, [label]);
  const clearAriaLabel = useMemo(() => `Clear ${label} filter`, [label]);

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
      
      {/* Helper text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        Click to open dropdown and search within options.
      </div>
      
      {/* Multi-select filter component with search inside dropdown */}
      <MultiSelectFilter
        options={availableOptions}
        selectedValues={selectedValues}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholderText}
        searchable={true}
        disabled={availableOptions.length === 0}
        maxHeight={400} // Increased height for better scrolling
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

