'use client';

import React, { useEffect, useState } from 'react';
import { UltraFastFilterDropdown } from '@/components/Filters/UltraFastFilterDropdown';
import { DataTable } from '@/components/DataTable/DataTable';
import { LoadingProgress } from '@/components/Dashboard/LoadingProgress';
import { useUltraFastFilter } from '@/context/UltraFastFilterContext';
import { getColumnConfigs } from '@/utils/dataProcessing';
import { generateMockData } from '@/utils/csvParser';

// Minimal SVG icons
const DashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const Dashboard: React.FC = () => {
  const { state, dispatch } = useUltraFastFilter();
  const { data, filteredData, isLoading, filters, error } = state;
  const [enableVirtualScroll, setEnableVirtualScroll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [datasetSize, setDatasetSize] = useState<'small' | 'medium' | 'large'>('small');
  const [useChunkedDisplay, setUseChunkedDisplay] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<number | undefined>();

  // Calculate metrics
  const hasActiveFilters = Object.values(filters).some((values: string[]) => values.length > 0);
  const activeFilterCount = Object.values(filters).filter((f: string[]) => f.length > 0).length;
  const currentDataLength = data.length;
  const currentFilteredLength = filteredData.length;
  const filterEfficiency = currentDataLength > 0 ? Math.round((currentFilteredLength / currentDataLength) * 100) : 0;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const mockData = await generateMockData(1000);
        dispatch({ type: 'SET_DATA', payload: mockData });
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadData();
  }, [dispatch]);

  const columns = getColumnConfigs(data);
  const filterableColumns = columns.filter(col => col.filterable);

  const handleClearAllFilters = () => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  };

  const handleLoadDataset = async (size: 'small' | 'medium' | 'large') => {
    dispatch({ type: 'SET_LOADING', payload: true });
    setDatasetSize(size);
    setLoadingProgress(0);
    setLoadingMessage('Initializing data generation...');
    setEstimatedTime(undefined);
    
    const sizes = { small: 10000, medium: 10000, large: 50000 };
    const targetSize = sizes[size];
    
    // Always use standard DataTable with horizontal scrolling for all dataset sizes
    setUseChunkedDisplay(false);
    
    try {
      // For large datasets, show progress
      if (size === 'large') {
        setEstimatedTime(8); // Estimate 8 seconds for large dataset
        
        // Simulate progress updates with more realistic progression
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000; // seconds
          const estimatedTotal = 8; // 8 seconds total
          const baseProgress = Math.min((elapsed / estimatedTotal) * 100, 95);
          
          // Add some realistic variation
          const variation = Math.sin(elapsed * 2) * 5; // ±5% variation
          const newProgress = Math.max(0, Math.min(baseProgress + variation, 95));
          
          setLoadingProgress(newProgress);
          
          // Update estimated time remaining
          const remaining = Math.max(0, estimatedTotal - elapsed);
          setEstimatedTime(Math.round(remaining));
          
          // Update messages based on progress
          if (newProgress < 25) {
            setLoadingMessage('Initializing data generation engine...');
          } else if (newProgress < 45) {
            setLoadingMessage('Generating 50,000 data records...');
          } else if (newProgress < 65) {
            setLoadingMessage('Processing data structures and indexes...');
          } else if (newProgress < 85) {
            setLoadingMessage('Optimizing for ultra-fast filtering...');
          } else {
            setLoadingMessage('Finalizing dataset and preparing display...');
          }
        }, 100);
        
        // Generate data
        const newData = await generateMockData(targetSize);
        
        // Clear interval and set to 100%
        clearInterval(progressInterval);
        setLoadingProgress(100);
        setLoadingMessage('Dataset loaded successfully!');
        
        // Small delay to show completion
        setTimeout(() => {
          dispatch({ type: 'SET_DATA', payload: newData });
          dispatch({ type: 'SET_LOADING', payload: false });
          setLoadingProgress(0);
          setLoadingMessage('');
          setEstimatedTime(undefined);
        }, 500);
      } else {
        // For small and medium datasets, show simple loading
        setLoadingMessage(`Loading ${size} dataset...`);
        const newData = await generateMockData(targetSize);
        dispatch({ type: 'SET_DATA', payload: newData });
        dispatch({ type: 'SET_LOADING', payload: false });
        setLoadingProgress(0);
        setLoadingMessage('');
      }
    } catch (err) {
      console.error('Failed to load dataset:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
      setLoadingProgress(0);
      setLoadingMessage('');
      setEstimatedTime(undefined);
    }
  };

  const exportData = () => {
    const csvContent = [
      columns.map(col => col.label).join(','),
      ...filteredData.map(row => 
        columns.map(col => row[col.key]).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    // Show progress bar for large datasets
    if (datasetSize === 'large' && loadingProgress > 0) {
      return (
        <LoadingProgress
          progress={loadingProgress}
          message={loadingMessage}
          estimatedTime={estimatedTime}
        />
      );
    }
    
    // Show simple loading for other cases
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 animate-spin">
              <DashboardIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
            <p className="text-gray-600">{loadingMessage || 'Please wait while we prepare your data...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md mx-auto">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => dispatch({ type: 'CLEAR_ALL_FILTERS' })}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <RefreshIcon className="h-4 w-4 mr-2" />
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-0 sm:h-16 space-y-4 sm:space-y-0">
            {/* Brand */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <DashboardIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Business Intelligence</h1>
                <p className="text-xs sm:text-sm text-gray-500">Analytics Dashboard</p>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Dataset Selector */}
              <div className="flex border border-gray-300 rounded-md">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleLoadDataset(size)}
                    className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium first:rounded-l-md last:rounded-r-md ${
                      datasetSize === size
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 sm:space-x-4">
                {/* Export */}
                <button
                  onClick={exportData}
                  disabled={filteredData.length === 0}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <DownloadIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Export</span>
                </button>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAllFilters}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
                  >
                    <span className="hidden sm:inline">Clear All ({activeFilterCount})</span>
                    <span className="sm:hidden">Clear ({activeFilterCount})</span>
                  </button>
                )}

                {/* Settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{currentDataLength.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-gray-500">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{currentFilteredLength.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-gray-500">Filtered Records</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{activeFilterCount}</div>
              <div className="text-xs sm:text-sm text-gray-500">Active Filters</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{filterEfficiency}%</div>
              <div className="text-xs sm:text-sm text-gray-500">Efficiency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center mb-3 sm:mb-4">
                <FilterIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2" />
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Filters</h2>
                {hasActiveFilters && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {filterableColumns.map((column) => (
                  <UltraFastFilterDropdown
                    key={column.key}
                    column={column.key}
                    label={column.label}
                  />
                ))}
              </div>

              {/* Filter Summary */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Summary</h3>
                <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{data.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visible:</span>
                    <span>{filteredData.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Efficiency:</span>
                    <span>{filterEfficiency}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white border border-gray-200 rounded-lg">
              {filteredData.length === 0 && hasActiveFilters ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <FilterIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No matching records</h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-4">Try adjusting your filters to see more data.</p>
                  <button
                    onClick={handleClearAllFilters}
                    className="inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    <RefreshIcon className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <DataTable
                  data={filteredData}
                  columns={columns}
                  enableVirtualScroll={enableVirtualScroll}
                  virtualScrollHeight={600}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">
                  Display Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="display"
                      checked={!enableVirtualScroll && !useChunkedDisplay}
                      onChange={() => {
                        setEnableVirtualScroll(false);
                        setUseChunkedDisplay(false);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Standard</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="display"
                      checked={enableVirtualScroll}
                      onChange={() => {
                        setEnableVirtualScroll(true);
                        setUseChunkedDisplay(false);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Virtual Scroll</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="display"
                      checked={useChunkedDisplay}
                      onChange={() => {
                        setEnableVirtualScroll(false);
                        setUseChunkedDisplay(true);
                      }}
                      className="mr-2"
                      disabled
                    />
                    <span className="text-sm text-gray-400">Chunked Display (Disabled)</span>
                  </label>
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
