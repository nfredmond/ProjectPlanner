-- Migration: Auth Fixes and Admin Reset
-- Date: 2024-07-20

-- Function to reset or create admin user
CREATE OR REPLACE FUNCTION public.reset_admin_user(admin_email TEXT, admin_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  first_agency_id UUID;
  result_message TEXT;
BEGIN
  -- Check if user exists with this email
  SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
  
  -- If user exists, update password
  IF user_id IS NOT NULL THEN
    -- Update password and ensure account is confirmed
    UPDATE auth.users 
    SET 
      encrypted_password = crypt(admin_password, gen_salt('bf')),
      email_confirmed_at = now(),
      confirmation_sent_at = now(),
      updated_at = now(),
      confirmation_token = NULL,
      raw_app_meta_data = jsonb_set(raw_app_meta_data, '{provider}', '"email"'),
      raw_user_meta_data = jsonb_set(raw_user_meta_data, '{first_name, last_name}', '{"Admin", "User"}')
    WHERE id = user_id;
  
    -- Ensure user has admin role in profiles table
    UPDATE public.profiles
    SET role = 'admin',
        first_name = 'Admin',
        last_name = 'User'
    WHERE id = user_id;
    
    result_message := 'Admin user updated with ID: ' || user_id::TEXT;
  ELSE
    -- Create a new admin user
    -- Get UUID
    SELECT gen_random_uuid() INTO user_id;
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      user_id,
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email"}',
      '{"first_name": "Admin", "last_name": "User"}'
    );
    
    -- Get first agency for admin user
    SELECT id INTO first_agency_id FROM public.agencies LIMIT 1;
    
    IF first_agency_id IS NULL THEN
      -- Create a default agency if none exists
      INSERT INTO public.agencies (name, created_at)
      VALUES ('Default Agency', now())
      RETURNING id INTO first_agency_id;
    END IF;
    
    -- Insert into profiles table
    INSERT INTO public.profiles (
      id, agency_id, first_name, last_name, role
    ) VALUES (
      user_id,
      first_agency_id,
      'Admin',
      'User',
      'admin'
    );
    
    result_message := 'Admin user created with ID: ' || user_id::TEXT;
  END IF;
  
  RETURN result_message;
END;
$$;

-- Grant execute permission to specific roles or service role
GRANT EXECUTE ON FUNCTION public.reset_admin_user TO service_role;

-- Create example function call
COMMENT ON FUNCTION public.reset_admin_user IS 'Function to reset or create admin user. Example usage: SELECT public.reset_admin_user(''admin@example.com'', ''securepassword'');';

-- Create a more secure version that requires an access key
CREATE OR REPLACE FUNCTION public.reset_admin_user_with_key(admin_email TEXT, admin_password TEXT, access_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expected_key TEXT;
  result TEXT;
BEGIN
  -- Get expected key from settings table or use default
  SELECT value INTO expected_key FROM public.app_settings WHERE key = 'admin_reset_key';
  
  IF expected_key IS NULL THEN
    expected_key := 'ProjectPlanner_AdminReset_2024';
  END IF;
  
  -- Verify access key
  IF access_key = expected_key THEN
    -- Call the reset function
    SELECT public.reset_admin_user(admin_email, admin_password) INTO result;
    RETURN result;
  ELSE
    RETURN 'Unauthorized: Invalid access key';
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.reset_admin_user_with_key TO service_role;

-- Comment for usage
COMMENT ON FUNCTION public.reset_admin_user_with_key IS 'Secure function to reset admin user with an access key. Example usage: SELECT public.reset_admin_user_with_key(''admin@example.com'', ''securepassword'', ''YourSecretKey'');';

-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add admin reset key setting if it doesn't exist
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('admin_reset_key', 'ProjectPlanner_AdminReset_2024', 'Secret key required to reset admin user')
ON CONFLICT (key) DO NOTHING;

-- Reset the specified admin user
SELECT public.reset_admin_user('nfredmond@gmail.com', 'Yuba530#'); 