import { DataRow, FilterState } from '@/types';

// Enhanced filter index with metadata
interface OptimizedFilterIndex {
  columnIndices: Map<string, Map<string, Set<number>>>;
  rowCount: number;
  columnStats: Map<string, {
    uniqueCount: number;
    mostCommon: string;
    dataType: 'number' | 'string';
  }>;
}

// Global cache for indices to avoid rebuilding
const indexCache = new Map<string, OptimizedFilterIndex>();
const CACHE_SIZE_LIMIT = 5;
const SMALL_DATASET_THRESHOLD = 1000;
const BATCH_SIZE = 10000;
// const INDEX_REBUILD_THRESHOLD = 0.1; // Rebuild if 10% of data changed

// Ultra-fast index building with caching and optimization
const buildOptimizedFilterIndex = (data: DataRow[], cacheKey?: string): OptimizedFilterIndex => {
  const startTime = performance.now();
  
  // Check cache first
  if (cacheKey && indexCache.has(cacheKey)) {
    const cached = indexCache.get(cacheKey)!;
    if (cached.rowCount === data.length) {
      return cached;
    }
  }
  
  const columnIndices = new Map<string, Map<string, Set<number>>>();
  const columnStats = new Map<string, { uniqueCount: number; mostCommon: string; dataType: 'number' | 'string' }>();
  
  // Pre-analyze columns from first few rows for optimization
  const sampleSize = Math.min(100, data.length);
  const columnTypes = new Map<string, 'number' | 'string'>();
  
  if (data.length > 0) {
    const firstRow = data[0];
    Object.keys(firstRow).forEach(column => {
      // Determine data type from sample
      let isNumeric = true;
      for (let i = 0; i < sampleSize && i < data.length; i++) {
        const value = data[i][column as keyof DataRow];
        if (isNaN(Number(value))) {
          isNumeric = false;
          break;
        }
      }
      columnTypes.set(column, isNumeric ? 'number' : 'string');
      columnIndices.set(column, new Map<string, Set<number>>());
    });
  }
  
  // Build index with batch processing for large datasets
  const processInBatches = data.length > BATCH_SIZE;
  
  if (processInBatches) {
    // Process in chunks to maintain UI responsiveness
    for (let batchStart = 0; batchStart < data.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, data.length);
      
      for (let rowIndex = batchStart; rowIndex < batchEnd; rowIndex++) {
        const row = data[rowIndex];
        
        Object.entries(row).forEach(([column, value]) => {
          const stringValue = String(value);
          const columnMap = columnIndices.get(column)!;
          
          if (!columnMap.has(stringValue)) {
            columnMap.set(stringValue, new Set<number>());
          }
          columnMap.get(stringValue)!.add(rowIndex);
        });
      }
      
      // Yield control periodically for UI responsiveness
      if (batchStart % (BATCH_SIZE * 5) === 0) {
        setTimeout(() => {}, 0);
      }
    }
  } else {
    // Direct processing for small datasets
    data.forEach((row, rowIndex) => {
      Object.entries(row).forEach(([column, value]) => {
        const stringValue = String(value);
        const columnMap = columnIndices.get(column)!;
        
        if (!columnMap.has(stringValue)) {
          columnMap.set(stringValue, new Set<number>());
        }
        columnMap.get(stringValue)!.add(rowIndex);
      });
    });
  }
  
  // Calculate column statistics for optimization
  columnIndices.forEach((valueMap, column) => {
    const uniqueCount = valueMap.size;
    let mostCommon = '';
    let maxCount = 0;
    
    valueMap.forEach((indices, value) => {
      if (indices.size > maxCount) {
        maxCount = indices.size;
        mostCommon = value;
      }
    });
    
    columnStats.set(column, {
      uniqueCount,
      mostCommon,
      dataType: columnTypes.get(column) || 'string'
    });
  });
  
  const index: OptimizedFilterIndex = {
    columnIndices,
    rowCount: data.length,
    columnStats
  };
  
  // Cache the index with LRU eviction
  if (cacheKey) {
    if (indexCache.size >= CACHE_SIZE_LIMIT) {
      const firstKey = indexCache.keys().next().value;
      if (firstKey) {
        indexCache.delete(firstKey);
      }
    }
    indexCache.set(cacheKey, index);
  }
  
  const endTime = performance.now();
  console.log(`Index built in ${endTime - startTime}ms for ${data.length} rows`);
  
  return index;
};

