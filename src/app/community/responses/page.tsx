import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ResponseApprovalWrapper } from '@/components/community/response-approval-wrapper';

export const metadata = {
  title: 'Response Approval | RTPA Project Prioritization',
  description: 'Review and approve automated responses to community feedback'
};

export default async function ResponseApprovalPage() {
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
      agency_id
    `)
    .eq('id', session.user.id)
    .single();
  
  // Check if user has permission to access this page
  const isAdminOrEditor = profile?.role === 'admin' || profile?.role === 'editor';
  if (!isAdminOrEditor) {
    redirect('/dashboard');
  }
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Response Approval Workflow</h1>
        <p className="text-gray-600">
          Review and approve automated responses to community feedback.
        </p>
      </div>
      
      <ResponseApprovalWrapper agencyId={profile?.agency_id || ''} />
    </div>
  );
} 