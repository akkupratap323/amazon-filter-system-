'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface PerformanceMetrics {
  dataLoadTime: number;
  filterTime: number;
  renderTime: number;
  memoryUsage: number;
  fps: number;
}

interface PerformanceMonitorProps {
  dataSize: number;
  filteredSize: number;
  isVirtualScrollEnabled: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  dataSize,
  filteredSize,
  isVirtualScrollEnabled,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    dataLoadTime: 0,
    filterTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    fps: 60,
  });

  const [isVisible, setIsVisible] = useState(false);

  // Calculate performance score
  const performanceScore = useMemo(() => {
    const baseScore = 100;
    let deductions = 0;

    // Deduct points for slow operations
    if (metrics.dataLoadTime > 1000) deductions += 20;
    if (metrics.filterTime > 500) deductions += 15;
    if (metrics.renderTime > 100) deductions += 10;
    if (metrics.fps < 30) deductions += 25;

    // Bonus for virtual scroll
    if (isVirtualScrollEnabled && dataSize > 10000) {
      deductions = Math.max(0, deductions - 10);
    }

    return Math.max(0, baseScore - deductions);
  }, [metrics, isVirtualScrollEnabled, dataSize]);

  // Monitor FPS
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Monitor memory usage
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
        const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0; // MB
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 2000);
    updateMemoryUsage();

    return () => clearInterval(interval);
  }, []);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Show Performance Monitor"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-2xl p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Performance Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Performance Score</span>
          <span className={`text-lg font-bold ${getPerformanceColor(performanceScore)}`}>
            {performanceScore}/100
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {getPerformanceLabel(performanceScore)} • {dataSize.toLocaleString()} rows
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">FPS</div>
          <div className={`text-lg font-bold ${metrics.fps >= 30 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.fps}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Memory</div>
          <div className="text-lg font-bold text-blue-600">
            {metrics.memoryUsage}MB
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Load Time</div>
          <div className="text-lg font-bold text-purple-600">
            {metrics.dataLoadTime}ms
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Filter Time</div>
          <div className="text-lg font-bold text-orange-600">
            {metrics.filterTime}ms
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Virtual Scroll</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isVirtualScrollEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isVirtualScrollEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Data Size</span>
          <span className="font-medium text-gray-900">
            {filteredSize.toLocaleString()}/{dataSize.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Recommendations */}
      {performanceScore < 60 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm font-medium text-yellow-800 mb-1">Recommendations:</div>
          <ul className="text-xs text-yellow-700 space-y-1">
            {metrics.fps < 30 && <li>• Enable Virtual Scroll for better performance</li>}
            {metrics.memoryUsage > 100 && <li>• Consider reducing dataset size</li>}
            {metrics.filterTime > 500 && <li>• Optimize filter queries</li>}
          </ul>
        </div>
      )}
    </div>
  );
}; 