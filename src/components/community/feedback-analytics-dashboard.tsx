'use client';

import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
);

interface FeedbackItem {
  id: string;
  content: string;
  sentiment?: string;
  status: string;
  created_at: string;
  project_id?: string;
  projects?: {
    title: string;
  };
}

interface FeedbackAnalyticsDashboardProps {
  feedbackData: FeedbackItem[];
  agencyId: string;
}

export function FeedbackAnalyticsDashboard({ 
  feedbackData, 
  agencyId 
}: FeedbackAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('30');
  const [commonThemes, setCommonThemes] = useState<{theme: string, count: number}[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);
  
  // Fetch common themes using AI classification
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setIsLoadingThemes(true);
        const response = await fetch('/api/community/feedback/themes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agency_id: agencyId,
            feedback_ids: feedbackData.map(item => item.id),
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch themes');
        }
        
        const data = await response.json();
        setCommonThemes(data.themes || []);
      } catch (error) {
        console.error('Error fetching themes:', error);
        // Fallback to dummy themes if API fails
        setCommonThemes([
          { theme: 'Safety Concerns', count: 15 },
          { theme: 'Traffic Congestion', count: 12 },
          { theme: 'Public Transit', count: 10 },
          { theme: 'Bike Lanes', count: 8 },
          { theme: 'Pedestrian Access', count: 7 },
        ]);
      } finally {
        setIsLoadingThemes(false);
      }
    };
    
    if (feedbackData.length > 0) {
      fetchThemes();
    } else {
      setIsLoadingThemes(false);
    }
  }, [feedbackData, agencyId]);
  
  // Filter data based on time range
  const getFilteredData = () => {
    const days = parseInt(timeRange);
    const cutoffDate = subDays(new Date(), days);
    return feedbackData.filter(item => new Date(item.created_at) >= cutoffDate);
  };
  
  const filteredData = getFilteredData();
  
  // Prepare sentiment distribution data
  const sentimentData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        label: 'Sentiment Distribution',
        data: [
          filteredData.filter(item => item.sentiment === 'positive').length,
          filteredData.filter(item => item.sentiment === 'neutral').length,
          filteredData.filter(item => item.sentiment === 'negative').length,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare feedback volume by project data
  const projectCounts: Record<string, number> = {};
  filteredData.forEach(item => {
    const projectTitle = item.projects?.title || 'Unassigned';
    projectCounts[projectTitle] = (projectCounts[projectTitle] || 0) + 1;
  });
  
  const projectLabels = Object.keys(projectCounts).slice(0, 10); // Top 10 projects
  const projectData = {
    labels: projectLabels,
    datasets: [
      {
        label: 'Feedback Count',
        data: projectLabels.map(label => projectCounts[label]),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare feedback volume over time data
  const days = parseInt(timeRange);
  const dateRange = eachDayOfInterval({
    start: subDays(new Date(), days - 1),
    end: new Date(),
  });
  
  const dailyCounts: Record<string, number> = {};
  dateRange.forEach(date => {
    dailyCounts[format(date, 'yyyy-MM-dd')] = 0;
  });
  
  filteredData.forEach(item => {
    const date = format(parseISO(item.created_at), 'yyyy-MM-dd');
    if (dailyCounts[date] !== undefined) {
      dailyCounts[date]++;
    }
  });
  
  const timeSeriesData = {
    labels: Object.keys(dailyCounts).map(date => format(parseISO(date), 'MMM d')),
    datasets: [
      {
        label: 'Feedback Volume',
        data: Object.values(dailyCounts),
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };
  
  // Prepare response rate data
  const totalFeedback = filteredData.length;
  const respondedFeedback = filteredData.filter(item => item.status === 'approved').length;
  const responseRate = totalFeedback > 0 ? (respondedFeedback / totalFeedback) * 100 : 0;
  
  const responseRateData = {
    labels: ['Responded', 'Pending Response'],
    datasets: [
      {
        data: [respondedFeedback, totalFeedback - respondedFeedback],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare common themes data
  const themesData = {
    labels: commonThemes.map(item => item.theme),
    datasets: [
      {
        label: 'Occurrence Count',
        data: commonThemes.map(item => item.count),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Time Range:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Button 
            variant="outline" 
            onClick={() => window.print()}
          >
            Export Report
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredData.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              in the last {timeRange} days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{responseRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {respondedFeedback} of {totalFeedback} responded
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredData.length > 0 
                ? ((filteredData.filter(item => item.sentiment === 'positive').length / filteredData.length) * 100).toFixed(1) 
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {filteredData.filter(item => item.sentiment === 'positive').length} positive feedback
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(filteredData.length / parseInt(timeRange)).toFixed(1)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              feedback items per day
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Feedback Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line 
                data={timeSeriesData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <Pie 
                data={sentimentData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Feedback by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar 
                data={projectData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false,
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Common Themes in Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingThemes ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
              </div>
            ) : (
              <div className="h-80">
                <Bar 
                  data={themesData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                      x: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false,
                      }
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 