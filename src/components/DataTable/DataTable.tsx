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
  virtualScrollHeight = 400,
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
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortState.direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    if (sortState.direction === 'desc') {
      return (
        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }

    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
        <div className="text-gray-500 text-lg">No data available</div>
        <div className="text-gray-400 text-sm mt-2">Try adjusting your filters</div>
      </div>
    );
  }

  if (enableVirtualScroll) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <VirtualScroll
          data={paginatedData}
          columns={columns}
          containerHeight={virtualScrollHeight}
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {String(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        paginationState={paginationState}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
      />
    </div>
  );
};
