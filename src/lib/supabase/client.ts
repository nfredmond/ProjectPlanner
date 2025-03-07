'use client';

import { createBrowserClient } from '@supabase/ssr';

// Create a single supabase client for browser-side usage
// This is used in client components
export const createClientComponentClient = () => {
  // Default values for development to prevent complete failures
  let supabaseUrl = 'https://bcwwhrfxvotfskqjqlrv.supabase.co';
  let supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNDMxNTgsImV4cCI6MjA1NjcxOTE1OH0.HFD8l-qoGrEUMgCvWXEXuV2_McQCg4a_7P0VYBfFCvU';

  // First try to get from environment variables
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    
    // Return a mock client that won't crash the app but won't work
    return {
      auth: { getSession: () => Promise.resolve({ data: { session: null }, error: null }) },
      from: () => ({ select: () => ({ data: null, error: null }) }),
      // Add other commonly used methods that just return empty results
    } as any;
  }
}; 