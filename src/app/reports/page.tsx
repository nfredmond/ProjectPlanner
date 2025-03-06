import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-500 mt-1">Generate reports and analytics for your transportation projects</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReportTypeSelector 
            profile={profile} 
            totalProjects={totalProjects} 
          />
        </div>
        
        <div className="lg:col-span-1">
          <RecentReports 
            reports={recentReports || []}
          />
        </div>
      </div>
    </div>
  );
}
