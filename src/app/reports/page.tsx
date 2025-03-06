import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { DocumentChartBarIcon } from '@heroicons/react/24/outline';
import ReportTypeSelector from '@/components/reports/report-type-selector';
import RecentReports from '@/components/reports/recent-reports';
import { StatusCount } from '@/components/dashboard/types';

export const metadata = {
  title: 'Reports | RTPA Project Prioritization',
  description: 'Generate reports and analytics for your transportation projects',
};

export default async function ReportsPage() {
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
  
  // Fetch recent reports
  const { data: recentReports } = await supabase
    .from('reports')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  // Get project count by status for report options
  const { data: statusCounts } = await supabase
    .rpc('get_project_counts_by_status', { agency_id_param: profile.agency_id });
  
  // Calculate total projects
  const totalProjects = statusCounts?.reduce((sum: number, item: StatusCount) => sum + item.count, 0) || 0;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <DocumentChartBarIcon className="h-8 w-8 text-rtpa-blue-500 mr-3" />
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1 font-body">Generate reports and analytics for your transportation projects</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
            <ReportTypeSelector 
              profile={profile} 
              totalProjects={totalProjects} 
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-4 font-heading text-gray-900">Recent Reports</h2>
            <RecentReports 
              reports={recentReports || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
