'use client';

import React from 'react';
import Link from 'next/link';
import { ProjectStatus } from '@/types';

interface CommunityFeaturedProjectsProps {
  projects: {
    id: string;
    title: string;
    description?: string;
    status: ProjectStatus;
    primary_category?: string;
    score_total?: number;
  }[];
}

export default function CommunityFeaturedProjects({ projects }: CommunityFeaturedProjectsProps) {
  // Status colors for badges
  const getStatusColor = (status: string) => {
    switch (status) {
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
  
  // Truncate description to a certain length
  const truncateDescription = (text?: string, maxLength = 150) => {
    if (!text) return 'No description available.';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.length > 0 ? (
        projects.map((project) => (
          <div
            key={project.id}
            className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {project.title}
                  </h3>
                  {project.primary_category && (
                    <p className="text-sm text-gray-500">
                      {project.primary_category}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    project.status
                  )}`}
                >
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-600 line-clamp-3">
                  {truncateDescription(project.description)}
                </p>
              </div>
              
              {project.score_total !== undefined && (
                <div className="mt-4 flex items-center">
                  <div className="text-sm font-medium text-gray-500 mr-2">Score:</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-rtpa-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (project.score_total / 5) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="ml-2 text-sm font-medium text-gray-700">
                    {project.score_total.toFixed(1)}/5
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <Link
                  href={`/community/projects/${project.id}`}
                  className="inline-flex items-center text-sm font-medium text-rtpa-blue-600 hover:text-rtpa-blue-800"
                >
                  View Details
                  <svg
                    className="ml-1 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <Link
                  href={`/community/feedback/new?project=${project.id}`}
                  className="inline-flex items-center text-sm font-medium text-rtpa-green-600 hover:text-rtpa-green-800"
                >
                  <svg
                    className="mr-1 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Provide Feedback
                </Link>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-3 bg-white rounded-lg shadow-md p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No featured projects yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back soon for updates on new transportation projects in your community.
          </p>
        </div>
      )}
    </div>
  );
}
