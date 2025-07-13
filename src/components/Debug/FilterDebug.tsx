'use client';

import React, { useEffect, useState } from 'react';
import { useChunkedData } from '@/context/ChunkedDataContext';

export const FilterDebug: React.FC = () => {
  const { state, getFilterOptions } = useChunkedData();
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      const columns = ['id', 'number', 'mod3', 'mod4', 'mod5', 'category', 'status'];
      const filterOptions: { [key: string]: string[] } = {};
      
      columns.forEach(column => {
        filterOptions[column] = getFilterOptions(column);
      });

      setDebugInfo({
        dataGenerator: !!state.dataGenerator,
        filterManager: !!state.filterManager,
        totalCount: state.totalCount,
        loadedChunks: state.cacheInfo.loadedChunks,
        totalChunks: state.cacheInfo.totalChunks,
        filterOptions,
        filters: state.filters,
        filteredCount: state.filteredCount,
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [state, getFilterOptions]);

  if (!state.dataGenerator) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Filter Debug Info</h3>
      <div className="space-y-1">
        <div>Data Generator: {debugInfo.dataGenerator ? '✅' : '❌'}</div>
        <div>Filter Manager: {debugInfo.filterManager ? '✅' : '❌'}</div>
        <div>Total Count: {String(debugInfo.totalCount || 0)}</div>
        <div>Loaded Chunks: {String(debugInfo.loadedChunks || 0)}/{String(debugInfo.totalChunks || 0)}</div>
        <div>Filtered Count: {String(debugInfo.filteredCount || 0)}</div>
        <div className="mt-2">
          <strong>Filter Options:</strong>
          {Object.entries(debugInfo.filterOptions || {}).map(([column, options]) => (
            <div key={column} className="ml-2">
              {column}: {Array.isArray(options) ? options.length : 0} options
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}; 