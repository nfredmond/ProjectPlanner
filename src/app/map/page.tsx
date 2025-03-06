import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import ProjectsMap from '@/components/map/projects-map';
import MapFilters from '@/components/map/map-filters';
import { MapIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Project Map | RTPA Project Prioritization',
  description: 'Interactive map of transportation projects',
};

export default async function MapPage({
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
  
  // Fetch user's profile with agency details
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, agencies:agency_id(*)')
    .eq('id', session.user.id)
    .single();
  
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500">Error loading profile</div>
      </div>
    );
  }
  
  // Parse query parameters for filters
  const status = searchParams.status as string[] || [];
  const category = searchParams.category as string[] || [];
  const minScore = searchParams.min_score ? Number(searchParams.min_score) : undefined;
  const maxScore = searchParams.max_score ? Number(searchParams.max_score) : undefined;
  
  // Fetch all projects with geometry for the agency
  let projectsQuery = supabase
    .from('projects')
    .select('id, title, status, primary_category, cost_estimate, score_total, geom')
    .eq('agency_id', profile.agency_id)
    .not('geom', 'is', null);
  
  // Add filters if provided
  if (status.length > 0) {
    projectsQuery = projectsQuery.in('status', status);
  }
  
  if (category.length > 0) {
    projectsQuery = projectsQuery.in('primary_category', category);
  }
  
  if (minScore !== undefined) {
    projectsQuery = projectsQuery.gte('score_total', minScore);
  }
  
  if (maxScore !== undefined) {
    projectsQuery = projectsQuery.lte('score_total', maxScore);
  }
  
  const { data: projects } = await projectsQuery;
  
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
  
  // Get agency settings for default map center
  const defaultMapCenter = profile.agencies?.settings?.default_map_center || [36.7783, -119.4179]; // Default to California
  const defaultMapZoom = profile.agencies?.settings?.default_map_zoom || 6;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <MapIcon className="h-8 w-8 text-rtpa-blue-500 mr-3" />
          <h1 className="text-3xl font-bold font-heading text-gray-900">Project Map</h1>
        </div>
        <p className="text-gray-600 text-lg mb-2 font-body">Interactive map of transportation projects</p>
        <div className="bg-blue-50 text-blue-700 rounded-md p-3 flex items-start">
          <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium">Click anywhere on the map to submit feedback about a location</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow-card rounded-xl p-4 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 font-heading text-gray-900">Filter Projects</h2>
            <MapFilters 
              statusFilters={status}
              categoryFilters={category}
              availableCategories={uniqueCategories}
              minScore={minScore}
              maxScore={maxScore}
            />
          </div>
        </div>
        
        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow-card rounded-xl overflow-hidden border border-gray-100">
            <div className="h-[calc(100vh-240px)] min-h-[500px]">
              <ProjectsMap 
                projects={projects || []}
                defaultCenter={defaultMapCenter}
                defaultZoom={defaultMapZoom}
                agencyId={profile.agency_id}
                enableFeedback={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
