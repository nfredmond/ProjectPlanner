'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CategoryCount {
  category: string;
  count: number;
}

interface ProjectCategoryChartProps {
  data: CategoryCount[];
}

export default function ProjectCategoryChart({ data }: ProjectCategoryChartProps) {
  // Sort by count in descending order
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  
  // Map category names to more readable labels
  const categoryLabels: Record<string, string> = {
    'road': 'Roads',
    'transit': 'Transit',
    'bike': 'Bicycle',
    'pedestrian': 'Pedestrian',
    'bridge': 'Bridges',
    'safety': 'Safety',
    'maintenance': 'Maintenance',
    'highway': 'Highways',
    'multimodal': 'Multimodal',
    'other': 'Other',
  };

  const chartData: ChartData<'bar'> = {
    labels: sortedData.map(item => categoryLabels[item.category] || item.category),
    datasets: [
      {
        label: 'Number of Projects',
        data: sortedData.map(item => item.count),
        backgroundColor: '#3b82f6', // blue-500
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            return `${value} projects`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0, // Only show whole numbers
        },
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-64">
      {data.length > 0 ? (
        <Bar data={chartData} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400">
          No category data available
        </div>
      )}
    </div>
  );
}
