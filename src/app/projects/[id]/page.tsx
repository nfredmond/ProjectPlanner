import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import ProjectDetailTabs from '@/components/projects/project-detail-tabs';
import ProjectDetailHeader from '@/components/projects/project-detail-header';
import ProjectDetailSidebar from '@/components/projects/project-detail-sidebar';

export const revalidate = 0; // Disable caching for this page

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const supabase = await createServerComponentClient();
  
  const { data: project } = await supabase
    .from('projects')
    .select('title')
    .eq('id', params.id)
    .single();
  
  return {
    title: project ? `${project.title} | RTPA Project Prioritization` : 'Project | RTPA Project Prioritization',
    description: 'View and manage project details',
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
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
  
  // Fetch project details
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      created_by_user:profiles!projects_created_by_fkey(id, first_name, last_name, email)
    `)
    .eq('id', params.id)
    .eq('agency_id', profile.agency_id)
    .single();
  
  if (error || !project) {
    notFound();
  }
  
  // Fetch criteria
  const { data: criteria } = await supabase
    .from('criteria')
    .select('*')
    .or(`agency_id.eq.${profile.agency_id},is_default.eq.true`)
    .order('order');
  
  // Fetch project scores
  const { data: projectScores } = await supabase
    .from('project_criteria_scores')
    .select('*, criteria(*)')
    .eq('project_id', params.id);
  
  // Fetch project feedback
  const { data: projectFeedback } = await supabase
    .from('feedback')
    .select('*, user:profiles(first_name, last_name)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false });
  
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
      
      <div className="bg-white shadow-card rounded-xl border border-gray-100 mb-6 p-6">
        <ProjectDetailHeader project={project} profile={profile} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-card rounded-xl border border-gray-100">
            <ProjectDetailTabs 
              project={project} 
              criteria={criteria || []} 
              projectScores={projectScores || []} 
              feedback={projectFeedback || []}
              profile={profile}
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white shadow-card rounded-xl border border-gray-100 p-5">
            <ProjectDetailSidebar 
              project={project} 
              scores={projectScores || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
