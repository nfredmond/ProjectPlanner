import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract feedback data
    const {
      name,
      email,
      project_id,
      content,
      agency_id,
      coordinates,
      status = 'pending'
    } = body;
    
    // Validate required fields
    if (!content || !agency_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Basic spam detection (can be enhanced)
    const spamPatterns = [
      /\b(viagra|cialis|porn|sex|casino|lottery|prize|winner|million|dollars)\b/i,
      /https?:\/\/(?!.*trusted-domain\.com)/i, // Allow only trusted domains in URLs
      /^\s*$/,  // Empty submissions
    ];
    
    const isSpam = spamPatterns.some(pattern => pattern.test(content));
    if (isSpam) {
      // Still return success to the client but mark as spam
      return NextResponse.json({ success: true, id: uuidv4() });
    }
    
    // Prepare geom point if coordinates are provided
    let geom = null;
    if (coordinates) {
      let lat, lng;
      
      // Handle both array format [lat, lng] and object format {lat, lng}
      if (Array.isArray(coordinates)) {
        [lat, lng] = coordinates;
      } else if (coordinates.lat && coordinates.lng) {
        lat = coordinates.lat;
        lng = coordinates.lng;
      }
      
      if (lat && lng) {
        // PostGIS expects SRID 4326 and longitude before latitude
        geom = { type: 'Point', coordinates: [lng, lat] };
      }
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Insert feedback into database
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        id: uuidv4(),
        project_id: project_id || null,
        agency_id,
        content,
        geom,
        status,
        upvotes: 0,
        downvotes: 0,
        created_at: new Date().toISOString(),
        metadata: {
          submitter_name: name,
          submitter_email: email,
          source: 'map_form'
        }
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error inserting feedback:', error);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }
    
    // Trigger notification (we'll implement this in the notification system)
    try {
      await fetch(`${request.nextUrl.origin}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new_feedback',
          feedback_id: data.id,
          agency_id
        }),
      });
    } catch (notifyError) {
      // Log but don't fail if notification fails
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error processing feedback submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const agencyId = searchParams.get('agency_id');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  if (!agencyId) {
    return NextResponse.json(
      { error: 'Agency ID is required' },
      { status: 400 }
    );
  }
  
  const supabase = createRouteHandlerClient({ cookies });
  let query = supabase
    .from('feedback')
    .select('*, projects(*)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  if (status) {
    query = query.eq('status', status);
  }
  
  // Calculate offset for pagination
  const offset = (page - 1) * limit;
  
  // Get count with filters
  let countQuery = supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId);
    
  if (projectId) {
    countQuery = countQuery.eq('project_id', projectId);
  }
  
  if (status) {
    countQuery = countQuery.eq('status', status);
  }
  
  const { count, error: countError } = await countQuery;
  
  if (countError) {
    console.error('Error getting feedback count:', countError);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
  
  // Apply pagination to query
  query = query.range(offset, offset + limit - 1);
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    data,
    total: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit)
  });
} 