import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-client';
import { getLlmResponse } from '@/lib/llm/service';
import { retrieveRelevantGuidelines } from '@/lib/llm/retrieval';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { 
      projectId, 
      includeScores = true, 
      templateId,
      fundingPrograms = [], // Optional array of funding program IDs to check against
      includeSimilarProjects = false, // Whether to include similar projects in analysis
      includeReferences = true // Whether to include references to guidelines
    } = body;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Get project details from Supabase
    const supabase = createAdminClient();
    
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, profiles(first_name, last_name)')
      .eq('id', projectId)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Get project scores if requested
    let scores: any[] = [];
    if (includeScores) {
      const { data: scoreData, error: scoreError } = await supabase
        .from('project_criteria_scores')
        .select('*, criteria(name, description, weight)')
        .eq('project_id', projectId);
      
      if (!scoreError && scoreData) {
        scores = scoreData;
      }
    }
    
    // Get project feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('project_id', projectId);
    
    const feedbackData = feedbackError ? [] : feedback || [];
    
    // Fetch relevant guidelines based on project details
    let guidelines: any[] = [];
    if (includeReferences) {
      guidelines = await retrieveRelevantGuidelines(project, fundingPrograms);
    }
    
    // Fetch similar projects for comparative analysis
    let similarProjects: any[] = [];
    if (includeSimilarProjects) {
      // Find projects with similar category and near completion
      const { data: similar, error: similarError } = await supabase
        .from('projects')
        .select('id, title, description, primary_category, status, score_total, cost_estimate')
        .eq('primary_category', project.primary_category)
        .neq('id', projectId)
        .eq('status', 'completed')
        .order('score_total', { ascending: false })
        .limit(3);
        
      if (!similarError && similar) {
        similarProjects = similar;
      }
    }
    
    // Get template if specified, otherwise use default
    let template;
    if (templateId) {
      const { data: templateData, error: templateError } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('id', templateId)
        .eq('purpose', 'analyze')
        .eq('is_active', true)
        .single();
      
      if (!templateError && templateData) {
        template = templateData;
      }
    }
    
    // If no specific template was found, get the default for 'analyze' purpose
    if (!template) {
      const { data: defaultTemplate, error: defaultTemplateError } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('purpose', 'analyze')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (defaultTemplateError || !defaultTemplate) {
        // If no template found, use hardcoded prompt
        const prompt = constructProjectAnalysisPrompt(
          project, 
          scores, 
          feedbackData, 
          guidelines, 
          similarProjects,
          fundingPrograms
        );
        
        // Call LLM
        const llmResponse = await getLlmResponse({
          prompt,
          purpose: 'analyze',
          cache_key: `project_analysis_${projectId}_${includeScores}_${includeReferences}_${includeSimilarProjects}`,
        });
        
        // Parse the response
        const parsedResponse = parseAnalysisResponse(llmResponse.text);
        
        return NextResponse.json({
          ...parsedResponse,
          model: llmResponse.model,
          provider: llmResponse.provider,
          cached: llmResponse.cached || false,
        });
      }
      
      template = defaultTemplate;
    }
    
    // Process template with project data
    const projectInfo = JSON.stringify({
      title: project.title,
      description: project.description,
      status: project.status,
      cost_estimate: project.cost_estimate,
      primary_category: project.primary_category,
      metadata: project.metadata,
      score_total: project.score_total,
      score_breakdown: project.score_breakdown,
    }, null, 2);
    
    // Format scores for template
    const scoresInfo = scores.length > 0 
      ? scores.map(score => ({
          criterion: score.criteria.name,
          description: score.criteria.description,
          weight: score.criteria.weight,
          score: score.score_value,
          notes: score.notes,
        }))
      : [];
    
    // Format feedback for template
    const feedbackInfo = feedbackData.length > 0
      ? feedbackData.map(item => ({
          content: item.content,
          sentiment: item.sentiment,
          upvotes: item.upvotes,
          downvotes: item.downvotes,
        }))
      : [];
    
    // Format guidelines for template
    const guidelinesInfo = guidelines.length > 0
      ? guidelines.map(guideline => ({
          source: guideline.source,
          title: guideline.title,
          content: guideline.content,
          relevance: guideline.relevance,
          url: guideline.url,
        }))
      : [];
    
    // Format similar projects for template
    const similarProjectsInfo = similarProjects.length > 0
      ? similarProjects.map(proj => ({
          title: proj.title,
          category: proj.primary_category,
          status: proj.status,
          score: proj.score_total,
          cost: proj.cost_estimate,
        }))
      : [];
    
    // Format funding programs for template
    const fundingProgramsInfo = fundingPrograms.length > 0
      ? fundingPrograms.map((programId: string) => ({
          id: programId,
          // Add more details if available
        }))
      : [];
    
    // Apply variables to template
    let processedTemplate = template.template;
    
    // Replace variables in the template
    const variables: Record<string, string> = {
      project_information: projectInfo,
      scores_information: JSON.stringify(scoresInfo, null, 2),
      feedback_information: JSON.stringify(feedbackInfo, null, 2),
      guidelines_information: JSON.stringify(guidelinesInfo, null, 2),
      similar_projects_information: JSON.stringify(similarProjectsInfo, null, 2),
      funding_programs_information: JSON.stringify(fundingProgramsInfo, null, 2),
    };
    
    Object.entries(variables).forEach(([name, value]) => {
      processedTemplate = processedTemplate.replace(
        new RegExp(`{{${name}}}`, 'g'),
        value
      );
    });
    
    // Call LLM with the processed template
    const llmResponse = await getLlmResponse({
      prompt: processedTemplate,
      purpose: 'analyze',
      cache_key: `project_analysis_${projectId}_${includeScores}_${templateId}_${includeReferences}_${includeSimilarProjects}`,
    });
    
    // Log template usage
    await supabase
      .from('prompt_template_usage_logs')
      .insert({
        template_id: template.id,
        template_version: template.version,
        variables,
        success: true,
        tokens_used: llmResponse.tokens_used,
      });
    
    // Parse the response
    const parsedResponse = parseAnalysisResponse(llmResponse.text);
    
    return NextResponse.json({
      ...parsedResponse,
      model: llmResponse.model,
      provider: llmResponse.provider,
      cached: llmResponse.cached || false,
    });
  } catch (error) {
    console.error('Error analyzing project:', error);
    return NextResponse.json(
      { error: 'Failed to analyze project' },
      { status: 500 }
    );
  }
}

