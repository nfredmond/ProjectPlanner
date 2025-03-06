import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { NotificationsTable } from '@/components/layout/notifications-table';

export const metadata = {
  title: 'Notifications | RTPA Project Prioritization',
  description: 'View and manage your notifications',
};

export default async function NotificationsPage() {
  const supabase = await createServerComponentClient();
  
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return <div>Loading...</div>;
  }
  
  // Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, agencies:agency_id(*)')
    .eq('id', session.user.id)
    .single();
  
  if (!profile) {
    return <div>Error loading profile</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-gray-500 mt-1">View and manage your notifications</p>
      </div>
      
      <NotificationsTable userId={session.user.id} />
    </div>
  );
} 