'use client';

import React from 'react';
import { DataRow, ColumnConfig } from '@/types';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';

interface VirtualScrollProps {
  data: DataRow[];
  columns: ColumnConfig[];
  itemHeight?: number;
  containerHeight?: number;
}

export const VirtualScroll: React.FC<VirtualScrollProps> = ({
  data,
  columns,
  itemHeight = 50,
  containerHeight = 400,
}) => {
  const {
    virtualState,
    handleScroll,
    getItemStyle,
    containerStyle,
    contentStyle,
  } = useVirtualScroll(data.length, itemHeight, containerHeight);

  const visibleItems = data.slice(virtualState.startIndex, virtualState.endIndex + 1);

  return (
    <div style={containerStyle} onScroll={handleScroll} className="border border-gray-300">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-300">
        <div className="flex">
          {columns.map((column) => (
            <div
              key={column.key}
              className="flex-1 px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300 last:border-r-0"
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual content */}
      <div style={contentStyle}>
        {visibleItems.map((row, index) => {
          const actualIndex = virtualState.startIndex + index;
          return (
            <div
              key={actualIndex}
              style={getItemStyle(actualIndex)}
              className="flex border-b border-gray-200 hover:bg-gray-50"
            >
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="flex-1 px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 truncate"
                >
                  {String(row[column.key])}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
