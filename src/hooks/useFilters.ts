import { useState, useCallback, useMemo } from 'react';
import { DataRow, FilterState } from '@/types';
import { applyFilters, getAvailableFilterOptions } from '@/utils/filterLogic';

export const useFilters = (data: DataRow[]) => {
  const [filters, setFilters] = useState<FilterState>({});

  const filteredData = useMemo(() => {
    return applyFilters(data, filters);
  }, [data, filters]);

  const updateFilter = useCallback((column: string, selectedValues: string[]) => {
    setFilters(prev => ({
      ...prev,
      [column]: selectedValues,
    }));
  }, []);

  const clearFilter = useCallback((column: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const getFilterOptions = useCallback((column: string) => {
    return getAvailableFilterOptions(data, filters, column);
  }, [data, filters]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(values => values.length > 0);
  }, [filters]);

  return {
    filters,
    filteredData,
    updateFilter,
    clearFilter,
    clearAllFilters,
    getFilterOptions,
    hasActiveFilters,
  };
};
