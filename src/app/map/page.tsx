import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import ProjectsMap from '@/components/map/projects-map';
import MapFilters from '@/components/map/map-filters';

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
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Project Map</h1>
        <p className="text-gray-500 mt-1">Interactive map of transportation projects</p>
        <p className="text-sm text-blue-600 mt-1">Click anywhere on the map to submit feedback about a location</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <MapFilters 
            statusFilters={status}
            categoryFilters={category}
            availableCategories={uniqueCategories}
            minScore={minScore}
            maxScore={maxScore}
          />
        </div>
        
        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
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
