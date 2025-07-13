import { CSVData } from './csvParser';

export class UltraOptimizedDataGenerator {
  private static instance: UltraOptimizedDataGenerator;
  private dataCache: Map<number, CSVData[]> = new Map();
  private columnIndexes: Map<string, Map<string, Set<number>>> = new Map();
  private currentData: CSVData[] = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance(): UltraOptimizedDataGenerator {
    if (!UltraOptimizedDataGenerator.instance) {
      UltraOptimizedDataGenerator.instance = new UltraOptimizedDataGenerator();
    }
    return UltraOptimizedDataGenerator.instance;
  }

  generateLargeDataset(count: number): CSVData[] {
    console.log(`🚀 Generating ultra-optimized dataset with ${count.toLocaleString()} records...`);
    const startTime = performance.now();

    if (this.dataCache.has(count)) {
      console.log(`⚡ Using cached dataset (${(performance.now() - startTime).toFixed(2)}ms)`);
      const cachedData = this.dataCache.get(count)!;
      this.currentData = cachedData;
      return cachedData;
    }

    const data: CSVData[] = [];
    data.length = count;
    
    const chunkSize = 10000;
    for (let chunk = 0; chunk < Math.ceil(count / chunkSize); chunk++) {
      const chunkStart = chunk * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, count);
      
      for (let i = chunkStart; i < chunkEnd; i++) {
        const id = i + 1;
        data[i] = {
          id,
          number: id,
          'modulo 3': (id % 3).toString(),
          'modulo 4': (id % 4).toString(),
          'modulo 5': (id % 5).toString(),
          'modulo 6': (id % 6).toString(),
          'modulo 7': (id % 7).toString(),
          'modulo 8': (id % 8).toString(),
          'modulo 10': (id % 10).toString(),
          'modulo 12': (id % 12).toString(),
          'modulo 15': (id % 15).toString(),
          'modulo 20': (id % 20).toString(),
          'modulo 25': (id % 25).toString(),
          'modulo 30': (id % 30).toString(),
          'modulo 50': (id % 50).toString(),
          'modulo 100': (id % 100).toString(),
          category: `Category ${String.fromCharCode(65 + (id % 26))}`,
          status: ['Active', 'Inactive', 'Pending', 'Completed', 'Archived', 'Draft'][id % 6],
          value: Math.floor(Math.random() * 10000) + 100,
          date: new Date(2024, (id % 12), (id % 28) + 1).toISOString().split('T')[0],
          priority: ['Low', 'Medium', 'High', 'Critical'][id % 4],
          region: ['North', 'South', 'East', 'West', 'Central'][id % 5],
          department: ['Sales', 'Marketing', 'Engineering', 'Finance', 'HR', 'Operations'][id % 6],
        };
      }
    }

    this.dataCache.set(count, data);
    this.currentData = data;
    this.buildIndexes(data);

    const endTime = performance.now();
    console.log(`⚡ Dataset generated in ${(endTime - startTime).toFixed(2)}ms`);
    
    return data;
  }

  private buildIndexes(data: CSVData[]): void {
    if (this.isInitialized) return;

    console.log('🔍 Building ultra-fast indexes...');
    const startTime = performance.now();

    const columns = Object.keys(data[0] || {});
    
    columns.forEach(column => {
      const columnIndex = new Map<string, Set<number>>();
      
      data.forEach((row, idx) => {
        const value = String(row[column]);
        if (!columnIndex.has(value)) {
          columnIndex.set(value, new Set());
        }
        columnIndex.get(value)!.add(idx);
      });
      
      this.columnIndexes.set(column, columnIndex);
    });

    this.isInitialized = true;
    const endTime = performance.now();
    console.log(`⚡ Indexes built in ${(endTime - startTime).toFixed(2)}ms`);
  }

  filterData(filters: Record<string, string[]>): { data: CSVData[], count: number } {
    const startTime = performance.now();
    
    const activeFilters = Object.entries(filters).filter(([, values]) => values.length > 0);
    
    if (activeFilters.length === 0) {
      return { data: this.currentData, count: this.currentData.length };
    }

    const [firstColumn, firstValues] = activeFilters[0];
    let matchingIndices = new Set<number>();
    
    firstValues.forEach(value => {
      const indices = this.columnIndexes.get(firstColumn)?.get(value);
      if (indices) {
        indices.forEach(index => matchingIndices.add(index));
      }
    });

    for (let i = 1; i < activeFilters.length; i++) {
      const [column, values] = activeFilters[i];
      const newMatchingIndices = new Set<number>();
      
      values.forEach(value => {
        const indices = this.columnIndexes.get(column)?.get(value);
        if (indices) {
          indices.forEach(index => {
            if (matchingIndices.has(index)) {
              newMatchingIndices.add(index);
            }
          });
        }
      });
      
      matchingIndices = newMatchingIndices;
      
      if (matchingIndices.size === 0) {
        break;
      }
    }

    const data = Array.from(matchingIndices).map(index => this.getDataAtIndex(index));
    
    const endTime = performance.now();
    console.log(`⚡ Filtered ${data.length} records in ${(endTime - startTime).toFixed(2)}ms`);
    
    return { data, count: data.length };
  }

  getAvailableFilterOptions(column: string, filters: Record<string, string[]>): Array<{ value: string; count: number }> {
    const startTime = performance.now();
    
    const otherFilters = Object.entries(filters).filter(([col]) => col !== column);
    
    if (otherFilters.length === 0) {
      const columnIndex = this.columnIndexes.get(column);
      if (!columnIndex) return [];
      
      const options = Array.from(columnIndex.entries()).map(([value, indices]) => ({
        value,
        count: indices.size
      }));
      
      options.sort((a, b) => b.count - a.count);
      return options;
    }

    const filteredResult = this.filterData(Object.fromEntries(otherFilters));
    
    const valueCounts = new Map<string, number>();
    filteredResult.data.forEach(row => {
      const value = String(row[column]);
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    });
    
    const options = Array.from(valueCounts.entries()).map(([value, count]) => ({
      value,
      count
    }));
    
    options.sort((a, b) => b.count - a.count);
    
    const endTime = performance.now();
    console.log(`⚡ Generated filter options in ${(endTime - startTime).toFixed(2)}ms`);
    
    return options;
  }

  private getDataAtIndex(index: number): CSVData {
    return this.currentData[index] || {} as CSVData;
  }

  clearCache(): void {
    this.dataCache.clear();
    this.columnIndexes.clear();
    this.currentData = [];
    this.isInitialized = false;
  }
}