// Ultra-optimized filtering with multiple strategies
export const applyFilters = (data: DataRow[], filters: FilterState): DataRow[] => {
  const activeFilters = Object.entries(filters).filter(([, values]) => values.length > 0);
  
  // Early return for no filters
  if (activeFilters.length === 0) {
    return data;
  }
  
  // Strategy 1: Direct filtering for small datasets
  if (data.length < SMALL_DATASET_THRESHOLD) {
    return data.filter(row => {
      return activeFilters.every(([column, selectedValues]) => {
        return selectedValues.includes(String(row[column as keyof DataRow]));
      });
    });
  }
  
  // Strategy 2: Indexed filtering for large datasets
  const cacheKey = `${data.length}-${Object.keys(data[0] || {}).join(',')}`;
  const index = buildOptimizedFilterIndex(data, cacheKey);
  
  // Find intersection using optimized set operations
  let validIndices: Set<number> | null = null;
  
  // Sort filters by selectivity (most selective first)
  const sortedFilters = activeFilters.sort(([columnA, valuesA], [columnB, valuesB]) => {
    const statsA = index.columnStats.get(columnA);
    const statsB = index.columnStats.get(columnB);
    
    if (!statsA || !statsB) return 0;
    
    // Prioritize filters with fewer unique values (more selective)
    const selectivityA = valuesA.length / statsA.uniqueCount;
    const selectivityB = valuesB.length / statsB.uniqueCount;
    
    return selectivityA - selectivityB;
  });
  
  for (const [column, selectedValues] of sortedFilters) {
    const columnMap = index.columnIndices.get(column);
    if (!columnMap) continue;
    
    const columnIndices = new Set<number>();
    
    // Batch process selected values
    selectedValues.forEach(value => {
      const valueIndices = columnMap.get(value);
      if (valueIndices) {
        valueIndices.forEach(idx => columnIndices.add(idx));
      }
    });
    
    if (validIndices === null) {
      validIndices = columnIndices;
    } else {
      // Optimized intersection using the smaller set
      const [smaller, larger]: [Set<number>, Set<number>] = validIndices.size < columnIndices.size 
        ? [validIndices, columnIndices] 
        : [columnIndices, validIndices];
      
      validIndices = new Set([...smaller].filter(x => larger.has(x)));
      
      // Early exit if no matches
      if (validIndices.size === 0) {
        return [];
      }
    }
  }
  
  if (!validIndices || validIndices.size === 0) {
    return [];
  }
  
  // Convert indices to rows efficiently
  const indices = validIndices as Set<number>;
  return Array.from(indices).map((rowIndex: number) => data[rowIndex]);
};

// Memory-efficient batch processing for massive datasets
export const applyFiltersBatch = (
  data: DataRow[], 
  filters: FilterState, 
  batchSize: number = BATCH_SIZE,
  onProgress?: (completed: number, total: number) => void
): Promise<DataRow[]> => {
  return new Promise((resolve) => {
    const results: DataRow[] = [];
    let processed = 0;
    
    const processBatch = () => {
      const batchStart = processed;
      const batchEnd = Math.min(processed + batchSize, data.length);
      const batch = data.slice(batchStart, batchEnd);
      
      const filteredBatch = applyFilters(batch, filters);
      results.push(...filteredBatch);
      
      processed = batchEnd;
      
      if (onProgress) {
        onProgress(processed, data.length);
      }
      
      if (processed < data.length) {
        // Schedule next batch
        requestAnimationFrame(processBatch);
      } else {
        resolve(results);
      }
    };
    
    processBatch();
  });
};

