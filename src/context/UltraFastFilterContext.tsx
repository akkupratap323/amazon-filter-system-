'use client';

import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { UltraFastFilterManager } from '@/utils/UltraFastFilterManager';
import { DataRow, FilterOption } from '@/types';

interface FilterState {
  data: DataRow[];
  filters: Record<string, string[]>;
  filteredData: DataRow[];
  filterManager: UltraFastFilterManager | null;
  isLoading: boolean;
  error: string | null;
}

type FilterAction =
  | { type: 'SET_DATA'; payload: DataRow[] }
  | { type: 'UPDATE_FILTER'; payload: { column: string; values: string[] } }
  | { type: 'CLEAR_FILTER'; payload: string }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: FilterState = {
  data: [],
  filters: {},
  filteredData: [],
  filterManager: null,
  isLoading: false,
  error: null,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  try {
    switch (action.type) {
      case 'SET_DATA': {
        try {
          const filterManager = new UltraFastFilterManager(action.payload);
          
          // Safety check for data size
          if (action.payload.length > 1000000) {
            console.warn('Data size too large, limiting to 1M records');
            action.payload = action.payload.slice(0, 1000000);
          }
          
          filterManager.initialize();
          
          return {
            ...state,
            data: action.payload,
            filteredData: action.payload,
            filterManager,
            isLoading: false,
            error: null,
          };
        } catch (error) {
          console.error('Error setting data:', error);
          return {
            ...state,
            data: action.payload,
            filteredData: action.payload,
            filterManager: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize filters',
          };
        }
      }

      case 'UPDATE_FILTER': {
        const { column, values } = action.payload;
        const newFilters = {
          ...state.filters,
          [column]: values,
        };

        // Apply all filters to get filtered data using the filter manager
        let filteredData = state.data;
        try {
          filteredData = state.filterManager 
            ? state.filterManager.getFilteredData(newFilters)
            : state.data;
        } catch (error) {
          console.error('Filter error:', error);
          // Fallback to original data if filtering fails
          filteredData = state.data;
        }

        return {
          ...state,
          filters: newFilters,
          filteredData,
          error: null,
        };
      }

      case 'CLEAR_FILTER': {
        const remainingFilters = Object.fromEntries(
          Object.entries(state.filters).filter(([col]) => col !== action.payload)
        );
        
        // Apply remaining filters to get filtered data
        let filteredData = state.data;
        try {
          filteredData = state.filterManager 
            ? state.filterManager.getFilteredData(remainingFilters)
            : state.data;
        } catch (error) {
          console.error('Filter error:', error);
          // Fallback to original data if filtering fails
          filteredData = state.data;
        }

        return {
          ...state,
          filters: remainingFilters,
          filteredData,
          error: null,
        };
      }

      case 'CLEAR_ALL_FILTERS':
        return {
          ...state,
          filters: {},
          filteredData: state.data,
          error: null,
        };

      case 'SET_LOADING':
        return {
          ...state,
          isLoading: action.payload,
        };

      case 'SET_ERROR':
        return {
          ...state,
          error: action.payload,
          isLoading: false,
        };

      default:
        return state;
    }
  } catch (error) {
    console.error('Filter reducer error:', error);
    return {
      ...state,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      isLoading: false,
    };
  }
}

interface UltraFastFilterContextType {
  state: FilterState;
  dispatch: React.Dispatch<FilterAction>;
  getFilterOptions: (column: string) => FilterOption[];
  getAvailableFilterOptions: (column: string) => FilterOption[];
  getFilteredCount: () => number;
}

const UltraFastFilterContext = createContext<UltraFastFilterContextType | undefined>(undefined);

export function UltraFastFilterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  const getFilterOptions = useMemo(() => {
    return (column: string) => {
      try {
        if (!state.filterManager) return [];
        return state.filterManager.getFilterOptions(column);
      } catch (error) {
        console.error('Error getting filter options:', error);
        return [];
      }
    };
  }, [state.filterManager]);

  const getAvailableFilterOptions = useMemo(() => {
    return (column: string) => {
      try {
        if (!state.filterManager) return [];
        return state.filterManager.getAvailableFilterOptions(column, state.filters);
      } catch (error) {
        console.error('Error getting available filter options:', error);
        return [];
      }
    };
  }, [state.filterManager, state.filters]);

  const getFilteredCount = useMemo(() => {
    return () => {
      try {
        if (!state.filterManager) return state.data.length;
        return state.filterManager.getFilteredCount(state.filters);
      } catch (error) {
        console.error('Error getting filtered count:', error);
        return state.data.length;
      }
    };
  }, [state.filterManager, state.filters, state.data.length]);

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    getFilterOptions,
    getAvailableFilterOptions,
    getFilteredCount,
  }), [state, dispatch, getFilterOptions, getAvailableFilterOptions, getFilteredCount]);

  return (
    <UltraFastFilterContext.Provider value={contextValue}>
      {children}
    </UltraFastFilterContext.Provider>
  );
}

export function useUltraFastFilter() {
  const context = useContext(UltraFastFilterContext);
  if (context === undefined) {
    throw new Error('useUltraFastFilter must be used within an UltraFastFilterProvider');
  }
  return context;
} 