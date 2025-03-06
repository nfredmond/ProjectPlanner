import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Project</h1>
        <p className="text-gray-500 mt-1">Create a new transportation project for your agency</p>
      </div>
      
      <ProjectForm 
        profile={profile as UserProfile & { agencies: { name: string } }}
        criteria={criteria as Criterion[]}
        categoryOptions={uniqueCategories}
      />
    </div>
  );
}
