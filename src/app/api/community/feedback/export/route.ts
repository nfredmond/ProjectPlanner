import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { format, parseISO, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agency_id');
    const projectId = searchParams.get('project_id');
    const query = searchParams.get('q');
    const sentiment = searchParams.get('sentiment');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    
    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Build query for feedback
    let feedbackQuery = supabase
      .from('feedback')
      .select('*, projects(title)')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (projectId) {
      feedbackQuery = feedbackQuery.eq('project_id', projectId);
    }
    
    if (sentiment) {
      feedbackQuery = feedbackQuery.eq('sentiment', sentiment);
    }
    
    if (status) {
      feedbackQuery = feedbackQuery.eq('status', status);
    }
    
    if (startDate) {
      feedbackQuery = feedbackQuery.gte('created_at', startDate);
    }
    
    if (query) {
      feedbackQuery = feedbackQuery.ilike('content', `%${query}%`);
    }
    
    // Fetch data
    const { data: feedbackData, error } = await feedbackQuery;
    
    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }
    
    // Convert to CSV
    const csvHeader = [
      'ID',
      'Content',
      'Sentiment',
      'Status',
      'Created At',
      'Project',
      'Upvotes',
      'Downvotes'
    ].join(',');
    
    const csvRows = feedbackData.map(feedback => [
      feedback.id,
      `"${feedback.content.replace(/"/g, '""')}"`, // Escape quotes in content
      feedback.sentiment || 'Unknown',
      feedback.status,
      format(parseISO(feedback.created_at), 'yyyy-MM-dd HH:mm:ss'),
      feedback.projects?.title || 'None',
      feedback.upvotes,
      feedback.downvotes
    ].join(','));
    
    const csv = [csvHeader, ...csvRows].join('\n');
    
    // Return CSV as file download
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="feedback_export_${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 