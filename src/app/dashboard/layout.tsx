import React from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';
import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerComponentClient();

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user profile to get agency and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, agencies:agency_id(*)')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    // If profile doesn't exist, sign out
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userData={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header userData={profile} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
