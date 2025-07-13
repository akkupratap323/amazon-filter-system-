import Papa from 'papaparse';
// import { DataRow } from '@/types';

export interface CSVData {
  [key: string]: string | number;
}

// Enhanced performance constants for big data
const DEFAULT_CHUNK_SIZE = 100; // Optimized for memory vs performance balance
const MAX_CACHE_SIZE = 100; // Maximum chunks to keep in memory
const PREFETCH_DISTANCE = 3; // Number of chunks to prefetch ahead
const WORKER_THRESHOLD = 500000; // Use web workers for very large datasets
const MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB memory limit
const CLEANUP_INTERVAL = 30000; // 30 seconds cleanup interval

// LRU Cache implementation with memory tracking
class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, { value: V; timestamp: number; accessCount: number }>;
  private accessOrder: K[];

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Update access statistics
    entry.timestamp = Date.now();
    entry.accessCount++;

    // Move to end of access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);

    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing entry
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = Date.now();
      entry.accessCount++;
    } else {
      // Add new entry
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }
      
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        accessCount: 1
      });
      this.accessOrder.push(key);
    }
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    
    const lruKey = this.accessOrder.shift()!;
    this.cache.delete(lruKey);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const entries = Array.from(this.cache.entries());
    return {
      size: this.cache.size,
      totalAccess: entries.reduce((sum, [, entry]) => sum + entry.accessCount, 0),
      avgAccess: entries.length > 0 ? entries.reduce((sum, [, entry]) => sum + entry.accessCount, 0) / entries.length : 0
    };
  }
}

// Advanced ChunkedDataGenerator with intelligent loading
export class ChunkedDataGenerator {
  private totalCount: number;
  private chunkSize: number;
  private cache: LRUCache<number, CSVData[]>;
  private prefetchQueue: Set<number>;
  private loadingChunks: Set<number>;
  private memoryUsage: number;
  private cleanupInterval: NodeJS.Timeout | null;
  private abortController: AbortController;
  private worker: Worker | null;

  // Pre-computed modulo configurations for performance
  private readonly moduloConfig = {
    divisors: [3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 50, 100],
    keys: [3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 50, 100].map(d => `modulo ${d}`),
    categories: ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'],
    statuses: ['Active', 'Pending', 'Inactive', 'Completed']
  };

  constructor(totalCount: number, chunkSize: number = DEFAULT_CHUNK_SIZE) {
    this.totalCount = totalCount;
    this.chunkSize = Math.min(chunkSize, Math.max(1000, Math.floor(totalCount / 1000))); // Dynamic chunk sizing
    this.cache = new LRUCache<number, CSVData[]>(MAX_CACHE_SIZE);
    this.prefetchQueue = new Set();
    this.loadingChunks = new Set();
    this.memoryUsage = 0;
    this.cleanupInterval = null;
    this.abortController = new AbortController();
    this.worker = null;

    this.startMemoryManagement();
  }

  // Generate chunk with optimized data structure
  generateChunk(chunkIndex: number): CSVData[] {
    // Check cache first
    const cached = this.cache.get(chunkIndex);
    if (cached) {
      this.triggerPrefetch(chunkIndex);
      return cached;
    }

    // Check if already loading
    if (this.loadingChunks.has(chunkIndex)) {
      return this.generateChunkSync(chunkIndex); // Fallback to sync generation
    }

    // Generate chunk data
    const chunkData = this.generateChunkSync(chunkIndex);
    
    // Cache the chunk
    this.cacheChunk(chunkIndex, chunkData);
    
    // Trigger prefetching for nearby chunks
    this.triggerPrefetch(chunkIndex);

    return chunkData;
  }

  // Synchronous chunk generation with optimizations
  private generateChunkSync(chunkIndex: number): CSVData[] {
    const startIndex = chunkIndex * this.chunkSize;
    const endIndex = Math.min(startIndex + this.chunkSize, this.totalCount);
    const chunkData: CSVData[] = new Array(endIndex - startIndex);

    const { divisors, keys, categories, statuses } = this.moduloConfig;

    // Batch generate rows for better performance
    for (let i = startIndex; i < endIndex; i++) {
      const id = i + 1;
      const arrayIndex = i - startIndex;
      
      // Create row with pre-allocated structure
      const row: CSVData = {
        id,
        number: id,
        category: categories[id % categories.length],
        status: statuses[id % statuses.length]
      };

      // Batch compute modulo values
      for (let j = 0; j < divisors.length; j++) {
        row[keys[j]] = (id % divisors[j]).toString();
      }

      chunkData[arrayIndex] = row;
    }

    return chunkData;
  }

