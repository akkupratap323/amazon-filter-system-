'use client';

import React, { createContext, useContext, useReducer, ReactNode, useCallback, useRef } from 'react';
import { DataRow, ColumnConfig, FilterState } from '@/types';
import { ChunkedDataGenerator } from '@/utils/csvParser';
import { getColumnConfigs } from '@/utils/dataProcessing';
import { OptimizedFilterManager } from '@/utils/optimizedFilterLogic';

interface ChunkedDataState {
  dataGenerator: ChunkedDataGenerator | null;
  filterManager: OptimizedFilterManager | null;
  totalCount: number;
  loadedData: DataRow[];
  visibleRange: { start: number; end: number };
  loading: boolean;
  error: string | null;
  columns: ColumnConfig[];
  filters: FilterState;
  filteredCount: number;
  cacheInfo: {
    loadedChunks: number;
    totalChunks: number;
    memoryUsage: number;
  };
}

type ChunkedDataAction =
  | { type: 'INITIALIZE_GENERATOR'; payload: { totalCount: number; chunkSize?: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_CHUNK'; payload: { chunkIndex: number; data: DataRow[] } }
  | { type: 'SET_VISIBLE_RANGE'; payload: { start: number; end: number } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'UPDATE_COLUMNS'; payload: ColumnConfig[] }
  | { type: 'UPDATE_FILTERS'; payload: FilterState }
  | { type: 'CLEAR_FILTERS' };

const initialState: ChunkedDataState = {
  dataGenerator: null,
  filterManager: null,
  totalCount: 0,
  loadedData: [],
  visibleRange: { start: 0, end: 0 },
  loading: false,
  error: null,
  columns: [],
  filters: {},
  filteredCount: 0,
  cacheInfo: { loadedChunks: 0, totalChunks: 0, memoryUsage: 0 },
};

const chunkedDataReducer = (state: ChunkedDataState, action: ChunkedDataAction): ChunkedDataState => {
  switch (action.type) {
    case 'INITIALIZE_GENERATOR': {
      const generator = new ChunkedDataGenerator(action.payload.totalCount, action.payload.chunkSize);
      const filterManager = new OptimizedFilterManager(action.payload.totalCount, action.payload.chunkSize);
      
      // Generate first chunk immediately to get column structure
      const firstChunk = generator.generateChunk(0);
      const columns = getColumnConfigs(firstChunk);
      
      // Build initial index for the first chunk with correct column names
      filterManager.buildIndex('id', firstChunk, 0);
      filterManager.buildIndex('number', firstChunk, 0);
      filterManager.buildIndex('mod3', firstChunk, 0);
      filterManager.buildIndex('mod4', firstChunk, 0);
      filterManager.buildIndex('mod5', firstChunk, 0);
      filterManager.buildIndex('mod6', firstChunk, 0);
      filterManager.buildIndex('mod7', firstChunk, 0);
      filterManager.buildIndex('mod8', firstChunk, 0);
      filterManager.buildIndex('mod10', firstChunk, 0);
      filterManager.buildIndex('mod12', firstChunk, 0);
      filterManager.buildIndex('mod15', firstChunk, 0);
      filterManager.buildIndex('mod20', firstChunk, 0);
      filterManager.buildIndex('category', firstChunk, 0);
      filterManager.buildIndex('status', firstChunk, 0);
      filterManager.cacheData(firstChunk, 0);
      
      // Preload a few more chunks to populate filter options
      const chunksToPreload = Math.min(2, generator.getTotalChunks() - 1);
      for (let i = 1; i <= chunksToPreload; i++) {
        const chunkData = generator.generateChunk(i);
        const startIndex = i * generator.getChunkSize();
        filterManager.buildIndex('id', chunkData, startIndex);
        filterManager.buildIndex('number', chunkData, startIndex);
        filterManager.buildIndex('mod3', chunkData, startIndex);
        filterManager.buildIndex('mod4', chunkData, startIndex);
        filterManager.buildIndex('mod5', chunkData, startIndex);
        filterManager.buildIndex('mod6', chunkData, startIndex);
        filterManager.buildIndex('mod7', chunkData, startIndex);
        filterManager.buildIndex('mod8', chunkData, startIndex);
        filterManager.buildIndex('mod10', chunkData, startIndex);
        filterManager.buildIndex('mod12', chunkData, startIndex);
        filterManager.buildIndex('mod15', chunkData, startIndex);
        filterManager.buildIndex('mod20', chunkData, startIndex);
        filterManager.buildIndex('category', chunkData, startIndex);
        filterManager.buildIndex('status', chunkData, startIndex);
        filterManager.cacheData(chunkData, startIndex);
      }
      
      return {
        ...state,
        dataGenerator: generator,
        filterManager: filterManager,
        totalCount: action.payload.totalCount,
        filteredCount: action.payload.totalCount,
        columns: columns,
        cacheInfo: generator.getCacheInfo(),
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'LOAD_CHUNK': {
      const newLoadedData = [...state.loadedData];
      const chunkStart = action.payload.chunkIndex * (state.dataGenerator?.getChunkSize() || 1000);
      
      // Replace or add chunk data
      for (let i = 0; i < action.payload.data.length; i++) {
        const globalIndex = chunkStart + i;
        if (globalIndex < newLoadedData.length) {
          newLoadedData[globalIndex] = action.payload.data[i];
        } else {
          newLoadedData.push(action.payload.data[i]);
        }
      }

      // Update columns if this is the first chunk
      let newColumns = state.columns;
      if (newLoadedData.length > 0 && state.columns.length === 0) {
        newColumns = getColumnConfigs(newLoadedData);
      }

      return {
        ...state,
        loadedData: newLoadedData,
        columns: newColumns,
        cacheInfo: state.dataGenerator?.getCacheInfo() || state.cacheInfo,
      };
    }

    case 'SET_VISIBLE_RANGE':
      return {
        ...state,
        visibleRange: action.payload,
      };

    case 'CLEAR_CACHE':
      state.dataGenerator?.clearCache();
      return {
        ...state,
        loadedData: [],
        cacheInfo: state.dataGenerator?.getCacheInfo() || state.cacheInfo,
      };

    case 'UPDATE_COLUMNS':
      return {
        ...state,
        columns: action.payload,
      };

    case 'UPDATE_FILTERS': {
      const newFilters = action.payload;
      const filteredCount = state.filterManager?.getFilteredCount(newFilters) || state.totalCount;
      
      return {
        ...state,
        filters: newFilters,
        filteredCount: filteredCount,
      };
    }

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {},
        filteredCount: state.totalCount,
      };

    default:
      return state;
  }
};

interface ChunkedDataContextType {
  state: ChunkedDataState;
  initializeGenerator: (totalCount: number, chunkSize?: number) => void;
  loadChunk: (chunkIndex: number) => Promise<void>;
  loadVisibleChunks: (startIndex: number, endIndex: number) => Promise<void>;
  setVisibleRange: (start: number, end: number) => void;
  clearCache: () => void;
  getDataForRange: (startIndex: number, endIndex: number) => DataRow[];
  getFilterOptions: (column: string) => string[];
  updateFilters: (filters: FilterState) => void;
  clearFilters: () => void;
}

const ChunkedDataContext = createContext<ChunkedDataContextType | undefined>(undefined);

export const ChunkedDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chunkedDataReducer, initialState);
  const loadingChunks = useRef<Set<number>>(new Set());

  const initializeGenerator = useCallback((totalCount: number, chunkSize: number = 1000) => {
    dispatch({ type: 'INITIALIZE_GENERATOR', payload: { totalCount, chunkSize } });
  }, []);

  const loadChunk = useCallback(async (chunkIndex: number) => {
    if (!state.dataGenerator || loadingChunks.current.has(chunkIndex)) {
      return;
    }

    loadingChunks.current.add(chunkIndex);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Generate chunk data immediately
      const chunkData = state.dataGenerator.generateChunk(chunkIndex);
      
      // Build indexes for the new chunk with correct column names
      if (state.filterManager) {
        const startIndex = chunkIndex * (state.dataGenerator.getChunkSize());
        state.filterManager.buildIndex('id', chunkData, startIndex);
        state.filterManager.buildIndex('number', chunkData, startIndex);
        state.filterManager.buildIndex('mod3', chunkData, startIndex);
        state.filterManager.buildIndex('mod4', chunkData, startIndex);
        state.filterManager.buildIndex('mod5', chunkData, startIndex);
        state.filterManager.buildIndex('mod6', chunkData, startIndex);
        state.filterManager.buildIndex('mod7', chunkData, startIndex);
        state.filterManager.buildIndex('mod8', chunkData, startIndex);
        state.filterManager.buildIndex('mod10', chunkData, startIndex);
        state.filterManager.buildIndex('mod12', chunkData, startIndex);
        state.filterManager.buildIndex('mod15', chunkData, startIndex);
        state.filterManager.buildIndex('mod20', chunkData, startIndex);
        state.filterManager.buildIndex('category', chunkData, startIndex);
        state.filterManager.buildIndex('status', chunkData, startIndex);
        state.filterManager.cacheData(chunkData, startIndex);
      }
      
      dispatch({ type: 'LOAD_CHUNK', payload: { chunkIndex, data: chunkData } });
      dispatch({ type: 'SET_LOADING', payload: false });
      loadingChunks.current.delete(chunkIndex);
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load chunk' 
      });
      loadingChunks.current.delete(chunkIndex);
    }
  }, [state.dataGenerator, state.filterManager]);

  const loadVisibleChunks = useCallback(async (startIndex: number, endIndex: number) => {
    if (!state.dataGenerator) return;

    const chunkSize = state.dataGenerator.getChunkSize();
    const startChunk = Math.floor(startIndex / chunkSize);
    const endChunk = Math.floor(endIndex / chunkSize);

    // Load chunks that are not already loaded
    const chunksToLoad: number[] = [];
    for (let i = startChunk; i <= endChunk; i++) {
      const isLoaded = state.dataGenerator.isChunkLoaded(i);
      if (!isLoaded && !loadingChunks.current.has(i)) {
        chunksToLoad.push(i);
      }
    }

    // Load chunks in parallel with a limit
    const maxConcurrent = 3;
    for (let i = 0; i < chunksToLoad.length; i += maxConcurrent) {
      const batch = chunksToLoad.slice(i, i + maxConcurrent);
      await Promise.all(batch.map(chunkIndex => loadChunk(chunkIndex)));
    }
  }, [state.dataGenerator, loadChunk]);

  const setVisibleRange = useCallback((start: number, end: number) => {
    dispatch({ type: 'SET_VISIBLE_RANGE', payload: { start, end } });
  }, []);

  const clearCache = useCallback(() => {
    dispatch({ type: 'CLEAR_CACHE' });
  }, []);

  const getDataForRange = useCallback((startIndex: number, endIndex: number): DataRow[] => {
    if (!state.dataGenerator) return [];

    // Return filtered data if filters are applied
    if (Object.keys(state.filters).length > 0 && state.filterManager) {
      return state.filterManager.getFilteredDataRange(startIndex, endIndex, state.filters);
    }

    // Return data from the generator (it will generate on-demand if not cached)
    return state.dataGenerator.getDataRange(startIndex, endIndex);
  }, [state.dataGenerator, state.filters, state.filterManager]);

  const getFilterOptions = useCallback((column: string): string[] => {
    if (!state.filterManager) return [];
    return state.filterManager.getFilterOptions(column, state.filters);
  }, [state.filterManager, state.filters]);

  const updateFilters = useCallback((filters: FilterState) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const contextValue: ChunkedDataContextType = {
    state,
    initializeGenerator,
    loadChunk,
    loadVisibleChunks,
    setVisibleRange,
    clearCache,
    getDataForRange,
    getFilterOptions,
    updateFilters,
    clearFilters,
  };

  return (
    <ChunkedDataContext.Provider value={contextValue}>
      {children}
    </ChunkedDataContext.Provider>
  );
};

export const useChunkedData = (): ChunkedDataContextType => {
  const context = useContext(ChunkedDataContext);
  if (!context) {
    throw new Error('useChunkedData must be used within a ChunkedDataProvider');
  }
  return context;
}; 