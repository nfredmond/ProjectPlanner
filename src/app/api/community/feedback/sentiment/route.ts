import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Validate user authentication
    const supabase = await createServerComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user's role and agency
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, agency_id')
      .eq('id', session.user.id)
      .single();
      
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    // Only admins and editors can analyze sentiment
    if (userProfile.role !== 'admin' && userProfile.role !== 'editor') {
      return NextResponse.json(
        { error: 'Insufficient permissions to analyze sentiment' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { feedbackId } = await req.json();
    
    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Missing required field: feedbackId' },
        { status: 400 }
      );
    }
    
    // Get the feedback content
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId)
      .single();
      
    if (feedbackError || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }
    
    // Ensure user belongs to the same agency as the feedback
    if (feedback.agency_id !== userProfile.agency_id) {
      return NextResponse.json(
        { error: 'You can only analyze feedback for your agency' },
        { status: 403 }
      );
    }
    
    // Check if sentiment is already analyzed
    if (feedback.sentiment) {
      return NextResponse.json({
        sentiment: feedback.sentiment,
        message: 'Sentiment already analyzed'
      });
    }
    
    // Analyze sentiment with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analysis tool. Analyze the sentiment of the following feedback and respond with ONLY one of these categories: "positive", "negative", "neutral", or "mixed". Do not include any other text in your response.'
        },
        {
          role: 'user',
          content: feedback.content
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });
    
    const sentimentResult = completion.choices[0]?.message.content?.trim().toLowerCase();
    
    // Validate sentiment value
    if (!['positive', 'negative', 'neutral', 'mixed'].includes(sentimentResult as string)) {
      return NextResponse.json(
        { error: 'Invalid sentiment result from AI' },
        { status: 500 }
      );
    }
    
    // Update the feedback with the sentiment
    const { error: updateError } = await supabase
      .from('feedback')
      .update({
        sentiment: sentimentResult,
        sentiment_analyzed_at: new Date().toISOString(),
        sentiment_analyzed_by: session.user.id
      })
      .eq('id', feedbackId);
      
    if (updateError) {
      console.error('Error updating feedback sentiment:', updateError);
      return NextResponse.json(
        { error: 'Failed to save sentiment analysis' },
        { status: 500 }
      );
    }
    
    // Create audit log entry
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'feedback_sentiment_analyzed',
      resource_type: 'feedback',
      resource_id: feedbackId,
      metadata: {
        feedback_id: feedbackId,
        sentiment: sentimentResult
      }
    });
    
    return NextResponse.json({
      sentiment: sentimentResult,
      message: 'Sentiment successfully analyzed'
    });
    
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 