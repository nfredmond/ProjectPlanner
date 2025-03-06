'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientComponentClient } from '@/lib/supabase/client';

interface ProjectCostChartProps {
  data?: {
    project: string;
    cost: number;
  }[];
  agencyId?: string;
}

export default function ProjectCostChart({ data: initialData = [], agencyId }: ProjectCostChartProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(initialData.length === 0 && !!agencyId);
  
  // Fetch data if agencyId is provided and no initial data
  useEffect(() => {
    if (agencyId && initialData.length === 0) {
      const fetchData = async () => {
        setLoading(true);
        const supabase = createClientComponentClient();
        const { data: projectCosts } = await supabase
          .from('projects')
          .select('title, cost_estimate')
          .eq('agency_id', agencyId)
          .not('cost_estimate', 'is', null)
          .order('cost_estimate', { ascending: false })
          .limit(5);
          
        if (projectCosts) {
          setData(projectCosts.map(p => ({
            project: p.title,
            cost: p.cost_estimate
          })));
        }
        setLoading(false);
      };
      
      fetchData();
    }
  }, [agencyId, initialData.length]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Project Costs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-center justify-center">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : data.length === 0 ? (
            <p className="text-gray-500">No data available</p>
          ) : (
            <p>Project Cost Chart Placeholder</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 