import { createServerComponentClient } from '@/lib/supabase/server';
import { validateRequest } from '@/lib/auth';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { feedbackId, projectId, action } = await request.json();
    
    if (!feedbackId && !action) {
      return NextResponse.json({ error: 'Feedback ID or action is required' }, { status: 400 });
    }
    
    // Fetch the feedback with its related project
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        id,
        content,
        sentiment,
        projects:project_id (
          id,
          title,
          description,
          primary_category
        )
      `)
      .eq('id', feedbackId)
      .single();
    
    if (feedbackError || !feedback) {
      return NextResponse.json(
        { error: feedbackError?.message || 'Feedback not found' },
        { status: 404 }
      );
    }
    
    // Fetch the agency's LLM configuration
    const { data: agencyProfile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', session.user.id)
      .single();
    
    const { data: llmConfig } = await supabase
      .from('llm_configs')
      .select('*')
      .eq('agency_id', agencyProfile?.agency_id)
      .single();
    
    // Default to OpenAI if no config exists
    const modelPreference = llmConfig?.model_preference || 'openai:gpt-4';
    const [provider, model] = modelPreference.split(':');
    
    let responseContent;
    let sentimentResult;
    
    // Handle different actions based on the request
    if (action === 'analyze_sentiment') {
      // Analyze the sentiment of the feedback content
      sentimentResult = await analyzeSentiment(feedback.content, provider, model);
      
      // Update the feedback record with sentiment analysis
      const { error: updateError } = await supabase
        .from('feedback')
        .update({ sentiment: sentimentResult.sentiment })
        .eq('id', feedbackId);
      
      if (updateError) {
        console.error('Error updating feedback sentiment:', updateError);
      }
      
      // Create an audit log entry
      await supabase.from('audit_logs').insert({
        user_id: session.user.id,
        action: 'ANALYZE_FEEDBACK_SENTIMENT',
        details: { feedback_id: feedbackId, sentiment: sentimentResult.sentiment }
      });
      
      return NextResponse.json(sentimentResult);
    } else if (action === 'summarize_feedback') {
      // If we're summarizing multiple feedback items
      const { data: allFeedback, error: allFeedbackError } = await supabase
        .from('feedback')
        .select('id, content, sentiment, project_id')
        .eq('project_id', projectId || feedback.projects?.[0]?.id);
      
      if (allFeedbackError) {
        return NextResponse.json({ error: 'Failed to fetch feedback for summarization' }, { status: 500 });
      }
      
      const summaryResult = await summarizeFeedback(allFeedback, provider, model);
      
      // Create an audit log entry
      await supabase.from('audit_logs').insert({
        user_id: session.user.id,
        action: 'SUMMARIZE_FEEDBACK',
        details: { project_id: projectId || feedback.projects?.[0]?.id, feedback_count: allFeedback.length }
      });
      
      return NextResponse.json(summaryResult);
    } else if (action === 'cluster_feedback') {
      // Cluster feedback to identify trends and themes
      const { data: allFeedback, error: allFeedbackError } = await supabase
        .from('feedback')
        .select('id, content, sentiment, project_id, created_at')
        .eq('project_id', projectId || feedback.projects?.[0]?.id);
        
      if (allFeedbackError) {
        return NextResponse.json({ error: 'Failed to fetch feedback for clustering' }, { status: 500 });
      }
      
      const clusteringResult = await clusterFeedback(allFeedback, provider, model);
      
      return NextResponse.json(clusteringResult);
    } else if (action === 'generate_response') {
      // Generate an automated response to the feedback
      const responseResult = await generateResponse(feedback, provider, model);
      
      // Store the generated response
      const { data: template, error: templateError } = await supabase
        .from('response_templates')
        .select('*')
        .eq('id', responseResult.template_id)
        .single();
        
      const { data: responseData, error: responseError } = await supabase
        .from('feedback_responses')
        .insert({
          feedback_id: feedbackId,
          content: responseResult.response,
          generated_by: 'llm',
          status: 'pending_approval',
          template_id: responseResult.template_id,
          template_name: template?.name || 'Custom',
          generated_by_user_id: session.user.id
        })
        .select()
        .single();
        
      if (responseError) {
        console.error('Error storing response:', responseError);
        return NextResponse.json({ error: 'Failed to store response' }, { status: 500 });
      }
      
      // Create an audit log entry
      await supabase.from('audit_logs').insert({
        user_id: session.user.id,
        action: 'GENERATE_FEEDBACK_RESPONSE',
        details: { feedback_id: feedbackId, response_id: responseData.id }
      });
      
      return NextResponse.json({
        ...responseResult,
        response_id: responseData.id
      });
    } else if (action === 'identify_trends') {
      // Identify trends across feedback over time
      const { data: allFeedback, error: allFeedbackError } = await supabase
        .from('feedback')
        .select('id, content, sentiment, project_id, created_at')
        .order('created_at', { ascending: false })
        .limit(200); // Limit to recent feedback for performance
        
      if (allFeedbackError) {
        return NextResponse.json({ error: 'Failed to fetch feedback for trend analysis' }, { status: 500 });
      }
      
      const trendResult = await identifyTrends(allFeedback, provider, model);
      
      return NextResponse.json(trendResult);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in feedback response API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to analyze sentiment of feedback content
async function analyzeSentiment(content: string, provider: string, model: string) {
  if (provider === 'openai') {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis assistant for a transportation planning agency. 
          Analyze the sentiment of the following feedback and categorize it as one of:
          - positive: Clearly expressing approval, satisfaction, or support
          - negative: Clearly expressing disapproval, dissatisfaction, or opposition
          - neutral: Factual, objective, or neither positive nor negative
          - mixed: Contains both positive and negative sentiments
          
          Also identify:
          1. Key emotions expressed (e.g., frustration, happiness, concern)
          2. Overall intensity of sentiment (low, medium, high)
          3. Primary topics or concerns mentioned
          
          Provide a brief explanation for your categorization.`
        },
        {
          role: 'user',
          content: `Analyze the sentiment of this community feedback: "${content}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 250,
    });
    
    const result = completion.choices[0].message.content;
    // Extract sentiment category from result
    let sentiment = 'neutral';
    if (result?.toLowerCase().includes('positive')) sentiment = 'positive';
    if (result?.toLowerCase().includes('negative')) sentiment = 'negative';
    if (result?.toLowerCase().includes('mixed')) sentiment = 'mixed';
    
    // Parse the result to extract structured data
    const emotions = extractFromLLMResponse(result, 'emotions') || [];
    const intensity = extractFromLLMResponse(result, 'intensity') || 'medium';
    const topics = extractFromLLMResponse(result, 'topics') || [];
    
    return {
      sentiment,
      analysis: result,
      structured_data: {
        emotions,
        intensity,
        topics
      }
    };
  } else if (provider === 'anthropic') {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    
    const response = await anthropic.completions.create({
      model: model || 'claude-3-sonnet-20240229',
      prompt: `\n\nHuman: Analyze the sentiment of this community feedback: "${content}"\n\nPlease categorize it as one of:\n- positive: Clearly expressing approval, satisfaction, or support\n- negative: Clearly expressing disapproval, dissatisfaction, or opposition\n- neutral: Factual, objective, or neither positive nor negative\n- mixed: Contains both positive and negative sentiments\n\nAlso identify:\n1. Key emotions expressed (e.g., frustration, happiness, concern)\n2. Overall intensity of sentiment (low, medium, high)\n3. Primary topics or concerns mentioned\n\nProvide a brief explanation for your categorization.\n\nAssistant:`,
      max_tokens_to_sample: 250,
      temperature: 0.3,
    });
    
    const result = response.completion;
    // Extract sentiment category from result
    let sentiment = 'neutral';
    if (result?.toLowerCase().includes('positive')) sentiment = 'positive';
    if (result?.toLowerCase().includes('negative')) sentiment = 'negative';
    if (result?.toLowerCase().includes('mixed')) sentiment = 'mixed';
    
    // Parse the result to extract structured data
    const emotions = extractFromLLMResponse(result, 'emotions') || [];
    const intensity = extractFromLLMResponse(result, 'intensity') || 'medium';
    const topics = extractFromLLMResponse(result, 'topics') || [];
    
    return {
      sentiment,
      analysis: result,
      structured_data: {
        emotions,
        intensity,
        topics
      }
    };
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

// Function to summarize feedback using LLM
async function summarizeFeedback(feedbackList: any[], provider: string, model: string) {
  const feedbackContent = feedbackList.map(fb => {
    return `Feedback ${fb.id}: "${fb.content}" (Sentiment: ${fb.sentiment || 'not analyzed'})`;
  }).join('\n\n');
  
  if (provider === 'openai') {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a feedback analysis assistant for a transportation planning agency. 
          Summarize the following community feedback items, identifying:
          1. Key themes and topics mentioned (list them with brief descriptions)
          2. Common concerns or suggestions (organize by frequency and importance)
          3. Overall sentiment distribution (% positive, negative, neutral, mixed)
          4. Most actionable feedback points (prioritized list with justification)
          5. Recommended actions based on the feedback (specific, practical steps)
          
          Format your response in a structured way with clear headings, bullet points, and percentages where appropriate.
          Include quantitative metrics wherever possible.`
        },
        {
          role: 'user',
          content: `Summarize the following feedback items:\n\n${feedbackContent}`
        }
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });
    
    return {
      summary: completion.choices[0].message.content,
      feedbackCount: feedbackList.length,
      model: `${provider}:${model}`
    };
  } else if (provider === 'anthropic') {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    
    const response = await anthropic.completions.create({
      model: model || 'claude-3-sonnet-20240229',
      prompt: `\n\nHuman: Summarize the following feedback items:\n\n${feedbackContent}\n\nPlease identify:\n1. Key themes and topics mentioned (list them with brief descriptions)\n2. Common concerns or suggestions (organize by frequency and importance)\n3. Overall sentiment distribution (% positive, negative, neutral, mixed)\n4. Most actionable feedback points (prioritized list with justification)\n5. Recommended actions based on the feedback (specific, practical steps)\n\nFormat your response in a structured way with clear headings, bullet points, and percentages where appropriate.\nInclude quantitative metrics wherever possible.\n\nAssistant:`,
      max_tokens_to_sample: 1000,
      temperature: 0.5,
    });
    
    return {
      summary: response.completion,
      feedbackCount: feedbackList.length,
      model: `${provider}:${model}`
    };
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

// Function to cluster feedback and identify themes
async function clusterFeedback(feedbackList: any[], provider: string, model: string) {
  const feedbackContent = feedbackList.map(fb => {
    return `Feedback ${fb.id}: "${fb.content}" (Sentiment: ${fb.sentiment || 'not analyzed'}, Date: ${new Date(fb.created_at).toLocaleDateString()})`;
  }).join('\n\n');
  
  if (provider === 'openai') {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a feedback analysis assistant for a transportation planning agency. 
          Analyze the following community feedback items and cluster them into meaningful groups by topic, concern, or theme.
          
          For each cluster:
          1. Assign a descriptive name
          2. List the feedback IDs that belong to this cluster
          3. Provide a brief summary of the common theme
          4. Note the dominant sentiment within this cluster
          5. Identify any unique insights from this cluster
          
          Also provide:
          - The total number of clusters identified
          - A percentage breakdown of feedback by cluster
          - A confidence score (1-10) for each clustering decision
          
          Return the results as a structured JSON object that could be easily parsed.`
        },
        {
          role: 'user',
          content: `Cluster the following feedback items:\n\n${feedbackContent}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    return {
      clusters: JSON.parse(completion.choices[0].message.content || '{}'),
      feedbackCount: feedbackList.length,
      model: `${provider}:${model}`
    };
  } else if (provider === 'anthropic') {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    
    const response = await anthropic.completions.create({
      model: model || 'claude-3-sonnet-20240229',
      prompt: `\n\nHuman: Cluster the following feedback items:\n\n${feedbackContent}\n\nAnalyze these community feedback items and cluster them into meaningful groups by topic, concern, or theme.\n\nFor each cluster:\n1. Assign a descriptive name\n2. List the feedback IDs that belong to this cluster\n3. Provide a brief summary of the common theme\n4. Note the dominant sentiment within this cluster\n5. Identify any unique insights from this cluster\n\nAlso provide:\n- The total number of clusters identified\n- A percentage breakdown of feedback by cluster\n- A confidence score (1-10) for each clustering decision\n\nReturn the results as a structured JSON object that could be easily parsed.\n\nAssistant:`,
      max_tokens_to_sample: 2000,
      temperature: 0.3,
    });
    
    // Try to extract JSON from the response
    const jsonMatch = response.completion.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : '{}';
    
    try {
      return {
        clusters: JSON.parse(jsonString),
        feedbackCount: feedbackList.length,
        model: `${provider}:${model}`
      };
    } catch (e) {
      console.error('Error parsing JSON from Anthropic response:', e);
      return {
        clusters: { error: "Failed to parse JSON from response" },
        rawResponse: response.completion,
        feedbackCount: feedbackList.length,
        model: `${provider}:${model}`
      };
    }
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

// Function to identify trends in feedback over time
async function identifyTrends(feedbackList: any[], provider: string, model: string) {
  // Sort feedback by date
  const sortedFeedback = [...feedbackList].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  // Group feedback by month for trend analysis
  const feedbackByMonth: Record<string, any[]> = {};
  sortedFeedback.forEach(fb => {
    const date = new Date(fb.created_at);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    
    if (!feedbackByMonth[monthYear]) {
      feedbackByMonth[monthYear] = [];
    }
    
    feedbackByMonth[monthYear].push(fb);
  });
  
  // Prepare the input for the LLM
  const trendInput = Object.entries(feedbackByMonth).map(([month, items]) => {
    const sentiments = items.reduce((acc, fb) => {
      const sentiment = fb.sentiment || 'not analyzed';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return `Month: ${month}
Total Feedback: ${items.length}
Sentiment Distribution: ${JSON.stringify(sentiments)}
Sample Feedback: ${items.slice(0, 3).map(fb => `"${fb.content.substring(0, 100)}..."`).join(', ')}`;
  }).join('\n\n');
  
  if (provider === 'openai') {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a trend analysis assistant for a transportation planning agency.
          Analyze the following monthly feedback data and identify trends over time.
          
          Focus on:
          1. Changes in sentiment over time (increasing positivity/negativity)
          2. Emerging themes or topics that appear in more recent months
          3. Topics that have decreased in frequency over time
          4. Seasonal patterns or cyclical issues
          5. Correlation between events/projects and feedback patterns
          
          Return the analysis as a structured JSON object with:
          - "trends": Array of identified trends with evidence
          - "emerging_topics": New or growing concerns
          - "declining_topics": Topics becoming less prominent
          - "sentiment_trajectory": Overall direction of sentiment
          - "recommendations": Actions based on these trends`
        },
        {
          role: 'user',
          content: `Analyze trends in this feedback data over time:\n\n${trendInput}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });
    
    return {
      trends: JSON.parse(completion.choices[0].message.content || '{}'),
      timeframe: {
        start: Object.keys(feedbackByMonth)[0],
        end: Object.keys(feedbackByMonth)[Object.keys(feedbackByMonth).length - 1]
      },
      feedbackCount: feedbackList.length,
      model: `${provider}:${model}`
    };
  } else if (provider === 'anthropic') {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    
    const response = await anthropic.completions.create({
      model: model || 'claude-3-sonnet-20240229',
      prompt: `\n\nHuman: Analyze trends in this feedback data over time:\n\n${trendInput}\n\nFocus on:\n1. Changes in sentiment over time (increasing positivity/negativity)\n2. Emerging themes or topics that appear in more recent months\n3. Topics that have decreased in frequency over time\n4. Seasonal patterns or cyclical issues\n5. Correlation between events/projects and feedback patterns\n\nReturn the analysis as a structured JSON object with:\n- "trends": Array of identified trends with evidence\n- "emerging_topics": New or growing concerns\n- "declining_topics": Topics becoming less prominent\n- "sentiment_trajectory": Overall direction of sentiment\n- "recommendations": Actions based on these trends\n\nAssistant:`,
      max_tokens_to_sample: 1500,
      temperature: 0.3,
    });
    
    // Try to extract JSON from the response
    const jsonMatch = response.completion.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : '{}';
    
    try {
      return {
        trends: JSON.parse(jsonString),
        timeframe: {
          start: Object.keys(feedbackByMonth)[0],
          end: Object.keys(feedbackByMonth)[Object.keys(feedbackByMonth).length - 1]
        },
        feedbackCount: feedbackList.length,
        model: `${provider}:${model}`
      };
    } catch (e) {
      console.error('Error parsing JSON from Anthropic response:', e);
      return {
        trends: { error: "Failed to parse JSON from response" },
        rawResponse: response.completion,
        timeframe: {
          start: Object.keys(feedbackByMonth)[0],
          end: Object.keys(feedbackByMonth)[Object.keys(feedbackByMonth).length - 1]
        },
        feedbackCount: feedbackList.length,
        model: `${provider}:${model}`
      };
    }
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

// Function to generate responses to feedback
async function generateResponse(feedback: any, provider: string, model: string) {
  // Fetch available response templates
  const supabase = await createServerComponentClient();
  const { data: templates } = await supabase
    .from('response_templates')
    .select('id, name, content, tone, category')
    .eq('is_active', true);
  
  // Prepare template information for the LLM
  const templateInfo = templates?.map(t => 
    `Template ID: ${t.id}
Name: ${t.name}
Category: ${t.category}
Tone: ${t.tone}
Content: ${t.content}`
  ).join('\n\n') || 'No templates available';
  
  if (provider === 'openai') {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a response generation assistant for a transportation planning agency.
          Your task is to generate an appropriate response to community feedback.
          
          Available response templates:
          ${templateInfo}
          
          Generate a response by:
          1. Identifying the most appropriate template for this feedback
          2. Customizing that template to address the specific concerns raised
          3. Maintaining the selected template's tone and style
          4. Including specific details from the feedback where appropriate
          
          Return a JSON object with:
          - template_id: ID of the selected template
          - response: The full customized response
          - explanation: Brief rationale for template selection and customization`
        },
        {
          role: 'user',
          content: `Generate a response to this feedback:
          
          Feedback: "${feedback.content}"
          Sentiment: ${feedback.sentiment || 'unknown'}
          Project: ${feedback.projects?.title || 'Unknown'} - ${feedback.projects?.description?.substring(0, 100) || 'No description'}`
        }
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(completion.choices[0].message.content || '{}');
  } else if (provider === 'anthropic') {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    
    const response = await anthropic.completions.create({
      model: model || 'claude-3-sonnet-20240229',
      prompt: `\n\nHuman: Generate a response to this feedback:
      
      Feedback: "${feedback.content}"
      Sentiment: ${feedback.sentiment || 'unknown'}
      Project: ${feedback.projects?.title || 'Unknown'} - ${feedback.projects?.description?.substring(0, 100) || 'No description'}
      
      Available response templates:
      ${templateInfo}
      
      Generate a response by:
      1. Identifying the most appropriate template for this feedback
      2. Customizing that template to address the specific concerns raised
      3. Maintaining the selected template's tone and style
      4. Including specific details from the feedback where appropriate
      
      Return a JSON object with:
      - template_id: ID of the selected template
      - response: The full customized response
      - explanation: Brief rationale for template selection and customization\n\nAssistant:`,
      max_tokens_to_sample: 1000,
      temperature: 0.5,
    });
    
    // Try to extract JSON from the response
    const jsonMatch = response.completion.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : '{}';
    
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error('Error parsing JSON from Anthropic response:', e);
      return {
        error: "Failed to parse response",
        rawResponse: response.completion
      };
    }
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

// Helper function to extract structured data from LLM responses
function extractFromLLMResponse(response: string | null, dataType: 'emotions' | 'intensity' | 'topics'): any {
  if (!response) return null;
  
  if (dataType === 'emotions') {
    // Extract emotions mentioned in the response
    const emotionKeywords = [
      'happy', 'sad', 'angry', 'frustrated', 'concerned', 'worried', 'pleased',
      'satisfied', 'disappointed', 'hopeful', 'excited', 'anxious', 'confused',
      'appreciative', 'grateful', 'upset', 'enthusiastic', 'optimistic', 'pessimistic'
    ];
    
    return emotionKeywords
      .filter(emotion => response.toLowerCase().includes(emotion))
      .slice(0, 3); // Return top 3 emotions found
  }
  
  if (dataType === 'intensity') {
    // Extract intensity from the response
    if (response.toLowerCase().includes('high intensity') || 
        response.toLowerCase().includes('strong') ||
        response.toLowerCase().includes('very')) {
      return 'high';
    } else if (response.toLowerCase().includes('low intensity') ||
              response.toLowerCase().includes('mild') ||
              response.toLowerCase().includes('slight')) {
      return 'low';
    } else {
      return 'medium';
    }
  }
  
  if (dataType === 'topics') {
    // Try to extract topics from keypoints in the response
    const lines = response.split('\n');
    const topicLines = lines.filter(line => 
      line.toLowerCase().includes('topic') || 
      line.toLowerCase().includes('concern') || 
      line.toLowerCase().includes('mention') ||
      line.match(/[•\-\*]\s+/)
    );
    
    if (topicLines.length > 0) {
      const extractedTopics = topicLines.map(line => {
        // Remove bullet points and numbering
        const cleanLine = line.replace(/^[•\-\*\d\.\s]+/, '').trim();
        // Take the first part of the sentence (likely the topic)
        return cleanLine.split(',')[0].split(':')[0].trim();
      });
      
      return Array.from(new Set(extractedTopics)).slice(0, 5); // Deduplicate and limit to 5 topics
    }
    
    return [];
  }
  
  return null;
} 