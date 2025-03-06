import React, { Suspense } from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { ProjectStatus } from '@/types';
import MetricCard from '@/components/dashboard/metric-card';
import ProjectStatusChart from '@/components/dashboard/project-status-chart';
import ProjectCategoryChart from '@/components/dashboard/project-category-chart';
import ProjectCostChart from '@/components/dashboard/project-cost-chart';
import RecentProjectsTable from '@/components/dashboard/recent-projects-table';
import RecentFeedbackList from '@/components/dashboard/recent-feedback-list';
import MapPreview from '@/components/dashboard/map-preview';
import { StatusCount } from '@/components/dashboard/types';

export const metadata = {
  title: 'Dashboard | RTPA Project Prioritization',
  description: 'Overview of your agency\'s transportation projects',
};

export default async function DashboardPage() {
  const supabase = await createServerComponentClient();
  
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return <div>Loading...</div>;
  }
  
  // Fetch user's agency
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', session.user.id)
    .single();
  
  if (!profile) {
    return <div>Error loading profile</div>;
  }
  
  // Fetch counts by status
  const { data: statusCounts } = await supabase
    .rpc('get_project_counts_by_status', { agency_id_param: profile.agency_id });
  
  // Fetch total project cost
  const { data: costData } = await supabase
    .rpc('get_total_project_cost', { agency_id_param: profile.agency_id });
  
  // Fetch project count by category
  const { data: categoryCounts } = await supabase
    .rpc('get_project_counts_by_category', { agency_id_param: profile.agency_id });
  
  // Fetch recent projects
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('id, title, status, cost_estimate, created_at, score_total')
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  // Fetch recent feedback
  const { data: recentFeedback } = await supabase
    .from('feedback')
    .select('id, content, sentiment, created_at, projects(title)')
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Format the metrics data
  const metrics = {
    totalProjects: statusCounts?.reduce((acc: number, item: StatusCount) => acc + item.count, 0) || 0,
    activeProjects: statusCounts?.find((item: StatusCount) => item.status === 'active')?.count || 0,
    plannedProjects: statusCounts?.find((item: StatusCount) => item.status === 'planned')?.count || 0,
    completedProjects: statusCounts?.find((item: StatusCount) => item.status === 'completed')?.count || 0,
    totalCost: costData?.total_cost || 0,
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your transportation projects</p>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Projects"
          value={metrics.totalProjects}
          icon="projects"
          trend={"+12% from last month"}
          trendUp={true}
        />
        <MetricCard
          title="Active Projects"
          value={metrics.activeProjects}
          icon="active"
          trend={"+5% from last month"}
          trendUp={true}
        />
        <MetricCard
          title="Total Budget"
          value={`$${(metrics.totalCost / 1000000).toFixed(1)}M`}
          icon="budget"
          trend={"+8.2% from last quarter"}
          trendUp={true}
        />
        <MetricCard
          title="Completed Projects"
          value={metrics.completedProjects}
          icon="completed"
          trend={"+3% from last month"}
          trendUp={true}
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Projects by Status</h2>
          <ProjectStatusChart data={statusCounts || []} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Projects by Category</h2>
          <ProjectCategoryChart data={categoryCounts || []} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Project Costs</h2>
          <ProjectCostChart agencyId={profile.agency_id} />
        </div>
      </div>
      
      {/* Map and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Project Map</h2>
            <a href="/map" className="text-rtpa-blue-600 text-sm font-medium hover:text-rtpa-blue-800">
              View full map →
            </a>
          </div>
          <MapPreview agencyId={profile.agency_id} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <a href="/projects" className="text-rtpa-blue-600 text-sm font-medium hover:text-rtpa-blue-800">
              View all projects →
            </a>
          </div>
          <RecentProjectsTable projects={recentProjects || []} />
        </div>
      </div>
      
      {/* Community Feedback */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Community Feedback</h2>
          <a href="/community" className="text-rtpa-blue-600 text-sm font-medium hover:text-rtpa-blue-800">
            View all feedback →
          </a>
        </div>
        <RecentFeedbackList feedback={typedFeedback} />
      </div>
    </div>
  );
}
