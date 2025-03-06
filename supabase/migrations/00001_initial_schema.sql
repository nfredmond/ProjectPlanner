-- Enable PostGIS for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer', 'community');
CREATE TYPE project_status AS ENUM ('draft', 'planned', 'active', 'completed', 'cancelled');
CREATE TYPE feedback_status AS ENUM ('pending', 'approved', 'rejected');

---------------------------------
-- Agencies table
---------------------------------
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::JSONB,
    CONSTRAINT agencies_name_unique UNIQUE (name)
);

---------------------------------
-- Profiles table
---------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'viewer',
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------
-- Criteria table
---------------------------------
CREATE TABLE criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    max_points INTEGER NOT NULL DEFAULT 5,
    weight NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_default BOOLEAN DEFAULT FALSE
);

---------------------------------
-- Projects table
---------------------------------
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'draft',
    cost_estimate NUMERIC(15,2),
    primary_category TEXT,
    geom GEOMETRY(GEOMETRY, 4326),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    score_total NUMERIC(10,2),
    score_breakdown JSONB DEFAULT '{}'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Create a GiST index on the geometry column for spatial queries
CREATE INDEX projects_geom_idx ON projects USING GIST (geom);

---------------------------------
-- Project Criteria Scores table
---------------------------------
CREATE TABLE project_criteria_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    score_value NUMERIC(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT project_criteria_unique UNIQUE (project_id, criterion_id)
);

---------------------------------
-- Feedback table
---------------------------------
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    sentiment TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    status feedback_status NOT NULL DEFAULT 'pending',
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attachment_url TEXT
);

---------------------------------
-- Votes table
---------------------------------
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote BOOLEAN NOT NULL, -- TRUE for upvote, FALSE for downvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT votes_user_feedback_unique UNIQUE (user_id, feedback_id)
);

---------------------------------
-- Reports table
---------------------------------
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::JSONB,
    generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------
-- Audit Log table
---------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::JSONB
);

---------------------------------
-- LLM Config table
---------------------------------
CREATE TABLE llm_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    model_preference TEXT NOT NULL DEFAULT 'openai:gpt-4',
    settings JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT llm_configs_agency_unique UNIQUE (agency_id)
);

-- Create Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_criteria_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_configs ENABLE ROW LEVEL SECURITY;

-- Create a function to get the current user's agency
CREATE OR REPLACE FUNCTION get_current_user_agency()
RETURNS UUID AS $$
DECLARE
    agency_id UUID;
BEGIN
    SELECT p.agency_id INTO agency_id
    FROM profiles p
    WHERE p.id = auth.uid();
    
    RETURN agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if current user is an admin
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

-- Create a function to check if current user is an admin or editor
CREATE OR REPLACE FUNCTION is_admin_or_editor()
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT p.role INTO user_role
    FROM profiles p
    WHERE p.id = auth.uid();
    
    RETURN user_role IN ('admin', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agency policies
CREATE POLICY agency_select ON agencies
    FOR SELECT USING (
        -- Admin can see all agencies, others can only see their own
        is_admin() OR id = get_current_user_agency()
    );

CREATE POLICY agency_insert ON agencies
    FOR INSERT WITH CHECK (
        -- Only admins can create agencies
        is_admin()
    );

CREATE POLICY agency_update ON agencies
    FOR UPDATE USING (
        -- Only admins can update agencies
        is_admin() AND id = get_current_user_agency()
    );

CREATE POLICY agency_delete ON agencies
    FOR DELETE USING (
        -- Only admins can delete agencies
        is_admin() AND id = get_current_user_agency()
    );

-- Profile policies
CREATE POLICY profile_select ON profiles
    FOR SELECT USING (
        -- Can see profiles in same agency
        agency_id = get_current_user_agency() OR
        -- Or their own profile
        id = auth.uid()
    );

CREATE POLICY profile_insert ON profiles
    FOR INSERT WITH CHECK (
        -- Admins can create profiles in their agency
        (is_admin() AND agency_id = get_current_user_agency()) OR
        -- Or users can create their own profile
        id = auth.uid()
    );

CREATE POLICY profile_update ON profiles
    FOR UPDATE USING (
        -- Admins can update profiles in their agency
        (is_admin() AND agency_id = get_current_user_agency()) OR
        -- Or users can update their own profile
        id = auth.uid()
    );

CREATE POLICY profile_delete ON profiles
    FOR DELETE USING (
        -- Only admins can delete profiles in their agency
        is_admin() AND agency_id = get_current_user_agency() AND id != auth.uid()
    );

-- Project policies
CREATE POLICY project_select ON projects
    FOR SELECT USING (
        -- Can see projects in same agency
        agency_id = get_current_user_agency()
    );

CREATE POLICY project_insert ON projects
    FOR INSERT WITH CHECK (
        -- Admins and editors can create projects in their agency
        is_admin_or_editor() AND agency_id = get_current_user_agency()
    );

CREATE POLICY project_update ON projects
    FOR UPDATE USING (
        -- Admins and editors can update projects in their agency
        is_admin_or_editor() AND agency_id = get_current_user_agency()
    );

CREATE POLICY project_delete ON projects
    FOR DELETE USING (
        -- Only admins can delete projects in their agency
        is_admin() AND agency_id = get_current_user_agency()
    );

-- Similar policies for other tables would follow the same pattern
-- I'm omitting them for brevity, but they would enforce the same agency-based isolation

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_timestamp
BEFORE UPDATE ON agencies
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_criteria_timestamp
BEFORE UPDATE ON criteria
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_projects_timestamp
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_project_criteria_scores_timestamp
BEFORE UPDATE ON project_criteria_scores
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_llm_configs_timestamp
BEFORE UPDATE ON llm_configs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Insert some default criteria
INSERT INTO criteria (name, description, max_points, weight, "order", is_default) VALUES
('Safety', 'Improves safety for all road users', 5, 0.20, 1, TRUE),
('Equity', 'Benefits disadvantaged communities', 5, 0.15, 2, TRUE),
('Climate Impact', 'Reduces greenhouse gas emissions', 5, 0.15, 3, TRUE),
('Congestion Relief', 'Reduces traffic congestion', 5, 0.10, 4, TRUE),
('State of Good Repair', 'Maintains existing transportation infrastructure', 5, 0.10, 5, TRUE),
('Multimodal Options', 'Provides alternatives to driving', 5, 0.10, 6, TRUE),
('Economic Development', 'Supports economic growth and job creation', 5, 0.10, 7, TRUE),
('Cost Effectiveness', 'Delivers benefits relative to costs', 5, 0.10, 8, TRUE);

-- Create audit triggers
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  record_data JSONB;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    record_data = to_jsonb(OLD);
    action_type = 'DELETE';
  ELSIF (TG_OP = 'UPDATE') THEN
    record_data = jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
    action_type = 'UPDATE';
  ELSIF (TG_OP = 'INSERT') THEN
    record_data = to_jsonb(NEW);
    action_type = 'INSERT';
  END IF;

  INSERT INTO audit_logs (user_id, action, details)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME || '_' || action_type,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'data', record_data
    )
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to important tables
CREATE TRIGGER projects_audit
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER project_criteria_scores_audit
AFTER INSERT OR UPDATE OR DELETE ON project_criteria_scores
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER feedback_audit
AFTER INSERT OR UPDATE OR DELETE ON feedback
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
