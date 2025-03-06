import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
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

  // Fetch user profile to check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your agency settings and users</p>
      </div>
      
      {/* Admin Navigation */}
      <nav className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin"
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/llm-settings"
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          LLM Settings
        </Link>
        <Link
          href="/admin/env-settings"
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Environment Variables
        </Link>
      </nav>

      {children}
    </div>
  );
} 