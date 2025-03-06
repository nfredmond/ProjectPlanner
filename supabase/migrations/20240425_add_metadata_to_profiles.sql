-- Add a JSONB metadata column to the profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create an index on the metadata column to optimize queries that filter on metadata fields
CREATE INDEX IF NOT EXISTS idx_profiles_metadata ON profiles USING GIN (metadata);

-- Update the RLS policy to allow users to update their own metadata
ALTER POLICY profile_update ON profiles
    FOR UPDATE USING (
        -- Admins can update profiles in their agency
        (is_admin() AND agency_id = get_current_user_agency()) OR
        -- Or users can update their own profile
        id = auth.uid()
    );

-- Allow admin users to see profiles with pending organization requests
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT p.role INTO user_role
    FROM profiles p
    WHERE p.id = auth.uid();
    
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 