/**
 * Construct the prompt for project analysis
 */
function constructProjectAnalysisPrompt(
  project: any, 
  scores: any[], 
  feedback: any[],
  guidelines: any[] = [],
  similarProjects: any[] = [],
  fundingPrograms: string[] = []
) {
  let prompt = `Please analyze the following transportation project and provide a structured response:

Project Title: ${project.title}
Project Status: ${project.status}
Project Category: ${project.primary_category || 'Not specified'}
Estimated Cost: ${project.cost_estimate ? `$${project.cost_estimate.toLocaleString()}` : 'Not specified'}

Project Description:
${project.description || 'No description provided.'}

`;

  // Add scores if available
  if (scores && scores.length > 0) {
    prompt += `\n\nProject Scoring:\n`;
    scores.forEach((score) => {
      prompt += `- ${score.criteria?.name || 'Unnamed criterion'}: ${score.score_value}/5`;
      if (score.notes) {
        prompt += ` (Notes: ${score.notes})`;
      }
      prompt += '\n';
    });
  }

  // Add feedback if available
  if (feedback && feedback.length > 0) {
    prompt += `\n\nCommunity Feedback:\n`;
    feedback.forEach((item) => {
      prompt += `- ${item.content} (Sentiment: ${item.sentiment || 'Not analyzed'}, Upvotes: ${item.upvotes || 0}, Downvotes: ${item.downvotes || 0})\n`;
    });
  }
  
  // Add guidelines if available
  if (guidelines && guidelines.length > 0) {
    prompt += `\n\nRelevant Guidelines:\n`;
    guidelines.forEach((guide) => {
      prompt += `- ${guide.title} (Source: ${guide.source})\n`;
      prompt += `  ${guide.content.substring(0, 200)}...\n`;
    });
  }
  
  // Add similar projects if available
  if (similarProjects && similarProjects.length > 0) {
    prompt += `\n\nSimilar Completed Projects:\n`;
    similarProjects.forEach((proj) => {
      prompt += `- ${proj.title} (Score: ${proj.score_total}/5, Cost: $${proj.cost_estimate?.toLocaleString() || 'Not specified'})\n`;
    });
  }
  
  // Add funding programs to check against
  if (fundingPrograms && fundingPrograms.length > 0) {
    prompt += `\n\nEvaluate this project against these funding programs:\n`;
    fundingPrograms.forEach((program) => {
      prompt += `- ${program}\n`;
    });
  }

  prompt += `\nPlease provide the following in your analysis:
1. A concise summary of the project (2-3 paragraphs)
2. Key strengths of the project (3-5 bullet points with specific reference to guidelines where applicable)
3. Potential weaknesses or areas for improvement (3-5 bullet points with specific reference to guidelines where applicable)
4. Specific recommendations to enhance the project (3-5 bullet points with specific reference to guidelines where applicable)
5. Potential grant opportunities that might be a good match for this project (2-3 items with match percentage and brief description)
6. Comparison to similar projects (if provided)
7. Regulatory compliance analysis (list specific guidelines this project meets or fails to meet)
8. Funding eligibility assessment (for each requested funding program)

Format your response in JSON structure with the following keys: summary, strengths, weaknesses, recommendations, grantOpportunities, comparisons, regulatoryCompliance, fundingEligibility.
The grantOpportunities should be an array of objects with name, match (percentage), and description fields.
The regulatoryCompliance should be an array of objects with guideline, status (meets/does not meet), and explanation fields.
The fundingEligibility should be an array of objects with program, eligible (boolean), requirements, and explanation fields.`;

  return prompt;
}

