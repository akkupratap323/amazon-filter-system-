'use client';

import React from 'react';

interface LoadingProgressProps {
  progress: number;
  message: string;
  estimatedTime?: number;
  stage?: string;
  totalRecords?: number;
  processedRecords?: number;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  progress,
  message,
  estimatedTime,
  stage = "Processing",
  totalRecords,
  processedRecords
}) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl p-8 max-w-lg w-full mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-6">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-indigo-500 animate-spin"></div>
            {/* Inner static background */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s8-1.79 8-4" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Business Intelligence Dashboard
          </h2>
          <p className="text-sm text-gray-600 font-medium mb-1">{stage}</p>
          <p className="text-sm text-gray-500">{message}</p>
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
          {/* Main Progress Bar */}
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {Math.round(progress)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
            {totalRecords && processedRecords && (
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {formatNumber(processedRecords)}
                </div>
                <div className="text-xs text-gray-500">
                  of {formatNumber(totalRecords)} records
                </div>
              </div>
            )}
            
            {estimatedTime && (
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {formatTime(estimatedTime)}
                </div>
                <div className="text-xs text-gray-500">remaining</div>
              </div>
            )}
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-center space-x-2 pt-2">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
                  style={{ 
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.4s'
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              Please wait while we process your data
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Large datasets may take several minutes to process</span>
          </div>
        </div>
      </div>
    </div>
  );
};
