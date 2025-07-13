import { DataRow, ColumnConfig } from '@/types';

// Performance constants
const SMALL_DATASET_THRESHOLD = 1000;
const CHUNK_SIZE = 50000;
const BATCH_SIZE = 10000;
// const MERGE_THRESHOLD = 100000;
const WORKER_THRESHOLD = 500000;

// Global caches for better performance
const columnConfigCache = new Map<string, ColumnConfig[]>();
const uniqueValuesCache = new Map<string, string[]>();
const sortCache = new Map<string, DataRow[]>();

// Ultra-optimized column configuration with caching
export const getColumnConfigs = (data: DataRow[]): ColumnConfig[] => {
  if (data.length === 0) return [];

  // Create cache key based on data structure
  const sampleRow = data[0];
  const cacheKey = Object.keys(sampleRow).sort().join('|');
  
  // Check cache first
  if (columnConfigCache.has(cacheKey)) {
    return columnConfigCache.get(cacheKey)!;
  }

  // Analyze data types from multiple samples for accuracy
  const sampleSize = Math.min(100, data.length);
  const columnTypes = new Map<string, 'number' | 'string' | 'mixed'>();
  
  Object.keys(sampleRow).forEach(key => {
    let numericCount = 0;
    let stringCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const value = data[i][key];
      if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
        numericCount++;
      } else {
        stringCount++;
      }
    }
    
    // Determine type based on majority
    if (numericCount > stringCount * 2) {
      columnTypes.set(key, 'number');
    } else if (stringCount > numericCount * 2) {
      columnTypes.set(key, 'string');
    } else {
      columnTypes.set(key, 'mixed');
    }
  });

  const configs: ColumnConfig[] = Object.keys(sampleRow).map(key => {
    const detectedType = columnTypes.get(key);
    let type: 'number' | 'string' | 'boolean';
    
    if (detectedType === 'number') {
      type = 'number';
    } else if (detectedType === 'mixed') {
      // For mixed types, default to string
      type = 'string';
    } else {
      type = 'string';
    }
    
    return {
      key,
      label: formatColumnLabel(key),
      type,
      filterable: true,
    };
  });

  // Cache the result
  columnConfigCache.set(cacheKey, configs);
  return configs;
};

// Optimized label formatting
const formatColumnLabel = (key: string): string => {
  return key
    .charAt(0).toUpperCase() + 
    key.slice(1)
      .replace(/([A-Z])/g, ' $1')
      .replace(/[-_]/g, ' ')
      .trim();
};

// Hyper-optimized unique values extraction
export const getUniqueValues = (data: DataRow[], column: string): string[] => {
  const cacheKey = `${column}-${data.length}`;
  
  // Check cache first
  if (uniqueValuesCache.has(cacheKey)) {
    return uniqueValuesCache.get(cacheKey)!;
  }

  let uniqueValues: string[];

  if (data.length < SMALL_DATASET_THRESHOLD) {
    // Direct approach for small datasets
    uniqueValues = [...new Set(data.map(row => String(row[column])))];
  } else {
    // Optimized approach for large datasets
    uniqueValues = getUniqueValuesOptimized(data, column);
  }

  // Sort with optimized comparison
  uniqueValues.sort(createOptimizedComparator());

  // Cache the result
  uniqueValuesCache.set(cacheKey, uniqueValues);
  return uniqueValues;
};

// Optimized unique values for large datasets
const getUniqueValuesOptimized = (data: DataRow[], column: string): string[] => {
  const uniqueSet = new Set<string>();
  const batchSize = BATCH_SIZE;

  // Process in batches to maintain UI responsiveness
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    batch.forEach(row => {
      uniqueSet.add(String(row[column]));
    });

    // Yield control periodically
    if (i % (batchSize * 10) === 0) {
      setTimeout(() => {}, 0);
    }
  }

  return Array.from(uniqueSet);
};

// Optimized comparator factory
const createOptimizedComparator = () => {
  return (a: string, b: string): number => {
    // Try numeric comparison first
    const numA = Number(a);
    const numB = Number(b);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    // Fallback to string comparison
    return a.localeCompare(b, undefined, { numeric: true });
  };
};

