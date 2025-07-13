'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FilterOption } from '@/types';
import debounce from 'lodash.debounce';

interface MultiSelectFilterProps {
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  maxHeight?: number;
}

// Virtual scrolling constants
const ITEM_HEIGHT = 36; // Height of each option item
const BUFFER_SIZE = 10; // Number of items to render above/below visible area

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = 'Select options...',
  searchable = true,
  disabled = false,
  maxHeight = 300,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [scrollTop, setScrollTop] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = debounce((term: string) => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(term.toLowerCase()) ||
      option.value.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, 150);

  useEffect(() => {
    if (searchable) {
      debouncedSearch(searchTerm);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options, searchable, debouncedSearch]);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchable]);

  // Virtual scrolling calculations
  const virtualScrollData = useMemo(() => {
    const visibleHeight = maxHeight;
    const visibleCount = Math.ceil(visibleHeight / ITEM_HEIGHT);
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      filteredOptions.length,
      Math.ceil(scrollTop / ITEM_HEIGHT) + visibleCount + BUFFER_SIZE
    );
    
    const visibleOptions = filteredOptions.slice(startIndex, endIndex);
    const totalHeight = filteredOptions.length * ITEM_HEIGHT;
    const offsetY = startIndex * ITEM_HEIGHT;
    
    return {
      visibleOptions,
      totalHeight,
      offsetY,
      startIndex,
      endIndex
    };
  }, [filteredOptions, scrollTop, maxHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const handleToggleOption = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    onSelectionChange(newSelection);
  };



  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredOptions(options);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} selected`;
  };

  // Performance optimization for large datasets
  const isLargeDataset = filteredOptions.length > 1000;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
          ${selectedValues.length > 0 ? 'text-gray-900' : 'text-gray-500'}
        `}
      >
        <span className="block truncate">{getDisplayText()}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search Input - Always visible in dropdown */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          </div>



          {/* Options List with Virtual Scrolling */}
          <div
            ref={scrollContainerRef}
            className="overflow-y-auto"
            style={{ maxHeight }}
            onScroll={handleScroll}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
            ) : isLargeDataset ? (
              // Virtual scrolling for large datasets
              <div style={{ height: virtualScrollData.totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${virtualScrollData.offsetY}px)` }}>
                  {virtualScrollData.visibleOptions.map((option, index) => (
                    <label
                      key={`${option.value}-${virtualScrollData.startIndex + index}`}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      style={{ height: ITEM_HEIGHT }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(option.value)}
                        onChange={() => handleToggleOption(option.value)}
                        className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="flex-1 text-sm text-gray-900 truncate">
                        {option.label}
                      </span>
                      {option.count !== undefined && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          ({option.count})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              // Regular rendering for smaller datasets
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleToggleOption(option.value)}
                    className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="flex-1 text-sm text-gray-900">
                    {option.label}
                  </span>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({option.count})
                    </span>
                  )}
                </label>
              ))
            )}
          </div>

          {/* Dataset size indicator */}
          {isLargeDataset && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
              Showing {filteredOptions.length.toLocaleString()} options
            </div>
          )}
        </div>
      )}
    </div>
  );
};
