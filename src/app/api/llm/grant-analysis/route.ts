import { NextRequest, NextResponse } from "next/server";
import { getLlmResponse } from "@/lib/llm/service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { projectId, grantProgram } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }
    
    // Get the current user's session
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch the project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        *,
        project_location(*),
        project_costs(*),
        project_criteria(*)
      `)
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Fetch grant program details if provided
    let grantDetails = null;
    if (grantProgram) {
      const { data: grantData, error: grantError } = await supabase
        .from("grant_programs")
        .select("*")
        .eq("id", grantProgram)
        .single();
      
      if (!grantError) {
        grantDetails = grantData;
      }
    }

    // Construct the prompt for the LLM
    const prompt = constructGrantAnalysisPrompt(project, grantDetails);

    // Call the LLM service
    const llmResponse = await getLlmResponse({
      prompt,
      purpose: "grant_analysis",
      user_id: session.user.id,
      system_message: getGrantAnalysisSystemPrompt(),
      max_tokens: 1500
    });

    // Parse the LLM response to extract structured data
    const analysisResult = parseGrantAnalysisResponse(llmResponse.text);

    // Store the analysis result in the database
    await supabase.from("project_grant_analyses").insert({
      project_id: projectId,
      grant_program_id: grantProgram || null,
      analysis_result: analysisResult,
      raw_response: llmResponse.text,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      model_used: llmResponse.model,
      tokens_used: llmResponse.tokens_used
    });

    // Return the analysis result
    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      raw_response: llmResponse.text
    });
  } catch (error) {
    console.error("Error in grant analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze project for grant eligibility" },
      { status: 500 }
    );
  }
}

/**
 * Construct a prompt for the grant analysis
 */
function constructGrantAnalysisPrompt(project: any, grantDetails: any) {
  let prompt = `Please analyze the following transportation project for grant funding eligibility and scoring.

PROJECT DETAILS:
Name: ${project.title}
Description: ${project.description}
Type: ${project.project_type}
Estimated Cost: $${project.project_costs?.[0]?.total_cost || 'Unknown'}
Location: ${project.project_location?.description || 'Not specified'}
`;

  // Add project benefits if available
  if (project.benefits) {
    prompt += `\nProject Benefits: ${project.benefits}`;
  }

  // Add project scoring criteria if available
  if (project.project_criteria && project.project_criteria.length > 0) {
    prompt += `\n\nCurrent Project Scoring:`;
    project.project_criteria.forEach((criterion: any) => {
      prompt += `\n- ${criterion.name}: ${criterion.score} (out of ${criterion.max_score})`;
    });
  }

  // Add grant program details if available
  if (grantDetails) {
    prompt += `\n\nGRANT PROGRAM:
Name: ${grantDetails.name}
Description: ${grantDetails.description}
Total Funding Available: $${grantDetails.funding_amount}
Application Deadline: ${grantDetails.deadline}
`;

    if (grantDetails.eligibility_criteria) {
      prompt += `\nEligibility Criteria:\n${grantDetails.eligibility_criteria}`;
    }

    if (grantDetails.scoring_criteria) {
      prompt += `\nScoring Criteria:\n${grantDetails.scoring_criteria}`;
    }
  } else {
    // If no specific grant program is provided, use general analysis
    prompt += `\n\nPlease evaluate this project for potential grant funding opportunities based on common federal and California state transportation grant programs (like ATP, INFRA, RAISE, SB1, etc.). Focus on:
1. Overall grant eligibility based on project type and characteristics
2. Strengths and weaknesses for competitive grants
3. Specific grant programs that might be a good fit
4. Scoring prediction for typical criteria (safety, equity, climate impact, etc.)
5. Suggestions to improve the project's competitiveness for grants`;
  }

  return prompt;
}

/**
 * Get system prompt for grant analysis
 */
function getGrantAnalysisSystemPrompt() {
  return `You are an expert transportation funding analyst with deep knowledge of federal and California transportation grant programs. 
Your task is to evaluate transportation projects for grant eligibility and competitiveness.
You understand the nuances of different funding programs including ATP, INFRA, RAISE, SB1, and other state/federal sources.
Provide thorough, objective analysis with specific scoring predictions when possible.
Structure your response in a clear, organized format covering eligibility, strengths/weaknesses, suggested improvements, and predicted scores.
Base your evaluation on the grant criteria if provided, or on typical transportation grant criteria if not specified.`;
}

/**
 * Parse the LLM response to extract structured data
 */
function parseGrantAnalysisResponse(responseText: string) {
  // This is a simplified parser - a more sophisticated version would use regex
  // or more robust parsing to extract structured data from the LLM response
  
  const result: any = {
    eligibility: {},
    strengths: [],
    weaknesses: [],
    recommendations: [],
    predictedScores: {},
    overallScore: null,
    suggestedPrograms: []
  };

  // Extract Overall Score if present (looking for patterns like "Overall Score: 85/100")
  const overallScoreMatch = responseText.match(/Overall Score:?\s*(\d+)(?:\/|\s*out of\s*)(\d+)/i);
  if (overallScoreMatch) {
    result.overallScore = {
      score: parseInt(overallScoreMatch[1]),
      maxScore: parseInt(overallScoreMatch[2])
    };
  }

  // Extract sections (very simplified - would need more robust parsing in production)
  const sections = responseText.split(/\n\s*#{1,3}\s*/); // Split by headings
  
  sections.forEach(section => {
    const lines = section.split('\n');
    const heading = lines[0]?.trim().toLowerCase();
    
    if (heading?.includes('eligib')) {
      result.eligibility.analysis = section.replace(lines[0], '').trim();
      // Try to extract Yes/No/Maybe
      const eligibilityMatch = section.match(/eligib\w+:?\s*(yes|no|maybe|likely|unlikely)/i);
      if (eligibilityMatch) {
        result.eligibility.status = eligibilityMatch[1].toLowerCase();
      }
    }
    
    if (heading?.includes('strength')) {
      const strengthLines = section.replace(lines[0], '').trim().split(/\n-|\n\d+\./);
      result.strengths = strengthLines
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    
    if (heading?.includes('weakness') || heading?.includes('challenge')) {
      const weaknessLines = section.replace(lines[0], '').trim().split(/\n-|\n\d+\./);
      result.weaknesses = weaknessLines
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    
    if (heading?.includes('recommend') || heading?.includes('improve')) {
      const recommendationLines = section.replace(lines[0], '').trim().split(/\n-|\n\d+\./);
      result.recommendations = recommendationLines
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    
    if (heading?.includes('score') || heading?.includes('rating')) {
      // Attempt to extract criterion scores
      const scoreLines = section.replace(lines[0], '').trim().split('\n');
      scoreLines.forEach(line => {
        const scoreMatch = line.match(/(.+?):\s*(\d+(?:\.\d+)?)(?:\/|\s*out of\s*)(\d+)/i);
        if (scoreMatch) {
          const criterion = scoreMatch[1].trim();
          const score = parseFloat(scoreMatch[2]);
          const maxScore = parseInt(scoreMatch[3]);
          
          if (criterion.toLowerCase() !== 'overall') {
            result.predictedScores[criterion] = { score, maxScore };
          }
        }
      });
    }
    
    if (heading?.includes('program') || heading?.includes('funding')) {
      const programLines = section.replace(lines[0], '').trim().split(/\n-|\n\d+\./);
      result.suggestedPrograms = programLines
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toLowerCase().includes('conclusion'));
    }
  });

  return result;
} 