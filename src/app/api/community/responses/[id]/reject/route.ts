import { createServerComponentClient } from '@/lib/supabase/server';
import { validateRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

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
    
    // Update the response status to rejected
    const { error: updateError } = await supabase
      .from('feedback_responses')
      .update({
        status: 'rejected',
        rejected_by: session.user.id,
        rejected_at: new Date().toISOString()
      })
      .eq('id', responseId);
      
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reject response' },
        { status: 500 }
      );
    }
    
    // Create an audit log
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'REJECT_FEEDBACK_RESPONSE',
      details: { response_id: responseId, feedback_id: responseData.feedback_id }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Response rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 