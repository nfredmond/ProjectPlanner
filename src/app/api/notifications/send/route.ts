import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract notification data
    const {
      type,
      feedback_id,
      agency_id,
      project_id,
      user_id,
      message,
      metadata
    } = body;
    
    // Validate required fields
    if (!type || !agency_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get notification recipients based on agency and notification type
    const { data: recipients, error: recipientsError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('agency_id', agency_id)
      .in('role', ['admin', 'editor']);
    
    if (recipientsError) {
      console.error('Error fetching notification recipients:', recipientsError);
      return NextResponse.json(
        { error: 'Failed to fetch notification recipients' },
        { status: 500 }
      );
    }
    
    // Generate notification title and content based on type
    let title = '';
    let content = '';
    
    switch (type) {
      case 'new_feedback':
        title = 'New Feedback Received';
        content = 'A new feedback submission requires your attention.';
        break;
      case 'feedback_moderation':
        title = 'Feedback Requires Moderation';
        content = 'A feedback submission has been flagged for moderation.';
        break;
      case 'feedback_response':
        title = 'Feedback Response Required';
        content = 'A feedback submission is awaiting your response.';
        break;
      case 'project_update':
        title = 'Project Updated';
        content = 'A project has been updated.';
        break;
      default:
        title = 'New Notification';
        content = message || 'You have a new notification.';
    }
    
    // Create notifications for each recipient
    const notifications = recipients.map(recipient => ({
      id: uuidv4(),
      user_id: recipient.id,
      agency_id,
      type,
      title,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        feedback_id,
        project_id,
        source_user_id: user_id
      }
    }));
    
    // Insert notifications into database
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications);
    
    if (error) {
      console.error('Error creating notifications:', error);
      return NextResponse.json(
        { error: 'Failed to create notifications' },
        { status: 500 }
      );
    }
    
    // TODO: Send email notifications (could be implemented with a service like SendGrid)
    // This would be implemented in a production environment
    
    return NextResponse.json({ 
      success: true, 
      notification_count: notifications.length 
    });
  } catch (error) {
    console.error('Error processing notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const isRead = searchParams.get('is_read');
  const limit = parseInt(searchParams.get('limit') || '50');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }
  
  const supabase = createRouteHandlerClient({ cookies });
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (isRead !== null) {
    query = query.eq('is_read', isRead === 'true');
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ data });
} 