'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { redirect } from 'next/navigation';

// Create a supabase server client for server actions
const createServerActionClient = () => {
  const cookieStore = cookies();
  
  // Default values to ensure we always have something
  let supabaseUrl = 'https://bcwwhrfxvotfskqjqlrv.supabase.co';
  let supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNDMxNTgsImV4cCI6MjA1NjcxOTE1OH0.HFD8l-qoGrEUMgCvWXEXuV2_McQCg4a_7P0VYBfFCvU';

  // First try to get from environment variables
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });
};

// Create a supabase admin client using service role key
const createAdminActionClient = () => {
  // Default values to ensure we always have something
  let supabaseUrl = 'https://bcwwhrfxvotfskqjqlrv.supabase.co';
  let supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE0MzE1OCwiZXhwIjoyMDU2NzE5MTU4fQ.wpQNt1BPj2IX_JSrSKPqHiuQzikjYUIZe_3kEaRiT4s';

  // First try to get from environment variables
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Server action to sign out user (handles cookies properly)
export async function signOut() {
  const supabase = createServerActionClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// Server action to create a new user with proper role
export async function createUser(email: string, password: string, firstName: string, lastName: string, agencyId: string, role: string = 'viewer') {
  const supabase = createAdminActionClient();
  
  try {
    // Create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'User creation failed' };
    }

    // Create profile in the database
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      agency_id: agencyId,
      first_name: firstName,
      last_name: lastName,
      role: role,
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return { success: false, error: profileError.message };
    }

    return { success: true, userId: authData.user.id };
  } catch (error: any) {
    console.error('User creation error:', error);
    return { success: false, error: error.message };
  }
}

// Server action to reset admin user
export async function resetAdminUser(email: string, password: string) {
  const supabase = createAdminActionClient();
  
  try {
    // First check if user exists
    const { data: existingUser, error: userError } = await supabase.auth.admin.listUsers({
      filter: {
        email: email,
      },
    });

    let userId;
    
    // If user exists, update it
    if (existingUser && existingUser.users && existingUser.users.length > 0) {
      userId = existingUser.users[0].id;
      
      // Update the user password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password, email_confirm: true }
      );
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      // Create new admin user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: 'Admin',
          last_name: 'User',
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      userId = authData.user.id;
    }

    // Update or create profile with admin role
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      // Update existing profile to admin role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);
        
      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      // Get first agency for admin user
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .limit(1)
        .single();
        
      // Create new profile with admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          agency_id: agency?.id,
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
        });
        
      if (profileError) {
        return { success: false, error: profileError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Reset admin error:', error);
    return { success: false, error: error.message };
  }
} 