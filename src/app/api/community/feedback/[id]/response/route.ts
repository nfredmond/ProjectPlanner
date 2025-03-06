import { validateRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

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
    
    const { response } = await request.json();
    
    if (!response || typeof response !== 'string') {
      return NextResponse.json({ error: 'Valid response is required' }, { status: 400 });
    }
    
    // Check if the feedback exists and belongs to the user's agency
    const { data: agencyProfile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', session.user.id)
      .single();
    
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
    
    // Update the feedback with the response
    const { error: updateError } = await supabase
      .from('feedback')
      .update({
        official_response: response,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId);
    
    if (updateError) {
      console.error('Error updating feedback:', updateError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }
    
    // Create an audit log entry
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'UPDATE_FEEDBACK_RESPONSE',
      details: { feedback_id: feedbackId }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error saving feedback response:', error);
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    );
  }
} 