'use client';

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusCount {
  status: string;
  count: number;
}

interface ProjectStatusChartProps {
  data: StatusCount[];
}

export default function ProjectStatusChart({ data }: ProjectStatusChartProps) {
  const statusColors: { [key: string]: string } = {
    'draft': '#94a3b8', // slate-400
    'planned': '#60a5fa', // blue-400
    'active': '#4ade80', // green-400
    'completed': '#2563eb', // blue-600
    'cancelled': '#ef4444', // red-500
  };

  const statusLabels: Record<string, string> = {
    'draft': 'Draft',
    'planned': 'Planned',
    'active': 'Active',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };

  const chartData: ChartData<'doughnut'> = {
    labels: data.map(item => statusLabels[item.status] || item.status),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => statusColors[item.status] || '#cbd5e1'),
        borderColor: data.map(item => statusColors[item.status] || '#cbd5e1'),
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = data.reduce((acc, item) => acc + item.count, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%',
  };

  return (
    <div className="h-64">
      {data.length > 0 ? (
        <Doughnut data={chartData} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400">
          No project data available
        </div>
      )}
    </div>
  );
}
