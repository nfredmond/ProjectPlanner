import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface EnvironmentVariable {
  key: string;
  value: string;
  is_secret: boolean;
  description: string | null;
  is_customer_specific: boolean;
}

/**
 * Retrieves environment variables with customer-specific overrides
 * Only accessible to authenticated users
 */
export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get('customerId');
  
  // Create supabase client
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verify the user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Get the user's role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  // Check if user is admin or has appropriate permissions
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }
  
  try {
    // Call the Supabase function to get resolved environment variables
    const { data, error } = await supabase
      .from('environment_variables')
      .select('*')
      .order('key');
    
    if (error) throw error;
    
    if (!data) {
      return NextResponse.json([]);
    }
    
    // Filter out sensitive variables for non-admin users
    const filteredData = data.map((item) => ({
      key: item.key,
      value: item.is_secret ? '[HIDDEN]' : item.value,
      is_secret: item.is_secret,
      description: item.description,
      is_customer_specific: item.customer_id !== null,
      customer_id: item.customer_id
    }));
    
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Error fetching environment variables:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve environment variables' },
      { status: 500 }
    );
  }
} 