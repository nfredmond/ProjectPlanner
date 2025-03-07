import React, { Suspense } from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { ProjectStatus } from '@/types';
import { HomeIcon } from '@heroicons/react/24/outline';
import MetricCard from '@/components/dashboard/metric-card';
import ProjectStatusChart from '@/components/dashboard/project-status-chart';
import ProjectCategoryChart from '@/components/dashboard/project-category-chart';
import ProjectCostChart from '@/components/dashboard/project-cost-chart';
import RecentProjectsTable from '@/components/dashboard/recent-projects-table';
import RecentFeedbackList from '@/components/dashboard/recent-feedback-list';
import MapPreview from '@/components/dashboard/map-preview';
import { StatusCount } from '@/components/dashboard/types';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
  title: 'Dashboard | RTPA Project Prioritization',
  description: 'Overview of your agency\'s transportation projects',
};

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Get current user profile
  const { data: { session } } = await supabase.auth.getSession();
  
  // Fetch user profile data
  const { data: profile, error: profileError } = session ? 
    await supabase
      .from('profiles')
      .select('*, agencies(name)')
      .eq('id', session.user.id)
      .single() : 
    { data: null, error: null };

  // Fetch recent projects
  const { data: projects, error: projectsError } = session ?
    await supabase
      .from('projects')
      .select('id, title, status, created_at, updated_at')
      .eq('agency_id', profile?.agency_id)
      .order('updated_at', { ascending: false })
      .limit(5) :
    { data: null, error: null };

  // Fetch project count
  const { count: projectCount, error: countError } = session ?
    await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile?.agency_id) :
    { count: 0, error: null };

  // Fetch counts by status
  const { data: statusCounts } = await supabase
    .rpc('get_project_counts_by_status', { agency_id_param: profile?.agency_id });
  
  // Fetch total project cost
  const { data: costData } = await supabase
    .rpc('get_total_project_cost', { agency_id_param: profile?.agency_id });
  
  // Fetch project count by category
  const { data: categoryCounts } = await supabase
    .rpc('get_project_counts_by_category', { agency_id_param: profile?.agency_id });
  
  // Fetch recent feedback
  const { data: recentFeedback } = await supabase
    .from('feedback')
    .select('id, content, sentiment, created_at, projects(title)')
    .eq('agency_id', profile?.agency_id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Calculate metrics from the fetched data
  const totalCost = costData?.total_cost || 0;
  
  // Get feedback count
  const feedbackCount = recentFeedback?.length || 0;
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Transform the recentFeedback to match FeedbackItem structure
  const typedFeedback = (recentFeedback || []).map(item => ({
    id: item.id,
    content: item.content,
    sentiment: item.sentiment,
    created_at: item.created_at,
    projects: Array.isArray(item.projects) && item.projects.length > 0 
      ? { title: item.projects[0].title } 
      : item.projects
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link 
          href="/projects/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          New Project
        </Link>
      </div>

      {/* Error handling */}
      {(profileError || projectsError || countError) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error loading dashboard data:</p>
          <ul className="list-disc list-inside">
            {profileError && <li>{profileError.message}</li>}
            {projectsError && <li>{projectsError.message}</li>}
            {countError && <li>{countError.message}</li>}
          </ul>
        </div>
      )}

      {/* Welcome section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          Welcome, {profile?.first_name || 'User'}!
        </h2>
        <p className="text-gray-600 mb-4">
          {profile?.agencies?.name ? `Agency: ${profile.agencies.name}` : 'No agency assigned'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">Projects</h3>
            <p className="text-3xl font-bold text-blue-600">{projectCount || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Active</h3>
            <p className="text-3xl font-bold text-green-600">
              {projects?.filter(p => p.status === 'active').length || 0}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800">Planned</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {projects?.filter(p => p.status === 'planned').length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Recent projects */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
        {projects && projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/projects/${project.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                        View
                      </Link>
                      <Link href={`/projects/${project.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No projects found. Get started by creating your first project.</p>
        )}
        <div className="mt-4 text-right">
          <Link 
            href="/projects" 
            className="text-blue-600 hover:text-blue-800"
          >
            View all projects →
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              href="/projects" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center"
            >
              <span className="text-lg font-medium text-gray-900">Projects</span>
              <span className="text-sm text-gray-500">Manage all projects</span>
            </Link>
            <Link 
              href="/map" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center"
            >
              <span className="text-lg font-medium text-gray-900">Map</span>
              <span className="text-sm text-gray-500">View spatial data</span>
            </Link>
            <Link 
              href="/prioritization" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center"
            >
              <span className="text-lg font-medium text-gray-900">Prioritize</span>
              <span className="text-sm text-gray-500">Score projects</span>
            </Link>
            <Link 
              href="/reports" 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center"
            >
              <span className="text-lg font-medium text-gray-900">Reports</span>
              <span className="text-sm text-gray-500">Generate insights</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Database Connection</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Authentication</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Storage</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Available</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API Services</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
