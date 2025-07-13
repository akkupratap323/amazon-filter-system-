'use client';

import React, { memo, useEffect, useState } from 'react';
import { DataRow, ColumnConfig } from '@/types';
import { useChunkedData } from '@/context/ChunkedDataContext';

interface ChunkedVirtualScrollProps {
  columns: ColumnConfig[];
  itemHeight?: number;
  containerHeight?: number;
}

// Professional SVG Icons
const LoadingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ErrorIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EmptyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

// Enhanced professional row component
const ChunkedVirtualRow = memo<{
  row: DataRow;
  columns: ColumnConfig[];
  index: number;
  isEven: boolean;
}>(({ row, columns, index, isEven }) => (
  <div 
    className={`
      group relative border-b border-gray-100/50 
      ${isEven ? 'bg-white' : 'bg-gray-50/30'} 
      hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 
      transition-all duration-200 ease-in-out
      hover:shadow-sm hover:border-blue-200/50
    `}
  >
    {/* Row highlight indicator */}
    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-gradient-to-b group-hover:from-blue-500 group-hover:to-indigo-600 transition-all duration-200"></div>
    
    <div className="grid grid-cols-12 gap-6 px-8 py-5 items-center">
      {columns.map((column, colIndex) => {
        const cellValue = row[column.key];
        const isFirstColumn = colIndex === 0;
        
        return (
          <div
            key={`${column.key}-${index}`}
            className={`
              text-sm transition-colors duration-150
              ${isFirstColumn ? 'col-span-2 font-semibold text-gray-900' : 'col-span-2 text-gray-700'}
              group-hover:text-gray-900
            `}
          >
            {column.type === 'number' ? (
              <div className="flex items-center space-x-2">
                <span className="font-mono font-medium bg-gray-100/50 px-2 py-1 rounded-md text-xs">
                  {typeof cellValue === 'number' 
                    ? cellValue.toLocaleString() 
                    : String(cellValue)
                  }
                </span>
              </div>
            ) : column.type === 'boolean' ? (
              <div className="flex items-center">
                <span className={`
                  inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                  ${cellValue ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                `}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cellValue ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {cellValue ? 'Active' : 'Inactive'}
                </span>
              </div>
            ) : (
              <span className="truncate block" title={String(cellValue)}>
                {String(cellValue)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  </div>
));

ChunkedVirtualRow.displayName = 'ChunkedVirtualRow';

export const ChunkedVirtualScroll: React.FC<ChunkedVirtualScrollProps> = ({
  columns,
  containerHeight = 600,
}) => {
  const { state, loadVisibleChunks, getDataForRange } = useChunkedData();
  const { dataGenerator, totalCount, filteredCount, loading, error, cacheInfo, filters } = state;
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(100);
  const [loadedData, setLoadedData] = useState<DataRow[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const effectiveTotalCount = Object.keys(filters).length > 0 ? filteredCount : totalCount;
  const totalPages = Math.ceil(effectiveTotalCount / pageSize);
  const hasFilters = Object.keys(filters).length > 0;

  // Enhanced data loading with transition effects
  useEffect(() => {
    if (dataGenerator && effectiveTotalCount > 0) {
      setIsTransitioning(true);
      
      const startIndex = currentPage * pageSize;
      const endIndex = Math.min(startIndex + pageSize - 1, effectiveTotalCount - 1);
      
      loadVisibleChunks(startIndex, endIndex);
      
      // Add slight delay for smooth transition
      setTimeout(() => {
        const pageData = getDataForRange(startIndex, endIndex);
        setLoadedData(pageData);
        setIsTransitioning(false);
      }, 150);
    }
  }, [dataGenerator, effectiveTotalCount, currentPage, pageSize, loadVisibleChunks, getDataForRange, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [filters]);

  const handlePageChange = (page: number) => {
    if (page !== currentPage && page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const maxVisible = 5;
    const pages: number[] = [];
    
    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(0, Math.min(totalPages - maxVisible, currentPage - 2));
      for (let i = start; i < Math.min(start + maxVisible, totalPages); i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Error State
  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-red-200/50 shadow-2xl rounded-3xl p-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
          <ErrorIcon className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Data Loading Error</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <LoadingIcon className="h-4 w-4 mr-2" />
          Retry Loading
        </button>
      </div>
    );
  }

  // Empty State
  if (!dataGenerator) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl p-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
          <EmptyIcon className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Data Available</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
          Initialize a dataset to begin exploring your business intelligence data.
        </p>
        <div className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl">
          <DatabaseIcon className="h-4 w-4 mr-2" />
          Waiting for Data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <DatabaseIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Data Table</h3>
              <p className="text-sm text-gray-600">
                {effectiveTotalCount.toLocaleString()} records
                {hasFilters && (
                  <span className="text-blue-600 ml-1">
                    (filtered from {totalCount.toLocaleString()})
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-4">
            {loading && (
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
                <LoadingIcon className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-700">Loading...</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                Page {currentPage + 1} of {totalPages}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
        <div className="grid grid-cols-12 gap-6 px-8 py-4">
          {columns.map((column) => (
            <div
              key={`header-${column.key}`}
              className="col-span-2 text-left"
            >
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-100 uppercase tracking-wider">
                  {column.label}
                </span>
                <div className={`
                  w-2 h-2 rounded-full
                  ${column.type === 'number' ? 'bg-blue-400' : 
                    column.type === 'boolean' ? 'bg-green-400' : 'bg-gray-400'}
                `}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Container */}
      <div 
        className="relative overflow-auto bg-white"
        style={{ height: containerHeight }}
      >
        {/* Loading Overlay */}
        {(loading || isTransitioning) && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center space-x-3 bg-white shadow-lg rounded-2xl px-6 py-4">
              <LoadingIcon className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-gray-700">Loading data...</span>
            </div>
          </div>
        )}

        {/* Data Rows */}
        <div className="min-h-full">
          {loadedData.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <EmptyIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h4>
                <p className="text-gray-600">No records match your current filters.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {loadedData.map((row, index) => (
                <ChunkedVirtualRow
                  key={`row-${row.id || index}-${currentPage}`}
                  row={row}
                  columns={columns}
                  index={index}
                  isEven={index % 2 === 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Professional Pagination Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200/50 px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Results Info */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">
                {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, effectiveTotalCount)}
              </span>
              <span className="mx-1">of</span>
              <span className="font-medium text-gray-900">
                {effectiveTotalCount.toLocaleString()}
              </span>
              <span className="ml-1">rows</span>
            </div>
            
            {hasFilters && (
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-blue-700">Filtered</span>
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((pageNum) => (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => handlePageChange(pageNum)}
                  className={`
                    inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm
                    ${currentPage === pageNum
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
                    }
                  `}
                >
                  {pageNum + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          
          {/* Page Info */}
          <div className="text-sm text-gray-600">
            Page <span className="font-medium text-gray-900">{currentPage + 1}</span> of{' '}
            <span className="font-medium text-gray-900">{totalPages}</span>
          </div>
        </div>
        
        {/* Enhanced Cache Progress */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Cache Performance</span>
            </div>
            <span className="font-mono">
              {cacheInfo.loadedChunks}/{cacheInfo.totalChunks} chunks loaded
            </span>
          </div>
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ 
                width: `${cacheInfo.totalChunks > 0 ? (cacheInfo.loadedChunks / cacheInfo.totalChunks) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Memory Efficient</span>
            <span>{Math.round(cacheInfo.totalChunks > 0 ? (cacheInfo.loadedChunks / cacheInfo.totalChunks) * 100 : 0)}% Cached</span>
          </div>
        </div>
      </div>
    </div>
  );
};
