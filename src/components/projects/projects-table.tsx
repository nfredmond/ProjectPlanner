'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { ProjectStatus } from '@/types';

interface ProjectItem {
  id: string;
  title: string;
  status: ProjectStatus;
  primary_category?: string;
  cost_estimate?: number;
  created_at: string;
  score_total?: number;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

interface ProjectsTableProps {
  projects: ProjectItem[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export default function ProjectsTable({
  projects,
  currentPage,
  totalPages,
  totalCount,
  limit,
}: ProjectsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Function to create a new URL with updated search params
  const createQueryString = (
    params: Record<string, string | null>
  ) => {
    const newSearchParams = searchParams 
      ? new URLSearchParams(searchParams.toString()) 
      : new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });
    
    return newSearchParams.toString();
  };

  // Function to handle page change
  const handlePageChange = (page: number) => {
    router.push(`${pathname}?${createQueryString({ page: page.toString() })}`);
  };

  // Function to handle sort change
  const handleSortChange = (column: string) => {
    const currentSortBy = searchParams?.get('sort_by') || 'created_at';
    const currentSortDir = searchParams?.get('sort_dir') || 'desc';
    
    const newSortDir = currentSortBy === column && currentSortDir === 'asc' ? 'desc' : 'asc';
    
    router.push(
      `${pathname}?${createQueryString({
        sort_by: column,
        sort_dir: newSortDir,
      })}`
    );
  };

  // Function to get status badge styling
  const getStatusBadgeStyle = (status: ProjectStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-indigo-100 text-indigo-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get current sort indicators
  const currentSortBy = searchParams?.get('sort_by') || 'created_at';
  const currentSortDir = searchParams?.get('sort_dir') || 'desc';

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('title')}
              >
                <div className="flex items-center">
                  Project
                  {currentSortBy === 'title' && (
                    <span className="ml-1">
                      {currentSortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('cost_estimate')}
              >
                <div className="flex items-center">
                  Cost
                  {currentSortBy === 'cost_estimate' && (
                    <span className="ml-1">
                      {currentSortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('score_total')}
              >
                <div className="flex items-center">
                  Score
                  {currentSortBy === 'score_total' && (
                    <span className="ml-1">
                      {currentSortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('created_at')}
              >
                <div className="flex items-center">
                  Created
                  {currentSortBy === 'created_at' && (
                    <span className="ml-1">
                      {currentSortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created By
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.length > 0 ? (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-rtpa-blue-600 hover:text-rtpa-blue-900 font-medium"
                    >
                      {project.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(
                        project.status
                      )}`}
                    >
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {project.primary_category || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {project.cost_estimate
                      ? `$${project.cost_estimate.toLocaleString()}`
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {project.score_total ? (
                      <div className="flex items-center">
                        <div className="mr-2 w-16 bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-rtpa-blue-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(100, (project.score_total / 5) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-900">{project.score_total.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not scored</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {formatDate(project.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {project.profiles?.first_name
                      ? `${project.profiles.first_name} ${project.profiles.last_name || ''}`
                      : 'Unknown'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No projects found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.min((currentPage - 1) * limit + 1, totalCount)}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * limit, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> projects
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">First page</span>
                  <ChevronDoubleLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to show pages around the current page
                  let pageNum = currentPage;
                  if (currentPage < 3) {
                    pageNum = i + 1;
                  } else if (currentPage > totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  // Ensure page number is in valid range
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-rtpa-blue-50 border-rtpa-blue-500 text-rtpa-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    currentPage >= totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage >= totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Last page</span>
                  <ChevronDoubleRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
          
          {/* Mobile pagination controls */}
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <p className="text-sm text-gray-700 flex items-center">
              <span>Page {currentPage} of {totalPages}</span>
            </p>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage >= totalPages
                  ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
