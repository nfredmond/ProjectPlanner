import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth-actions';

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      agencyId,
      newAgencyRequest,
      newAgencyName
    } = await request.json();
    
    // Validate request
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }
    
    // Create user with the viewer role by default
    const result = await createUser(email, password, firstName, lastName, agencyId, 'viewer');
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    // If this was a new agency request, store that information in the user's metadata
    if (newAgencyRequest && result.userId) {
      const { createAdminActionClient } = require('@/lib/auth-actions');
      const supabase = createAdminActionClient();
      
      try {
        // First check if the profiles table has a metadata column
        const { data, error } = await supabase
          .from('profiles')
          .select('metadata')
          .eq('id', result.userId)
          .single();
          
        if (!error) {
          // Update the profile with metadata
          await supabase
            .from('profiles')
            .update({
              metadata: {
                new_agency_request: true,
                new_agency_name: newAgencyName,
                email: email
              }
            })
            .eq('id', result.userId);
        }
      } catch (error) {
        console.error('Error updating user metadata:', error);
        // Continue anyway, since the user was created successfully
      }
    }
    
    return NextResponse.json(
      { success: true, userId: result.userId },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 