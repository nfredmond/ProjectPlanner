'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectCategoryChartProps {
  data?: {
    category: string;
    count: number;
  }[];
}

export default function ProjectCategoryChart({ data = [] }: ProjectCategoryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Projects by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-center justify-center">
          {data.length === 0 ? (
            <p className="text-gray-500">No data available</p>
          ) : (
            <p>Project Category Chart Placeholder</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 