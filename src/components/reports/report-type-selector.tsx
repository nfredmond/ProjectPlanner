'use client';

import React from 'react';
import Link from 'next/link';
import { 
  DocumentChartBarIcon, 
  MapIcon, 
  TableCellsIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface ReportTypeSelectorProps {
  profile: any;
  totalProjects: number;
}

const reportTypes = [
  {
    id: 'project-summary',
    name: 'Project Summary Report',
    description: 'Overview of all projects with status breakdown and key metrics',
    icon: DocumentChartBarIcon,
    color: 'bg-blue-50 text-blue-700',
    path: '/reports/projects/summary',
  },
  {
    id: 'project-prioritization',
    name: 'Prioritization Report',
    description: 'Analyze and rank projects based on criteria scores',
    icon: ArrowTrendingUpIcon,
    color: 'bg-purple-50 text-purple-700',
    path: '/reports/projects/prioritization',
  },
  {
    id: 'project-map',
    name: 'Geographic Distribution Report',
    description: 'Map visualization of projects with spatial analysis',
    icon: MapIcon,
    color: 'bg-green-50 text-green-700',
    path: '/reports/projects/map',
  },
  {
    id: 'project-list',
    name: 'Detailed Project List',
    description: 'Comprehensive list of all projects with details and status',
    icon: TableCellsIcon,
    color: 'bg-indigo-50 text-indigo-700',
    path: '/reports/projects/list',
  },
  {
    id: 'community-feedback',
    name: 'Community Feedback Report',
    description: 'Analysis of public feedback on projects with sentiment breakdown',
    icon: UserGroupIcon,
    color: 'bg-orange-50 text-orange-700',
    path: '/reports/community/feedback',
  },
  {
    id: 'custom-report',
    name: 'Custom Report',
    description: 'Create a custom report based on your specific needs',
    icon: DocumentTextIcon,
    color: 'bg-gray-50 text-gray-700',
    path: '/reports/custom',
  },
];

export default function ReportTypeSelector({
  profile,
  totalProjects,
}: ReportTypeSelectorProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Generate New Report</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select a report type to generate. Your agency has {totalProjects} active projects.
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {reportTypes.map((type) => (
            <Link
              key={type.id}
              href={type.path}
              className="relative block rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50"
            >
              <div className="flex items-start">
                <div className={`shrink-0 rounded-lg p-2 ${type.color}`}>
                  <type.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">{type.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{type.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
