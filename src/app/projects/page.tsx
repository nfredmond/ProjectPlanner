import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PlusIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import ProjectsTable from '@/components/projects/projects-table';
import ProjectFilters from '@/components/projects/project-filters';

export const metadata = {
  title: 'Projects | RTPA Project Prioritization',
  description: 'Manage your transportation projects',
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createServerComponentClient();
  
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }
  
  // Fetch user's agency
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', session.user.id)
    .single();
  
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500">Error loading profile</div>
      </div>
    );
  }
  
  // Parse search parameters
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const status = searchParams.status as string[] || [];
  const category = searchParams.category as string[] || [];
  const query = searchParams.q as string || '';
  const sortBy = searchParams.sort_by as string || 'created_at';
  const sortDir = (searchParams.sort_dir as 'asc' | 'desc') || 'desc';
  
  // Calculate offset for pagination
  const offset = (page - 1) * limit;
  
  // Fetch projects with filters
  let projectsQuery = supabase
    .from('projects')
    .select('id, title, status, primary_category, cost_estimate, created_at, score_total, profiles(first_name, last_name)', { count: 'exact' })
    .eq('agency_id', profile.agency_id)
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(offset, offset + limit - 1);
  
  // Add filters if provided
  if (status.length > 0) {
    projectsQuery = projectsQuery.in('status', status);
  }
  
  if (category.length > 0) {
    projectsQuery = projectsQuery.in('primary_category', category);
  }
  
  if (query) {
    projectsQuery = projectsQuery.ilike('title', `%${query}%`);
  }
  
  const { data: projectsRaw, count, error } = await projectsQuery;
  
  // Transform the profiles array into a single profiles object
  const projects = projectsRaw?.map((project: any) => ({
    ...project,
    profiles: project.profiles && project.profiles.length > 0 
      ? project.profiles[0] 
      : { first_name: undefined, last_name: undefined }
  }));
  
  // Fetch distinct categories for filters
  const { data: categories } = await supabase
    .from('projects')
    .select('primary_category')
    .eq('agency_id', profile.agency_id)
    .not('primary_category', 'is', null)
    .order('primary_category')
    .limit(100);
  
  const uniqueCategories = categories?.filter(
    (item: any, index: number, self: any[]) => 
      item.primary_category !== null && 
      self.findIndex((t: any) => t.primary_category === item.primary_category) === index
  ).map((item: any) => item.primary_category) || [];

  // Calculate total pages
  const totalPages = count ? Math.ceil(count / limit) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <ClipboardDocumentListIcon className="h-8 w-8 text-rtpa-blue-500 mr-3" />
            <div>
              <h1 className="text-3xl font-bold font-heading text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1 font-body">Manage and prioritize your transportation projects</p>
            </div>
          </div>
          <div>
            <Link 
              href="/projects/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500 transition-colors"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Project
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-card rounded-xl p-5 border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold mb-4 font-heading text-gray-900">Filter Projects</h2>
        <ProjectFilters 
          statusFilters={status}
          categoryFilters={category}
          availableCategories={uniqueCategories}
          searchQuery={query}
        />
      </div>
      
      <div className="bg-white shadow-card rounded-xl border border-gray-100">
        <ProjectsTable 
          projects={projects || []}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count || 0}
          limit={limit}
        />
      </div>
    </div>
  );
}
