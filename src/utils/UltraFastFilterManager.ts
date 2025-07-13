import { FilterOption, DataRow } from '@/types';

export class UltraFastFilterManager {
  private filterCache: Map<string, FilterOption[]> = new Map();
  private dataIndex: Map<string, Map<string, Set<number>>> = new Map();
  private data: DataRow[] = [];
  private isInitialized = false;
  private numericColumns: Set<string> = new Set(['id', 'number']);

  constructor(data: DataRow[]) {
    this.data = data;
  }

  // Initialize the filter manager with ultra-optimized indexing
  initialize(): void {
    if (this.isInitialized) return;
    
    // Safety check to prevent recursive calls
    if (this.data.length === 0) {
      console.warn('No data to initialize filter manager');
      this.isInitialized = true;
      return;
    }

    try {
      // Create ultra-fast indexes for instant lookups
      this.createUltraFastIndexes();
      
      // Pre-compute all filter options
      this.precomputeFilterOptions();

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing filter manager:', error);
      this.isInitialized = true; // Mark as initialized to prevent infinite retries
    }
  }

  private createUltraFastIndexes(): void {
    // Create indexes for each column using Map and Set for O(1) lookups
    this.data.forEach((row, index) => {
      Object.keys(row).forEach(column => {
        const value = String(row[column]);
        
        if (!this.dataIndex.has(column)) {
          this.dataIndex.set(column, new Map());
        }
        
        const columnIndex = this.dataIndex.get(column)!;
        if (!columnIndex.has(value)) {
          columnIndex.set(value, new Set());
        }
        
        columnIndex.get(value)!.add(index);
      });
    });
  }

  private precomputeFilterOptions(): void {
    // Pre-compute filter options for all columns
    this.dataIndex.forEach((columnIndex, column) => {
      let options: FilterOption[];

      if (this.numericColumns.has(column)) {
        // For numeric columns, create range-based options instead of individual values
        options = this.createNumericFilterOptions(column);
      } else {
        // For regular columns, use all unique values
        const entries = Array.from(columnIndex.entries());
        // Limit to prevent too many options that could crash the app
        const limitedEntries = entries.slice(0, 100);
        options = limitedEntries.map(([value, indices]) => ({
          value,
          label: value,
          count: indices.size
        }));
      }

      // Sort by count (descending) for better UX
      options.sort((a, b) => (b.count || 0) - (a.count || 0));
      
      this.filterCache.set(column, options);
    });
  }

  private createNumericFilterOptions(column: string): FilterOption[] {
    try {
      const values = this.data.map(row => Number(row[column])).filter(v => !isNaN(v));
      if (values.length === 0) return [];

      // Use efficient min/max calculation to avoid stack overflow
      let min = values[0];
      let max = values[0];
      for (let i = 1; i < values.length; i++) {
        if (values[i] < min) min = values[i];
        if (values[i] > max) max = values[i];
      }
      
      const range = max - min;
      const dataSize = this.data.length;

      // Create range-based options for better performance
      const options: FilterOption[] = [];
      
      // Check if values are mostly sequential (like IDs)
      const uniqueValues = new Set(values);
      const isSequential = uniqueValues.size > dataSize * 0.9; // If 90%+ values are unique
      
      if (isSequential && dataSize > 1000) {
        // For sequential data (like IDs), create fixed-size buckets
        const bucketSize = Math.max(1000, Math.ceil(dataSize / 20)); // At least 1000 per bucket, max 20 buckets
        const maxBuckets = Math.ceil(dataSize / bucketSize);
        
        // Safety check to prevent infinite loops
        if (maxBuckets > 100) {
          console.warn('Too many buckets, limiting to 100');
          return [];
        }
        
        for (let i = 0; i < maxBuckets; i++) {
          const bucketStart = i * bucketSize + 1; // IDs start from 1
          const bucketEnd = Math.min((i + 1) * bucketSize, dataSize);
          
          const count = bucketEnd - bucketStart + 1;
          
          const label = `${bucketStart}-${bucketEnd}`;
          
          options.push({
            value: `${bucketStart}-${bucketEnd}`,
            label,
            count
          });
        }
      } else if (range <= 100) {
        // For small ranges, show individual values
        const uniqueValuesArray = Array.from(uniqueValues).sort((a, b) => a - b);
        // Limit to prevent too many options
        const limitedValues = uniqueValuesArray.slice(0, 50);
        limitedValues.forEach(value => {
          const count = this.data.filter(row => Number(row[column]) === value).length;
          options.push({
            value: value.toString(),
            label: value.toString(),
            count
          });
        });
      } else {
        // For large ranges, create range buckets
        // Adjust bucket count based on data size
        let bucketCount = 20; // Default
        
        if (dataSize > 100000) {
          bucketCount = 30; // More buckets for very large datasets
        } else if (dataSize > 50000) {
          bucketCount = 25; // Medium buckets for large datasets
        }
        
        const bucketSize = range / bucketCount;

        for (let i = 0; i < bucketCount; i++) {
          const bucketStart = min + (i * bucketSize);
          const bucketEnd = min + ((i + 1) * bucketSize);
          
          const count = this.data.filter(row => {
            const value = Number(row[column]);
            return value >= bucketStart && value < bucketEnd;
          }).length;

          if (count > 0) {
            const label = i === bucketCount - 1 
              ? `${Math.floor(bucketStart)}-${Math.floor(bucketEnd)}`
              : `${Math.floor(bucketStart)}-${Math.floor(bucketEnd - 1)}`;
            
            options.push({
              value: `${bucketStart}-${bucketEnd}`,
              label,
              count
            });
          }
        }
      }

      return options;
    } catch (error) {
      console.error('Error creating numeric filter options:', error);
      return [];
    }
  }

