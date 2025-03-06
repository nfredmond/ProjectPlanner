import { createServerComponentClient } from '@/lib/supabase/server';
import { validateRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get the agency ID from the user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', session.user.id)
      .single();
    
    if (!profile || !profile.agency_id) {
      return NextResponse.json(
        { error: 'No agency associated with user' },
        { status: 400 }
      );
    }
    
    // Fetch response templates for the agency
    const { data, error } = await supabase
      .from('response_templates')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching response templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch response templates' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in response templates endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get the request body
    const body = await request.json();
    
    // Validate the request body
    if (!body.name || !body.content || !body.tone || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the agency ID from the user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', session.user.id)
      .single();
    
    if (!profile || !profile.agency_id) {
      return NextResponse.json(
        { error: 'No agency associated with user' },
        { status: 400 }
      );
    }
    
    // Check if user has permission (admin or editor)
    if (!['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Create a new response template
    const { data, error } = await supabase
      .from('response_templates')
      .insert([
        {
          agency_id: profile.agency_id,
          name: body.name,
          content: body.content,
          tone: body.tone,
          category: body.category,
          is_active: body.is_active !== false, // default to true if not provided
          created_by: session.user.id
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating response template:', error);
      return NextResponse.json(
        { error: 'Failed to create response template' },
        { status: 500 }
      );
    }
    
    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'CREATE_RESPONSE_TEMPLATE',
      details: { template_id: data.id, template_name: data.name }
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in response templates endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 