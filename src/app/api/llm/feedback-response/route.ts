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
    const { feedbackId, projectId } = await request.json();
    
    if (!feedbackId) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
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
    
    // Generate response based on provider preference
    if (provider === 'openai') {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const projectContext = feedback.projects && feedback.projects.length > 0
        ? `The feedback is related to a project titled "${feedback.projects[0].title}". Project description: "${feedback.projects[0].description || 'No description available'}". Project category: ${feedback.projects[0].primary_category || 'Not specified'}.`
        : 'No specific project is associated with this feedback.';
      
      const completion = await openai.chat.completions.create({
        model: model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an assistant for a transportation planning agency responding to community feedback. 
            Your responses should be:
            1. Respectful and empathetic
            2. Factual and informative
            3. Clear and concise
            4. Politically neutral
            5. Appropriate for official communication from a government agency
            
            Do not make up specific facts about projects beyond what is provided. If you don't have enough information to answer specifically, acknowledge this and provide a general response.`
          },
          {
            role: 'user',
            content: `Please draft a response to the following community feedback:
            
            ${projectContext}
            
            Community feedback: "${feedback.content}"
            
            Sentiment: ${feedback.sentiment || 'Not analyzed'}
            
            The response should thank them for their input, address their specific concerns or questions if possible, and explain how their feedback will be considered in the planning process. The tone should be professional yet approachable.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      
      responseContent = completion.choices[0].message.content;
    } else if (provider === 'anthropic') {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || '',
      });
      
      const projectContext = feedback.projects && feedback.projects.length > 0
        ? `The feedback is related to a project titled "${feedback.projects[0].title}". Project description: "${feedback.projects[0].description || 'No description available'}". Project category: ${feedback.projects[0].primary_category || 'Not specified'}.`
        : 'No specific project is associated with this feedback.';
      
      // Call Anthropic API using their SDK
      const response = await anthropic.completions.create({
        model: model || 'claude-3-sonnet-20240229',
        prompt: `\n\nHuman: ${projectContext}\n\nCommunity feedback: "${feedback.content}"\n\nSentiment: ${feedback.sentiment || 'Not analyzed'}\n\nPlease draft a response. The response should thank them for their input, address their specific concerns or questions if possible, and explain how their feedback will be considered in the planning process. The tone should be professional yet approachable.\n\nAssistant:`,
        max_tokens_to_sample: 500,
        temperature: 0.7,
      });
      
      responseContent = response.completion;
    } else {
      return NextResponse.json(
        { error: `Unsupported LLM provider: ${provider}` },
        { status: 400 }
      );
    }
    
    // Create an audit log entry
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'GENERATE_FEEDBACK_RESPONSE',
      details: { feedback_id: feedbackId }
    });
    
    return NextResponse.json({ 
      response: responseContent,
      model: modelPreference
    });
    
  } catch (error) {
    console.error('Error generating feedback response:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 