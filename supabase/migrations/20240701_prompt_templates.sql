-- Migration for Prompt Templates
-- This migration adds tables for storing, versioning, and managing prompt templates

---------------------------------
-- Prompt Templates table
---------------------------------
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    purpose TEXT NOT NULL, -- e.g., 'generate-report', 'grant-analysis', etc.
    template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT prompt_templates_name_agency_unique UNIQUE (name, agency_id)
);

---------------------------------
-- Prompt Template Versions table (for version history)
---------------------------------
CREATE TABLE prompt_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    template TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT prompt_template_versions_template_version_unique UNIQUE (template_id, version)
);

---------------------------------
-- Prompt Template Variables table (for dynamic variables in templates)
---------------------------------
CREATE TABLE prompt_template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    default_value TEXT,
    required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT prompt_template_variables_template_name_unique UNIQUE (template_id, name)
);

---------------------------------
-- Prompt Template Usage Logs table
---------------------------------
CREATE TABLE prompt_template_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
    template_version INTEGER NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    variables JSONB DEFAULT '{}'::JSONB,
    success BOOLEAN DEFAULT TRUE,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------
-- Update trigger for prompt_templates
---------------------------------
CREATE TRIGGER update_prompt_templates_timestamp
BEFORE UPDATE ON prompt_templates
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

---------------------------------
-- Update trigger for prompt_template_variables
---------------------------------
CREATE TRIGGER update_prompt_template_variables_timestamp
BEFORE UPDATE ON prompt_template_variables
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

---------------------------------
-- Versioning trigger for prompt_templates
---------------------------------
CREATE OR REPLACE FUNCTION create_prompt_template_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create new version if template or purpose changed
    IF OLD.template <> NEW.template OR OLD.purpose <> NEW.purpose THEN
        -- Increment version number
        NEW.version = OLD.version + 1;
        
        -- Create entry in version history
        INSERT INTO prompt_template_versions (
            template_id, 
            version, 
            template, 
            created_by, 
            notes
        ) VALUES (
            NEW.id,
            NEW.version,
            NEW.template,
            NEW.created_by,
            'Automatic version on update'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_templates_versioning
BEFORE UPDATE ON prompt_templates
FOR EACH ROW EXECUTE FUNCTION create_prompt_template_version();

---------------------------------
-- Default Templates
---------------------------------
-- Insert default templates for common purposes
INSERT INTO prompt_templates (
    agency_id,
    name,
    description,
    purpose,
    template,
    created_at
) VALUES (
    -- This assumes the first agency in the database
    (SELECT id FROM agencies ORDER BY created_at LIMIT 1),
    'Default Project Analysis',
    'Default template for analyzing transportation projects',
    'analyze',
    'Analyze the following transportation project and provide insights on its feasibility, potential impact, and alignment with regional priorities:

Project Information:
{{project_information}}

Consider the following aspects in your analysis:
1. Alignment with regional transportation goals
2. Environmental impacts and mitigations
3. Equity considerations
4. Cost-effectiveness and funding viability
5. Technical feasibility
6. Community benefits and potential concerns

Provide specific recommendations for improvement and potential funding sources.',
    CURRENT_TIMESTAMP
);

INSERT INTO prompt_templates (
    agency_id,
    name,
    description,
    purpose,
    template,
    created_at
) VALUES (
    -- This assumes the first agency in the database
    (SELECT id FROM agencies ORDER BY created_at LIMIT 1),
    'Default Grant Analysis',
    'Default template for analyzing grant opportunities for projects',
    'grant-analysis',
    'Evaluate how well the following project matches the requirements for the specified grant opportunity:

Project Information:
{{project_information}}

Grant Opportunity:
{{grant_information}}

In your evaluation, address:
1. How well the project aligns with the grant's stated goals and priorities
2. Specific eligibility criteria that the project meets or fails to meet
3. Strengths of the project in relation to the grant requirements
4. Weaknesses or gaps that should be addressed
5. Recommendations for improving the application
6. Estimated likelihood of success (Low, Medium, High)

Provide an overall assessment of the project''s competitiveness for this grant opportunity.',
    CURRENT_TIMESTAMP
);

---------------------------------
-- Row-Level Security Policies
---------------------------------
-- Apply RLS policies for prompt templates
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_template_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY admin_all_prompt_templates ON prompt_templates
    USING (is_admin());

CREATE POLICY admin_all_prompt_template_versions ON prompt_template_versions
    USING (is_admin());

CREATE POLICY admin_all_prompt_template_variables ON prompt_template_variables
    USING (is_admin());

CREATE POLICY admin_all_prompt_template_usage_logs ON prompt_template_usage_logs
    USING (is_admin());

-- Editors can view and edit prompt templates for their agency
CREATE POLICY editor_agency_prompt_templates ON prompt_templates
    USING (agency_id = get_current_user_agency() AND is_admin_or_editor());

CREATE POLICY editor_agency_prompt_template_versions ON prompt_template_versions
    USING ((SELECT agency_id FROM prompt_templates WHERE id = template_id) = get_current_user_agency() AND is_admin_or_editor());

CREATE POLICY editor_agency_prompt_template_variables ON prompt_template_variables
    USING ((SELECT agency_id FROM prompt_templates WHERE id = template_id) = get_current_user_agency() AND is_admin_or_editor());

-- Viewers can view but not edit prompt templates for their agency
CREATE POLICY viewer_agency_prompt_templates ON prompt_templates
    FOR SELECT USING (agency_id = get_current_user_agency());

CREATE POLICY viewer_agency_prompt_template_versions ON prompt_template_versions
    FOR SELECT USING ((SELECT agency_id FROM prompt_templates WHERE id = template_id) = get_current_user_agency());

CREATE POLICY viewer_agency_prompt_template_variables ON prompt_template_variables
    FOR SELECT USING ((SELECT agency_id FROM prompt_templates WHERE id = template_id) = get_current_user_agency());

-- Add audit logs for prompt template changes
CREATE TRIGGER prompt_templates_audit
AFTER INSERT OR UPDATE OR DELETE ON prompt_templates
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER prompt_template_versions_audit
AFTER INSERT OR UPDATE OR DELETE ON prompt_template_versions
FOR EACH ROW EXECUTE FUNCTION audit_log_changes(); 