import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { FeedbackAnalyticsDashboard } from '@/components/community/feedback-analytics-dashboard';

export const metadata = {
  title: 'Feedback Analytics | RTPA Project Prioritization',
  description: 'Analyze community feedback data',
};

export default async function FeedbackAnalyticsPage() {
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
  
  // Fetch feedback data for analytics
  const { data: feedbackRawData } = await supabase
    .from('feedback')
    .select('id, content, sentiment, status, created_at, project_id, projects(title)')
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false });
    
  // Transform the data to match the FeedbackItem interface
  const feedbackData = feedbackRawData?.map((item: any) => ({
    ...item,
    projects: item.projects && item.projects.length > 0 ? item.projects[0] : { title: '' }
  }));
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback Analytics</h1>
        <p className="text-gray-500 mt-1">Analyze community feedback data and trends</p>
      </div>
      
      <FeedbackAnalyticsDashboard 
        feedbackData={feedbackData || []} 
        agencyId={profile.agency_id}
      />
    </div>
  );
} 