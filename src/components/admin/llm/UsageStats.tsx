'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { LlmProvider } from '@/lib/llm/service';

// Provider usage data structure
interface ProviderUsage {
  provider: LlmProvider;
  tokens: number;
  requests: number;
  cost: number;
  success_rate: number | null;
}

// Purpose usage data structure
interface PurposeUsage {
  purpose: string;
  tokens: number;
  requests: number;
}

// Model usage data structure
interface ModelUsage {
  model: string;
  provider: LlmProvider;
  tokens: number;
  requests: number;
  cost: number;
}

// Time-based usage data structure
interface TimeUsage {
  date: string;
  tokens: number;
  requests: number;
}

// Overall usage statistics
interface UsageStatistics {
  total_tokens?: number;
  total_cost?: number;
  total_requests?: number;
  success_rate?: number;
  by_provider: ProviderUsage[];
  by_purpose: PurposeUsage[];
  by_model: ModelUsage[];
  by_time: TimeUsage[];
}

interface UsageStatsProps {
  stats: UsageStatistics | null;
  loading: boolean;
}

// Type for the Pie chart label callback
interface PieLabelProps {
  name: string;
  percent: number;
}

export function UsageStats({ stats, loading }: UsageStatsProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No usage statistics available.</p>
      </div>
    );
  }
  
  // Prepare data for charts
  const providerData = stats.by_provider || [];
  const purposeData = stats.by_purpose || [];
  const modelData = stats.by_model || [];
  const timeData = stats.by_time || [];
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Format numbers for display
  const formatNumber = (num: number): string => num.toLocaleString();
  
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="by-provider">By Provider</TabsTrigger>
        <TabsTrigger value="by-purpose">By Purpose</TabsTrigger>
        <TabsTrigger value="by-model">By Model</TabsTrigger>
        <TabsTrigger value="by-time">Time Trends</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tokens?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all providers and models
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_cost?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on provider pricing
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_requests?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                API calls to LLM providers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.success_rate ? `${(stats.success_rate * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successful API calls
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage by Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={providerData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="tokens"
                      nameKey="provider"
                      label={({ name, percent }: PieLabelProps) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {providerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage by Purpose</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={purposeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="purpose" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Bar dataKey="tokens" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="by-provider">
        <Card>
          <CardHeader>
            <CardTitle>Usage by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Tokens Used</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Estimated Cost</TableHead>
                  <TableHead>Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerData.map((item) => (
                  <TableRow key={item.provider}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{item.provider}</Badge>
                    </TableCell>
                    <TableCell>{formatNumber(item.tokens)}</TableCell>
                    <TableCell>{formatNumber(item.requests)}</TableCell>
                    <TableCell>${item.cost.toFixed(2)}</TableCell>
                    <TableCell>
                      {item.success_rate ? `${(item.success_rate * 100).toFixed(1)}%` : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="by-purpose">
        <Card>
          <CardHeader>
            <CardTitle>Usage by Purpose</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Tokens Used</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Avg. Tokens per Request</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purposeData.map((item) => (
                  <TableRow key={item.purpose}>
                    <TableCell className="font-medium">
                      {item.purpose.split('-').map((word: string) => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </TableCell>
                    <TableCell>{formatNumber(item.tokens)}</TableCell>
                    <TableCell>{formatNumber(item.requests)}</TableCell>
                    <TableCell>
                      {item.requests > 0 
                        ? formatNumber(Math.round(item.tokens / item.requests)) 
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="by-model">
        <Card>
          <CardHeader>
            <CardTitle>Usage by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Tokens Used</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Estimated Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelData.map((item) => (
                  <TableRow key={`${item.provider}-${item.model}`}>
                    <TableCell className="font-medium">{item.model}</TableCell>
                    <TableCell>{item.provider}</TableCell>
                    <TableCell>{formatNumber(item.tokens)}</TableCell>
                    <TableCell>{formatNumber(item.requests)}</TableCell>
                    <TableCell>${item.cost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="by-time">
        <Card>
          <CardHeader>
            <CardTitle>Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Legend />
                  <Bar dataKey="tokens" name="Tokens Used" fill="#8884d8" />
                  <Bar dataKey="requests" name="Requests" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 