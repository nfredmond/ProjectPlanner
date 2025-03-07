/**
 * Supabase Setup Script
 * This script will:
 * 1. Apply the initial database schema
 * 2. Create a superuser admin account
 * 3. Set up the agency and profile records
 * 
 * Run with: node src/scripts/setup-supabase.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create superuser details
const superUserEmail = 'nfredmond@gmail.com';
const superUserPassword = 'Password123!'; // You should change this later
const firstName = 'Nathaniel';
const lastName = 'Redmond';
const agencyName = 'Green DOT Transportation Solutions';

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupSupabase() {
  console.log('Starting Supabase setup...');
  
  try {
    // Step 1: Apply database migrations
    console.log('Applying database schema migrations...');
    
    // Read the initial schema migration
    const initialSchemaPath = path.join(__dirname, '../../supabase/migrations/00001_initial_schema.sql');
    let initialSchema = '';
    
    try {
      initialSchema = fs.readFileSync(initialSchemaPath, 'utf8');
      console.log('Successfully read initial schema migration file');
    } catch (err) {
      console.error('Error reading initial schema file:', err.message);
      return;
    }
    
    // Execute the initial schema
    console.log('Executing initial schema migration...');
    
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      query: initialSchema
    });
    
    if (schemaError) {
      console.error('Error applying schema migration:', schemaError.message);
      
      // Let's continue anyway - the schema might already exist
      console.log('Continuing with setup in case schema already exists...');
    } else {
      console.log('Successfully applied initial schema migration');
    }
    
    // Step 2: Create superuser account
    console.log('Creating superuser account...');
    
    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.getUserByEmail(superUserEmail);
    
    let userId;
    
    if (userCheckError) {
      console.error('Error checking if user exists:', userCheckError.message);
      return;
    }
    
    if (existingUser) {
      console.log(`User ${superUserEmail} already exists, updating password...`);
      userId = existingUser.id;
      
      // Update existing user
      const { error: updateUserError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: superUserPassword }
      );
      
      if (updateUserError) {
        console.error('Error updating user:', updateUserError.message);
        return;
      }
      
      console.log('Successfully updated user password');
    } else {
      console.log(`Creating new user: ${superUserEmail}`);
      
      // Create new user
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: superUserEmail,
        password: superUserPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          is_superuser: true
        }
      });
      
      if (createUserError) {
        console.error('Error creating user:', createUserError.message);
        return;
      }
      
      userId = newUser.user.id;
      console.log(`Successfully created user with ID: ${userId}`);
    }
    
    // Step 3: Create or get agency
    console.log('Setting up agency...');
    
    // Check if agency exists
    const { data: existingAgency, error: agencyCheckError } = await supabase
      .from('agencies')
      .select('id')
      .eq('name', agencyName)
      .maybeSingle();
    
    if (agencyCheckError) {
      console.error('Error checking if agency exists (this is expected if the table was just created):', agencyCheckError.message);
      
      // Try creating the agencies table if it doesn't exist yet
      console.log('Attempting to create agencies table directly...');
      
      const createAgenciesTableSQL = `
        CREATE TABLE IF NOT EXISTS agencies (
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
      
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        query: createAgenciesTableSQL
      });
      
      if (createTableError) {
        console.error('Error creating agencies table:', createTableError.message);
        return;
      }
      
      console.log('Successfully created agencies table');
    }
    
    // Create or get agency
    let agencyId;
    
    if (existingAgency) {
      console.log(`Agency "${agencyName}" already exists with ID: ${existingAgency.id}`);
      agencyId = existingAgency.id;
    } else {
      console.log(`Creating new agency: ${agencyName}`);
      
      const { data: newAgency, error: createAgencyError } = await supabase
        .from('agencies')
        .insert({ name: agencyName, region: 'National' })
        .select('id')
        .single();
      
      if (createAgencyError) {
        console.error('Error creating agency:', createAgencyError.message);
        return;
      }
      
      agencyId = newAgency.id;
      console.log(`Successfully created agency with ID: ${agencyId}`);
    }
    
    // Step 4: Create or update profile
    console.log('Setting up user profile...');
    
    // Check if profiles table exists, if not, create it
    const checkProfilesTableSQL = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      );
    `;
    
    const { data: profilesTableCheck, error: profilesTableCheckError } = await supabase.rpc('exec_sql', {
      query: checkProfilesTableSQL
    });
    
    if (profilesTableCheckError) {
      console.error('Error checking if profiles table exists:', profilesTableCheckError.message);
      
      // Try creating the profiles table
      console.log('Attempting to create profiles table directly...');
      
      const createProfilesTableSQL = `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'viewer',
          first_name TEXT,
          last_name TEXT,
          title TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB DEFAULT '{}'::JSONB
        );
      `;
      
      const { error: createProfilesTableError } = await supabase.rpc('exec_sql', {
        query: createProfilesTableSQL
      });
      
      if (createProfilesTableError) {
        console.error('Error creating profiles table:', createProfilesTableError.message);
        return;
      }
      
      console.log('Successfully created profiles table');
    }
    
    // Check if user profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileCheckError && !profileCheckError.message.includes('does not exist')) {
      console.error('Error checking if profile exists:', profileCheckError.message);
      return;
    }
    
    // Create or update profile
    if (existingProfile) {
      console.log(`Profile already exists for user ${userId}, updating...`);
      
      const { error: updateProfileError } = await supabase
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
      
      if (updateProfileError) {
        console.error('Error updating profile:', updateProfileError.message);
        return;
      }
      
      console.log('Successfully updated user profile');
    } else {
      console.log(`Creating new profile for user ${userId}...`);
      
      // Insert directly with SQL in case the table structure is different
      const createProfileSQL = `
        INSERT INTO profiles (id, agency_id, role, first_name, last_name, title, metadata)
        VALUES (
          '${userId}',
          '${agencyId}',
          'admin',
          '${firstName}',
          '${lastName}',
          'Administrator',
          '{"is_superuser": true}'
        );
      `;
      
      const { error: createProfileError } = await supabase.rpc('exec_sql', {
        query: createProfileSQL
      });
      
      if (createProfileError) {
        console.error('Error creating profile:', createProfileError.message);
        return;
      }
      
      console.log('Successfully created user profile');
    }
    
    console.log('\n===== SETUP COMPLETE =====');
    console.log('You can now log in with the following credentials:');
    console.log(`Email: ${superUserEmail}`);
    console.log(`Password: ${superUserPassword}`);
    console.log('Role: admin (superuser)');
    console.log(`Agency: ${agencyName}`);
    
  } catch (error) {
    console.error('Unexpected error during setup:', error.message);
    console.error(error.stack);
  }
}

setupSupabase(); 