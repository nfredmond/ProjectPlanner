'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { createClientComponentClient } from '@/lib/supabase/client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProjectCostChartProps {
  agencyId: string;
}

interface MonthlyCost {
  month: string;
  cost: number;
}

export default function ProjectCostChart({ agencyId }: ProjectCostChartProps) {
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonthlyCosts = async () => {
      try {
        setLoading(true);
        const supabase = createClientComponentClient();
        
        // Get current date and 11 months ago for the last 12 months of data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 11);
        
        // Format dates for Supabase query
        const startDateString = startDate.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];
        
        // Query projects created in the last 12 months
        const { data, error } = await supabase
          .from('projects')
          .select('created_at, cost_estimate')
          .eq('agency_id', agencyId)
          .gte('created_at', startDateString)
          .lte('created_at', endDateString)
          .order('created_at');
          
        if (error) throw error;
        
        // Group by month and sum costs
        const monthlyData: Record<string, number> = {};
        
        // Initialize all months with zero
        for (let i = 0; i < 12; i++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
          monthlyData[monthKey] = 0;
        }
        
        // Sum costs for each month
        data?.forEach(project => {
          if (project.cost_estimate) {
            const monthKey = project.created_at.slice(0, 7); // YYYY-MM format
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + project.cost_estimate;
          }
        });
        
        // Convert to array for chart
        const monthlyCostsArray = Object.entries(monthlyData).map(([month, cost]) => ({
          month,
          cost
        })).sort((a, b) => a.month.localeCompare(b.month));
        
        setMonthlyCosts(monthlyCostsArray);
      } catch (err) {
        console.error('Error fetching monthly costs:', err);
        setError('Failed to load cost data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMonthlyCosts();
  }, [agencyId]);

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString + '-01');
    return date.toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  const chartData: ChartData<'line'> = {
    labels: monthlyCosts.map(item => formatMonth(item.month)),
    datasets: [
      {
        label: 'Project Costs',
        data: monthlyCosts.map(item => item.cost / 1000000), // Convert to millions
        borderColor: '#0891b2', // cyan-600
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            return `$${value.toFixed(2)}M`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value + 'M';
          }
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rtpa-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="h-64">
      {monthlyCosts.length > 0 ? (
        <Line data={chartData} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400">
          No cost data available
        </div>
      )}
    </div>
  );
}
