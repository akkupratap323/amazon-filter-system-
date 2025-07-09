export interface DataRow {
    [key: string]: string | number;
  }
  
  export interface FilterState {
    [columnName: string]: string[];
  }
  
  export interface ColumnConfig {
    key: string;
    label: string;
    type: 'number' | 'string';
    filterable: boolean;
  }
  
  export interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  }
  
  export interface FilterOption {
    value: string;
    label: string;
    count?: number;
  }
  
  export interface VirtualScrollState {
    startIndex: number;
    endIndex: number;
    visibleItems: number;
  }
  
  export interface DashboardState {
    data: DataRow[];
    filteredData: DataRow[];
    filters: FilterState;
    pagination: PaginationState;
    loading: boolean;
    error: string | null;
  }
  