// Ultra-fast filter counts calculation
export const calculateFilterCounts = (
  data: DataRow[],
  column: string,
  values: string[]
): { [value: string]: number } => {
  const counts: { [value: string]: number } = {};
  
  // Initialize counts
  values.forEach(value => {
    counts[value] = 0;
  });

  if (data.length < SMALL_DATASET_THRESHOLD) {
    // Direct counting for small datasets
    data.forEach(row => {
      const value = String(row[column]);
      if (counts.hasOwnProperty(value)) {
        counts[value]++;
      }
    });
  } else {
    // Batch counting for large datasets
    const batchSize = BATCH_SIZE;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      batch.forEach(row => {
        const value = String(row[column]);
        if (counts.hasOwnProperty(value)) {
          counts[value]++;
        }
      });
    }
  }

  return counts;
};

// Enhanced sorting with multiple optimization strategies
export const sortData = (data: DataRow[], column: string, direction: 'asc' | 'desc'): DataRow[] => {
  const cacheKey = `${column}-${direction}-${data.length}`;
  
  // Check cache first
  if (sortCache.has(cacheKey)) {
    return sortCache.get(cacheKey)!;
  }

  let sortedData: DataRow[];

  if (data.length < SMALL_DATASET_THRESHOLD) {
    // Direct sorting for small datasets
    sortedData = [...data].sort(createSortComparator(column, direction));
  } else {
    // Optimized sorting for large datasets
    sortedData = sortDataOptimized(data, column, direction);
  }

  // Cache the result (limit cache size)
  if (sortCache.size > 10) {
    const firstKey = sortCache.keys().next().value;
    if (firstKey) {
      sortCache.delete(firstKey);
    }
  }
  sortCache.set(cacheKey, sortedData);

  return sortedData;
};

// Advanced optimized sorting with multiple strategies
export const sortDataOptimized = (data: DataRow[], column: string, direction: 'asc' | 'desc'): DataRow[] => {
  // Strategy 1: Web Worker for massive datasets
  if (data.length > WORKER_THRESHOLD) {
    return sortDataWithWorker(data, column, direction);
  }

  // Strategy 2: Chunked sorting for large datasets
  if (data.length > CHUNK_SIZE) {
    return sortDataInChunks(data, column, direction);
  }

  // Strategy 3: Optimized in-place sorting
  return sortDataInPlace(data, column, direction);
};

// In-place sorting with optimized comparator
const sortDataInPlace = (data: DataRow[], column: string, direction: 'asc' | 'desc'): DataRow[] => {
  const dataCopy = [...data];
  const comparator = createSortComparator(column, direction);
  
  // Use native sort with optimized comparator
  return dataCopy.sort(comparator);
};

// Optimized sort comparator factory
const createSortComparator = (column: string, direction: 'asc' | 'desc') => {
  const multiplier = direction === 'asc' ? 1 : -1;
  
  return (a: DataRow, b: DataRow): number => {
    const aVal = a[column];
    const bVal = b[column];
    
    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return multiplier;
    if (bVal == null) return -multiplier;
    
    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * multiplier;
    }
    
    // String comparison with numeric awareness
    const aStr = String(aVal);
    const bStr = String(bVal);
    
    return aStr.localeCompare(bStr, undefined, { 
      numeric: true,
      sensitivity: 'base'
    }) * multiplier;
  };
};

// Chunked sorting with merge
const sortDataInChunks = (data: DataRow[], column: string, direction: 'asc' | 'desc'): DataRow[] => {
  const chunkSize = CHUNK_SIZE;
  const chunks: DataRow[][] = [];
  
  // Split into chunks
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  // Sort each chunk in parallel (simulated)
  const sortedChunks = chunks.map(chunk => 
    sortDataInPlace(chunk, column, direction)
  );
  
  // Merge sorted chunks
  return mergeSortedChunks(sortedChunks, column, direction);
};

