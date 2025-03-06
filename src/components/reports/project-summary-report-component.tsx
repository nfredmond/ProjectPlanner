'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { ProjectItem } from '@/components/dashboard/types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ProjectSummaryReportProps {
  data: {
    agencyName: string;
    timestamp: string;
    metrics: {
      totalProjects: number;
      activeProjects: number;
      plannedProjects: number;
      completedProjects: number;
      totalCost: number;
    };
    statusCounts: { status: string; count: number }[];
    categoryCounts: { category: string; count: number }[];
    topProjects: ProjectItem[];
    recentProjects: ProjectItem[];
  };
}

export default function ProjectSummaryReport({ data }: ProjectSummaryReportProps) {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy h:mm a');
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
  
  // Status colors for chart
  const statusColors = {
    'draft': '#94a3b8', // slate-400
    'planned': '#60a5fa', // blue-400
    'active': '#4ade80', // green-400
    'completed': '#2563eb', // blue-600
    'cancelled': '#ef4444', // red-500
  };
  
  // Status chart data
  const statusChartData = {
    labels: data.statusCounts.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1)),
    datasets: [
      {
        data: data.statusCounts.map(item => item.count),
        backgroundColor: data.statusCounts.map(item => statusColors[item.status as keyof typeof statusColors] || '#cbd5e1'),
        borderWidth: 1,
      },
    ],
  };
  
  // Category chart data
  const categoryChartData = {
    labels: data.categoryCounts.map(item => item.category),
    datasets: [
      {
        label: 'Number of Projects',
        data: data.categoryCounts.map(item => item.count),
        backgroundColor: '#3b82f6', // blue-500
        borderRadius: 4,
      },
    ],
  };
  
  // Get status badge style
  const getStatusBadge = (status: string) => {
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
  
  return (
    <div className="p-8">
      {/* Report Header */}
      <div className="border-b pb-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Project Summary Report</h2>
        <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="text-sm text-gray-500">{data.agencyName}</div>
          <div className="text-sm text-gray-500">Generated on: {formatDate(data.timestamp)}</div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Projects</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{data.metrics.totalProjects}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Active Projects</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{data.metrics.activeProjects}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Planned Projects</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{data.metrics.plannedProjects}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Completed Projects</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{data.metrics.completedProjects}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Budget</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(data.metrics.totalCost)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Chart */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4">Projects by Status</h4>
            <div className="h-64">
              <Doughnut 
                data={statusChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }} 
              />
            </div>
          </div>
          
          {/* Category Chart */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4">Projects by Category</h4>
            <div className="h-64">
              <Bar 
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y' as const,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Projects */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Scored Projects</h3>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Project</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cost</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.topProjects.map((project) => (
                <tr key={project.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="font-medium text-gray-900">{project.title}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        project.status
                      )}`}
                    >
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {project.primary_category || 'Not specified'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {project.cost_estimate ? formatCurrency(project.cost_estimate) : 'Not specified'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="flex items-center">
                      <div className="mr-2 w-16 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-rtpa-blue-600 h-2.5 rounded-full"
                          style={{ width: `${Math.min(100, ((project.score_total ?? 0) / 5) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900">{project.score_total?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {data.topProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                    No scored projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recently Updated Projects */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recently Updated Projects</h3>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Project</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cost</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.recentProjects.map((project) => (
                <tr key={project.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="font-medium text-gray-900">{project.title}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        project.status
                      )}`}
                    >
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {project.primary_category || 'Not specified'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {project.cost_estimate ? formatCurrency(project.cost_estimate) : 'Not specified'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {project.updated_at ? formatDate(project.updated_at) : formatDate(project.created_at)}
                  </td>
                </tr>
              ))}
              {data.recentProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                    No recently updated projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
