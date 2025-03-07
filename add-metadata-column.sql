-- Check if metadata column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'metadata';

-- If the above query returns no rows, you can run these statements:

-- Add the metadata column to the profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create an index for the metadata column
CREATE INDEX IF NOT EXISTS idx_profiles_metadata ON profiles USING GIN (metadata);

-- Test query to update a profile with metadata
-- Replace 'user-id-here' with an actual user ID
/*
UPDATE profiles
SET metadata = '{"new_agency_request": true, "new_agency_name": "Test Agency", "email": "test@example.com"}'
WHERE id = 'user-id-here';
*/ 