import { createServerComponentClient } from '@/lib/supabase/server';
import { validateRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const id = params.id;
    
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
    
    // Fetch the response template
    const { data, error } = await supabase
      .from('response_templates')
      .select('*')
      .eq('id', id)
      .eq('agency_id', profile.agency_id)
      .single();
    
    if (error) {
      console.error('Error fetching response template:', error);
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in response template endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const id = params.id;
    const body = await request.json();
    
    // Validate the request body
    if (!body.name || !body.content || !body.tone || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the agency ID and role from the user's profile
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
    
    // Verify the template belongs to the user's agency
    const { data: template, error: templateError } = await supabase
      .from('response_templates')
      .select('agency_id')
      .eq('id', id)
      .single();
    
    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    if (template.agency_id !== profile.agency_id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Update the response template
    const { data, error } = await supabase
      .from('response_templates')
      .update({
        name: body.name,
        content: body.content,
        tone: body.tone,
        category: body.category,
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating response template:', error);
      return NextResponse.json(
        { error: 'Failed to update response template' },
        { status: 500 }
      );
    }
    
    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'UPDATE_RESPONSE_TEMPLATE',
      details: { template_id: id, template_name: body.name }
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in response template endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate the request
  const { session, supabase } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const id = params.id;
    
    // Get the agency ID and role from the user's profile
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
    
    // Check if user has permission (admin only)
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permission denied - only admins can delete templates' },
        { status: 403 }
      );
    }
    
    // Get the template name for the audit log
    const { data: template, error: templateError } = await supabase
      .from('response_templates')
      .select('name, agency_id')
      .eq('id', id)
      .single();
    
    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Verify the template belongs to the user's agency
    if (template.agency_id !== profile.agency_id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Delete the response template
    const { error } = await supabase
      .from('response_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting response template:', error);
      return NextResponse.json(
        { error: 'Failed to delete response template' },
        { status: 500 }
      );
    }
    
    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'DELETE_RESPONSE_TEMPLATE',
      details: { template_id: id, template_name: template.name }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in response template endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 