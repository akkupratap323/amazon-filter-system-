'use client';

import React, { useMemo, memo } from 'react';
import { DataRow, ColumnConfig } from '@/types';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';

interface VirtualScrollProps {
  data: DataRow[];
  columns: ColumnConfig[];
  itemHeight?: number;
  containerHeight?: number;
}

// Memoized row component for better performance
const VirtualRow = memo<{
  row: DataRow;
  columns: ColumnConfig[];
  style: React.CSSProperties;
}>(({ row, columns, style }) => (
  <div
    style={style}
    className="absolute left-0 right-0 border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-150"
  >
    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
      {columns.map((column, colIndex) => (
        <div
          key={column.key}
          className={`text-sm text-gray-900 truncate ${
            colIndex === 0 ? 'col-span-2' : 'col-span-2'
          }`}
        >
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
      ))}
    </div>
  </div>
));

VirtualRow.displayName = 'VirtualRow';

export const VirtualScroll: React.FC<VirtualScrollProps> = ({
  data,
  columns,
  itemHeight = 60,
  containerHeight = 600,
}) => {
  const {
    virtualState,
    handleScroll,
    getItemStyle,
    containerStyle,
    contentStyle,
    scrollRef,
    isNearTop,
    isNearBottom,
  } = useVirtualScroll(data.length, itemHeight, containerHeight);

  const visibleItems = useMemo(() => {
    return data.slice(virtualState.startIndex, virtualState.endIndex + 1);
  }, [data, virtualState.startIndex, virtualState.endIndex]);

  // Optimize column layout for better performance
  const columnLayout = useMemo(() => {
    return columns.map((column, index) => ({
      ...column,
      className: index === 0 ? 'col-span-2' : 'col-span-2'
    }));
  }, [columns]);

  return (
    <div className="relative">
      {/* Virtual Scroll Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4">
          {columnLayout.map((column) => (
            <div
              key={column.key}
              className={`text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${column.className}`}
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Content Container */}
      <div 
        ref={scrollRef}
        style={containerStyle} 
        onScroll={handleScroll} 
        className="overflow-auto border border-gray-200 bg-white"
      >
        <div style={contentStyle} className="relative">
          {visibleItems.map((row, index) => {
            const actualIndex = virtualState.startIndex + index;
            return (
              <VirtualRow
                key={`${row.id || actualIndex}`}
                row={row}
                columns={columns}
                style={getItemStyle(actualIndex)}
              />
            );
          })}
        </div>
      </div>

      {/* Virtual Scroll Footer with Performance Info */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing rows {virtualState.startIndex + 1} - {Math.min(virtualState.endIndex + 1, data.length)}
          </span>
          <div className="flex items-center space-x-4">
            <span>
              Total: {data.length.toLocaleString()} rows
            </span>
            <span className="text-xs text-gray-500">
              {virtualState.visibleItems} visible
            </span>
            {isNearTop && (
              <span className="text-xs text-green-600">Near top</span>
            )}
            {isNearBottom && (
              <span className="text-xs text-green-600">Near bottom</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