/**
 * Parse the LLM response into structured data
 */
function parseAnalysisResponse(responseText: string) {
  try {
    // Try to extract JSON directly if the response is formatted correctly
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)```/) || 
                      responseText.match(/```([\s\S]*?)```/) ||
                      responseText.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      try {
        const jsonText = jsonMatch[1] || jsonMatch[0];
        const parsedJson = JSON.parse(jsonText.trim());
        return parsedJson;
      } catch (e) {
        console.error('Error parsing JSON from response:', e);
      }
    }
    
    // Fallback to manual parsing if JSON extraction fails
    const summary = extractSection(responseText, 'summary', 'strengths');
    const strengths = extractListItems(responseText, 'strengths', 'weaknesses');
    const weaknesses = extractListItems(responseText, 'weaknesses', 'recommendations');
    const recommendations = extractListItems(responseText, 'recommendations', 'grant opportunities');
    const grantOpportunities = extractGrantOpportunities(responseText);
    const comparisons = extractListItems(responseText, 'comparison', 'regulatory compliance');
    const regulatoryCompliance = extractRegulatoryCompliance(responseText);
    const fundingEligibility = extractFundingEligibility(responseText);
    
    return {
      summary,
      strengths,
      weaknesses,
      recommendations,
      grantOpportunities,
      comparisons,
      regulatoryCompliance,
      fundingEligibility
    };
  } catch (error) {
    console.error('Error parsing analysis response:', error);
    return {
      summary: 'Failed to parse response',
      strengths: [],
      weaknesses: [],
      recommendations: [],
      grantOpportunities: [],
      comparisons: [],
      regulatoryCompliance: [],
      fundingEligibility: []
    };
  }
}

/**
 * Extract a section of text between two headings
 */
function extractSection(text: string, sectionName: string, nextSection: string) {
  const regex = new RegExp(`(?:\\n|^)(?:\\d+\\.\\s*)?${sectionName}[:\\s]+(.*?)(?:\\n(?:\\d+\\.\\s*)?${nextSection}[:\\s]+|$)`, 'is');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extract list items from a section
 */
function extractListItems(text: string, sectionName: string, nextSection: string) {
  const sectionText = extractSection(text, sectionName, nextSection);
  if (!sectionText) return [];
  
  const listItems = sectionText.split(/(?:\r?\n|\r)(?:[-•*]\s*|\d+\.\s*)/).filter(Boolean);
  return listItems.map(item => item.trim());
}

/**
 * Extract grant opportunities section
 */
function extractGrantOpportunities(text: string) {
  const grantSection = extractSection(text, 'grant opportunities', 'comparison');
  if (!grantSection) return [];
  
  const grants = grantSection.split(/(?:\r?\n|\r)(?:[-•*]\s*|\d+\.\s*)/).filter(Boolean);
  
  return grants.map(grant => {
    const matchPattern = /^(.*?)(?:\((\d+)%\)|:?\s*(\d+)%)?\s*(?:-|:|–)?\s*(.*)/;
    const match = grant.trim().match(matchPattern);
    
    if (match) {
      const [_, name, percentage1, percentage2, description] = match;
      const matchPercentage = percentage1 || percentage2 || '0';
      
      return {
        name: name.trim(),
        match: parseInt(matchPercentage, 10),
        description: description.trim()
      };
    }
    
    return {
      name: grant.trim(),
      match: 0,
      description: ''
    };
  });
}

/**
 * Extract regulatory compliance information
 */
function extractRegulatoryCompliance(text: string) {
  const complianceSection = extractSection(text, 'regulatory compliance', 'funding eligibility');
  if (!complianceSection) return [];
  
  const complianceItems = complianceSection.split(/(?:\r?\n|\r)(?:[-•*]\s*|\d+\.\s*)/).filter(Boolean);
  
  return complianceItems.map(item => {
    const matches = item.trim().match(/^(.*?)(?:\s*-\s*|\s*:\s*)(meets|does not meet|partially meets)(?:\s*-\s*|\s*:\s*)?(.*)$/i);
    
    if (matches) {
      const [_, guideline, status, explanation] = matches;
      return {
        guideline: guideline.trim(),
        status: status.toLowerCase(),
        explanation: explanation ? explanation.trim() : ''
      };
    }
    
    return {
      guideline: item.trim(),
      status: 'unknown',
      explanation: ''
    };
  });
}

/**
 * Extract funding eligibility information
 */
function extractFundingEligibility(text: string) {
  const eligibilitySection = extractSection(text, 'funding eligibility', '');
  if (!eligibilitySection) return [];
  
  const eligibilityItems = eligibilitySection.split(/(?:\r?\n|\r)(?:[-•*]\s*|\d+\.\s*)/).filter(Boolean);
  
  return eligibilityItems.map(item => {
    const matches = item.trim().match(/^(.*?)(?:\s*-\s*|\s*:\s*)(eligible|not eligible|partially eligible)(?:\s*-\s*|\s*:\s*)?(.*)$/i);
    
    if (matches) {
      const [_, program, status, explanation] = matches;
      const isEligible = status.toLowerCase().includes('eligible') && !status.toLowerCase().includes('not');
      
      return {
        program: program.trim(),
        eligible: isEligible,
        requirements: extractRequirements(explanation),
        explanation: explanation ? explanation.trim() : ''
      };
    }
    
    return {
      program: item.trim(),
      eligible: false,
      requirements: [],
      explanation: ''
    };
  });
}

/**
 * Extract requirements from explanation text
 */
function extractRequirements(text: string) {
  if (!text) return [];
  
  const requirementMatch = text.match(/requirements?:?\s*(.*?)(?:\.|$)/i);
  if (!requirementMatch) return [];
  
  return requirementMatch[1].split(/,|;/).map(req => req.trim());
}
