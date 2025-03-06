import React from 'react';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import GrantAnalysisContainer from '@/components/projects/grant-analysis-container';
import { Metadata } from 'next';

interface PageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Grant Analysis | RTPA Project Planner',
  description: 'Analyze project eligibility for grants and funding opportunities',
};

export default async function GrantAnalysisPage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch the project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single();
  
  if (error || !project) {
    notFound();
  }
  
  // Fetch grant programs
  const { data: grantPrograms = [] } = await supabase
    .from('grant_programs')
    .select('*')
    .order('name');
  
  // Fetch existing analyses for this project
  const { data: existingAnalyses = [] } = await supabase
    .from('grant_analyses')
    .select('*, grant_program(*)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false });
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
        <p className="text-gray-600">Grant Analysis and Funding Opportunities</p>
      </div>
      
      <GrantAnalysisContainer 
        projectId={params.id} 
        grantPrograms={grantPrograms || []}
        existingAnalyses={existingAnalyses || []}
      />
    </div>
  );
} 