import React from 'react';
import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/server';
import ProjectSummaryReportComponent from '@/components/reports/project-summary-report-component';
import { StatusCount } from '@/components/dashboard/types';

export const metadata = {
  title: 'Project Summary Report | RTPA Project Prioritization',
  description: 'Overview of projects with status breakdown and key metrics',
};

export default async function ProjectSummaryReportPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createServerComponentClient();
  
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return <div>Loading...</div>;
  }
  
  // Fetch user's profile with agency details
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, agencies:agency_id(*)')
    .eq('id', session.user.id)
    .single();
  
  if (!profile) {
    return <div>Error loading profile</div>;
  }
  
  // Get project count by status
  const { data: statusCounts } = await supabase
    .rpc('get_project_counts_by_status', { agency_id_param: profile.agency_id });
  
  // Get project count by category
  const { data: categoryCounts } = await supabase
    .rpc('get_project_counts_by_category', { agency_id_param: profile.agency_id });
  
  // Get total project cost
  const { data: costData } = await supabase
    .rpc('get_total_project_cost', { agency_id_param: profile.agency_id });
  
  // Get top projects by score
  const { data: topProjects } = await supabase
    .from('projects')
    .select('id, title, status, primary_category, cost_estimate, score_total')
    .eq('agency_id', profile.agency_id)
    .order('score_total', { ascending: false })
    .limit(5);
  
  // Get recently updated projects
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('id, title, status, primary_category, cost_estimate, updated_at')
    .eq('agency_id', profile.agency_id)
    .order('updated_at', { ascending: false })
    .limit(5);
  
  // Calculate metrics
  const totalProjects = statusCounts?.reduce((acc: number, item: StatusCount) => acc + item.count, 0) || 0;
  const activeProjects = statusCounts?.find((item: StatusCount) => item.status === 'active')?.count || 0;
  const plannedProjects = statusCounts?.find((item: StatusCount) => item.status === 'planned')?.count || 0;
  const completedProjects = statusCounts?.find((item: StatusCount) => item.status === 'completed')?.count || 0;
  
  // Make sure top projects have all required fields including created_at
  const formattedTopProjects = topProjects?.map((project: any) => ({
    ...project,
    created_at: new Date().toISOString()
  })) || [];
  
  // Make sure recent projects have all required fields including created_at
  const formattedRecentProjects = recentProjects?.map((project: any) => ({
    ...project,
    created_at: project.updated_at || new Date().toISOString()
  })) || [];
  
  const reportData = {
    agencyName: profile.agencies.name,
    timestamp: new Date().toISOString(),
    metrics: {
      totalProjects,
      activeProjects,
      plannedProjects,
      completedProjects,
      totalCost: costData?.total_cost || 0,
    },
    statusCounts: statusCounts || [],
    categoryCounts: categoryCounts || [],
    topProjects: formattedTopProjects,
    recentProjects: formattedRecentProjects,
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/reports" className="text-rtpa-blue-600 hover:text-rtpa-blue-800 text-sm">
            ← Back to Reports
          </Link>
          <h1 className="text-3xl font-bold">Project Summary Report</h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Export PDF
          </button>
          
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Save Report
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <ProjectSummaryReportComponent data={reportData} />
      </div>
    </div>
  );
}
