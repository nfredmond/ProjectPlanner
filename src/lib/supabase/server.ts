import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Create a single supabase client for server-side usage
// This is used in server components and route handlers
export const createServerComponentClient = async () => {
  const cookieStore = cookies();
  
  // Default values to ensure we always have something
  let supabaseUrl = 'https://bcwwhrfxvotfskqjqlrv.supabase.co';
  let supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNDMxNTgsImV4cCI6MjA1NjcxOTE1OH0.HFD8l-qoGrEUMgCvWXEXuV2_McQCg4a_7P0VYBfFCvU';

  // First try to get from environment variables
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  try {
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
  } catch (error) {
    console.error('Error creating Supabase server client:', error);
    
    // Return a mock client that won't crash the app but won't work
    return {
      auth: { getSession: () => Promise.resolve({ data: { session: null }, error: null }) },
      from: () => ({ 
        select: () => ({ 
          data: null, 
          error: null,
          eq: () => ({ data: null, error: null, single: () => ({ data: null, error: null }) })
        }) 
      }),
      // Add other commonly used methods with minimal implementation
      rpc: () => ({ data: null, error: null }),
    } as any;
  }
};

// Create a single supabase admin client (using service role key)
// CAUTION: This bypasses RLS and should only be used in trusted server code
export const createAdminClient = () => {
  // Default values to ensure we always have something
  let supabaseUrl = 'https://bcwwhrfxvotfskqjqlrv.supabase.co';
  let supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE0MzE1OCwiZXhwIjoyMDU2NzE5MTU4fQ.wpQNt1BPj2IX_JSrSKPqHiuQzikjYUIZe_3kEaRiT4s';

  // First try to get from environment variables
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  try {
    // For admin client, we directly import createClient from supabase-js
    const { createClient } = require('@supabase/supabase-js');
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    console.error('Error creating Supabase admin client:', error);
    
    // Return a mock client similar to the one above
    return {
      auth: { getSession: () => Promise.resolve({ data: { session: null }, error: null }) },
      from: () => ({ select: () => ({ data: null, error: null }) }),
    } as any;
  }
}; 