'use client';

import React, { useEffect, useState } from 'react';
import { FilterDropdown } from '@/components/Filters/FilterDropdown';
import { DataTable } from '@/components/DataTable/DataTable';
import { useFilterContext } from '@/context/FilterContext';
import { getColumnConfigs } from '@/utils/dataProcessing';
import { generateMockData } from '@/utils/csvParser';

// Simple SVG Icon Components
const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FunnelIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const DocumentArrowDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Cog6ToothIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const InformationCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export const Dashboard: React.FC = () => {
  const { state, dispatch } = useFilterContext();
  const { data, filteredData, loading, error, filters } = state; // Remove hasActiveFilters from destructuring
  const [enableVirtualScroll, setEnableVirtualScroll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [datasetSize, setDatasetSize] = useState<'small' | 'medium' | 'large'>('small');

  // Calculate hasActiveFilters as a derived value
  const hasActiveFilters = Object.values(filters).some(values => values.length > 0);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const mockData = generateMockData(1000);
        dispatch({ type: 'SET_DATA', payload: mockData });
      } catch (err) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: err instanceof Error ? err.message : 'Failed to load data' 
        });
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

  const handleLoadDataset = (size: 'small' | 'medium' | 'large') => {
    dispatch({ type: 'SET_LOADING', payload: true });
    setDatasetSize(size);
    
    const sizes = {
      small: 1000,
      medium: 10000,
      large: 50000
    };
    
    setTimeout(() => {
      const newData = generateMockData(sizes[size]);
      dispatch({ type: 'SET_DATA', payload: newData });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      if (size === 'large') {
        setEnableVirtualScroll(true);
      }
    }, 100);
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
    a.download = 'dashboard-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getFilterEfficiency = () => {
    if (data.length === 0) return 0;
    return Math.round((filteredData.length / data.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900">Loading Dashboard</h3>
            <p className="text-gray-600 mt-2">Preparing your data visualization...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto border border-red-100">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Error Loading Data</h3>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Enhanced Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Business Intelligence Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                  <InformationCircleIcon className="h-4 w-4 mr-1" />
                  Interactive filtering and data visualization
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Dataset Size Selector */}
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleLoadDataset(size)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 shadow-sm ${
                      datasetSize === size
                        ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-md scale-105'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
              {/* Export Button */}
              <button
                onClick={exportData}
                className="btn-primary flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Export CSV
              </button>
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearAllFilters}
                  className="btn-secondary flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Clear Filters
                </button>
              )}
              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Stats Bar */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card style for stats */}
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Records</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{data.length.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <EyeIcon className="h-4 w-4 text-green-600 dark:text-green-300" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Visible Records</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{filteredData.length.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <FunnelIcon className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Filters</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Object.values(filters).filter(f => f.length > 0).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter Efficiency</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{getFilterEfficiency()}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="card overflow-hidden">
              {/* Filter Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FunnelIcon className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">Smart Filters</h2>
                  </div>
                  {hasActiveFilters && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                      {Object.values(filters).filter(f => f.length > 0).length} Active
                    </span>
                  )}
                </div>
              </div>
              {/* Filter Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {filterableColumns.map((column) => (
                    <div key={column.key} className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-indigo-400 opacity-30"></div>
                      <FilterDropdown
                        column={column.key}
                        label={column.label}
                      />
                    </div>
                  ))}
                </div>
                {/* Enhanced Filter Summary */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Filter Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Total Records:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{data.length.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Filtered Records:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{filteredData.length.toLocaleString()}</span>
                    </div>
                    {hasActiveFilters && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Efficiency:</span>
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{getFilterEfficiency()}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getFilterEfficiency()}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Enhanced Data Table */}
          <div className="lg:col-span-3">
            <div className="card overflow-hidden">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 px-6 py-4 border-b border-gray-200/50 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ChartBarIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Visualization</h2>
                  </div>
                  <div className="flex items-center space-x-6">
                    {/* Virtual Scroll Toggle */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableVirtualScroll}
                        onChange={(e) => setEnableVirtualScroll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded transition-colors"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Virtual Scroll</span>
                    </label>
                    {/* Row Count Badge */}
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {filteredData.length.toLocaleString()} rows
                    </div>
                  </div>
                </div>
              </div>
              {/* Table Content */}
              <div className="relative">
                {filteredData.length === 0 && hasActiveFilters ? (
                  <div className="text-center py-16">
                    <FunnelIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No matching records</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">Try adjusting your filters to see more data.</p>
                    <button
                      onClick={handleClearAllFilters}
                      className="btn-primary mt-4"
                    >
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
      </div>
      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-300" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Performance Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="performance"
                      checked={!enableVirtualScroll}
                      onChange={() => setEnableVirtualScroll(false)}
                      className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Standard (Better UX)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="performance"
                      checked={enableVirtualScroll}
                      onChange={() => setEnableVirtualScroll(true)}
                      className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Virtual Scroll (Better Performance)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
