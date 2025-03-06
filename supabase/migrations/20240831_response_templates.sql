-- Migration to add response templates for automated feedback responses

---------------------------------
-- Response Templates table
---------------------------------
CREATE TABLE response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  tone TEXT NOT NULL, -- 'formal', 'friendly', 'technical', 'simple'
  category TEXT NOT NULL DEFAULT 'general',
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX response_templates_agency_id_idx ON response_templates(agency_id);
CREATE INDEX response_templates_category_idx ON response_templates(category);

-- Create trigger for timestamps
CREATE TRIGGER update_response_templates_timestamp
BEFORE UPDATE ON response_templates
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create audit log trigger for response templates
CREATE TRIGGER response_templates_audit
AFTER INSERT OR UPDATE OR DELETE ON response_templates
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Enable RLS
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their agency's templates
CREATE POLICY response_templates_select_policy ON response_templates 
  FOR SELECT 
  USING (agency_id = get_current_user_agency());

-- Policy: Only admins and editors can insert templates
CREATE POLICY response_templates_insert_policy ON response_templates 
  FOR INSERT 
  WITH CHECK (
    agency_id = get_current_user_agency() AND
    is_admin_or_editor()
  );

-- Policy: Only admins and editors can update templates
CREATE POLICY response_templates_update_policy ON response_templates 
  FOR UPDATE 
  USING (
    agency_id = get_current_user_agency() AND
    is_admin_or_editor()
  );

-- Policy: Only admins can delete templates
CREATE POLICY response_templates_delete_policy ON response_templates 
  FOR DELETE 
  USING (
    agency_id = get_current_user_agency() AND
    is_admin()
  );

---------------------------------
-- Feedback Responses table
---------------------------------
CREATE TABLE feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  template_id UUID REFERENCES response_templates(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_automated BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX feedback_responses_feedback_id_idx ON feedback_responses(feedback_id);
CREATE INDEX feedback_responses_template_id_idx ON feedback_responses(template_id);

-- Create trigger for timestamps
CREATE TRIGGER update_feedback_responses_timestamp
BEFORE UPDATE ON feedback_responses
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create audit log trigger
CREATE TRIGGER feedback_responses_audit
AFTER INSERT OR UPDATE OR DELETE ON feedback_responses
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Enable RLS
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view responses related to their agency's feedback
CREATE POLICY feedback_responses_select_policy ON feedback_responses 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM feedback f
      WHERE f.id = feedback_id
      AND f.agency_id = get_current_user_agency()
    )
  );

-- Policy: Only admins and editors can insert responses
CREATE POLICY feedback_responses_insert_policy ON feedback_responses 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM feedback f
      WHERE f.id = feedback_id
      AND f.agency_id = get_current_user_agency()
    ) AND
    is_admin_or_editor()
  );

-- Policy: Only admins and editors can update responses
CREATE POLICY feedback_responses_update_policy ON feedback_responses 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM feedback f
      WHERE f.id = feedback_id
      AND f.agency_id = get_current_user_agency()
    ) AND
    is_admin_or_editor()
  );

-- Policy: Only admins can delete responses
CREATE POLICY feedback_responses_delete_policy ON feedback_responses 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM feedback f
      WHERE f.id = feedback_id
      AND f.agency_id = get_current_user_agency()
    ) AND
    is_admin()
  );

-- Add new columns to the feedback table for sentiment analysis
ALTER TABLE feedback 
  ADD COLUMN sentiment_score NUMERIC(3,2),
  ADD COLUMN sentiment_details JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN analyzed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN themes TEXT[],
  ADD COLUMN is_actionable BOOLEAN; 