import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
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
    
    // Get user permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    // Only admin and editor can moderate feedback
    if (profile.role !== 'admin' && profile.role !== 'editor') {
      return NextResponse.json(
        { error: 'Insufficient permissions to moderate feedback' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { feedbackId, action } = await req.json();
    
    if (!feedbackId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: feedbackId and action' },
        { status: 400 }
      );
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    // Get the feedback to check agency ownership
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
    
    // Ensure user is only moderating feedback for their own agency
    if (feedback.agency_id !== profile.agency_id) {
      return NextResponse.json(
        { error: 'You can only moderate feedback for your agency' },
        { status: 403 }
      );
    }
    
    // Update feedback status
    const { error: updateError } = await supabase
      .from('feedback')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        moderated_at: new Date().toISOString(),
        moderated_by: session.user.id
      })
      .eq('id', feedbackId);
      
    if (updateError) {
      console.error('Error updating feedback status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update feedback status' },
        { status: 500 }
      );
    }
    
    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: `feedback_${action}d`,
      resource_type: 'feedback',
      resource_id: feedbackId,
      metadata: {
        feedback_id: feedbackId,
        action: action
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Feedback successfully ${action === 'approve' ? 'approved' : 'rejected'}`
    });
  } catch (error) {
    console.error('Error moderating feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 