import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { feedback_ids, agency_id } = await request.json();

    // Validate input
    if (!feedback_ids || !Array.isArray(feedback_ids) || feedback_ids.length === 0) {
      return NextResponse.json(
        { error: 'No feedback IDs provided' },
        { status: 400 }
      );
    }

    if (!agency_id) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createServerComponentClient();

    // Fetch feedback details
    const { data: feedbackItems, error: queryError } = await supabase
      .from('feedback')
      .select('id, content, sentiment, status, created_at, theme, project:project_id(name)')
      .eq('agency_id', agency_id)
      .in('id', feedback_ids);

    if (queryError) {
      console.error('Error querying feedback:', queryError);
      return NextResponse.json(
        { error: 'Error querying feedback' },
        { status: 500 }
      );
    }

    if (!feedbackItems || feedbackItems.length === 0) {
      return NextResponse.json(
        { error: 'No feedback items found' },
        { status: 404 }
      );
    }

    // Helper function to get project name
    const getProjectName = (projectData: any) => {
      if (!projectData) return undefined;
      if (Array.isArray(projectData) && projectData.length > 0 && projectData[0].name) {
        return projectData[0].name;
      }
      if (typeof projectData === 'object' && projectData.name) {
        return projectData.name;
      }
      return undefined;
    };

    // Construct a prompt for OpenAI
    let prompt = `Generate a professional, empathetic response to the following feedback`;
    
    if (feedbackItems.length === 1) {
      const item = feedbackItems[0];
      prompt += `:\n\nFeedback: "${item.content}"\n`;
      prompt += `Sentiment: ${item.sentiment}\n`;
      
      const projectName = getProjectName(item.project);
      if (projectName) {
        prompt += `Project: ${projectName}\n`;
      }
      
      if (item.theme) {
        prompt += `Theme: ${item.theme}\n`;
      }
    } else {
      prompt += ` items:\n\n`;
      feedbackItems.forEach((item, index) => {
        prompt += `Feedback ${index + 1}: "${item.content}"\n`;
        prompt += `Sentiment: ${item.sentiment}\n`;
        
        const projectName = getProjectName(item.project);
        if (projectName) {
          prompt += `Project: ${projectName}\n`;
        }
        
        if (item.theme) {
          prompt += `Theme: ${item.theme}\n`;
        }
        prompt += `\n`;
      });
    }

    prompt += `\nThe response should:
1. Thank the user(s) for their feedback
2. Address the specific concerns or points mentioned
3. Explain what actions will be taken (if appropriate)
4. Be professional but warm and empathetic
5. Keep the tone aligned with the feedback sentiment
6. Be concise (100-150 words)`;

    // Call OpenAI for response generation
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a professional customer service representative responsible for responding to user feedback. Your responses should be empathetic, clear and action-oriented."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const generatedResponse = completion.choices[0]?.message?.content?.trim();

    if (!generatedResponse) {
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: generatedResponse });
  } catch (error) {
    console.error('Error in generate response endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 