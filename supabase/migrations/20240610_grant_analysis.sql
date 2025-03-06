-- Create grant programs table
CREATE TABLE IF NOT EXISTS grant_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  funding_amount DECIMAL(15, 2),
  deadline TIMESTAMP WITH TIME ZONE,
  eligibility_criteria TEXT,
  scoring_criteria TEXT,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Add RLS policies for grant_programs
ALTER TABLE grant_programs ENABLE ROW LEVEL SECURITY;

-- Policy: users can view grant programs from their agency
CREATE POLICY "Users can view their agency's grant programs" 
  ON grant_programs FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: only editors and admins can insert
CREATE POLICY "Editors and admins can create grant programs" 
  ON grant_programs FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- Policy: only editors and admins can update their own agency's grant programs
CREATE POLICY "Editors and admins can update their agency's grant programs" 
  ON grant_programs FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- Policy: only admins can delete grant programs
CREATE POLICY "Admins can delete grant programs" 
  ON grant_programs FOR DELETE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create project grant analyses table
CREATE TABLE IF NOT EXISTS project_grant_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  grant_program_id UUID REFERENCES grant_programs(id) ON DELETE SET NULL,
  analysis_result JSONB NOT NULL,
  raw_response TEXT,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Add RLS policies for project_grant_analyses
ALTER TABLE project_grant_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: users can view analyses for projects from their agency
CREATE POLICY "Users can view analyses from their agency's projects" 
  ON project_grant_analyses FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Policy: only users from the same agency can insert analyses
CREATE POLICY "Users can create analyses for their agency's projects" 
  ON project_grant_analyses FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects 
      WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Policy: only admins and the creator can delete analyses
CREATE POLICY "Admins and creators can delete analyses" 
  ON project_grant_analyses FOR DELETE
  USING (
    created_by = auth.uid()
    OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' AND agency_id IN (
        SELECT agency_id FROM projects WHERE id = project_id
      )
    )
  );

-- Add functions to get most recent analysis for a project
CREATE OR REPLACE FUNCTION get_latest_project_analysis(project_id UUID)
RETURNS SETOF project_grant_analyses
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM project_grant_analyses
  WHERE project_id = $1
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS project_grant_analyses_project_id_idx ON project_grant_analyses(project_id);
CREATE INDEX IF NOT EXISTS project_grant_analyses_created_at_idx ON project_grant_analyses(created_at);
CREATE INDEX IF NOT EXISTS grant_programs_agency_id_idx ON grant_programs(agency_id); 