  // Get filter options instantly (no computation needed)
  getFilterOptions(column: string): FilterOption[] {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.filterCache.get(column) || [];
  }

  // Get available options based on current filters - ULTRA-OPTIMIZED DEPENDENT FILTERING
  getAvailableFilterOptions(column: string, currentFilters: Record<string, string[]>): FilterOption[] {
    if (!this.isInitialized) {
      this.initialize();
    }

    // Get all possible values for this column
    const allOptions = this.filterCache.get(column) || [];
    
    // If no other filters are active, return all options
    const otherFilters = Object.entries(currentFilters).filter(([col]) => col !== column);
    if (otherFilters.length === 0) {
      return allOptions;
    }

    // Apply other filters using ultra-fast index lookups
    const matchingIndices = this.getMatchingIndices(otherFilters);
    
    if (this.numericColumns.has(column)) {
      // For numeric columns, use range-based filtering
      return this.getNumericFilterOptions(column, matchingIndices, allOptions);
    } else {
      // For regular columns, use value-based filtering
      return this.getValueBasedFilterOptions(column, matchingIndices, allOptions);
    }
  }

  private getNumericFilterOptions(column: string, matchingIndices: Set<number>, allOptions: FilterOption[]): FilterOption[] {
    // For numeric columns, we need to check if the ranges overlap with the filtered data
    const availableOptions: FilterOption[] = [];
    
    allOptions.forEach(option => {
      let count = 0;
      
      if (option.value.includes('-')) {
        // Handle range values (e.g., "100-200")
        const [start, end] = option.value.split('-').map(v => Number(v));
        
        matchingIndices.forEach(index => {
          const rowValue = Number(this.data[index][column]);
          if (rowValue >= start && rowValue <= end) {
            count++;
          }
        });
      } else {
        // Handle single values
        const targetValue = Number(option.value);
        matchingIndices.forEach(index => {
          if (Number(this.data[index][column]) === targetValue) {
            count++;
          }
        });
      }
      
      // Only include options that have matching data
      if (count > 0) {
        availableOptions.push({
          ...option,
          count
        });
      }
    });

    // Sort by updated count (descending)
    availableOptions.sort((a, b) => (b.count || 0) - (a.count || 0));
    
    return availableOptions;
  }

  private getValueBasedFilterOptions(column: string, matchingIndices: Set<number>, allOptions: FilterOption[]): FilterOption[] {
    // Get unique values from the filtered data for this column
    const availableValues = new Set<string>();
    matchingIndices.forEach(index => {
      const value = String(this.data[index][column]);
      availableValues.add(value);
    });
    
    // Return only the options that exist in the filtered data
    const availableOptions = allOptions.filter(option => availableValues.has(option.value));
    
    // Update counts based on the filtered data
    const updatedOptions = availableOptions.map(option => ({
      ...option,
      count: this.getCountForValueInFilteredData(column, option.value, matchingIndices)
    }));

    // Sort by updated count (descending)
    updatedOptions.sort((a, b) => (b.count || 0) - (a.count || 0));
    
    return updatedOptions;
  }

