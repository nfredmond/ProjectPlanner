import React from 'react';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeftIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link 
          href={`/projects/${params.id}`} 
          className="inline-flex items-center text-rtpa-blue-600 hover:text-rtpa-blue-800 text-sm font-medium transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Project
        </Link>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <CurrencyDollarIcon className="h-8 w-8 text-rtpa-blue-500 mr-3" />
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-900">{project.title}</h1>
            <p className="text-gray-600 font-body">Grant Analysis and Funding Opportunities</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
        <GrantAnalysisContainer 
          projectId={params.id} 
          grantPrograms={grantPrograms || []}
          existingAnalyses={existingAnalyses || []}
        />
      </div>
    </div>
  );
} 