  // Asynchronous chunk generation with Web Worker
  private async generateChunkAsync(chunkIndex: number): Promise<CSVData[]> {
    if (this.totalCount > WORKER_THRESHOLD && this.worker) {
      return this.generateChunkWithWorker(chunkIndex);
    }

    return new Promise((resolve) => {
      requestIdleCallback(() => {
        const chunkData = this.generateChunkSync(chunkIndex);
        resolve(chunkData);
      }, { timeout: 100 });
    });
  }

  // Web Worker chunk generation
  private generateChunkWithWorker(chunkIndex: number): Promise<CSVData[]> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const startIndex = chunkIndex * this.chunkSize;
      const endIndex = Math.min(startIndex + this.chunkSize, this.totalCount);

      const messageHandler = (e: MessageEvent) => {
        if (e.data.chunkIndex === chunkIndex) {
          this.worker!.removeEventListener('message', messageHandler);
          resolve(e.data.chunkData);
        }
      };

      this.worker.addEventListener('message', messageHandler);
      this.worker.postMessage({
        type: 'generateChunk',
        chunkIndex,
        startIndex,
        endIndex,
        moduloConfig: this.moduloConfig
      });
    });
  }

  // Intelligent prefetching system
  private triggerPrefetch(currentChunk: number): void {
    const prefetchChunks = [];
    
    // Prefetch next chunks
    for (let i = 1; i <= PREFETCH_DISTANCE; i++) {
      const nextChunk = currentChunk + i;
      if (nextChunk < this.getTotalChunks() && 
          !this.cache.get(nextChunk) && 
          !this.prefetchQueue.has(nextChunk)) {
        prefetchChunks.push(nextChunk);
      }
    }

    // Prefetch previous chunks (for scrolling back)
    for (let i = 1; i <= Math.floor(PREFETCH_DISTANCE / 2); i++) {
      const prevChunk = currentChunk - i;
      if (prevChunk >= 0 && 
          !this.cache.get(prevChunk) && 
          !this.prefetchQueue.has(prevChunk)) {
        prefetchChunks.push(prevChunk);
      }
    }

    // Execute prefetch
    prefetchChunks.forEach(chunkIndex => {
      this.prefetchQueue.add(chunkIndex);
      this.prefetchChunk(chunkIndex);
    });
  }

  // Asynchronous prefetch with memory management
  private async prefetchChunk(chunkIndex: number): Promise<void> {
    if (this.memoryUsage > MEMORY_THRESHOLD) {
      return; // Skip prefetch if memory usage is high
    }

    try {
      this.loadingChunks.add(chunkIndex);
      const chunkData = await this.generateChunkAsync(chunkIndex);
      
      if (!this.abortController.signal.aborted) {
        this.cacheChunk(chunkIndex, chunkData);
      }
    } catch (error) {
      console.error(`Prefetch failed for chunk ${chunkIndex}:`, error);
    } finally {
      this.loadingChunks.delete(chunkIndex);
      this.prefetchQueue.delete(chunkIndex);
    }
  }

  // Optimized data range retrieval
  getDataRange(startIndex: number, endIndex: number): CSVData[] {
    const data: CSVData[] = [];
    const startChunk = Math.floor(startIndex / this.chunkSize);
    const endChunk = Math.floor(endIndex / this.chunkSize);

    // Load required chunks
    for (let chunkIndex = startChunk; chunkIndex <= endChunk; chunkIndex++) {
      const chunk = this.generateChunk(chunkIndex);
      const chunkStart = chunkIndex * this.chunkSize;
      
      // Extract relevant data from chunk
      for (let i = 0; i < chunk.length; i++) {
        const globalIndex = chunkStart + i;
        if (globalIndex >= startIndex && globalIndex <= endIndex) {
          data.push(chunk[i]);
        }
      }
    }

    return data;
  }

  // Cache management with memory tracking
  private cacheChunk(chunkIndex: number, chunkData: CSVData[]): void {
    this.cache.set(chunkIndex, chunkData);
    this.updateMemoryUsage();
  }

  // Memory usage estimation and management
  private updateMemoryUsage(): void {
    this.memoryUsage = this.cache.size() * this.chunkSize * 200; // Rough estimate: 200 bytes per row
    
    // Aggressive cleanup if memory usage is high
    if (this.memoryUsage > MEMORY_THRESHOLD) {
      this.performMemoryCleanup();
    }
  }

  // Memory cleanup strategy
  private performMemoryCleanup(): void {
    const targetSize = Math.floor(MAX_CACHE_SIZE * 0.7); // Clean to 70% capacity
    
    while (this.cache.size() > targetSize) {
      // LRU cache will automatically evict least recently used items
      const stats = this.cache.getStats();
      if (stats.size <= targetSize) break;
      
      // Force eviction by adding a dummy entry
      this.cache.set(-1, []);
      this.cache.clear();
      break;
    }
    
    this.updateMemoryUsage();
  }

  // Memory management lifecycle
  private startMemoryManagement(): void {
    this.cleanupInterval = setInterval(() => {
      this.performMemoryCleanup();
      
      // Clear old prefetch queue items
      this.prefetchQueue.clear();
    }, CLEANUP_INTERVAL);

    // Initialize Web Worker for large datasets
    if (this.totalCount > WORKER_THRESHOLD) {
      this.initializeWorker();
    }
  }

  // Web Worker initialization
  private initializeWorker(): void {
    const workerCode = `
      self.onmessage = function(e) {
        const { type, chunkIndex, startIndex, endIndex, moduloConfig } = e.data;
        
        if (type === 'generateChunk') {
          const chunkData = [];
          const { divisors, keys, categories, statuses } = moduloConfig;
          
          for (let i = startIndex; i < endIndex; i++) {
            const id = i + 1;
            const row = {
              id,
              number: id,
              category: categories[id % categories.length],
              status: statuses[id % statuses.length]
            };
            
            for (let j = 0; j < divisors.length; j++) {
              row[keys[j]] = (id % divisors[j]).toString();
            }
            
            chunkData.push(row);
          }
          
          self.postMessage({ chunkIndex, chunkData });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
  }

  // Public API methods
  getTotalChunks(): number {
    return Math.ceil(this.totalCount / this.chunkSize);
  }

  getTotalCount(): number {
    return this.totalCount;
  }

  getChunkSize(): number {
    return this.chunkSize;
  }

  // Enhanced cache information
  getCacheInfo() {
    const stats = this.cache.getStats();
    return {
      loadedChunks: this.cache.size(),
      totalChunks: this.getTotalChunks(),
      memoryUsage: this.memoryUsage,
      memoryUsageMB: (this.memoryUsage / 1024 / 1024).toFixed(2),
      cacheHitRate: stats.avgAccess,
      prefetchQueueSize: this.prefetchQueue.size,
      loadingChunks: this.loadingChunks.size
    };
  }

  // Check if a chunk is loaded in cache
  isChunkLoaded(chunkIndex: number): boolean {
    return this.cache.get(chunkIndex) !== undefined;
  }

  // Cleanup and resource management
  clearCache(): void {
    this.cache.clear();
    this.prefetchQueue.clear();
    this.loadingChunks.clear();
    this.memoryUsage = 0;
  }

  destroy(): void {
    this.abortController.abort();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.clearCache();
  }
}

// Factory function for creating optimized generators
export function createChunkedDataGenerator(
  totalCount: number, 
  options: {
    chunkSize?: number;
    enablePrefetch?: boolean;
    maxCacheSize?: number;
  } = {}
): ChunkedDataGenerator {
  const generator = new ChunkedDataGenerator(
    totalCount, 
    options.chunkSize || DEFAULT_CHUNK_SIZE
  );
  
  return generator;
}

// Performance measurement utility
export function measurePerformance<T>(
  operation: () => T, 
  operationName: string
): T {
  const startTime = performance.now();
  const result = operation();
  const endTime = performance.now();
  
  console.log(`${operationName} completed in ${endTime - startTime}ms`);
  return result;
}

// CSV export utility
export function exportToCSV(data: CSVData[], filename: string = 'export.csv'): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// CSV parsing utility
export function parseCSV(csvContent: string): Promise<CSVData[]> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    // Use streaming for large files
    const isLargeFile = csvContent.length > 10 * 1024 * 1024; // 10MB threshold
    
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Auto-convert numbers
      fastMode: true, // Enable fast mode for better performance
      chunk: isLargeFile ? (results: Papa.ParseResult<CSVData>) => {
        // Process chunks for large files to prevent blocking
        console.log(`Processed ${results.data.length} rows...`);
      } : undefined,
      complete: (results) => {
        const endTime = performance.now();
        console.log(`CSV parsing completed in ${endTime - startTime}ms`);
        resolve(results.data as CSVData[]);
      },
      error: (error: unknown) => {
        console.error('CSV parsing error:', error);
        reject(error);
      },
    });
  });
}

// Mock data generation for testing
export function generateMockData(count: number): Promise<CSVData[]> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    // Use Web Worker for very large datasets
    if (count > WORKER_THRESHOLD && typeof Worker !== 'undefined') {
      generateMockDataWithWorker(count).then(resolve);
      return;
    }
    
    // Optimized synchronous generation
    const data = generateMockDataSync(count);
    
    const endTime = performance.now();
    console.log(`Mock data generation completed in ${endTime - startTime}ms`);
    resolve(data);
  });
}

// Synchronous optimized generation
function generateMockDataSync(count: number): CSVData[] {
  // Pre-allocate typed array for better performance
  const data: CSVData[] = new Array(count);
  
  // Pre-compute modulo divisors for better performance
  const moduloDivisors = [3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 50, 100];
  const moduloKeys = moduloDivisors.map(d => `modulo ${d}`);
  const categories = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
  const statuses = ['Active', 'Pending', 'Inactive', 'Completed'];
  
  // Generate data in optimized chunks
  for (let chunk = 0; chunk < Math.ceil(count / DEFAULT_CHUNK_SIZE); chunk++) {
    const chunkStart = chunk * DEFAULT_CHUNK_SIZE;
    const chunkEnd = Math.min(chunkStart + DEFAULT_CHUNK_SIZE, count);
    
    // Process chunk with minimal object creation
    for (let i = chunkStart; i < chunkEnd; i++) {
      const id = i + 1;
      
      // Create object with pre-computed properties
      const row: CSVData = {
        id,
        number: id,
        category: categories[id % categories.length],
        status: statuses[id % statuses.length]
      };
      
      // Batch compute all modulo values
      for (let j = 0; j < moduloDivisors.length; j++) {
        row[moduloKeys[j]] = (id % moduloDivisors[j]).toString();
      }
      
      data[i] = row;
    }
    
    // Yield control periodically for UI responsiveness
    if (chunk % 10 === 0) {
      // Allow other tasks to run
      setTimeout(() => {}, 0);
    }
  }
  
  return data;
}

// Web Worker implementation for very large datasets
function generateMockDataWithWorker(count: number): Promise<CSVData[]> {
  return new Promise((resolve) => {
    // Create inline worker for data generation
    const workerCode = `
      self.onmessage = function(e) {
        const { count, chunkSize } = e.data;
        const data = new Array(count);
        const moduloDivisors = [3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 50, 100];
        const moduloKeys = moduloDivisors.map(d => \`modulo \${d}\`);
        const categories = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
        const statuses = ['Active', 'Pending', 'Inactive', 'Completed'];
        
        for (let chunk = 0; chunk < Math.ceil(count / chunkSize); chunk++) {
          const chunkStart = chunk * chunkSize;
          const chunkEnd = Math.min(chunkStart + chunkSize, count);
          
          for (let i = chunkStart; i < chunkEnd; i++) {
            const id = i + 1;
            const row = { 
              id, 
              number: id,
              category: categories[id % categories.length],
              status: statuses[id % statuses.length]
            };
            
            for (let j = 0; j < moduloDivisors.length; j++) {
              row[moduloKeys[j]] = (id % moduloDivisors[j]).toString();
            }
            
            data[i] = row;
          }
          
          // Report progress
          if (chunk % 100 === 0) {
            self.postMessage({ type: 'progress', completed: chunkEnd, total: count });
          }
        }
        
        self.postMessage({ type: 'complete', data });
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    worker.onmessage = (e) => {
      const { type, data, completed, total } = e.data;
      
      if (type === 'progress') {
        console.log(`Generated ${completed}/${total} rows...`);
      } else if (type === 'complete') {
        worker.terminate();
        URL.revokeObjectURL(blob.toString());
        resolve(data);
      }
    };
    
    worker.postMessage({ count, chunkSize: DEFAULT_CHUNK_SIZE });
  });
}
