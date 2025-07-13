'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ColumnConfig } from '@/types';

import { DataRow } from '@/types';

interface ChunkedDataTableProps {
  data: DataRow[];
  columns: ColumnConfig[];
  chunkSize?: number;
  containerHeight?: number;
}

export const ChunkedDataTable: React.FC<ChunkedDataTableProps> = ({
  data,
  columns,
  chunkSize = 100,
  containerHeight = 600
}) => {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total chunks
  const totalChunks = Math.ceil(data.length / chunkSize);
  const totalPages = totalChunks;

  // Get current chunk data
  const currentChunkData = useMemo(() => {
    const startIndex = currentChunk * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize, data.length);
    return data.slice(startIndex, endIndex);
  }, [data, currentChunk, chunkSize]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    setIsLoading(true);
    setCurrentChunk(page);
    // Simulate loading delay for smooth UX
    setTimeout(() => setIsLoading(false), 50);
  }, []);

  const goToNextPage = useCallback(() => {
    if (currentChunk < totalChunks - 1) {
      goToPage(currentChunk + 1);
    }
  }, [currentChunk, totalChunks, goToPage]);

  const goToPrevPage = useCallback(() => {
    if (currentChunk > 0) {
      goToPage(currentChunk - 1);
    }
  }, [currentChunk, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(0);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(totalChunks - 1);
  }, [totalChunks, goToPage]);

  // Calculate pagination info
  const startIndex = currentChunk * chunkSize + 1;
  const endIndex = Math.min((currentChunk + 1) * chunkSize, data.length);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);
      
      if (currentChunk > 3) {
        pages.push(-1); // Ellipsis
      }
      
      // Show pages around current page
      const start = Math.max(1, currentChunk - 1);
      const end = Math.min(totalPages - 2, currentChunk + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentChunk < totalPages - 4) {
        pages.push(-1); // Ellipsis
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Table Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-12 gap-4 px-6 py-4">
          {columns.map((column) => (
            <div
              key={column.key}
              className={`font-semibold text-sm text-gray-900 dark:text-gray-100 ${
                column.width ? `col-span-${column.width}` : 'col-span-1'
              }`}
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>

      {/* Table Body */}
      <div 
        className="flex-1 overflow-auto"
        style={{ height: containerHeight - 120 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentChunkData.map((row, index) => (
              <div
                key={row.id || index}
                className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={`text-sm text-gray-900 dark:text-gray-100 ${
                      column.width ? `col-span-${column.width}` : 'col-span-1'
                    }`}
                  >
                    {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page Info */}
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startIndex.toLocaleString()} to {endIndex.toLocaleString()} of {data.length.toLocaleString()} results
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center space-x-2">
            {/* First Page */}
            <button
              onClick={goToFirstPage}
              disabled={currentChunk === 0}
              className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>

            {/* Previous Page */}
            <button
              onClick={goToPrevPage}
              disabled={currentChunk === 0}
              className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === -1 ? (
                    <span className="px-3 py-1 text-sm text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        currentChunk === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page + 1}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Next Page */}
            <button
              onClick={goToNextPage}
              disabled={currentChunk === totalChunks - 1}
              className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>

            {/* Last Page */}
            <button
              onClick={goToLastPage}
              disabled={currentChunk === totalChunks - 1}
              className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>

        {/* Chunk Info */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Chunk {currentChunk + 1} of {totalChunks} • {chunkSize} records per chunk • 
          <span className="text-green-600 dark:text-green-400 ml-1">⚡ Instant filtering</span>
        </div>
      </div>
    </div>
  );
}; 