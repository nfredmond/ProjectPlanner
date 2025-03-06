import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
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
    
    // Only admins and editors can respond to feedback
    if (userProfile.role !== 'admin' && userProfile.role !== 'editor') {
      return NextResponse.json(
        { error: 'Insufficient permissions to respond to feedback' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { feedbackId, response } = await req.json();
    
    if (!feedbackId || !response) {
      return NextResponse.json(
        { error: 'Missing required fields: feedbackId and response' },
        { status: 400 }
      );
    }
    
    // Get the feedback item
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
        { error: 'You can only respond to feedback for your agency' },
        { status: 403 }
      );
    }
    
    // Update the feedback with the response
    const { error: updateError } = await supabase
      .from('feedback')
      .update({
        response: response,
        responded_at: new Date().toISOString(),
        responded_by: session.user.id
      })
      .eq('id', feedbackId);
      
    if (updateError) {
      console.error('Error updating feedback response:', updateError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }
    
    // Create audit log entry
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'feedback_response_created',
      resource_type: 'feedback',
      resource_id: feedbackId,
      metadata: {
        feedback_id: feedbackId
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Response saved successfully'
    });
    
  } catch (error) {
    console.error('Error responding to feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
