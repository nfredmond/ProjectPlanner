import React from 'react';
import { ProjectStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FiltersProps {
  statusFilter: string[];
  categoryFilter: string[];
  availableCategories: string[];
  toggleStatus: (status: ProjectStatus) => void;
  toggleCategory: (category: string) => void;
}

const Filters: React.FC<FiltersProps> = ({
  statusFilter,
  categoryFilter,
  availableCategories,
  toggleStatus,
  toggleCategory,
}) => {
  const statusOptions: { value: ProjectStatus; label: string; color: string }[] = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'planned', label: 'Planned', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Status</h3>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => toggleStatus(status.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                statusFilter.includes(status.value)
                  ? status.color
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Categories</h3>
        {availableCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  categoryFilter.includes(category)
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No categories available</p>
        )}
      </div>

      {(statusFilter.length > 0 || categoryFilter.length > 0) && (
        <div className="pt-2">
          <h3 className="text-sm font-medium mb-2">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            {statusFilter.map((status) => (
              <Badge key={`status-${status}`} variant="secondary" className="flex items-center">
                Status: {status}
                <button
                  onClick={() => toggleStatus(status as ProjectStatus)}
                  className="ml-1 rounded-full hover:bg-gray-200"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {categoryFilter.map((category) => (
              <Badge key={`category-${category}`} variant="secondary" className="flex items-center">
                Category: {category}
                <button
                  onClick={() => toggleCategory(category)}
                  className="ml-1 rounded-full hover:bg-gray-200"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters; 