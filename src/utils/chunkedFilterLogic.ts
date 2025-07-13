import { DataRow, FilterState } from '@/types';
import { ChunkedDataGenerator } from './csvParser';

// Performance constants
const IMMEDIATE_CHUNKS = 3;
const BACKGROUND_BATCH_SIZE = 10;
const CACHE_SIZE_LIMIT = 1000;
const FILTER_CACHE_TTL = 300000; // 5 minutes
// const WORKER_THRESHOLD = 100000;

// Enhanced cache entry with metadata
interface CacheEntry {
  data: Set<string>;
  timestamp: number;
  hitCount: number;
  size: number;
}

// Optimized chunked filtering system
export class ChunkedFilterManager {
  private dataGenerator: ChunkedDataGenerator;
  private filterCache: Map<string, CacheEntry>;
  private activeFilters: FilterState;
  private indexCache: Map<string, Map<string, Set<number>>>;
  private backgroundTasks: Set<Promise<void>>;
  private abortController: AbortController;

  constructor(dataGenerator: ChunkedDataGenerator) {
    this.dataGenerator = dataGenerator;
    this.filterCache = new Map();
    this.activeFilters = {};
    this.indexCache = new Map();
    this.backgroundTasks = new Set();
    this.abortController = new AbortController();
    
    // Periodic cache cleanup
    this.startCacheCleanup();
  }

