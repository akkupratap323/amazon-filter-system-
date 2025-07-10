'use client';

import React, { useState, useMemo } from 'react';
import { DataRow, ColumnConfig } from '@/types';
import { Pagination } from './Pagination';
import { VirtualScroll } from './VirtualScroll';
import { usePagination } from '@/hooks/usePagination';
import { sortData } from '@/utils/dataProcessing';

interface DataTableProps {
  data: DataRow[];
  columns: ColumnConfig[];
  enableVirtualScroll?: boolean;
  virtualScrollHeight?: number;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  enableVirtualScroll = false,
  virtualScrollHeight = 600,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });

  // Sort data based on current sort state
  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return data;
    }
    return sortData(data, sortState.column, sortState.direction);
  }, [data, sortState]);

  const {
    paginationState,
    goToPage,
    changePageSize,
    getPaginatedData,
  } = usePagination(sortedData.length, 100);

  const paginatedData = useMemo(() => {
    return enableVirtualScroll ? sortedData : getPaginatedData(sortedData);
  }, [sortedData, getPaginatedData, enableVirtualScroll]);

  const handleSort = (column: string) => {
    setSortState(prev => {
      if (prev.column === column) {
        // Cycle through: asc -> desc -> null
        const newDirection: SortDirection = 
          prev.direction === 'asc' ? 'desc' : 
          prev.direction === 'desc' ? null : 'asc';
        
        return {
          column: newDirection ? column : null,
          direction: newDirection,
        };
      } else {
        return {
          column,
          direction: 'asc',
        };
      }
    });
  };

  const getSortIcon = (column: string) => {
    if (sortState.column !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }

    if (sortState.direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    if (sortState.direction === 'desc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }

    return null;
  };

  if (data.length === 0) {
    return (
      <div className="glass-effect rounded-2xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Try adjusting your filters or loading a dataset</p>
      </div>
    );
  }

  if (enableVirtualScroll) {
    return (
      <div className="glass-effect rounded-2xl overflow-hidden">
        {/* Virtual Scroll Header */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Virtual Scroll Mode</h3>
            <div className="text-sm text-gray-600">
              Showing all {sortedData.length.toLocaleString()} rows
            </div>
          </div>
        </div>
        
        <VirtualScroll
          data={sortedData}
          columns={columns}
          containerHeight={virtualScrollHeight}
        />
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-2xl overflow-hidden">
      {/* Enhanced Table Header */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Data Table</h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Page {paginationState.currentPage} of {paginationState.totalPages}
            </div>
            <div className="text-sm font-medium text-blue-600">
              {paginatedData.length} of {sortedData.length.toLocaleString()} rows
            </div>
          </div>
        </div>
      </div>

      {/* Professional Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="group px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    <span className="group-hover:text-gray-900 transition-colors">
                      {column.label}
                    </span>
                    <div className="ml-2 flex-shrink-0">
                      {getSortIcon(column.key)}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr 
                key={`${row.id || index}`} 
                className="hover:bg-blue-50/50 transition-colors duration-150 group"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      {column.type === 'number' ? (
                        <span className="font-mono font-medium">
                          {typeof row[column.key] === 'number' 
                            ? row[column.key].toLocaleString() 
                            : String(row[column.key])
                          }
                        </span>
                      ) : (
                        <span>{String(row[column.key])}</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Pagination */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200/50">
        <Pagination
          paginationState={paginationState}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      </div>
    </div>
  );
};
