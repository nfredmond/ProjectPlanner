# Admin User Reset Documentation

## Reset Admin User via SQL

Below is the SQL script that can be run in the Supabase SQL Editor to reset or create the admin superuser with the email `nfredmond@gmail.com` and password `Yuba530#`.

```sql
-- Reset or create the admin user
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Check if user exists with this email
  SELECT id INTO user_id FROM auth.users WHERE email = 'nfredmond@gmail.com';
  
  -- If user exists, update password
  IF user_id IS NOT NULL THEN
    -- Update password and ensure account is confirmed
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('Yuba530#', gen_salt('bf')),
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
    
    RAISE NOTICE 'User updated: %', user_id;
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
      'nfredmond@gmail.com',
      crypt('Yuba530#', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email"}',
      '{"first_name": "Admin", "last_name": "User"}'
    );
    
    -- Get first agency for admin user
    DECLARE
      first_agency_id UUID;
    BEGIN
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
    END;
    
    RAISE NOTICE 'User created: %', user_id;
  END IF;
END
$$;
```

## Running the SQL Script

1. Log into the Supabase dashboard
2. Go to the SQL Editor
3. Paste the SQL script above
4. Run the script
5. Check the notifications for confirmation of user update or creation

## Security Considerations

- This script sets a known password, which should be changed immediately after initial login
- The script has admin privileges and can bypass Row Level Security (RLS)
- Only run this script in trusted environments

## Using the Admin Reset Page

Alternatively, you can use the admin reset page in the application:

1. Visit `/admin-reset` in the application
2. Enter the email `nfredmond@gmail.com`
3. Enter the password `Yuba530#`
4. Enter the secret key (default: `ProjectPlanner_AdminReset_2024`)
5. Click "Reset Admin User"

This provides a more user-friendly interface for resetting the admin user. 