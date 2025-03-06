-- Create environment_variables table
CREATE TABLE IF NOT EXISTS environment_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  customer_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (key, customer_id)
);

-- Add comment
COMMENT ON TABLE environment_variables IS 'Stores environment variables for the application, both global and customer-specific';

-- Create index on key and customer_id for faster lookups
CREATE INDEX IF NOT EXISTS environment_variables_key_idx ON environment_variables (key);
CREATE INDEX IF NOT EXISTS environment_variables_customer_id_idx ON environment_variables (customer_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_environment_variables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER environment_variables_updated_at
BEFORE UPDATE ON environment_variables
FOR EACH ROW
EXECUTE FUNCTION update_environment_variables_updated_at();

-- Example seed data for default environment variables
INSERT INTO environment_variables (key, value, is_secret, description, customer_id)
VALUES
  ('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'your-mapbox-access-token', TRUE, 'Default Mapbox access token for maps functionality', NULL),
  ('OPENAI_MODEL', 'o3-mini', FALSE, 'Default OpenAI model to use for LLM features', NULL),
  ('ANTHROPIC_MODEL', 'claude-3.7-sonnet', FALSE, 'Default Anthropic model to use for LLM features', NULL),
  ('ENABLE_LLM_FEATURES', 'true', FALSE, 'Toggle to enable/disable LLM features globally', NULL),
  ('ENABLE_ADVANCED_MAPPING', 'true', FALSE, 'Toggle to enable/disable advanced mapping features globally', NULL),
  ('NODE_ENV', 'production', FALSE, 'Application environment (development or production)', NULL),
  ('NEXT_PUBLIC_APP_URL', 'https://rtpa-project-planner.vercel.app', FALSE, 'Public URL of the application', NULL)
ON CONFLICT (key, customer_id) DO NOTHING;

-- Create RLS policies
ALTER TABLE environment_variables ENABLE ROW LEVEL SECURITY;

-- Only admins can view, create, update, or delete environment variables
CREATE POLICY "Allow admins full access to environment variables"
ON environment_variables
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Create function to get environment variables with customer-specific overrides
CREATE OR REPLACE FUNCTION get_resolved_environment_variables(p_customer_id UUID DEFAULT NULL)
RETURNS TABLE (
  key TEXT,
  value TEXT,
  is_secret BOOLEAN,
  description TEXT,
  is_customer_specific BOOLEAN
) AS $$
BEGIN
  -- First get global variables
  CREATE TEMP TABLE temp_env_vars ON COMMIT DROP AS
  SELECT 
    key, 
    value, 
    is_secret, 
    description, 
    FALSE AS is_customer_specific
  FROM environment_variables
  WHERE customer_id IS NULL;
  
  -- If customer_id is provided, override with customer-specific values
  IF p_customer_id IS NOT NULL THEN
    -- Insert or update with customer-specific values
    INSERT INTO temp_env_vars (key, value, is_secret, description, is_customer_specific)
    SELECT 
      key, 
      value, 
      is_secret, 
      description, 
      TRUE AS is_customer_specific
    FROM environment_variables
    WHERE customer_id = p_customer_id
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      is_secret = EXCLUDED.is_secret,
      description = EXCLUDED.description,
      is_customer_specific = EXCLUDED.is_customer_specific;
  END IF;
  
  -- Return the resolved environment variables
  RETURN QUERY SELECT * FROM temp_env_vars ORDER BY key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 