import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { FeedbackList } from '@/components/community/feedback-list';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Community Feedback | RTPA Project Prioritization',
  description: 'Manage and respond to community feedback on transportation projects',
};

export default async function CommunityFeedbackPage() {
  const supabase = await createServerComponentClient();
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login?returnUrl=/community/feedback');
  }
  
  // Get user profile with agency info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, agencies:agency_id(name)')
    .eq('id', session.user.id)
    .single();
  
  const isAdminOrEditor = profile?.role === 'admin' || profile?.role === 'editor';
  
  // Get feedback for user's agency
  const { data: feedbackItems } = await supabase
    .from('feedback')
    .select(`
      *,
      projects:project_id (
        id,
        title,
        description,
        primary_category
      )
    `)
    .eq('agency_id', profile?.agency_id)
    .order('created_at', { ascending: false });
  
  // Group feedback by status
  const pendingFeedback = feedbackItems?.filter((item: any) => item.status === 'pending') || [];
  const approvedFeedback = feedbackItems?.filter((item: any) => item.status === 'approved') || [];
  const rejectedFeedback = feedbackItems?.filter((item: any) => item.status === 'rejected') || [];
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community Feedback</h1>
        <p className="text-gray-600">
          Review and respond to community feedback for {profile?.agencies?.name || 'your agency'}.
        </p>
      </div>
      
      <div className="space-y-8">
        {pendingFeedback.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                {pendingFeedback.length}
              </span>
              Pending Review
            </h2>
            <FeedbackList 
              feedback={pendingFeedback} 
              enableResponses={isAdminOrEditor}
              enableModeration={isAdminOrEditor}
            />
          </div>
        )}
        
        {approvedFeedback.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                {approvedFeedback.length}
              </span>
              Approved Feedback
            </h2>
            <FeedbackList 
              feedback={approvedFeedback}
              enableResponses={isAdminOrEditor}
            />
          </div>
        )}
        
        {isAdminOrEditor && rejectedFeedback.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                {rejectedFeedback.length}
              </span>
              Rejected Feedback
            </h2>
            <FeedbackList 
              feedback={rejectedFeedback}
              enableResponses={false}
              enableModeration={isAdminOrEditor}
            />
          </div>
        )}
        
        {feedbackItems?.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700">No feedback yet</h3>
            <p className="mt-2 text-gray-500">
              There is no community feedback for your agency&apos;s projects yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 