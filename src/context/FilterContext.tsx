'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { DataRow, DashboardState } from '@/types';
import { applyFilters } from '@/utils/filterLogic';

interface FilterContextType {
  state: DashboardState;
  dispatch: React.Dispatch<FilterAction>;
}

type FilterAction =
  | { type: 'SET_DATA'; payload: DataRow[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_FILTER'; payload: { column: string; values: string[] } }
  | { type: 'CLEAR_FILTER'; payload: string }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_PAGE'; payload: number };

const initialState: DashboardState = {
  data: [],
  filteredData: [],
  filters: {},
  pagination: {
    currentPage: 1,
    pageSize: 100,
    totalItems: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const filterReducer = (state: DashboardState, action: FilterAction): DashboardState => {
  switch (action.type) {
    case 'SET_DATA': {
      const filteredData = applyFilters(action.payload, state.filters);
      return {
        ...state,
        data: action.payload,
        filteredData,
        pagination: {
          ...state.pagination,
          totalItems: filteredData.length,
          totalPages: Math.ceil(filteredData.length / state.pagination.pageSize),
        },
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

    case 'UPDATE_FILTER': {
      const newFilters = {
        ...state.filters,
        [action.payload.column]: action.payload.values,
      };
      const filteredData = applyFilters(state.data, newFilters);
      
      return {
        ...state,
        filters: newFilters,
        filteredData,
        pagination: {
          ...state.pagination,
          currentPage: 1, // Reset to first page when filtering
          totalItems: filteredData.length,
          totalPages: Math.ceil(filteredData.length / state.pagination.pageSize),
        },
      };
    }

    case 'CLEAR_FILTER': {
      const newFilters = { ...state.filters };
      delete newFilters[action.payload];
      const filteredData = applyFilters(state.data, newFilters);
      
      return {
        ...state,
        filters: newFilters,
        filteredData,
        pagination: {
          ...state.pagination,
          currentPage: 1,
          totalItems: filteredData.length,
          totalPages: Math.ceil(filteredData.length / state.pagination.pageSize),
        },
      };
    }

    case 'CLEAR_ALL_FILTERS': {
      return {
        ...state,
        filters: {},
        filteredData: state.data,
        pagination: {
          ...state.pagination,
          currentPage: 1,
          totalItems: state.data.length,
          totalPages: Math.ceil(state.data.length / state.pagination.pageSize),
        },
      };
    }

    case 'SET_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          currentPage: action.payload,
        },
      };

    default:
      return state;
  }
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  return (
    <FilterContext.Provider value={{ state, dispatch }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
