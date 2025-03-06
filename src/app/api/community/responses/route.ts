import { createServerComponentClient } from '@/lib/supabase/server';
import { validateRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const feedbackId = searchParams.get('feedback_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Get user's agency ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', session.user.id)
      .single();
      
    if (!profile || !profile.agency_id) {
      return NextResponse.json(
        { error: 'No agency associated with user' },
        { status: 400 }
      );
    }
    
    // Build the query
    let query = supabase
      .from('feedback_responses')
      .select(`
        id,
        content,
        status,
        created_at,
        template_id,
        template_name,
        feedback_id,
        feedback:feedback_id (
          id,
          content,
          sentiment,
          project_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (feedbackId) {
      query = query.eq('feedback_id', feedbackId);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }
    
    // Format the data for better usage
    const formattedResponses = data.map(item => {
      const feedback = item.feedback as any;
      return {
        id: item.id,
        feedback_id: item.feedback_id,
        content: item.content,
        status: item.status,
        created_at: item.created_at,
        template_id: item.template_id,
        template_name: item.template_name,
        feedback_content: feedback ? feedback.content : '',
        feedback_sentiment: feedback ? feedback.sentiment : ''
      };
    });
    
    return NextResponse.json(formattedResponses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request body
    if (!body.feedbackId || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the agency ID from the user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', session.user.id)
      .single();
    
    if (!profile || !profile.agency_id) {
      return NextResponse.json(
        { error: 'No agency associated with user' },
        { status: 400 }
      );
    }
    
    // Check if user has permission (admin or editor)
    if (!['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Verify the feedback belongs to the user's agency
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('agency_id')
      .eq('id', body.feedbackId)
      .single();
    
    if (feedbackError || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }
    
    if (feedback.agency_id !== profile.agency_id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Create a new response
    const { data, error } = await supabase
      .from('feedback_responses')
      .insert([
        {
          feedback_id: body.feedbackId,
          template_id: body.templateId || null,
          content: body.content,
          is_automated: true,
          is_approved: body.autoApprove === true ? true : null,
          approved_by: body.autoApprove === true ? session.user.id : null,
          approved_at: body.autoApprove === true ? new Date().toISOString() : null,
          created_by: session.user.id
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating response:', error);
      return NextResponse.json(
        { error: 'Failed to create response' },
        { status: 500 }
      );
    }
    
    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'CREATE_AUTOMATED_RESPONSE',
      details: { response_id: data.id, feedback_id: body.feedbackId }
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in responses endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 