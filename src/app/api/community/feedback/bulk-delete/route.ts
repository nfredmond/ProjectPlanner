import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';

interface FeedbackItem {
  id: string;
}

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

    // Check if the user has permission to delete these feedback items
    // (agency_id check ensures the user can only delete feedback from their agency)
    const { data: feedbackItems, error: queryError } = await supabase
      .from('feedback')
      .select('id')
      .eq('agency_id', agency_id)
      .in('id', feedback_ids);

    if (queryError) {
      console.error('Error querying feedback:', queryError);
      return NextResponse.json(
        { error: 'Error querying feedback' },
        { status: 500 }
      );
    }

    // Extract valid feedback IDs that belong to the agency
    const validFeedbackIds = feedbackItems?.map((item: FeedbackItem) => item.id) || [];

    if (validFeedbackIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid feedback items found to delete' },
        { status: 400 }
      );
    }

    // Delete the feedback items
    const { error: deleteError } = await supabase
      .from('feedback')
      .delete()
      .in('id', validFeedbackIds);

    if (deleteError) {
      console.error('Error deleting feedback:', deleteError);
      return NextResponse.json(
        { error: 'Error deleting feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${validFeedbackIds.length} feedback items` 
    });
  } catch (error) {
    console.error('Error in bulk delete endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 