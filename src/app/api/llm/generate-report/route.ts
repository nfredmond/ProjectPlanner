import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getLlmResponse } from '@/lib/llm/service';

export async function POST(request: Request) {
  try {
    const { projectIds, reportType, templateId } = await request.json();
    
    if (!projectIds || !projectIds.length) {
      return NextResponse.json({ error: 'Project IDs are required' }, { status: 400 });
    }

    if (!reportType) {
      return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
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

    // Fetch projects data
    const { data: projects, error: projectsError } = await supabase
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
          description
        ),
        feedback (
          id,
          content,
          status,
          sentiment,
          upvotes,
          downvotes
        )
      `)
      .in('id', projectIds)
      .eq('feedback.status', 'approved');

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Fetch report template if provided
    let templateContent = '';
    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('report_templates')
        .select('content')
        .eq('id', templateId)
        .single();

      if (!templateError && template) {
        templateContent = template.content;
      }
    }

    // Fetch the agency settings to get preferred LLM provider
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const { data: agencySettings, error: agencyError } = await supabase
      .from('agencies')
      .select('settings, name')
      .eq('id', userProfile.agency_id)
      .single();

    if (agencyError) {
      console.error('Error fetching agency settings:', agencyError);
    }

    const llmProvider = agencySettings?.settings?.preferred_llm_provider || 'openai';
    const agencyName = agencySettings?.name || 'Regional Transportation Planning Agency';

    // Determine the report structure based on type
    let reportStructure = '';
    switch (reportType) {
      case 'grant_application':
        reportStructure = `
          # Grant Application Summary
          ## Project Overview
          ## Purpose and Need
          ## Project Benefits
          ## Expected Outcomes
          ## Community Support
          ## Budget and Timeline
          ## Conclusion
        `;
        break;
      case 'board_memo':
        reportStructure = `
          # Board Meeting Memo
          ## Executive Summary
          ## Background
          ## Project Details
          ## Staff Recommendation
          ## Fiscal Impact
          ## Next Steps
        `;
        break;
      case 'rtp_chapter':
        reportStructure = `
          # Regional Transportation Plan Project List
          ## Introduction
          ## Methodology
          ## Project Summaries
          ## Implementation Strategy
          ## Performance Metrics
        `;
        break;
      case 'public_summary':
        reportStructure = `
          # Public-Facing Project Summary
          ## Overview
          ## Benefits to the Community
          ## Timeline
          ## How to Get Involved
          ## Frequently Asked Questions
        `;
        break;
      default:
        reportStructure = `
          # Project Summary Report
          ## Executive Summary
          ## Project Details
          ## Analysis and Findings
          ## Recommendations
          ## Next Steps
        `;
    }

    // Use template content if available
    const structure = templateContent || reportStructure;

    // Format project data for the LLM
    const projectsData = projects.map(project => {
      const criteriaScores = project.project_criteria_scores.map((score: any) => {
        const criterion = project.criteria.find((c: any) => c.id === score.criteria_id);
        return `${criterion?.name || 'Unknown'}: ${score.score_value}/${criterion?.max_points || 5}`;
      }).join(', ');

      // Calculate community sentiment
      const feedbackCount = project.feedback?.length || 0;
      const approvalRatio = feedbackCount > 0 
        ? project.feedback.reduce((acc: number, fb: any) => acc + (fb.upvotes - fb.downvotes), 0) / feedbackCount 
        : 0;
      const sentimentDescription = approvalRatio > 0.5 
        ? 'Positive' 
        : approvalRatio < -0.5 
          ? 'Negative' 
          : 'Mixed/Neutral';

      return `
        Project: ${project.title}
        Description: ${project.description}
        Status: ${project.status}
        Cost Estimate: ${project.cost_estimate || 'Not specified'}
        Criteria Scores: ${criteriaScores}
        Community Feedback: ${feedbackCount} comments, Overall sentiment: ${sentimentDescription}
      `;
    }).join('\n\n');

    // Construct the prompt for the LLM
    const prompt = `
      You are an expert transportation planner creating a professional report for ${agencyName}.
      
      REPORT TYPE: ${reportType.replace(/_/g, ' ').toUpperCase()}
      
      REQUESTED STRUCTURE:
      ${structure}
      
      PROJECTS TO INCLUDE:
      ${projectsData}
      
      Please generate a comprehensive, well-structured report following the requested format.
      The report should be professional, clear, and suitable for the intended audience.
      Use Markdown formatting for structure (headings, lists, etc.).
      
      Keep the tone formal and objective, while highlighting project benefits and community impact.
      Avoid technical jargon unless necessary and explain any specialized terms.
      
      The report should be comprehensive but concise, focusing on key information that decision-makers need.
    `;

    // Call the LLM service
    const llmResponse = await getLlmResponse({
      prompt,
      purpose: 'generate_report',
      user_id: session.user.id,
      max_tokens: 4000, // Longer output for reports
      system_message: 'You are an expert transportation planner creating professional reports and summaries. You write clear, concise, and informative content that follows standard government document formatting and style guidelines.',
    }, llmProvider as any);

    // Store the generated report in the database
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        agency_id: userProfile.agency_id,
        report_type: reportType,
        content: llmResponse.text,
        parameters: { projectIds, templateId },
        generated_by: session.user.id,
        model_used: llmResponse.model,
        tokens_used: llmResponse.tokens_used
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error saving report:', reportError);
    }

    // Return the response
    return NextResponse.json({
      report: llmResponse.text,
      model: llmResponse.model,
      report_id: reportData?.id
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
} 