  // Ultra-optimized filter options with intelligent caching
  getFilterOptions(column: string, currentFilters: FilterState = {}): string[] {
    const startTime = performance.now();
    
    // Create optimized cache key
    const filterKey = this.createFilterKey(currentFilters, column);
    const cacheKey = `options_${column}_${filterKey}`;
    
    // Check cache with LRU update
    const cached = this.getCachedEntry(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${column}: ${performance.now() - startTime}ms`);
      return this.sortValues(Array.from(cached.data));
    }

    // Fast path: use index if available
    const indexResult = this.getOptionsFromIndex(column, currentFilters);
    if (indexResult) {
      this.setCacheEntry(cacheKey, indexResult);
      return this.sortValues(Array.from(indexResult));
    }

    // Chunked processing with immediate response
    const uniqueValues = new Set<string>();
    const totalChunks = this.dataGenerator.getTotalChunks();
    
    // Process immediate chunks for quick response
    const immediateChunks = Math.min(IMMEDIATE_CHUNKS, totalChunks);
    this.processChunksSync(0, immediateChunks - 1, column, currentFilters, uniqueValues);
    
    // Cache immediate results
    this.setCacheEntry(cacheKey, uniqueValues);
    
    // Process remaining chunks in background
    if (immediateChunks < totalChunks) {
      this.processChunksBackground(immediateChunks, totalChunks - 1, column, currentFilters, cacheKey);
    }

    console.log(`Filter options generated: ${performance.now() - startTime}ms`);
    return this.sortValues(Array.from(uniqueValues));
  }

  // Synchronous chunk processing for immediate results
  private processChunksSync(
    startChunk: number, 
    endChunk: number, 
    column: string, 
    filters: FilterState, 
    uniqueValues: Set<string>
  ): void {
    for (let i = startChunk; i <= endChunk; i++) {
      if (this.abortController.signal.aborted) break;
      
      const chunk = this.dataGenerator.generateChunk(i);
      const filteredChunk = this.applyFiltersToChunk(chunk, filters, column);
      
      // Batch add to set for better performance
      filteredChunk.forEach(row => {
        uniqueValues.add(String(row[column as keyof DataRow]));
      });
    }
  }

  // Background chunk processing with batching
  private processChunksBackground(
    startChunk: number, 
    endChunk: number, 
    column: string, 
    filters: FilterState, 
    cacheKey: string
  ): void {
    const task = this.processChunksAsync(startChunk, endChunk, column, filters, cacheKey);
    this.backgroundTasks.add(task);
    
    task.finally(() => {
      this.backgroundTasks.delete(task);
    });
  }

  // Async chunk processing with progress tracking
  private async processChunksAsync(
    startChunk: number, 
    endChunk: number, 
    column: string, 
    filters: FilterState, 
    cacheKey: string
  ): Promise<void> {
    const uniqueValues = new Set<string>();
    const batchSize = BACKGROUND_BATCH_SIZE;
    
    for (let batchStart = startChunk; batchStart <= endChunk; batchStart += batchSize) {
      if (this.abortController.signal.aborted) break;
      
      const batchEnd = Math.min(batchStart + batchSize - 1, endChunk);
      
      // Process batch
      await new Promise<void>(resolve => {
        requestIdleCallback(() => {
          this.processChunksSync(batchStart, batchEnd, column, filters, uniqueValues);
          resolve();
        }, { timeout: 50 });
      });
      
      // Update cache with progressive results
      const existing = this.getCachedEntry(cacheKey);
      if (existing) {
        uniqueValues.forEach(value => existing.data.add(value));
        existing.timestamp = Date.now();
      }
    }
  }

  // Optimized filter application with early exit
  private applyFiltersToChunk(chunk: DataRow[], filters: FilterState, excludeColumn?: string): DataRow[] {
    const activeFilters = Object.entries(filters).filter(([col, values]) => 
      col !== excludeColumn && values.length > 0
    );
    
    if (activeFilters.length === 0) return chunk;
    
    // Sort filters by selectivity (most selective first)
    activeFilters.sort(([, valuesA], [, valuesB]) => valuesA.length - valuesB.length);
    
    return chunk.filter(row => {
      // Early exit on first mismatch
      for (const [column, selectedValues] of activeFilters) {
        if (!selectedValues.includes(String(row[column as keyof DataRow]))) {
          return false;
        }
      }
      return true;
    });
  }

  // High-performance filtered data range with streaming
  getFilteredDataRange(startIndex: number, endIndex: number, filters: FilterState): DataRow[] {
    if (Object.keys(filters).length === 0) {
      return this.dataGenerator.getDataRange(startIndex, endIndex);
    }

    const filteredData: DataRow[] = [];
    const targetCount = endIndex - startIndex + 1;
    // let currentIndex = 0;
    let skippedCount = 0;
    
    const chunkSize = this.dataGenerator.getChunkSize();
    const startChunk = Math.floor(startIndex / chunkSize);
    const totalChunks = this.dataGenerator.getTotalChunks();
    
    // Stream through chunks efficiently
    for (let chunkIndex = startChunk; chunkIndex < totalChunks && filteredData.length < targetCount; chunkIndex++) {
      const chunk = this.dataGenerator.generateChunk(chunkIndex);
      const filteredChunk = this.applyFiltersToChunk(chunk, filters);
      
      for (const row of filteredChunk) {
        if (skippedCount < startIndex) {
          skippedCount++;
          continue;
        }
        
        filteredData.push(row);
        
        if (filteredData.length >= targetCount) break;
      }
    }
    
    return filteredData;
  }

  // Optimized filtered count with caching
  getFilteredCount(filters: FilterState): number {
    const filterKey = this.createFilterKey(filters);
    const cacheKey = `count_${filterKey}`;
    
    const cached = this.getCachedEntry(cacheKey);
    if (cached) {
      return Number(Array.from(cached.data)[0]); // Store count as single value
    }

    if (Object.keys(filters).length === 0) {
      return this.dataGenerator.getTotalCount();
    }

    let count = 0;
    const totalChunks = this.dataGenerator.getTotalChunks();
    
    // Batch process chunks for better performance
    const batchSize = BACKGROUND_BATCH_SIZE;
    for (let batchStart = 0; batchStart < totalChunks; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalChunks);
      
      for (let i = batchStart; i < batchEnd; i++) {
        const chunk = this.dataGenerator.generateChunk(i);
        const filteredChunk = this.applyFiltersToChunk(chunk, filters);
        count += filteredChunk.length;
      }
      
      // Yield control periodically
      if (batchStart % (batchSize * 5) === 0) {
        setTimeout(() => {}, 0);
      }
    }
    
    // Cache the count
    this.setCacheEntry(cacheKey, new Set([count.toString()]));
    
    return count;
  }

  // Index-based option retrieval for better performance
  private getOptionsFromIndex(column: string, filters: FilterState): Set<string> | null {
    const indexKey = `${column}_index`;
    
    if (!this.indexCache.has(indexKey)) {
      return null;
    }
    
    const columnIndex = this.indexCache.get(indexKey)!;
    const activeFilters = Object.entries(filters).filter(([col, values]) => 
      col !== column && values.length > 0
    );
    
    if (activeFilters.length === 0) {
      return new Set(columnIndex.keys());
    }
    
    // Complex index intersection logic would go here
    return null;
  }

  // Optimized cache key generation
  private createFilterKey(filters: FilterState, excludeColumn?: string): string {
    const relevantFilters = Object.entries(filters)
      .filter(([col, values]) => col !== excludeColumn && values.length > 0)
      .sort(([a], [b]) => a.localeCompare(b));
    
    return relevantFilters
      .map(([col, values]) => `${col}:${values.sort().join(',')}`)
      .join('|');
  }

  // Enhanced cache management with LRU and TTL
  private getCachedEntry(key: string): CacheEntry | null {
    const entry = this.filterCache.get(key);
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() - entry.timestamp > FILTER_CACHE_TTL) {
      this.filterCache.delete(key);
      return null;
    }
    
    // Update LRU
    entry.hitCount++;
    entry.timestamp = Date.now();
    
    return entry;
  }

  // Set cache entry with size management
  private setCacheEntry(key: string, data: Set<string>): void {
    // Evict if cache is full
    if (this.filterCache.size >= CACHE_SIZE_LIMIT) {
      this.evictLRU();
    }
    
    this.filterCache.set(key, {
      data,
      timestamp: Date.now(),
      hitCount: 1,
      size: data.size
    });
  }

  // LRU eviction strategy
  private evictLRU(): void {
    let lruKey = '';
    let lruTime = Date.now();
    let lruHits = Infinity;
    
    this.filterCache.forEach((entry, key) => {
      if (entry.hitCount < lruHits || (entry.hitCount === lruHits && entry.timestamp < lruTime)) {
        lruKey = key;
        lruTime = entry.timestamp;
        lruHits = entry.hitCount;
      }
    });
    
    if (lruKey) {
      this.filterCache.delete(lruKey);
    }
  }

  // Optimized value sorting
  private sortValues(values: string[]): string[] {
    return values.sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }

  // Periodic cache cleanup
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      this.filterCache.forEach((entry, key) => {
        if (now - entry.timestamp > FILTER_CACHE_TTL) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.filterCache.delete(key));
      
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }, FILTER_CACHE_TTL / 2);
  }

  // Enhanced cache management
  clearCache(): void {
    this.filterCache.clear();
    this.indexCache.clear();
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  clearFilterCache(column?: string): void {
    if (column) {
      const keysToDelete = Array.from(this.filterCache.keys())
        .filter(key => key.includes(`_${column}_`));
      keysToDelete.forEach(key => this.filterCache.delete(key));
    } else {
      this.filterCache.clear();
    }
  }

  // Performance monitoring
  getCacheStats() {
    const totalSize = Array.from(this.filterCache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      entries: this.filterCache.size,
      totalSize,
      backgroundTasks: this.backgroundTasks.size,
      avgHitCount: Array.from(this.filterCache.values())
        .reduce((sum, entry) => sum + entry.hitCount, 0) / this.filterCache.size
    };
  }

  // Graceful shutdown
  destroy(): void {
    this.abortController.abort();
    this.clearCache();
  }
}

// Optimized utility functions with singleton pattern
const managerCache = new Map<ChunkedDataGenerator, ChunkedFilterManager>();

export const getChunkedFilterOptions = (
  dataGenerator: ChunkedDataGenerator,
  targetColumn: string,
  currentFilters: FilterState = {}
): string[] => {
  let manager = managerCache.get(dataGenerator);
  if (!manager) {
    manager = new ChunkedFilterManager(dataGenerator);
    managerCache.set(dataGenerator, manager);
  }
  
  return manager.getFilterOptions(targetColumn, currentFilters);
};

export const applyChunkedFilters = (
  dataGenerator: ChunkedDataGenerator,
  filters: FilterState,
  startIndex: number,
  endIndex: number
): DataRow[] => {
  let manager = managerCache.get(dataGenerator);
  if (!manager) {
    manager = new ChunkedFilterManager(dataGenerator);
    managerCache.set(dataGenerator, manager);
  }
  
  return manager.getFilteredDataRange(startIndex, endIndex, filters);
};

export const getChunkedFilteredCount = (
  dataGenerator: ChunkedDataGenerator,
  filters: FilterState
): number => {
  let manager = managerCache.get(dataGenerator);
  if (!manager) {
    manager = new ChunkedFilterManager(dataGenerator);
    managerCache.set(dataGenerator, manager);
  }
  
  return manager.getFilteredCount(filters);
};

// Cleanup utility
export const clearChunkedFilterCache = (): void => {
  managerCache.forEach(manager => manager.destroy());
  managerCache.clear();
};
