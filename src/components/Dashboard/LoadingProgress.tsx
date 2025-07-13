'use client';

import React from 'react';

interface LoadingProgressProps {
  progress: number;
  message: string;
  estimatedTime?: number;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  progress,
  message,
  estimatedTime
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-12 max-w-md mx-auto animate-fade-in">
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading Large Dataset</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Progress Text */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}% Complete
            </span>
            {estimatedTime && (
              <span className="text-sm text-gray-500">
                ~{estimatedTime}s remaining
              </span>
            )}
          </div>
          
          {/* Loading Dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}; 