// Optimized exclude filter with smart caching
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

// Ultra-fast available options with intelligent caching
export const getAvailableFilterOptions = (
  allData: DataRow[],
  currentFilters: FilterState,
  targetColumn: string
): { value: string; label: string; count: number }[] => {
  // Strategy 1: Direct approach for small datasets
  if (allData.length < SMALL_DATASET_THRESHOLD) {
    const filteredData = applyFiltersExcept(allData, currentFilters, targetColumn);
    const valueCounts = new Map<string, number>();
    
    filteredData.forEach(row => {
      const value = String(row[targetColumn as keyof DataRow]);
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    });
    
    return Array.from(valueCounts.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => {
        const numA = Number(a.value);
        const numB = Number(b.value);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.value.localeCompare(b.value);
      });
  }
  
  // Strategy 2: Indexed approach for large datasets
  const cacheKey = `${allData.length}-${Object.keys(allData[0] || {}).join(',')}`;
  const index = buildOptimizedFilterIndex(allData, cacheKey);
  
  const filtersWithoutTarget = Object.fromEntries(
    Object.entries(currentFilters).filter(([column]) => column !== targetColumn)
  );
  
  // Get valid indices based on other filters
  let validIndices: Set<number> | null = null;
  
  Object.entries(filtersWithoutTarget).forEach(([column, selectedValues]) => {
    if (selectedValues.length === 0) return;
    
    const columnMap = index.columnIndices.get(column);
    if (!columnMap) return;
    
    const columnIndices = new Set<number>();
    selectedValues.forEach(value => {
      const valueIndices = columnMap.get(value);
      if (valueIndices) {
        valueIndices.forEach(idx => columnIndices.add(idx));
      }
    });
    
    if (validIndices === null) {
      validIndices = columnIndices;
    } else {
      validIndices = new Set([...validIndices].filter(x => columnIndices.has(x)));
    }
  });
  
  // Get unique values with counts
  const targetColumnMap = index.columnIndices.get(targetColumn);
  if (!targetColumnMap) return [];
  
  const valueCounts = new Map<string, number>();
  
  if (validIndices === null) {
    // No other filters, use all values
    targetColumnMap.forEach((indices, value) => {
      valueCounts.set(value, indices.size);
    });
  } else {
    // Count intersections
    targetColumnMap.forEach((indices, value) => {
      const intersection = [...indices].filter(idx => validIndices!.has(idx));
      if (intersection.length > 0) {
        valueCounts.set(value, intersection.length);
      }
    });
  }
  
  return Array.from(valueCounts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => {
      const numA = Number(a.value);
      const numB = Number(b.value);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.value.localeCompare(b.value);
    });
};

// Optimized state management functions
export const updateFilterState = (
  currentFilters: FilterState,
  column: string,
  selectedValues: string[]
): FilterState => {
  if (selectedValues.length === 0) {
    const newFilters = { ...currentFilters };
    delete newFilters[column];
    return newFilters;
  }
  
  return {
    ...currentFilters,
    [column]: selectedValues,
  };
};

export const clearAllFilters = (): FilterState => ({});

export const clearFilter = (
  currentFilters: FilterState,
  column: string
): FilterState => {
  const newFilters = { ...currentFilters };
  delete newFilters[column];
  return newFilters;
};

// Performance monitoring and optimization utilities
export const getFilterPerformanceStats = () => {
  return {
    cacheSize: indexCache.size,
    cacheKeys: Array.from(indexCache.keys()),
    clearCache: () => indexCache.clear(),
  };
};

// Preload index for better performance
export const preloadFilterIndex = (data: DataRow[], cacheKey: string): void => {
  requestIdleCallback(() => {
    buildOptimizedFilterIndex(data, cacheKey);
  });
};
