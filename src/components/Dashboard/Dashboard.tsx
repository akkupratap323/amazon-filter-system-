'use client';

import React, { useEffect, useState } from 'react';
import { FilterDropdown } from '@/components/Filters/FilterDropdown';
import { DataTable } from '@/components/DataTable/DataTable';
import { useFilterContext } from '@/context/FilterContext';
import { getColumnConfigs } from '@/utils/dataProcessing';
import { generateMockData } from '@/utils/csvParser';

// Simple, reliable SVG icons
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

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const Dashboard: React.FC = () => {
  const { state, dispatch } = useFilterContext();
  const { data, filteredData, loading, error, filters } = state;
  const [enableVirtualScroll, setEnableVirtualScroll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [datasetSize, setDatasetSize] = useState<'small' | 'medium' | 'large'>('small');

  // Calculate derived values
  const hasActiveFilters = Object.values(filters).some(values => values.length > 0);
  const activeFilterCount = Object.values(filters).filter(f => f.length > 0).length;
  const filterEfficiency = data.length > 0 ? Math.round((filteredData.length / data.length) * 100) : 0;

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
    a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-12 max-w-md mx-auto animate-fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-spin"></div>
              <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                <DashboardIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h3>
            <p className="text-gray-600">Preparing your business intelligence platform...</p>
            <div className="mt-4 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl border border-red-200/50 shadow-2xl rounded-3xl p-12 max-w-md mx-auto animate-fade-in">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <CloseIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">System Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <RefreshIcon className="h-4 w-4 mr-2" />
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <DashboardIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Business Intelligence
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Advanced Analytics Dashboard
                </p>
              </div>
            </div>
            
            {/* Action Controls */}
            <div className="flex items-center space-x-4">
              {/* Dataset Selector */}
              <div className="hidden md:flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/20">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleLoadDataset(size)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      datasetSize === size
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <button
                onClick={exportData}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
                disabled={filteredData.length === 0}
              >
                <DownloadIcon className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                Export Data
              </button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-xl shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 hover:bg-red-50"
                >
                  <CloseIcon className="h-4 w-4 mr-2" />
                  Clear All
                </button>
              )}

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <SettingsIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Stats Dashboard */}
      <div className="bg-white/30 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Total Records */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900">{data.length.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DatabaseIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Filtered Records */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Filtered Records</p>
                  <p className="text-3xl font-bold text-gray-900">{filteredData.length.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FilterIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Filters</p>
                  <p className="text-3xl font-bold text-gray-900">{activeFilterCount}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Filter Efficiency */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Efficiency</p>
                  <p className="text-3xl font-bold text-gray-900">{filterEfficiency}%</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUpIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Filters Sidebar */}
          <div className="lg:col-span-1 animate-slide-up">
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
              {/* Filter Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <FilterIcon className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Smart Filters</h2>
                  </div>
                  {hasActiveFilters && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-600">{activeFilterCount} Active</span>
                    </div>
                  )}
                </div>
                
                {/* Filter Progress */}
                {hasActiveFilters && (
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                      style={{ width: `${filterEfficiency}%` }}
                    ></div>
                  </div>
                )}
              </div>
              
              {/* Filter Controls */}
              <div className="space-y-6">
                {filterableColumns.map((column) => (
                  <div key={column.key} className="relative">
                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full opacity-30"></div>
                    <FilterDropdown
                      column={column.key}
                      label={column.label}
                    />
                  </div>
                ))}
              </div>

              {/* Filter Summary */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Filter Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Records:</span>
                    <span className="text-sm font-bold text-gray-900">{data.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Visible Records:</span>
                    <span className="text-sm font-bold text-gray-900">{filteredData.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Efficiency:</span>
                    <span className="text-sm font-bold text-blue-600">{filterEfficiency}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Data Table */}
          <div className="lg:col-span-3 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
              {/* Table Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                      <DashboardIcon className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Data Visualization</h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Virtual Scroll Toggle */}
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={enableVirtualScroll}
                        onChange={(e) => setEnableVirtualScroll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        Virtual Scroll
                      </span>
                    </label>
                    
                    {/* Row Count */}
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-700">
                        {filteredData.length.toLocaleString()} rows
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Table Content */}
              <div className="relative">
                {filteredData.length === 0 && hasActiveFilters ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <FilterIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No matching records found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your filters to see more data.</p>
                    <button
                      onClick={handleClearAllFilters}
                      className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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
      </div>

      {/* Enhanced Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl max-w-md w-full p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                  <SettingsIcon className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Dashboard Settings</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 p-2"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-4">
                  Performance Mode
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="performance"
                      checked={!enableVirtualScroll}
                      onChange={() => setEnableVirtualScroll(false)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">Standard Mode</span>
                      <p className="text-xs text-gray-600">Better user experience, pagination-based</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="performance"
                      checked={enableVirtualScroll}
                      onChange={() => setEnableVirtualScroll(true)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">Virtual Scroll</span>
                      <p className="text-xs text-gray-600">Better performance for large datasets</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowSettings(false)}
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 w-full"
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