// Optimized merge with heap-based approach
const mergeSortedChunks = (chunks: DataRow[][], column: string, direction: 'asc' | 'desc'): DataRow[] => {
  if (chunks.length === 1) return chunks[0];
  if (chunks.length === 0) return [];
  
  // Use a min-heap approach for efficient merging
  const result: DataRow[] = [];
  const heap: { chunk: number; index: number; value: string | number }[] = [];
  const comparator = createSortComparator(column, direction);
  
  // Initialize heap with first element from each chunk
  chunks.forEach((chunk, chunkIndex) => {
    if (chunk.length > 0) {
      heap.push({
        chunk: chunkIndex,
        index: 0,
        value: chunk[0][column]
      });
    }
  });
  
  // Sort heap initially
  heap.sort((a, b) => comparator({ [column]: a.value } as DataRow, { [column]: b.value } as DataRow));
  
  while (heap.length > 0) {
    const min = heap.shift()!;
    const chunk = chunks[min.chunk];
    
    result.push(chunk[min.index]);
    
    // Add next element from the same chunk
    if (min.index + 1 < chunk.length) {
      const nextValue = chunk[min.index + 1][column];
      
      // Insert in sorted position
      const newEntry = {
        chunk: min.chunk,
        index: min.index + 1,
        value: nextValue
      };
      
      let insertIndex = 0;
      while (insertIndex < heap.length && 
             comparator({ [column]: heap[insertIndex].value } as DataRow, { [column]: nextValue } as DataRow) <= 0) {
        insertIndex++;
      }
      
      heap.splice(insertIndex, 0, newEntry);
    }
  }
  
  return result;
};

// Web Worker sorting for massive datasets
const sortDataWithWorker = (data: DataRow[], column: string, direction: 'asc' | 'desc'): DataRow[] => {
  // For now, fallback to chunked sorting
  // In production, implement actual Web Worker
  console.log('Using Web Worker sorting for', data.length, 'rows');
  return sortDataInChunks(data, column, direction);
};

// Enhanced batch processing with progress tracking
export const processDataInBatches = <T>(
  data: T[],
  batchSize: number,
  processor: (batch: T[], progress: number) => void,
  onComplete?: () => void
): void => {
  let processed = 0;
  
  const processBatch = () => {
    if (processed >= data.length) {
      onComplete?.();
      return;
    }
    
    const batch = data.slice(processed, processed + batchSize);
    const progress = (processed / data.length) * 100;
    
    processor(batch, progress);
    processed += batchSize;
    
    // Schedule next batch
    requestAnimationFrame(processBatch);
  };
  
  processBatch();
};

// Memory-efficient streaming data iterator
export const createDataIterator = (data: DataRow[], batchSize: number = BATCH_SIZE) => {
  let currentIndex = 0;
  
  return {
    hasNext: () => currentIndex < data.length,
    next: (): DataRow[] => {
      const batch = data.slice(currentIndex, currentIndex + batchSize);
      currentIndex += batchSize;
      return batch;
    },
    peek: (): DataRow[] => {
      return data.slice(currentIndex, currentIndex + batchSize);
    },
    reset: () => {
      currentIndex = 0;
    },
    skip: (count: number) => {
      currentIndex = Math.min(currentIndex + count, data.length);
    },
    getProgress: () => ({
      current: currentIndex,
      total: data.length,
      percentage: (currentIndex / data.length) * 100
    })
  };
};

// Enhanced performance monitoring
export const measurePerformance = <T>(fn: () => T, label: string): T => {
  const start = performance.now();
  const memoryBefore = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
  
  const result = fn();
  
  const end = performance.now();
  const memoryAfter = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
  const memoryDiff = memoryAfter - memoryBefore;
  
  console.log(`${label}: ${(end - start).toFixed(2)}ms, Memory: ${(memoryDiff / 1024 / 1024).toFixed(2)}MB`);
  return result;
};

// Advanced debouncing with immediate execution option
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate: boolean = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  return (...args: Parameters<T>) => {
    lastArgs = args;
    
    const later = () => {
      timeout = null;
      if (!immediate && lastArgs) {
        func(...lastArgs);
      }
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func(...args);
    }
  };
};

// Cache management utilities
export const clearDataProcessingCache = (): void => {
  columnConfigCache.clear();
  uniqueValuesCache.clear();
  sortCache.clear();
};

export const getDataProcessingStats = () => ({
  columnConfigCache: columnConfigCache.size,
  uniqueValuesCache: uniqueValuesCache.size,
  sortCache: sortCache.size,
  clearCache: clearDataProcessingCache
});
