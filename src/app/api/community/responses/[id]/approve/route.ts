import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import { validateRequest } from '@/lib/auth';

export async function POST(
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
    
    // Check if the response exists and is pending approval
    const { data: responseData, error: responseError } = await supabase
      .from('feedback_responses')
      .select('*')
      .eq('id', responseId)
      .eq('status', 'pending_approval')
      .single();
      
    if (responseError || !responseData) {
      return NextResponse.json(
        { error: responseError?.message || 'Response not found or already processed' },
        { status: 404 }
      );
    }
    
    // Update the response status to approved
    const { error: updateError } = await supabase
      .from('feedback_responses')
      .update({
        status: 'approved',
        approved_by: session.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', responseId);
      
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to approve response' },
        { status: 500 }
      );
    }
    
    // Create an audit log
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'APPROVE_FEEDBACK_RESPONSE',
      details: { response_id: responseId, feedback_id: responseData.feedback_id }
    });
    
    // Send the response to the user (e.g., via email, notification system, etc.)
    // This would typically involve a call to another service/API
    // For this implementation, we'll just mark the feedback as responded
    const { error: feedbackUpdateError } = await supabase
      .from('feedback')
      .update({
        response_status: 'responded',
        responded_at: new Date().toISOString()
      })
      .eq('id', responseData.feedback_id);
      
    if (feedbackUpdateError) {
      console.error('Error updating feedback status:', feedbackUpdateError);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Response approved successfully'
    });
  } catch (error) {
    console.error('Error approving response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 