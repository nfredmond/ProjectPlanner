'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { XMarkIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { ProjectStatus } from '@/types';

interface MapFiltersProps {
  statusFilters: string[];
  categoryFilters: string[];
  availableCategories: string[];
  minScore?: number;
  maxScore?: number;
}

export default function MapFilters({
  statusFilters,
  categoryFilters,
  availableCategories,
  minScore,
  maxScore,
}: MapFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string[]>(statusFilters);
  const [categories, setCategories] = useState<string[]>(categoryFilters);
  const [scoreRange, setScoreRange] = useState<[number, number]>([
    minScore || 0,
    maxScore || 5,
  ]);

  // Update state when props change (e.g., when navigating back)
  useEffect(() => {
    setStatus(statusFilters);
    setCategories(categoryFilters);
    setScoreRange([minScore || 0, maxScore || 5]);
  }, [statusFilters, categoryFilters, minScore, maxScore]);

  // All available statuses
  const allStatuses: ProjectStatus[] = ['draft', 'planned', 'active', 'completed', 'cancelled'];

  // Status display names and colors
  const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    planned: { label: 'Planned', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    active: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-300' },
    completed: { label: 'Completed', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
  };

  // Create URL with updated search params
  const createQueryString = (
    params: Record<string, string | string[] | number | null>
  ) => {
    const newSearchParams = searchParams 
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || (Array.isArray(value) && value.length === 0)) {
        newSearchParams.delete(key);
      } else if (Array.isArray(value)) {
        newSearchParams.delete(key);
        value.forEach((val) => {
          newSearchParams.append(key, val);
        });
      } else {
        newSearchParams.set(key, String(value));
      }
    });
    
    return newSearchParams.toString();
  };

  // Toggle status filter
  const toggleStatus = (selectedStatus: ProjectStatus) => {
    const newStatus = status.includes(selectedStatus)
      ? status.filter(s => s !== selectedStatus)
      : [...status, selectedStatus];
    
    setStatus(newStatus);
    
    // Update URL with new status filter
    if (pathname) {
      router.push(`${pathname}?${createQueryString({ status: newStatus })}`);
    }
  };

  // Toggle category filter
  const toggleCategory = (selectedCategory: string) => {
    const newCategories = categories.includes(selectedCategory)
      ? categories.filter(c => c !== selectedCategory)
      : [...categories, selectedCategory];
    
    setCategories(newCategories);
    
    // Update URL with new category filter
    if (pathname) {
      router.push(`${pathname}?${createQueryString({ category: newCategories })}`);
    }
  };

  // Update score range
  const handleScoreRangeChange = (
    type: 'min' | 'max',
    value: number
  ) => {
    let newRange: [number, number];
    
    if (type === 'min') {
      newRange = [value, scoreRange[1]];
    } else {
      newRange = [scoreRange[0], value];
    }
    
    setScoreRange(newRange);
  };

  // Apply score range filter
  const applyScoreRange = () => {
    // Update URL with score range
    if (pathname) {
      router.push(
        `${pathname}?${createQueryString({
          min_score: scoreRange[0],
          max_score: scoreRange[1],
        })}`
      );
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setStatus([]);
    setCategories([]);
    setScoreRange([0, 5]);
    
    // Navigate to current path without query params
    if (pathname) {
      router.push(pathname);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-gray-500" />
          Filters
        </h3>
        
        {(status.length > 0 || categories.length > 0 || scoreRange[0] > 0 || scoreRange[1] < 5) && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-rtpa-blue-600 hover:text-rtpa-blue-800"
          >
            Clear all
          </button>
        )}
      </div>
      
      {/* Status filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Project Status</h4>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map((statusOption) => (
            <button
              key={statusOption}
              onClick={() => toggleStatus(statusOption)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                status.includes(statusOption)
                  ? statusConfig[statusOption].color
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {statusConfig[statusOption].label}
              {status.includes(statusOption) && (
                <XMarkIcon className="ml-1.5 h-3 w-3" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Category filters */}
      {availableCategories.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Project Category</h4>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((categoryOption) => (
              <button
                key={categoryOption}
                onClick={() => toggleCategory(categoryOption)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  categories.includes(categoryOption)
                    ? 'bg-rtpa-green-100 text-rtpa-green-800 border-rtpa-green-300'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {categoryOption}
                {categories.includes(categoryOption) && (
                  <XMarkIcon className="ml-1.5 h-3 w-3" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Score range filter */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-700">Project Score</h4>
          <div className="text-sm text-gray-500">
            {scoreRange[0]} - {scoreRange[1]}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="min-score" className="block text-xs text-gray-500 mb-1">
              Minimum Score
            </label>
            <input
              type="range"
              id="min-score"
              min="0"
              max="5"
              step="0.5"
              value={scoreRange[0]}
              onChange={(e) => handleScoreRangeChange('min', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label htmlFor="max-score" className="block text-xs text-gray-500 mb-1">
              Maximum Score
            </label>
            <input
              type="range"
              id="max-score"
              min="0"
              max="5"
              step="0.5"
              value={scoreRange[1]}
              onChange={(e) => handleScoreRangeChange('max', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <button
            onClick={applyScoreRange}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Apply Score Filter
          </button>
        </div>
      </div>
      
      {/* Display filtered projects count */}
      <div className="border-t pt-4">
        <div className="text-sm text-gray-500">
          Showing projects that match your filters. Click on markers to view project details.
        </div>
      </div>
    </div>
  );
}
