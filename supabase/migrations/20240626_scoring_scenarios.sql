-- Add scoring_scenarios table for saved weight configurations
CREATE TABLE scoring_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  weights JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX scoring_scenarios_agency_id_idx ON scoring_scenarios(agency_id);

-- Create trigger for timestamps
CREATE TRIGGER update_scoring_scenarios_timestamp
BEFORE UPDATE ON scoring_scenarios
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create audit log trigger for scoring scenarios
CREATE TRIGGER scoring_scenarios_audit
AFTER INSERT OR UPDATE OR DELETE ON scoring_scenarios
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Modify RLS policies to include scoring_scenarios
ALTER TABLE scoring_scenarios ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their agency's scoring scenarios
CREATE POLICY scoring_scenarios_select_policy ON scoring_scenarios 
  FOR SELECT 
  USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

-- Policy: Only admins/editors can insert scenarios
CREATE POLICY scoring_scenarios_insert_policy ON scoring_scenarios 
  FOR INSERT 
  WITH CHECK (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

-- Policy: Only admins/editors can update scenarios
CREATE POLICY scoring_scenarios_update_policy ON scoring_scenarios 
  FOR UPDATE 
  USING (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

-- Policy: Only admins/editors can delete scenarios
CREATE POLICY scoring_scenarios_delete_policy ON scoring_scenarios 
  FOR DELETE 
  USING (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  ); 