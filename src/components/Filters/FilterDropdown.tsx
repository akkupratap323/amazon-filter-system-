'use client';

import React, { useMemo } from 'react';
import { MultiSelectFilter } from './MultiSelectFilter';
import { FilterOption } from '@/types';
import { useFilterContext } from '@/context/FilterContext';
import { getAvailableFilterOptions } from '@/utils/filterLogic';
import { calculateFilterCounts } from '@/utils/dataProcessing';

interface FilterDropdownProps {
  column: string;
  label: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ column, label }) => {
  const { state, dispatch } = useFilterContext();
  const { data, filters } = state;

  const selectedValues = filters[column] || [];

  // Get available options based on other filters
  const availableOptions = useMemo(() => {
    return getAvailableFilterOptions(data, filters, column);
  }, [data, filters, column]);

  // Calculate counts for each option
  const optionsWithCounts: FilterOption[] = useMemo(() => {
    if (availableOptions.length === 0) return [];

    const counts = calculateFilterCounts(data, column, availableOptions);
    
    return availableOptions.map(value => ({
      value,
      label: value,
      count: counts[value] || 0,
    }));
  }, [availableOptions, data, column]);

  const handleSelectionChange = (values: string[]) => {
    dispatch({
      type: 'UPDATE_FILTER',
      payload: { column, values },
    });
  };

  const hasActiveFilter = selectedValues.length > 0;

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {hasActiveFilter && (
          <button
            onClick={() => dispatch({ type: 'CLEAR_FILTER', payload: column })}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Clear
          </button>
        )}
      </div>
      
      <MultiSelectFilter
        options={optionsWithCounts}
        selectedValues={selectedValues}
        onSelectionChange={handleSelectionChange}
        placeholder={`Select ${label.toLowerCase()}...`}
        searchable={true}
        disabled={optionsWithCounts.length === 0}
      />
      
      {hasActiveFilter && (
        <div className="text-xs text-gray-500">
          {selectedValues.length} of {optionsWithCounts.length} selected
        </div>
      )}
    </div>
  );
};
