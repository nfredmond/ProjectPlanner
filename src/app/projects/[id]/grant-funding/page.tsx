import React from 'react';
import { createServerComponentClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import GrantAnalysisContainer from '@/components/projects/grant-analysis-container';

export const revalidate = 0; // Disable caching for this page

interface GrantFundingPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: GrantFundingPageProps) {
  const supabase = await createServerComponentClient();
  
  const { data: project } = await supabase
    .from('projects')
    .select('title')
    .eq('id', params.id)
    .single();
  
  return {
    title: project ? `Grant Analysis for ${project.title} | RTPA Project Prioritization` : 'Grant Analysis | RTPA Project Prioritization',
    description: 'Analyze project for grant funding eligibility and competitiveness',
  };
}

export default async function GrantFundingPage({ params }: GrantFundingPageProps) {
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
    .select('*')
    .eq('id', params.id)
    .eq('agency_id', profile.agency_id)
    .single();
  
  if (error || !project) {
    notFound();
  }
  
  // Fetch grant programs
  const { data: grantPrograms } = await supabase
    .from('grant_programs')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .order('name');
  
  // Fetch existing analyses
  const { data: analyses } = await supabase
    .from('project_grant_analyses')
    .select(`
      *,
      grant_program:grant_program_id(id, name)
    `)
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
          Back to Project Details
        </Link>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <CurrencyDollarIcon className="h-8 w-8 text-rtpa-blue-500 mr-3" />
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-900">
              Grant Funding Analysis
            </h1>
            <p className="text-gray-600 font-body">
              Analyze {project.title} for grant funding eligibility and competitiveness
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
            <GrantAnalysisContainer 
              projectId={params.id} 
              grantPrograms={grantPrograms || []} 
              existingAnalyses={analyses || []} 
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white shadow-card rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 font-heading text-gray-900">About Grant Analysis</h2>
            <p className="text-sm text-gray-600 mb-4 font-body">
              This feature uses artificial intelligence to analyze your project against common grant funding criteria. 
              The analysis evaluates eligibility for various grant programs, highlights strengths and weaknesses, 
              and provides recommendations to improve competitiveness.
            </p>
            <h3 className="text-md font-medium mt-4 mb-2 font-heading text-gray-800">How it works:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 font-body">
              <li>Select a specific grant program or run a general analysis</li>
              <li>AI reviews your project details against grant criteria</li>
              <li>Receive an analysis with scores, strengths, and recommendations</li>
              <li>Use insights to improve your project&apos;s funding competitiveness</li>
            </ol>
            <p className="text-sm text-gray-500 mt-4 italic font-body">
              Note: Analysis is based on AI interpretation of project data and should be used as guidance, not as a 
              guarantee of funding success.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 