import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedbackAnalyticsWrapper } from '@/components/community/feedback-analytics-wrapper';
import { ResponseTemplatesWrapper } from '@/components/community/response-templates-wrapper';

export const metadata = {
  title: 'Community Feedback Analytics | RTPA Project Prioritization',
  description: 'Analyze community feedback and manage response templates'
};

export default async function CommunityAnalyticsPage() {
  const supabase = await createServerComponentClient();
  
  // Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login');
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, 
      first_name, 
      last_name, 
      role,
      agencies:agency_id (
        id, 
        name
      )
    `)
    .eq('id', session.user.id)
    .single();
  
  // Check if user has permission to access this page
  const isAdminOrEditor = profile?.role === 'admin' || profile?.role === 'editor';
  if (!isAdminOrEditor) {
    redirect('/dashboard');
  }
  
  // Extract agency info
  const agencyId = profile?.agencies ? profile.agencies[0]?.id : undefined;
  const agencyName = profile?.agencies ? profile.agencies[0]?.name : undefined;
  
  // Fetch all feedback for the user's agency
  const { data: feedbackItems } = await supabase
    .from('feedback')
    .select(`
      id,
      content,
      sentiment,
      status,
      created_at,
      project_id,
      projects:project_id (
        id,
        title
      )
    `)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community Feedback Analytics</h1>
        <p className="text-gray-600">
          Analyze feedback trends and manage response templates for {agencyName || 'your agency'}.
        </p>
      </div>
      
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="analytics">Feedback Analytics</TabsTrigger>
          <TabsTrigger value="templates">Response Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="space-y-6">
          <FeedbackAnalyticsWrapper 
            feedbackItems={feedbackItems || []} 
            agencyId={agencyId || ''}
          />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <ResponseTemplatesWrapper />
        </TabsContent>
      </Tabs>
    </div>
  );
} 