-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  rate_limit INTEGER,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  config JSONB DEFAULT '{}'::JSONB,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

-- Create integration logs table
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  request_params JSONB
);

-- Create RLS policies for integrations
CREATE POLICY "Agency users can view their own integrations"
  ON integrations
  FOR SELECT
  USING (agency_id = auth.jwt() -> 'agency_id');

CREATE POLICY "Agency admins can insert integrations"
  ON integrations
  FOR INSERT
  WITH CHECK (
    agency_id = auth.jwt() -> 'agency_id' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles ? 'admin'
    )
  );

CREATE POLICY "Agency admins can update their own integrations"
  ON integrations
  FOR UPDATE
  USING (
    agency_id = auth.jwt() -> 'agency_id' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles ? 'admin'
    )
  );

CREATE POLICY "Agency admins can delete their own integrations"
  ON integrations
  FOR DELETE
  USING (
    agency_id = auth.jwt() -> 'agency_id' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.roles ? 'admin'
    )
  );

-- Create RLS policies for integration logs
CREATE POLICY "Agency users can view their own integration logs"
  ON integration_logs
  FOR SELECT
  USING (agency_id = auth.jwt() -> 'agency_id');

CREATE POLICY "System can insert integration logs"
  ON integration_logs
  FOR INSERT
  WITH CHECK (true);

-- Enable RLS on tables
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY; 