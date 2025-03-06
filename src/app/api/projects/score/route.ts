import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getLlmResponse } from '@/lib/llm/service';
import apiResponse from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { projectId, criteria } = body;
    
    if (!projectId || !criteria) {
      return apiResponse.errors.badRequest('Project ID and criteria are required');
    }
    
    // Get project details from Supabase
    const supabase = createAdminClient();
    
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (projectError || !project) {
      return apiResponse.errors.notFound('Project not found');
    }
    
    // Construct prompt for LLM
    const prompt = constructProjectScoringPrompt(project, criteria);
    
    // Get LLM response
    const llmResponse = await getLlmResponse({
      prompt,
      purpose: 'project_scoring',
      system_message: 'You are a transportation planning expert assistant. Score the provided project based on the given criteria, and explain your rationale for each score.',
      max_tokens: 2000,
    });
    
    // Parse the LLM response into structured data
    const scoring = parseScoringResponse(llmResponse.text, criteria);
    
    return apiResponse.success(scoring);
  } catch (error: any) {
    console.error('Error scoring project:', error);
    return apiResponse.errors.serverError(
      'An error occurred while scoring the project',
      { originalError: error.message }
    );
  }
}

/**
 * Construct the prompt for project scoring
 */
function constructProjectScoringPrompt(project: any, criteria: any[]) {
  let prompt = `Please score the following transportation project based on the provided criteria:

Project Title: ${project.title}
Project Status: ${project.status}
Project Category: ${project.primary_category || 'Not specified'}
Estimated Cost: ${project.cost_estimate ? `$${project.cost_estimate.toLocaleString()}` : 'Not specified'}

Project Description:
${project.description || 'No description provided.'}

Scoring Criteria:
`;

  // Add criteria details
  criteria.forEach((criterion, index) => {
    prompt += `${index + 1}. ${criterion.name}: ${criterion.description || 'No description'} (Score from 0-${criterion.max_points || 5})\n`;
  });

  prompt += `\nFor each criterion, provide a score and a brief explanation of your reasoning. Be objective and fair in your assessment.

Format your response as a structured JSON with:
1. criterionScores: Object with criterion IDs as keys and scores as values
2. explanations: Object with criterion IDs as keys and explanation strings as values

For example:
{
  "criterionScores": {
    "criterion-id-1": 4,
    "criterion-id-2": 3
  },
  "explanations": {
    "criterion-id-1": "This project scores well on this criterion because...",
    "criterion-id-2": "The project addresses this criterion partially by..."
  }
}`;

  return prompt;
}

/**
 * Parse the LLM response into structured data
 */
function parseScoringResponse(responseText: string, criteria: any[]) {
  try {
    // Try to extract JSON directly if the response is formatted correctly
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)```/) || 
                      responseText.match(/```([\s\S]*?)```/) ||
                      responseText.match(/{[\s\S]*?}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    
    // If no JSON found, attempt to manually extract scores
    const criterionScores: Record<string, number> = {};
    const explanations: Record<string, string> = {};
    
    criteria.forEach(criterion => {
      const regex = new RegExp(`(${criterion.name}|${criterion.id}).*?([0-5])[^0-9]*?([\\s\\S]*?)(?=\\n\\s*[A-Za-z]|$)`, 'i');
      const match = responseText.match(regex);
      
      if (match) {
        criterionScores[criterion.id] = parseInt(match[2]);
        explanations[criterion.id] = match[3].trim();
      } else {
        // Default fallback if no match found
        criterionScores[criterion.id] = 3; // Middle score as default
        explanations[criterion.id] = `No specific explanation provided for ${criterion.name}.`;
      }
    });
    
    return {
      criterionScores,
      explanations
    };
  } catch (error) {
    console.error('Error parsing scoring response:', error);
    
    // Return default scores if parsing fails
    const criterionScores: Record<string, number> = {};
    const explanations: Record<string, string> = {};
    
    criteria.forEach(criterion => {
      criterionScores[criterion.id] = 3; // Middle score as default
      explanations[criterion.id] = `Unable to extract score explanation for ${criterion.name}.`;
    });
    
    return {
      criterionScores,
      explanations
    };
  }
}
