'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  Legend, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  ScatterChart,
  Scatter,
  ZAxis 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, PieChart as PieChartIcon, TrendingUp, Grid3X3, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface FeedbackAnalyticsProps {
  projectId?: string;
  feedbackItems: any[];
  onSummarizeFeedback: () => Promise<any>;
  onAnalyzeSentiment?: () => Promise<any>;
}

interface ClusterData {
  name: string;
  feedback_ids: string[];
  summary: string;
  dominant_sentiment: string;
  insights: string;
  percentage: number;
  confidence: number;
}

interface TrendData {
  trends: any[];
  emerging_topics: string[];
  declining_topics: string[];
  sentiment_trajectory: string;
  recommendations: string[];
}

export function FeedbackAnalytics({
  projectId,
  feedbackItems,
  onSummarizeFeedback,
  onAnalyzeSentiment
}: FeedbackAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isClustering, setIsClustering] = useState(false);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [clusters, setClusters] = useState<ClusterData[] | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const { toast } = useToast();

  const sentimentCount = feedbackItems.reduce((acc, item) => {
    const sentiment = item.sentiment || 'not analyzed';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentData = Object.entries(sentimentCount).map(([name, value]) => ({
    name,
    value
  }));

  const SENTIMENT_COLORS = {
    positive: '#4ade80',
    negative: '#f87171',
    neutral: '#94a3b8',
    mixed: '#fbbf24',
    'not analyzed': '#e2e8f0'
  };

  const getFeedbackOverTime = () => {
    const feedbackByMonth: Record<string, Record<string, number>> = {};
    
    feedbackItems.forEach(item => {
      const date = new Date(item.created_at);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      const sentiment = item.sentiment || 'not analyzed';
      
      if (!feedbackByMonth[monthYear]) {
        feedbackByMonth[monthYear] = {
          positive: 0,
          negative: 0,
          neutral: 0,
          mixed: 0,
          'not analyzed': 0
        };
      }
      
      feedbackByMonth[monthYear][sentiment]++;
    });
    
    return Object.entries(feedbackByMonth).map(([month, data]) => ({
      month,
      ...data,
      total: Object.values(data).reduce((sum, val) => sum + val, 0)
    }));
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const result = await onSummarizeFeedback();
      setSummary(result.summary);
    } catch (error) {
      console.error('Error summarizing feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to summarize feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClusterAnalysis = async () => {
    setIsClustering(true);
    try {
      const response = await fetch(`/api/llm/feedback-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cluster_feedback',
          projectId: projectId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to cluster feedback');
      }
      
      const result = await response.json();
      
      if (result.clusters && result.clusters.clusters) {
        setClusters(result.clusters.clusters);
      } else {
        toast({
          title: 'Warning',
          description: 'Clustering analysis returned an unexpected format',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error clustering feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to cluster feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsClustering(false);
    }
  };

  const handleTrendAnalysis = async () => {
    setIsTrendLoading(true);
    try {
      const response = await fetch(`/api/llm/feedback-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'identify_trends',
          projectId: projectId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze trends');
      }
      
      const result = await response.json();
      
      if (result.trends) {
        setTrends(result.trends);
      } else {
        toast({
          title: 'Warning',
          description: 'Trend analysis returned an unexpected format',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error analyzing trends:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze trends. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTrendLoading(false);
    }
  };

  // Extract emotion data for word cloud visualization
  const getEmotionData = () => {
    const emotions: Record<string, number> = {};
    
    feedbackItems.forEach(item => {
      if (item.structured_data && item.structured_data.emotions) {
        item.structured_data.emotions.forEach((emotion: string) => {
          emotions[emotion] = (emotions[emotion] || 0) + 1;
        });
      }
    });
    
    return Object.entries(emotions).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Create cluster visualization data
  const getClusterVisualizationData = () => {
    if (!clusters) return [];
    
    return clusters.map((cluster, index) => ({
      x: Math.random() * 100,  // Random position for visualization
      y: Math.random() * 100,
      z: cluster.feedback_ids.length,
      name: cluster.name,
      sentiment: cluster.dominant_sentiment,
      size: cluster.percentage
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Feedback Analytics</CardTitle>
        <CardDescription>
          {projectId 
            ? 'Analytics for feedback on this project' 
            : 'Overview of all feedback for your agency'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger value="clusters" className="flex items-center gap-1">
              <Grid3X3 className="h-4 w-4" />
              <span>Clusters</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Sentiment Distribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || '#999'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} feedback items`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Feedback Stats</h3>
                <div className="space-y-2 p-4 border rounded-md">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Total Feedback:</span>
                    <span>{feedbackItems.length}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Positive Feedback:</span>
                    <span>{sentimentCount.positive || 0} ({Math.round(((sentimentCount.positive || 0) / feedbackItems.length) * 100)}%)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Negative Feedback:</span>
                    <span>{sentimentCount.negative || 0} ({Math.round(((sentimentCount.negative || 0) / feedbackItems.length) * 100)}%)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Neutral Feedback:</span>
                    <span>{sentimentCount.neutral || 0} ({Math.round(((sentimentCount.neutral || 0) / feedbackItems.length) * 100)}%)</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Mixed Feedback:</span>
                    <span>{sentimentCount.mixed || 0} ({Math.round(((sentimentCount.mixed || 0) / feedbackItems.length) * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Common Emotions</h3>
              <div className="flex flex-wrap gap-2 p-4 border rounded-md">
                {getEmotionData().map((emotion, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-sm py-1 px-2"
                    style={{ 
                      fontSize: `${Math.min(1 + (emotion.value / 5) * 0.5, 1.5)}rem`,
                      opacity: 0.7 + (emotion.value / 10) * 0.3
                    }}
                  >
                    {emotion.name} ({emotion.value})
                  </Badge>
                ))}
                {getEmotionData().length === 0 && (
                  <p className="text-gray-500">No emotion data available. Try analyzing sentiment first.</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Feedback Trends Over Time</h3>
              <Button 
                onClick={handleTrendAnalysis} 
                disabled={isTrendLoading || feedbackItems.length < 5}
                variant="outline"
              >
                {isTrendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {trends ? 'Refresh Trends' : 'Analyze Trends'}
              </Button>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getFeedbackOverTime()}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} />
                  <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} />
                  <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} />
                  <Bar dataKey="mixed" stackId="a" fill={SENTIMENT_COLORS.mixed} />
                  <Bar dataKey="not analyzed" stackId="a" fill={SENTIMENT_COLORS['not analyzed']} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {trends && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Emerging Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      {trends.emerging_topics.map((topic, index) => (
                        <li key={index}>{topic}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Declining Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      {trends.declining_topics.map((topic, index) => (
                        <li key={index}>{topic}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Sentiment Trajectory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{trends.sentiment_trajectory}</p>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Recommended Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      {trends.recommendations.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {!trends && !isTrendLoading && (
              <div className="text-center p-8 border border-dashed rounded-md">
                <p className="text-gray-500">
                  {feedbackItems.length < 5 
                    ? 'Need at least 5 feedback items to analyze trends' 
                    : 'Click "Analyze Trends" to identify patterns over time'}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="clusters" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Feedback Clusters</h3>
              <Button 
                onClick={handleClusterAnalysis} 
                disabled={isClustering || feedbackItems.length < 5}
                variant="outline"
              >
                {isClustering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {clusters ? 'Refresh Clusters' : 'Analyze Clusters'}
              </Button>
            </div>

            {clusters && (
              <>
                <div className="h-[300px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20,
                      }}
                    >
                      <CartesianGrid />
                      <XAxis type="number" dataKey="x" name="cluster" />
                      <YAxis type="number" dataKey="y" name="size" />
                      <ZAxis type="number" dataKey="z" range={[50, 400]} name="count" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name, props) => {
                          if (name === 'cluster') return props.payload.name;
                          if (name === 'size') return `${props.payload.size.toFixed(1)}%`;
                          if (name === 'count') return `${value} items`;
                          return value;
                        }}
                      />
                      <Scatter 
                        name="Clusters" 
                        data={getClusterVisualizationData()} 
                        fill="#8884d8"
                      >
                        {getClusterVisualizationData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={SENTIMENT_COLORS[entry.sentiment as keyof typeof SENTIMENT_COLORS] || '#8884d8'}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  {clusters.map((cluster, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-base">{cluster.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge
                              className="capitalize"
                              style={{ backgroundColor: SENTIMENT_COLORS[cluster.dominant_sentiment as keyof typeof SENTIMENT_COLORS] || '#999' }}
                            >
                              {cluster.dominant_sentiment}
                            </Badge>
                            <Badge variant="outline">{cluster.percentage.toFixed(1)}%</Badge>
                            <Badge variant="outline">{cluster.feedback_ids.length} items</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Summary</h4>
                          <p className="text-sm text-gray-600">{cluster.summary}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Key Insights</h4>
                          <p className="text-sm text-gray-600">{cluster.insights}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {!clusters && !isClustering && (
              <div className="text-center p-8 border border-dashed rounded-md">
                <p className="text-gray-500">
                  {feedbackItems.length < 5 
                    ? 'Need at least 5 feedback items to identify clusters' 
                    : 'Click "Analyze Clusters" to identify common themes and topics'}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Feedback Summary</h3>
              <Button 
                onClick={handleSummarize} 
                disabled={isLoading || feedbackItems.length === 0}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {summary ? 'Regenerate Summary' : 'Generate Summary'}
              </Button>
            </div>
            
            {summary ? (
              <div className="prose max-w-none p-4 border rounded-md bg-gray-50">
                <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} />
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-md">
                <p className="text-gray-500">
                  {feedbackItems.length === 0 
                    ? 'No feedback to summarize' 
                    : 'Click "Generate Summary" to analyze all feedback'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 