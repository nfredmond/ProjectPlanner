/**
 * This script creates a superuser admin account in Supabase
 * Run with: node src/scripts/create-superuser.js
 */

// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createSuperUser() {
  // Replace these with your desired superuser details
  const email = 'nfredmond@gmail.com'; // Your email from the image
  const password = 'Password123!'; // Simplified strong password
  const firstName = 'Nathaniel'; // From the image
  const lastName = 'Redmond'; // From the image
  const agencyName = 'Green DOT Transportation Solutions'; // From the image

  console.log('Creating superuser account...');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`); // Only show in development context!

  try {
    // Check Supabase connection first
    console.log('Checking Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabaseAdmin.from('profiles').select('count').limit(1);
    
    if (connectionError) {
      console.error('❌ Error connecting to Supabase:', connectionError.message);
      console.error('Please check your Supabase configuration in .env file.');
      return;
    }
    
    console.log('✅ Successfully connected to Supabase');
    
    // 1. Check if the user already exists
    console.log(`Checking if user ${email} exists...`);
    const { data: existingUser, error: userCheckError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (userCheckError) {
      console.error('❌ Error checking if user exists:', userCheckError.message);
      return;
    }
    
    let userId;
    
    if (existingUser) {
      console.log(`✅ User with email ${email} already exists with ID: ${existingUser.id}`);
      console.log('Updating existing user to admin...');
      userId = existingUser.id;
      
      // Update existing user's password
      const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      );
      
      if (updateUserError) {
        console.error('❌ Error updating user password:', updateUserError.message);
        return;
      }
      
      console.log('✅ User password updated successfully');
      
    } else {
      // 2. Create the user
      console.log('Creating new user...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          is_superuser: true
        }
      });
      
      if (createError) {
        console.error('❌ Error creating user:', createError.message);
        return;
      }
      
      console.log(`✅ User created with ID: ${newUser.user.id}`);
      userId = newUser.user.id;
    }
    
    // 3. Check if the agency exists or create it
    console.log(`Checking if agency "${agencyName}" exists...`);
    let agencyId;
    const { data: existingAgency, error: agencyCheckError } = await supabaseAdmin
      .from('agencies')
      .select('id')
      .eq('name', agencyName)
      .maybeSingle();
    
    if (agencyCheckError) {
      console.error('❌ Error checking if agency exists:', agencyCheckError.message);
      return;
    }
    
    if (existingAgency) {
      console.log(`✅ Agency "${agencyName}" already exists with ID: ${existingAgency.id}`);
      agencyId = existingAgency.id;
    } else {
      // Create the agency
      console.log(`Creating new agency "${agencyName}"...`);
      const { data: newAgency, error: agencyError } = await supabaseAdmin
        .from('agencies')
        .insert({ name: agencyName })
        .select('id')
        .single();
      
      if (agencyError) {
        console.error('❌ Error creating agency:', agencyError.message);
        // If the error is about duplicate names, try to fetch the existing one
        if (agencyError.message.includes('duplicate')) {
          const { data: agency } = await supabaseAdmin
            .from('agencies')
            .select('id')
            .eq('name', agencyName)
            .single();
          
          if (agency) {
            console.log(`✅ Found existing agency with ID: ${agency.id}`);
            agencyId = agency.id;
          } else {
            return;
          }
        } else {
          return;
        }
      } else {
        console.log(`✅ Agency created with ID: ${newAgency.id}`);
        agencyId = newAgency.id;
      }
    }
    
    // 4. Create or update the user profile with admin role
    console.log('Checking if user profile exists...');
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileCheckError) {
      console.error('❌ Error checking if profile exists:', profileCheckError.message);
      return;
    }
    
    if (existingProfile) {
      // Update profile to admin
      console.log(`Found existing profile with role: ${existingProfile.role}`);
      console.log('Updating profile to admin role...');
      
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          role: 'admin',
          first_name: firstName,
          last_name: lastName,
          agency_id: agencyId,
          metadata: { is_superuser: true }
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError.message);
        return;
      }
      
      console.log('✅ Profile updated to admin for user:', email);
    } else {
      // Create profile with admin role
      console.log('Creating new profile with admin role...');
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          role: 'admin',
          first_name: firstName,
          last_name: lastName,
          agency_id: agencyId,
          metadata: { is_superuser: true }
        });
      
      if (profileError) {
        console.error('❌ Error creating profile:', profileError.message);
        return;
      }
      
      console.log('✅ Profile created with admin role for user:', email);
    }
    
    // Final verification
    console.log('Verifying admin account...');
    const { data: finalProfile, error: finalCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, agency_id')
      .eq('id', userId)
      .single();
    
    if (finalCheckError) {
      console.error('❌ Error verifying profile:', finalCheckError.message);
      return;
    }
    
    // Authentication test
    console.log('Testing authentication...');
    const { data: authTest, error: authTestError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });
    
    if (authTestError) {
      console.error('❌ Authentication test failed:', authTestError.message);
      console.error('Please try manually logging in with the provided credentials.');
      return;
    }
    
    console.log('✅ Authentication test successful!');
    
    console.log('');
    console.log('✅ SUPERUSER ADMIN ACCOUNT SETUP COMPLETE!');
    console.log('----------------------------------------');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${finalProfile.role} (superuser)`);
    console.log(`Agency ID: ${finalProfile.agency_id}`);
    console.log('');
    console.log('You can now log in with these credentials at /login');
    
  } catch (error) {
    console.error('❌ Unexpected error creating superuser:', error.message);
    console.error(error.stack);
  }
}

createSuperUser(); 