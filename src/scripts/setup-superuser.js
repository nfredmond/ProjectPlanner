/**
 * Supabase Superuser Setup Script
 * This script will create a superuser admin account in Supabase
 * 
 * Run with: node src/scripts/setup-superuser.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bcwwhrfxvotfskqjqlrv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd3docmZ4dm90ZnNrcWpxbHJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE0MzE1OCwiZXhwIjoyMDU2NzE5MTU4fQ.wpQNt1BPj2IX_JSrSKPqHiuQzikjYUIZe_3kEaRiT4s';

// Superuser details
const email = 'nfredmond@gmail.com';
const password = 'Password123!';
const firstName = 'Nathaniel';
const lastName = 'Redmond';
const agencyName = 'Green DOT Transportation Solutions';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to create or retrieve a user
async function createOrUpdateUser() {
  console.log('Creating or updating superuser account...');
  
  try {
    // Check if the user already exists
    const authUrl = `${supabaseUrl}/auth/v1/admin/users`;
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    };
    
    console.log('Checking if user exists...');
    const response = await fetch(authUrl, fetchOptions);
    const users = await response.json();
    
    let userId = null;
    const existingUser = users.find(user => user.email === email);
    
    if (existingUser) {
      console.log(`User ${email} already exists with ID: ${existingUser.id}`);
      userId = existingUser.id;
      
      // Update the user's password
      console.log('Updating user password...');
      const updateOptions = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ password })
      };
      
      const updateUrl = `${supabaseUrl}/auth/v1/admin/users/${userId}`;
      const updateResponse = await fetch(updateUrl, updateOptions);
      
      if (updateResponse.ok) {
        console.log('Successfully updated user password');
      } else {
        const error = await updateResponse.json();
        console.error('Error updating user:', error);
      }
    } else {
      // Create a new user
      console.log(`Creating new user: ${email}`);
      const createOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            is_superuser: true
          }
        })
      };
      
      const createResponse = await fetch(authUrl, createOptions);
      
      if (createResponse.ok) {
        const newUser = await createResponse.json();
        userId = newUser.id;
        console.log(`Successfully created user with ID: ${userId}`);
      } else {
        const error = await createResponse.json();
        console.error('Error creating user:', error);
        return null;
      }
    }
    
    return userId;
  } catch (error) {
    console.error('Error in createOrUpdateUser:', error.message);
    return null;
  }
}

// Create or update the user tables
async function createTables() {
  console.log('Setting up database tables if they don\'t exist...');
  
  try {
    // Create agencies table
    console.log('Creating agencies table if it doesn\'t exist...');
    const createAgenciesSQL = `
      CREATE TABLE IF NOT EXISTS public.agencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        region TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        logo_url TEXT,
        settings JSONB DEFAULT '{}'::JSONB,
        CONSTRAINT agencies_name_unique UNIQUE (name)
      );
    `;
    
    const { error: agenciesError } = await supabase.from('agencies').select('count').limit(1);
    
    if (agenciesError && agenciesError.message.includes('does not exist')) {
      // Use supabase pg to create the table
      const { error } = await supabase.rpc('pg_create_table', { sql: createAgenciesSQL });
      if (error) {
        console.log('Could not create agencies table with RPC, will try direct API call');
        
        // Try using SQL API
        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'params=single-object'
          },
          body: JSON.stringify({
            query: createAgenciesSQL
          })
        });
        
        if (!sqlResponse.ok) {
          console.error('Error creating agencies table:', await sqlResponse.text());
          console.log('Will continue with agency creation assuming table might already exist');
        }
      }
    } else {
      console.log('Agencies table already exists');
    }
    
    // Create profiles table
    console.log('Creating profiles table if it doesn\'t exist...');
    const createProfilesSQL = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'viewer',
        first_name TEXT,
        last_name TEXT,
        title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'::JSONB
      );
    `;
    
    const { error: profilesError } = await supabase.from('profiles').select('count').limit(1);
    
    if (profilesError && profilesError.message.includes('does not exist')) {
      // Use supabase pg to create the table
      const { error } = await supabase.rpc('pg_create_table', { sql: createProfilesSQL });
      if (error) {
        console.log('Could not create profiles table with RPC, will try direct API call');
        
        // Try using SQL API
        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'params=single-object'
          },
          body: JSON.stringify({
            query: createProfilesSQL
          })
        });
        
        if (!sqlResponse.ok) {
          console.error('Error creating profiles table:', await sqlResponse.text());
          console.log('Will continue with profile creation assuming table might already exist');
        }
      }
    } else {
      console.log('Profiles table already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error in createTables:', error.message);
    return false;
  }
}

// Create or get agency
async function createOrGetAgency() {
  console.log('Creating or getting agency...');
  
  try {
    // Check if agency exists
    const { data: existingAgencies, error: agencyError } = await supabase
      .from('agencies')
      .select('id, name')
      .eq('name', agencyName);
    
    if (agencyError && !agencyError.message.includes('does not exist')) {
      console.error('Error checking if agency exists:', agencyError.message);
      return null;
    }
    
    if (existingAgencies && existingAgencies.length > 0) {
      console.log(`Agency "${agencyName}" already exists with ID: ${existingAgencies[0].id}`);
      return existingAgencies[0].id;
    }
    
    // Create agency
    console.log(`Creating new agency: ${agencyName}`);
    const { data: newAgency, error: createError } = await supabase
      .from('agencies')
      .insert({ name: agencyName, region: 'National' })
      .select('id');
    
    if (createError) {
      console.error('Error creating agency:', createError.message);
      
      // Try using direct REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/agencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ name: agencyName, region: 'National' })
      });
      
      if (response.ok) {
        const agency = await response.json();
        console.log(`Successfully created agency with ID: ${agency[0].id}`);
        return agency[0].id;
      } else {
        console.error('Error creating agency through REST API:', await response.text());
        return null;
      }
    }
    
    console.log(`Successfully created agency with ID: ${newAgency[0].id}`);
    return newAgency[0].id;
  } catch (error) {
    console.error('Error in createOrGetAgency:', error.message);
    return null;
  }
}

// Create or update user profile
async function createOrUpdateProfile(userId, agencyId) {
  console.log('Creating or updating user profile...');
  
  try {
    if (!userId || !agencyId) {
      console.error('Missing userId or agencyId for profile creation');
      return false;
    }
    
    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId);
    
    if (profileError && !profileError.message.includes('does not exist')) {
      console.error('Error checking if profile exists:', profileError.message);
      return false;
    }
    
    if (existingProfile && existingProfile.length > 0) {
      console.log(`Profile already exists for user ${userId}, updating...`);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          agency_id: agencyId,
          role: 'admin',
          first_name: firstName,
          last_name: lastName,
          title: 'Administrator',
          metadata: { is_superuser: true }
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating profile:', updateError.message);
        return false;
      }
      
      console.log('Successfully updated user profile');
      return true;
    } else {
      // Create profile
      console.log(`Creating new profile for user ${userId}...`);
      
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          agency_id: agencyId,
          role: 'admin',
          first_name: firstName,
          last_name: lastName,
          title: 'Administrator',
          metadata: { is_superuser: true }
        });
      
      if (createError) {
        console.error('Error creating profile:', createError.message);
        
        // Try using direct REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            id: userId,
            agency_id: agencyId,
            role: 'admin',
            first_name: firstName,
            last_name: lastName,
            title: 'Administrator',
            metadata: { is_superuser: true }
          })
        });
        
        if (!response.ok) {
          console.error('Error creating profile through REST API:', await response.text());
          return false;
        }
      }
      
      console.log('Successfully created user profile');
      return true;
    }
  } catch (error) {
    console.error('Error in createOrUpdateProfile:', error.message);
    return false;
  }
}

// Main function to set up superuser
async function setupSuperuser() {
  console.log('Setting up superuser account...');
  
  try {
    // Step 1: Create or get tables
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.log('Continuing anyway as tables might already exist...');
    }
    
    // Step 2: Create or update user
    const userId = await createOrUpdateUser();
    if (!userId) {
      console.error('Failed to create or update user');
      return;
    }
    
    // Step 3: Create or get agency
    const agencyId = await createOrGetAgency();
    if (!agencyId) {
      console.error('Failed to create or get agency');
      return;
    }
    
    // Step 4: Create or update profile
    const profileCreated = await createOrUpdateProfile(userId, agencyId);
    if (!profileCreated) {
      console.error('Failed to create or update profile');
      return;
    }
    
    console.log('\n===== SUPERUSER SETUP COMPLETE =====');
    console.log('You can now log in with the following credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Role: admin (superuser)');
    console.log(`Agency: ${agencyName}`);
    
    // Test authentication
    console.log('\nTesting authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('Authentication test failed:', authError.message);
      console.error('Please check that the user was created properly');
    } else {
      console.log('✅ Authentication test successful!');
    }
    
  } catch (error) {
    console.error('Unexpected error during setup:', error);
  }
}

// Run the setup
setupSuperuser(); 