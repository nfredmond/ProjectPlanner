import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeftIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import ProjectForm from '@/components/projects/project-form';
import { Criterion, UserProfile } from '@/types';

export const metadata = {
  title: 'New Project | RTPA Project Prioritization',
  description: 'Create a new transportation project',
};

export default async function NewProjectPage() {
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
  
  // Fetch criteria for the agency (or default criteria if none exist for the agency)
  const { data: criteria } = await supabase
    .from('criteria')
    .select('*')
    .or(`agency_id.eq.${profile.agency_id},is_default.eq.true`)
    .order('order');
  
  // Fetch category options (from existing projects in the system)
  const { data: categories } = await supabase
    .from('projects')
    .select('primary_category')
    .not('primary_category', 'is', null)
    .order('primary_category');
  
  // Get unique categories
  const uniqueCategories = categories
    ? Array.from(new Set(categories.map((item: any) => item.primary_category))) as string[]
    : [];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link 
          href="/projects" 
          className="inline-flex items-center text-rtpa-blue-600 hover:text-rtpa-blue-800 text-sm font-medium transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <PlusCircleIcon className="h-8 w-8 text-rtpa-blue-500 mr-3" />
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-900">New Project</h1>
            <p className="text-gray-600 mt-1 font-body">Create a new transportation project for your agency</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
        <ProjectForm 
          profile={profile as UserProfile & { agencies: { name: string } }}
          criteria={criteria as Criterion[]}
          categoryOptions={uniqueCategories}
        />
      </div>
    </div>
  );
}
