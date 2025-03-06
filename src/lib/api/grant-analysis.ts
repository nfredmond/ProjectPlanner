import { createClientComponentClient } from '@/lib/supabase-client';
import { GrantAnalysisResult, GrantProgram } from '@/types/grant-analysis';

// Initialize the Supabase client
const supabase = createClientComponentClient();

/**
 * Get grant programs for the current user's agency
 */
export const getGrantPrograms = async (): Promise<GrantProgram[]> => {
  const { data, error } = await supabase
    .from('grant_programs')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching grant programs:', error);
    throw new Error('Failed to fetch grant programs');
  }
  
  return data || [];
};

/**
 * Get the latest grant analysis for a project
 */
export const getLatestGrantAnalysis = async (projectId: string): Promise<GrantAnalysisResult | null> => {
  const { data, error } = await supabase
    .rpc('get_latest_project_analysis', { project_id: projectId });
  
  if (error) {
    console.error('Error fetching latest grant analysis:', error);
    return null;
  }
  
  return data?.length > 0 ? data[0].analysis_result : null;
};

/**
 * Get all grant analyses for a project
 */
export const getProjectGrantAnalyses = async (projectId: string) => {
  const { data, error } = await supabase
    .from('project_grant_analyses')
    .select(`
      *,
      grant_program:grant_program_id(id, name)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching project grant analyses:', error);
    throw new Error('Failed to fetch project grant analyses');
  }
  
  return data || [];
};

/**
 * Delete a grant analysis
 */
export const deleteGrantAnalysis = async (analysisId: string) => {
  const { error } = await supabase
    .from('project_grant_analyses')
    .delete()
    .eq('id', analysisId);
  
  if (error) {
    console.error('Error deleting grant analysis:', error);
    throw new Error('Failed to delete analysis');
  }
  
  return true;
};

/**
 * Run a grant analysis for a project
 */
export const runGrantAnalysis = async (projectId: string, grantProgramId?: string) => {
  const response = await fetch('/api/llm/grant-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId,
      grantProgram: grantProgramId,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze project for grant eligibility');
  }
  
  const data = await response.json();
  return data;
}; 