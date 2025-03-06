'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  DocumentIcon, 
  DocumentChartBarIcon, 
  MapIcon, 
  TableCellsIcon, 
  UserGroupIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Report } from '@/types';

interface RecentReportsProps {
  reports: Report[];
}

export default function RecentReports({ reports }: RecentReportsProps) {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Get icon based on report type
  const getReportIcon = (reportType: string) => {
    switch (reportType) {
      case 'project-summary':
        return DocumentChartBarIcon;
      case 'project-map':
        return MapIcon;
      case 'project-list':
        return TableCellsIcon;
      case 'community-feedback':
        return UserGroupIcon;
      default:
        return DocumentIcon;
    }
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Recent Reports</h2>
      </div>
      
      <div>
        {reports.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {reports.map((report) => {
              const ReportIcon = getReportIcon(report.report_type);
              
              return (
                <li key={report.id} className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <ReportIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {report.parameters?.title || 'Untitled Report'}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          {report.report_type.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        <span className="mx-1">&middot;</span>
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {report.file_url ? (
                        <a
                          href={report.file_url}
                          download
                          className="inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </a>
                      ) : (
                        <Link
                          href={`/reports/${report.report_type}?id=${report.id}`}
                          className="inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg
                            className="h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <span className="sr-only">View</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <DocumentIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
            <p>No reports generated yet.</p>
            <p className="mt-1 text-sm">Select a report type to generate your first report.</p>
          </div>
        )}
      </div>
    </div>
  );
}
