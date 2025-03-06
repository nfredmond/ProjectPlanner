import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';
import PrioritizationTool from '@/components/projects/prioritization-tool';

export const metadata = {
  title: 'Project Prioritization | RTPA Project Prioritization',
  description: 'Compare and prioritize transportation projects',
};

export default async function PrioritizationPage({
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
  
  // Parse search parameters
  const statusFilter = searchParams.status as string[] || ['active', 'planned']; // Default to active and planned
  const categoryFilter = searchParams.category as string[] || [];
  const highlight = searchParams.highlight as string;
  
  // Fetch projects for prioritization
  let projectsQuery = supabase
    .from('projects')
    .select(`
      id, 
      title, 
      status, 
      primary_category, 
      cost_estimate, 
      score_total, 
      score_breakdown,
      created_at,
      updated_at
    `)
    .eq('agency_id', profile.agency_id)
    .not('score_total', 'is', null);
    
  // Apply filters
  if (statusFilter.length > 0) {
    projectsQuery = projectsQuery.in('status', statusFilter);
  }
  
  if (categoryFilter.length > 0) {
    projectsQuery = projectsQuery.in('primary_category', categoryFilter);
  }
  
  // Get projects ordered by score
  const { data: projects } = await projectsQuery.order('score_total', { ascending: false });
  
  // Fetch criteria for weightings
  const { data: criteria } = await supabase
    .from('criteria')
    .select('*')
    .or(`agency_id.eq.${profile.agency_id},is_default.eq.true`)
    .order('order');
  
  // Fetch distinct categories for filters
  const { data: categories } = await supabase
    .from('projects')
    .select('primary_category')
    .eq('agency_id', profile.agency_id)
    .not('primary_category', 'is', null)
    .order('primary_category');
  
  const uniqueCategories = categories
    ? Array.from(new Set(categories.map((item: any) => item.primary_category))) as string[]
    : [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Project Prioritization</h1>
          <p className="text-gray-500 mt-1">Compare and rank transportation projects</p>
        </div>
        
        <div className="flex space-x-3">
          <Link 
            href="/reports/projects/prioritization" 
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
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Generate Report
          </Link>
          
          <Link 
            href="/projects/new" 
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Project
          </Link>
        </div>
      </div>
      
      <PrioritizationTool 
        projects={projects || []}
        criteria={criteria || []} 
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        availableCategories={uniqueCategories}
        highlightedProjectId={highlight}
      />
    </div>
  );
}
