import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChartBarIcon, DocumentChartBarIcon, PlusIcon } from '@heroicons/react/24/outline';
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
  let supabase;
  try {
    supabase = await createServerComponentClient();
  } catch (error) {
    console.error('Supabase connection error:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-red-500 text-lg font-semibold mb-2">Database Connection Error</div>
        <div className="text-gray-700 text-center max-w-md">
          <p className="mb-4">Unable to connect to the database. This is likely due to missing or incorrect Supabase credentials in the environment configuration.</p>
          <p className="text-sm text-gray-500">Please check your .env file and ensure the following variables are correctly set:</p>
          <ul className="text-sm text-gray-500 list-disc list-inside mt-2 mb-4">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>SUPABASE_SERVICE_ROLE_KEY</li>
          </ul>
          <Link href="/" className="text-rtpa-blue-600 hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }
  
  // Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-red-500 text-lg font-semibold mb-2">Authentication Error</div>
        <div className="text-gray-700 text-center max-w-md">
          <p className="mb-4">There was a problem with your authentication session: {sessionError.message}</p>
          <p className="text-sm text-gray-500 mb-4">Please try logging out and logging back in.</p>
          <Link href="/login" className="text-rtpa-blue-600 hover:underline">Go to Login</Link>
        </div>
      </div>
    );
  }
  
  if (!session) {
    console.warn('No active session found, redirecting to login page');
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-red-500 text-lg font-semibold mb-2">Session Required</div>
        <div className="text-gray-700 text-center max-w-md">
          <p className="mb-4">You need to be logged in to access this page.</p>
          <Link href="/login" className="text-rtpa-blue-600 hover:underline">Go to Login</Link>
        </div>
      </div>
    );
  }
  
  // Fetch user's profile with agency details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, agencies:agency_id(*)')
    .eq('id', session.user.id)
    .single();
  
  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-red-500 text-lg font-semibold mb-2">Profile Error</div>
        <div className="text-gray-700 text-center max-w-md">
          <p className="mb-4">There was an error loading your profile: {profileError.message}</p>
          <Link href="/" className="text-rtpa-blue-600 hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500">Error loading profile</div>
      </div>
    );
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <ChartBarIcon className="h-8 w-8 text-rtpa-blue-500 mr-3" />
            <div>
              <h1 className="text-3xl font-bold font-heading text-gray-900">Project Prioritization</h1>
              <p className="text-gray-600 mt-1 font-body">Compare and rank transportation projects</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Link 
              href="/reports/projects/prioritization" 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500 transition-colors"
            >
              <DocumentChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
              Generate Report
            </Link>
            
            <Link 
              href="/projects/new" 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Project
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-card rounded-xl border border-gray-100">
        <PrioritizationTool 
          projects={projects || []}
          criteria={criteria || []} 
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          availableCategories={uniqueCategories}
          highlightedProjectId={highlight}
        />
      </div>
    </div>
  );
}
