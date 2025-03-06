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

export const metadata = {
  title: 'Dashboard | RTPA Project Prioritization',
  description: 'Overview of your agency\'s transportation projects',
};

export default async function DashboardPage() {
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

  // Calculate metrics from the fetched data
  const projectCount = statusCounts ? statusCounts.reduce((sum, item) => sum + item.count, 0) : 0;
  
  // Get active project count
  const activeCount = statusCounts ? 
    statusCounts.find(s => s.status === 'active')?.count || 0 : 0;
    
  // Get completed project count
  const completedCount = statusCounts ? 
    statusCounts.find(s => s.status === 'completed')?.count || 0 : 0;
    
  // Get total cost
  const totalCost = costData?.total_cost || 0;
  
  // Get feedback count
  const feedbackCount = recentFeedback?.length || 0;
  
  // Format currency for display
  const formatCurrency = (amount) => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <HomeIcon className="h-8 w-8 text-rtpa-blue-500 mr-3" />
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1 font-body">Overview of your agency's transportation projects</p>
          </div>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
          <MetricCard 
            title="Total Projects"
            value={projectCount}
            icon="projects"
            trend="+12% from last month"
            trendUp={true}
          />
        </div>
        
        <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
          <MetricCard 
            title="Active Projects"
            value={activeCount}
            icon="active"
            trend="+5% from last month"
            trendUp={true}
          />
        </div>
        
        <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
          <MetricCard 
            title="Total Budget"
            value={formatCurrency(totalCost)}
            icon="budget"
            trend="+8.2% from last quarter"
            trendUp={true}
          />
        </div>
        
        <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
          <MetricCard 
            title="Completed Projects"
            value={completedCount}
            icon="completed"
            trend="+3% from last month"
            trendUp={true}
          />
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 font-heading text-gray-900">Projects by Status</h2>
          <ProjectStatusChart data={statusCounts || []} />
        </div>
        
        <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 font-heading text-gray-900">Projects by Category</h2>
          <ProjectCategoryChart data={categoryCounts || []} />
        </div>
        
        <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 font-heading text-gray-900">Project Costs</h2>
          <ProjectCostChart agencyId={profile.agency_id} />
        </div>
      </div>
      
      {/* Map and Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold font-heading text-gray-900">Project Map</h2>
            <Link href="/map" className="text-rtpa-blue-600 text-sm font-medium hover:text-rtpa-blue-800 transition-colors">
              View full map →
            </Link>
          </div>
          <MapPreview agencyId={profile.agency_id} />
        </div>
        
        <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold font-heading text-gray-900">Recent Activity</h2>
            <Link href="/projects" className="text-rtpa-blue-600 text-sm font-medium hover:text-rtpa-blue-800 transition-colors">
              View all projects →
            </Link>
          </div>
          <RecentProjectsTable projects={recentProjects || []} />
        </div>
      </div>
      
      {/* Community Feedback */}
      <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold font-heading text-gray-900">Recent Community Feedback</h2>
          <Link href="/community" className="text-rtpa-blue-600 text-sm font-medium hover:text-rtpa-blue-800 transition-colors">
            View all feedback →
          </Link>
        </div>
        <RecentFeedbackList feedback={typedFeedback} />
      </div>
    </div>
  );
}
