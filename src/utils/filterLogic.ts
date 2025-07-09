import { DataRow, FilterState } from '@/types';

export const applyFilters = (data: DataRow[], filters: FilterState): DataRow[] => {
  return data.filter(row => {
    return Object.entries(filters).every(([column, selectedValues]) => {
      if (selectedValues.length === 0) return true;
      return selectedValues.includes(String(row[column]));
    });
  });
};

export const applyFiltersExcept = (
  data: DataRow[],
  filters: FilterState,
  excludeColumn: string
): DataRow[] => {
  const filtersWithoutExcluded = Object.fromEntries(
    Object.entries(filters).filter(([column]) => column !== excludeColumn)
  );
  
  return applyFilters(data, filtersWithoutExcluded);
};

export const getAvailableFilterOptions = (
  allData: DataRow[],
  currentFilters: FilterState,
  targetColumn: string
): string[] => {
  // Apply all filters except the target column
  const filteredData = applyFiltersExcept(allData, currentFilters, targetColumn);
  
  // Get unique values from the target column
  const uniqueValues = [...new Set(filteredData.map(row => String(row[targetColumn])))];
  
  // Sort the values
  return uniqueValues.sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
};

export const updateFilterState = (
  currentFilters: FilterState,
  column: string,
  selectedValues: string[]
): FilterState => {
  return {
    ...currentFilters,
    [column]: selectedValues,
  };
};

export const clearAllFilters = (): FilterState => {
  return {};
};

export const clearFilter = (
  currentFilters: FilterState,
  column: string
): FilterState => {
  const newFilters = { ...currentFilters };
  delete newFilters[column];
  return newFilters;
};