  // Ultra-fast index-based filtering with numeric support
  private getMatchingIndices(filters: [string, string[]][]): Set<number> {
    if (filters.length === 0) {
      return new Set(this.data.map((_, index) => index));
    }

    // Get the first filter to start with
    const [firstColumn, firstValues] = filters[0];
    let matchingIndices = new Set<number>();
    
    // Add all matching indices from the first filter
    firstValues.forEach(value => {
      if (this.numericColumns.has(firstColumn)) {
        // Handle numeric range filtering
        const indices = this.getNumericMatchingIndices(firstColumn, value);
        indices.forEach(index => matchingIndices.add(index));
      } else {
        // Handle regular value filtering
        const indices = this.dataIndex.get(firstColumn)?.get(value);
        if (indices) {
          indices.forEach(index => matchingIndices.add(index));
        }
      }
    });

    // Apply remaining filters
    for (let i = 1; i < filters.length; i++) {
      const [column, values] = filters[i];
      const newMatchingIndices = new Set<number>();
      
      values.forEach(value => {
        let indices: Set<number>;
        
        if (this.numericColumns.has(column)) {
          // Handle numeric range filtering
          indices = this.getNumericMatchingIndices(column, value);
        } else {
          // Handle regular value filtering
          indices = this.dataIndex.get(column)?.get(value) || new Set();
        }
        
        indices.forEach(index => {
          if (matchingIndices.has(index)) {
            newMatchingIndices.add(index);
          }
        });
      });
      
      matchingIndices = newMatchingIndices;
      
      // Early exit if no matches
      if (matchingIndices.size === 0) {
        break;
      }
    }

    return matchingIndices;
  }

  private getNumericMatchingIndices(column: string, value: string): Set<number> {
    const indices = new Set<number>();
    
    if (value.includes('-')) {
      // Handle range values (e.g., "100-200")
      const [start, end] = value.split('-').map(v => Number(v));
      
      this.data.forEach((row, index) => {
        const rowValue = Number(row[column]);
        if (rowValue >= start && rowValue <= end) {
          indices.add(index);
        }
      });
    } else {
      // Handle single values
      const targetValue = Number(value);
      this.data.forEach((row, index) => {
        if (Number(row[column]) === targetValue) {
          indices.add(index);
        }
      });
    }
    
    return indices;
  }

  // Get count for a specific value in filtered data using indices
  private getCountForValueInFilteredData(column: string, value: string, matchingIndices: Set<number>): number {
    let count = 0;
    
    if (this.numericColumns.has(column)) {
      // Handle numeric range counting
      if (value.includes('-')) {
        const [start, end] = value.split('-').map(v => Number(v));
        matchingIndices.forEach(index => {
          const rowValue = Number(this.data[index][column]);
          if (rowValue >= start && rowValue <= end) {
            count++;
          }
        });
      } else {
        const targetValue = Number(value);
        matchingIndices.forEach(index => {
          if (Number(this.data[index][column]) === targetValue) {
            count++;
          }
        });
      }
    } else {
      // Handle regular value counting
      matchingIndices.forEach(index => {
        if (String(this.data[index][column]) === value) {
          count++;
        }
      });
    }
    
    return count;
  }

  // Apply filters instantly using optimized lookup
  applyFilters(data: DataRow[], filters: [string, string[]][]): DataRow[] {
    if (filters.length === 0) return data;

    const matchingIndices = this.getMatchingIndices(filters);
    return Array.from(matchingIndices).map(index => this.data[index]);
  }

  // Get filtered data count instantly
  getFilteredCount(filters: Record<string, string[]>): number {
    const filterEntries = Object.entries(filters).filter(([, values]) => values.length > 0);
    if (filterEntries.length === 0) return this.data.length;

    const matchingIndices = this.getMatchingIndices(filterEntries);
    return matchingIndices.size;
  }

  // Get the final filtered data based on all active filters
  getFilteredData(filters: Record<string, string[]>): DataRow[] {
    const filterEntries = Object.entries(filters).filter(([, values]) => values.length > 0);
    if (filterEntries.length === 0) return this.data;

    const matchingIndices = this.getMatchingIndices(filterEntries);
    return Array.from(matchingIndices).map(index => this.data[index]);
  }

  // Clear cache (useful for data updates)
  clearCache(): void {
    this.filterCache.clear();
    this.dataIndex.clear();
    this.isInitialized = false;
  }

  // Update data and reinitialize
  updateData(newData: DataRow[]): void {
    this.data = newData;
    this.clearCache();
    this.initialize();
  }
} 