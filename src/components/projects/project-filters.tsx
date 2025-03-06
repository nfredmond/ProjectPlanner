'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { ProjectStatus } from '@/types';

interface ProjectFiltersProps {
  statusFilters: string[];
  categoryFilters: string[];
  availableCategories: string[];
  searchQuery: string;
}

export default function ProjectFilters({
  statusFilters,
  categoryFilters,
  availableCategories,
  searchQuery,
}: ProjectFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState(searchQuery);
  const [status, setStatus] = useState<string[]>(statusFilters);
  const [categories, setCategories] = useState<string[]>(categoryFilters);

  // Update state when props change (e.g., when navigating back)
  useEffect(() => {
    setQuery(searchQuery);
    setStatus(statusFilters);
    setCategories(categoryFilters);
  }, [searchQuery, statusFilters, categoryFilters]);

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
    params: Record<string, string | string[] | null>
  ) => {
    const newSearchParams = searchParams 
      ? new URLSearchParams(searchParams.toString()) 
      : new URLSearchParams();
    
    // Reset pagination when filters change
    newSearchParams.delete('page');
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || (Array.isArray(value) && value.length === 0)) {
        newSearchParams.delete(key);
      } else if (Array.isArray(value)) {
        newSearchParams.delete(key);
        value.forEach(val => newSearchParams.append(key, val));
      } else {
        newSearchParams.set(key, value);
      }
    });
    
    return newSearchParams.toString();
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pathname) {
      router.push(`${pathname}?${createQueryString({ q: query || null })}`);
    }
  };

  // Toggle status filter
  const toggleStatus = (selectedStatus: ProjectStatus) => {
    const newStatus = status.includes(selectedStatus)
      ? status.filter(s => s !== selectedStatus)
      : [...status, selectedStatus];
    
    setStatus(newStatus);
    
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
    
    if (pathname) {
      router.push(`${pathname}?${createQueryString({ category: newCategories })}`);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setStatus([]);
    setCategories([]);
    setQuery('');
    
    if (pathname) {
      router.push(pathname);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        {/* Search input */}
        <div className="flex-1">
          <form onSubmit={handleSearch} className="relative flex">
            <input
              type="text"
              placeholder="Search projects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500 sm:text-sm"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
            >
              <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
        
        {/* Filter toggle button */}
        <div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border ${
              (status.length > 0 || categories.length > 0)
                ? 'border-rtpa-blue-300 text-rtpa-blue-700 bg-rtpa-blue-50'
                : 'border-gray-300 text-gray-700 bg-white'
            } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500`}
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Filters
            {(status.length > 0 || categories.length > 0) && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rtpa-blue-100 text-rtpa-blue-800">
                {status.length + categories.length}
              </span>
            )}
          </button>
        </div>
        
        {/* Clear filters */}
        {(status.length > 0 || categories.length > 0 || query) && (
          <div>
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
            >
              <XMarkIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      {/* Expanded filter options */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-4">
            {/* Status filters */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
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
                <h3 className="text-sm font-medium text-gray-700 mb-2">Category</h3>
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
          </div>
        </div>
      )}
    </div>
  );
}
