import { DataRow, FilterState } from '@/types';

// Optimized filtering system with indexing and caching
export class OptimizedFilterManager {
  private dataIndex: Map<string, Map<string, Set<number>>>;
  private dataCache: Map<number, DataRow>;
  private filterCache: Map<string, Set<number>>;
  private optionsCache: Map<string, Set<string>>;
  private totalCount: number;
  private chunkSize: number;

  constructor(totalCount: number, chunkSize: number = 1000) {
    this.dataIndex = new Map();
    this.dataCache = new Map();
    this.filterCache = new Map();
    this.optionsCache = new Map();
    this.totalCount = totalCount;
    this.chunkSize = chunkSize;
  }

  // Build index for a column (called when data is loaded)
  buildIndex(column: string, data: DataRow[], startIndex: number = 0): void {
    if (!this.dataIndex.has(column)) {
      this.dataIndex.set(column, new Map());
    }

    const columnIndex = this.dataIndex.get(column)!;
    
    data.forEach((row, localIndex) => {
      const globalIndex = startIndex + localIndex;
      const value = String(row[column as keyof DataRow]);
      
      if (!columnIndex.has(value)) {
        columnIndex.set(value, new Set());
      }
      columnIndex.get(value)!.add(globalIndex);
    });
  }

  // Cache data rows
  cacheData(data: DataRow[], startIndex: number = 0): void {
    data.forEach((row, localIndex) => {
      const globalIndex = startIndex + localIndex;
      this.dataCache.set(globalIndex, row);
    });
  }

  // Get filtered data range with optimized performance
  getFilteredDataRange(startIndex: number, endIndex: number, filters: FilterState): DataRow[] {
    if (Object.keys(filters).length === 0) {
      // No filters, return cached data
      const result: DataRow[] = [];
      for (let i = startIndex; i <= endIndex && i < this.totalCount; i++) {
        const cached = this.dataCache.get(i);
        if (cached) {
          result.push(cached);
        }
      }
      return result;
    }

    // Get filtered indices
    const filteredIndices = this.getFilteredIndices(filters);
    if (!filteredIndices) {
      return [];
    }

    // Convert to array and sort
    const sortedIndices = Array.from(filteredIndices).sort((a, b) => a - b);
    
    // Get data for the requested range
    const result: DataRow[] = [];
    for (const index of sortedIndices) {
      if (index >= startIndex && index <= endIndex) {
        const cached = this.dataCache.get(index);
        if (cached) {
          result.push(cached);
        }
      }
      if (result.length >= (endIndex - startIndex + 1)) {
        break;
      }
    }

    return result;
  }

  // Get filtered count with caching
  getFilteredCount(filters: FilterState): number {
    if (Object.keys(filters).length === 0) {
      return this.totalCount;
    }

    const cacheKey = JSON.stringify(filters);
    if (this.filterCache.has(cacheKey)) {
      return this.filterCache.get(cacheKey)!.size;
    }

    const filteredIndices = this.getFilteredIndices(filters);
    if (!filteredIndices) {
      return 0;
    }

    const count = filteredIndices.size;
    this.filterCache.set(cacheKey, filteredIndices);
    return count;
  }

  // Get filter options with optimized performance
  getFilterOptions(column: string, currentFilters: FilterState = {}): string[] {
    const cacheKey = `options_${column}_${JSON.stringify(currentFilters)}`;
    
    if (this.optionsCache.has(cacheKey)) {
      return Array.from(this.optionsCache.get(cacheKey)!);
    }

    if (!this.dataIndex.has(column)) {
      return [];
    }

    const columnIndex = this.dataIndex.get(column)!;
    const uniqueValues = new Set<string>();

    // If no other filters, return all unique values
    if (Object.keys(currentFilters).length === 0) {
      columnIndex.forEach((indices, value) => {
        uniqueValues.add(value);
      });
    } else {
      // Apply other filters to get valid indices
      const validIndices = this.getFilteredIndices(currentFilters, column);
      if (validIndices) {
        // Get unique values from valid indices
        columnIndex.forEach((indices, value) => {
          for (const index of indices) {
            if (validIndices.has(index)) {
              uniqueValues.add(value);
              break;
            }
          }
        });
      }
    }

    const result = Array.from(uniqueValues).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    // Cache the result
    this.optionsCache.set(cacheKey, new Set(result));
    return result;
  }

  // Get filtered indices with optimized intersection
  private getFilteredIndices(filters: FilterState, excludeColumn?: string): Set<number> | null {
    let result: Set<number> | null = null;

    for (const [column, selectedValues] of Object.entries(filters)) {
      if (column === excludeColumn || selectedValues.length === 0) {
        continue;
      }

      if (!this.dataIndex.has(column)) {
        return new Set(); // No data for this column
      }

      const columnIndex = this.dataIndex.get(column)!;
      const columnIndices = new Set<number>();

      // Collect indices for selected values
      for (const value of selectedValues) {
        const indices = columnIndex.get(value);
        if (indices) {
          indices.forEach(index => columnIndices.add(index));
        }
      }

      // Intersect with previous result
      if (result === null) {
        result = columnIndices;
      } else {
        const intersection = new Set<number>();
        for (const index of result) {
          if (columnIndices.has(index)) {
            intersection.add(index);
          }
        }
        result = intersection;
      }

      // Early exit if no results
      if (result.size === 0) {
        return result;
      }
    }

    return result;
  }

  // Clear cache
  clearCache(): void {
    this.filterCache.clear();
    this.optionsCache.clear();
  }

  // Clear specific cache
  clearFilterCache(column?: string): void {
    if (column) {
      const keysToDelete = Array.from(this.optionsCache.keys()).filter(key => 
        key.startsWith(`options_${column}_`)
      );
      keysToDelete.forEach(key => this.optionsCache.delete(key));
    } else {
      this.optionsCache.clear();
    }
  }

  // Get memory usage info
  getMemoryInfo(): { indexSize: number; cacheSize: number; filterCacheSize: number } {
    let indexSize = 0;
    this.dataIndex.forEach((columnIndex) => {
      columnIndex.forEach((indices) => {
        indexSize += indices.size * 8; // Approximate size of numbers
      });
    });

    return {
      indexSize,
      cacheSize: this.dataCache.size * 100, // Approximate size per row
      filterCacheSize: this.filterCache.size * 50, // Approximate size per cache entry
    };
  }
}

// Optimized filter options for large datasets
export const getOptimizedFilterOptions = (
  filterManager: OptimizedFilterManager,
  targetColumn: string,
  currentFilters: FilterState = {}
): string[] => {
  return filterManager.getFilterOptions(targetColumn, currentFilters);
};

// Apply optimized filters to data
export const applyOptimizedFilters = (
  filterManager: OptimizedFilterManager,
  filters: FilterState,
  startIndex: number,
  endIndex: number
): DataRow[] => {
  return filterManager.getFilteredDataRange(startIndex, endIndex, filters);
};

// Get optimized filtered count
export const getOptimizedFilteredCount = (
  filterManager: OptimizedFilterManager,
  filters: FilterState
): number => {
  return filterManager.getFilteredCount(filters);
}; 