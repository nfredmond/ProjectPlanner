import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getLlmResponse } from '@/lib/llm/service';

export async function POST(request: Request) {
  try {
    const { projectId, criteriaScore } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get the authenticated user
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        project_criteria_scores (
          criteria_id,
          score_value
        ),
        criteria:project_criteria_scores!inner (
          id,
          name,
          description,
          max_points,
          weight
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch the agency settings to get preferred LLM provider
    const { data: agencySettings, error: agencyError } = await supabase
      .from('agencies')
      .select('settings')
      .eq('id', project.agency_id)
      .single();

    if (agencyError) {
      console.error('Error fetching agency settings:', agencyError);
    }

    const llmProvider = agencySettings?.settings?.preferred_llm_provider || 'openai';

    // Construct a prompt for the LLM
    const prompt = `
      You are an expert transportation planner assisting with project recommendations.
      
      PROJECT DETAILS:
      Title: ${project.title}
      Description: ${project.description}
      Status: ${project.status}
      Cost Estimate: ${project.cost_estimate || 'Not specified'}
      
      EVALUATION CRITERIA AND SCORES:
      ${project.project_criteria_scores.map((score: any) => {
        const criterion = project.criteria.find((c: any) => c.id === score.criteria_id);
        return `${criterion?.name || 'Unknown criterion'}: ${score.score_value}/${criterion?.max_points || 5} (${(score.score_value / (criterion?.max_points || 5) * 100).toFixed(0)}%)`;
      }).join('\n')}
      
      ${criteriaScore ? `The project scored particularly low on: ${criteriaScore.name}` : ''}
      
      Based on the project details and scores above, please provide:
      1. 3-5 specific recommendations to improve the project's effectiveness, especially in any low-scoring areas
      2. Brief examples of similar successful projects that achieved high scores in comparable categories
      3. Potential funding sources that might be suitable for this project based on its characteristics
      
      Format your response in clear sections with bullet points for easy readability.
    `;

    // Call the LLM service
    const llmResponse = await getLlmResponse({
      prompt,
      purpose: 'project_recommendations',
      user_id: session.user.id,
      system_message: 'You are an expert transportation planner providing recommendations to improve transportation projects. Your advice should be practical, specific, and aligned with best practices in transportation planning and engineering.',
    }, llmProvider as any);

    // Return the response
    return NextResponse.json({
      recommendations: llmResponse.text,
      model: llmResponse.model,
    });
    
  } catch (error) {
    console.error('Error generating project recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
} 