import { createServerComponentClient } from '@/lib/supabase/server';
import { validateRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const responseId = params.id;
    const body = await request.json();
    
    // Validate the request body
    if (!body.content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    
    // Get the agency ID and role from the user's profile
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
    
    // Get the response and verify it belongs to the user's agency
    const { data: existingResponse, error: responseError } = await supabase
      .from('feedback_responses')
      .select(`
        id,
        feedback_id,
        template_id,
        content,
        is_automated,
        is_approved,
        feedback:feedback_id (
          agency_id
        )
      `)
      .eq('id', responseId)
      .single();
    
    if (responseError || !existingResponse) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }
    
    // Safe access to agency_id with proper array handling
    const feedbackAgencyId = existingResponse.feedback && 
      Array.isArray(existingResponse.feedback) && 
      existingResponse.feedback[0]?.agency_id;
    
    if (feedbackAgencyId !== profile.agency_id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Prepare update object
    const updateData: any = {
      content: body.content,
      updated_at: new Date().toISOString()
    };
    
    // If is_approved is provided, update approval status
    if (body.is_approved === true) {
      updateData.is_approved = true;
      updateData.approved_by = session.user.id;
      updateData.approved_at = new Date().toISOString();
    } else if (body.is_approved === false) {
      updateData.is_approved = false;
      updateData.approved_by = session.user.id;
      updateData.approved_at = new Date().toISOString();
    }
    
    // Update the response
    const { data, error } = await supabase
      .from('feedback_responses')
      .update(updateData)
      .eq('id', responseId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating response:', error);
      return NextResponse.json(
        { error: 'Failed to update response' },
        { status: 500 }
      );
    }
    
    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: body.is_approved ? 'UPDATE_AND_APPROVE_RESPONSE' : 'UPDATE_RESPONSE',
      details: { 
        response_id: responseId, 
        feedback_id: existingResponse.feedback_id,
        approval_status: body.is_approved ? 'approved' : (body.is_approved === false ? 'rejected' : 'unchanged')
      }
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const responseId = params.id;
    
    // Get the agency ID from the user's profile
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
    
    // Get the response with related data
    const { data: response, error: responseError } = await supabase
      .from('feedback_responses')
      .select(`
        id,
        feedback_id,
        template_id,
        content,
        is_automated,
        is_approved,
        created_at,
        updated_at,
        created_by,
        approved_by,
        approved_at,
        feedback:feedback_id (
          id,
          content,
          sentiment,
          project_id,
          agency_id,
          projects:project_id (
            id,
            title
          )
        ),
        template:template_id (
          id,
          name
        )
      `)
      .eq('id', responseId)
      .single();
    
    if (responseError || !response) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }
    
    // Check if the response belongs to the user's agency
    const responseFeedbackAgencyId = response.feedback && 
      Array.isArray(response.feedback) && 
      response.feedback[0]?.agency_id;
      
    if (responseFeedbackAgencyId !== profile.agency_id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 