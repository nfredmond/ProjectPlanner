'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  UserCircleIcon,
  ClockIcon,
  DocumentChartBarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface ProjectDetailSidebarProps {
  project: any;
  scores: any[];
}

export default function ProjectDetailSidebar({ project, scores }: ProjectDetailSidebarProps) {
  // Calculate average score
  const avgScore = scores?.length
    ? scores.reduce((sum, score) => sum + Number(score.score_value || 0), 0) / scores.length
    : 0;
  
  // Format dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className="space-y-6">
      {/* Project Score */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="bg-rtpa-blue-50 px-6 py-4 border-b border-rtpa-blue-100">
          <h3 className="text-lg font-medium text-rtpa-blue-800 flex items-center">
            <StarIcon className="h-5 w-5 mr-2" />
            Project Score
          </h3>
        </div>
        <div className="p-6">
          {scores?.length > 0 ? (
            <div className="text-center">
              <div className="text-4xl font-bold text-rtpa-blue-600">
                {avgScore.toFixed(1)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Average of {scores.length} criteria
              </p>
              
              <div className="mt-4 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-rtpa-blue-600 h-2.5 rounded-full"
                  style={{ width: `${Math.min(100, (avgScore / 5) * 100)}%` }}
                ></div>
              </div>
              
              <Link
                href="#scoring"
                onClick={(e) => {
                  e.preventDefault();
                  const button = document.querySelector('button[aria-label="Scoring & Prioritization"]');
                  if (button instanceof HTMLElement) {
                    button.click();
                  }
                }}
                className="mt-4 inline-block text-sm text-rtpa-blue-600 hover:text-rtpa-blue-800"
              >
                View detailed scoring →
              </Link>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>This project has not been scored yet.</p>
              <Link
                href="#scoring"
                onClick={(e) => {
                  e.preventDefault();
                  const button = document.querySelector('button[aria-label="Scoring & Prioritization"]');
                  if (button instanceof HTMLElement) {
                    button.click();
                  }
                }}
                className="mt-2 inline-block text-sm text-rtpa-blue-600 hover:text-rtpa-blue-800"
              >
                Add scores →
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Project Info */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Project Information</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start">
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Estimated Cost</div>
              <div className="mt-1 text-sm text-gray-900 font-medium">
                {formatCurrency(project.cost_estimate)}
              </div>
            </div>
          </div>
          
          <div className="flex items-start">
            <DocumentChartBarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Category</div>
              <div className="mt-1 text-sm text-gray-900">
                {project.primary_category || 'Not specified'}
              </div>
            </div>
          </div>
          
          <div className="flex items-start">
            <UserCircleIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Created By</div>
              <div className="mt-1 text-sm text-gray-900">
                {project.created_by_user?.[0]?.first_name || 'Unknown'} {project.created_by_user?.[0]?.last_name || ''}
              </div>
            </div>
          </div>
          
          <div className="flex items-start">
            <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Created On</div>
              <div className="mt-1 text-sm text-gray-900">
                {formatDate(project.created_at)}
              </div>
            </div>
          </div>
          
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Last Updated</div>
              <div className="mt-1 text-sm text-gray-900">
                {formatDate(project.updated_at)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Actions</h3>
        </div>
        <div className="p-6 space-y-4">
          <Link
            href={`/reports/projects?id=${project.id}`}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
          >
            Generate Report
          </Link>
          
          <Link
            href={`/community/share?project=${project.id}`}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
          >
            Share for Feedback
          </Link>
          
          <Link
            href={`/projects/prioritization?highlight=${project.id}`}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
          >
            View in Prioritization
          </Link>
        </div>
      </div>
    </div>
  );
}
