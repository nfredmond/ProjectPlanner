import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Create a single supabase client for browser-side usage
// This is used in client components
export const createClientComponentClient = () => {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Fallback to hardcoded values if environment variables are missing
    supabaseUrl = 'https://bcwwhrfxvotfskqjqlrv.supabase.co';
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNDMxNTgsImV4cCI6MjA1NjcxOTE1OH0.HFD8l-qoGrEUMgCvWXEXuV2_McQCg4a_7P0VYBfFCvU';
    console.warn('Using fallback Supabase credentials. Set environment variables for production use.');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Create a single supabase client for server-side usage
// This is used in server components and route handlers
export const createServerComponentClient = async () => {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    // Fallback to hardcoded values if environment variables are missing
    supabaseUrl = 'https://bcwwhrfxvotfskqjqlrv.supabase.co';
    supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE0MzE1OCwiZXhwIjoyMDU2NzE5MTU4fQ.wpQNt1BPj2IX_JSrSKPqHiuQzikjYUIZe_3kEaRiT4s';
    console.warn('Using fallback Supabase credentials. Set environment variables for production use.');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};

// Create a single supabase admin client (using service role key)
// CAUTION: This bypasses RLS and should only be used in trusted server code
export const createAdminClient = () => {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    // Fallback to hardcoded values if environment variables are missing
    supabaseUrl = 'https://bcwwhrfxvotfskqjqlrv.supabase.co';
    supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE0MzE1OCwiZXhwIjoyMDU2NzE5MTU4fQ.wpQNt1BPj2IX_JSrSKPqHiuQzikjYUIZe_3kEaRiT4s';
    console.warn('Using fallback Supabase admin credentials. Set environment variables for production use.');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
