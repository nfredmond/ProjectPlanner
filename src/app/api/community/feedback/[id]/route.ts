import { validateRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Get a single feedback item
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
    const feedbackId = params.id;
    
    if (!feedbackId) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
    }
    
    // Get the user's agency
    const { data: agencyProfile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', session.user.id)
      .single();
    
    // Fetch feedback with related project
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        *,
        projects:project_id (
          id,
          title,
          description,
          primary_category
        )
      `)
      .eq('id', feedbackId)
      .eq('agency_id', agencyProfile?.agency_id)
      .single();
    
    if (feedbackError || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found or you do not have permission to view it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(feedback);
    
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// Update feedback status (approve, reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const feedbackId = params.id;
    
    if (!feedbackId) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
    }
    
    const { status, official_response } = await request.json();
    
    if (!status && !official_response) {
      return NextResponse.json(
        { error: 'Status or official response is required' },
        { status: 400 }
      );
    }
    
    // Get the user's agency
    const { data: agencyProfile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', session.user.id)
      .single();
    
    // Check if user has permission to update feedback status
    if (status && !['admin', 'editor'].includes(agencyProfile?.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to update feedback status' },
        { status: 403 }
      );
    }
    
    // Check if the feedback exists and belongs to the user's agency
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId)
      .eq('agency_id', agencyProfile?.agency_id)
      .single();
    
    if (feedbackError || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    // Build update data
    const updateData: { status?: string; official_response?: string; updated_at: string } = {
      updated_at: new Date().toISOString()
    };
    
    if (status) {
      updateData.status = status;
    }
    
    if (official_response) {
      updateData.official_response = official_response;
    }
    
    // Update the feedback
    const { error: updateError } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', feedbackId);
    
    if (updateError) {
      console.error('Error updating feedback:', updateError);
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }
    
    // Create an audit log entry
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: status ? 'UPDATE_FEEDBACK_STATUS' : 'UPDATE_FEEDBACK_RESPONSE',
      details: { feedback_id: feedbackId, status, has_response: !!official_response }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
} 