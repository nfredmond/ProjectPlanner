-- Migration for LLM Configuration
-- This migration adds tables for storing LLM provider configurations and model settings

---------------------------------
-- LLM Configs table
---------------------------------
CREATE TABLE llm_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    context_size INTEGER NOT NULL,
    cost_per_1k_tokens NUMERIC(10,6) NOT NULL,
    capabilities TEXT[] NOT NULL,
    default_for_tasks TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT llm_configs_name_provider_unique UNIQUE (name, provider)
);

---------------------------------
-- Agency LLM Preferences table
---------------------------------
CREATE TABLE agency_llm_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    preferred_provider TEXT NOT NULL,
    preferred_model TEXT NOT NULL,
    temperature NUMERIC(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT agency_llm_preferences_agency_purpose_unique UNIQUE (agency_id, purpose)
);

---------------------------------
-- LLM Usage Logs table
---------------------------------
CREATE TABLE llm_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    purpose TEXT NOT NULL,
    tokens_used INTEGER NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------
-- Update trigger for llm_configs
---------------------------------
CREATE TRIGGER update_llm_configs_timestamp
BEFORE UPDATE ON llm_configs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

---------------------------------
-- Update trigger for agency_llm_preferences
---------------------------------
CREATE TRIGGER update_agency_llm_preferences_timestamp
BEFORE UPDATE ON agency_llm_preferences
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

---------------------------------
-- Default LLM Configurations
---------------------------------
-- Insert default configurations for supported models
INSERT INTO llm_configs (
    name,
    provider,
    context_size,
    cost_per_1k_tokens,
    capabilities,
    default_for_tasks,
    created_at
) VALUES 
-- OpenAI models
(
    'gpt-4o',
    'openai',
    128000,
    0.01,
    ARRAY['text_generation', 'code_generation', 'instruction_following', 'reasoning'],
    ARRAY['analyze', 'project-recommendations'],
    CURRENT_TIMESTAMP
),
(
    'gpt-4-turbo',
    'openai',
    128000,
    0.01,
    ARRAY['text_generation', 'code_generation', 'instruction_following', 'reasoning'],
    NULL,
    CURRENT_TIMESTAMP
),
(
    'gpt-3.5-turbo',
    'openai',
    16000,
    0.001,
    ARRAY['text_generation', 'instruction_following'],
    NULL,
    CURRENT_TIMESTAMP
),
-- Anthropic models
(
    'claude-3-opus-20240229',
    'anthropic',
    200000,
    0.015,
    ARRAY['text_generation', 'instruction_following', 'reasoning', 'long_form_content'],
    ARRAY['generate-report', 'feedback-response'],
    CURRENT_TIMESTAMP
),
(
    'claude-3-sonnet-20240229',
    'anthropic',
    180000,
    0.008,
    ARRAY['text_generation', 'instruction_following', 'reasoning'],
    NULL,
    CURRENT_TIMESTAMP
),
(
    'claude-3-haiku-20240307',
    'anthropic',
    160000,
    0.003,
    ARRAY['text_generation', 'instruction_following'],
    NULL,
    CURRENT_TIMESTAMP
),
-- LLaMA models
(
    'llama-3-70b-instruct',
    'llama',
    8000,
    0.0008,
    ARRAY['text_generation', 'instruction_following'],
    NULL,
    CURRENT_TIMESTAMP
),
(
    'llama-3-8b-instruct',
    'llama',
    4000,
    0.0002,
    ARRAY['text_generation', 'instruction_following'],
    NULL,
    CURRENT_TIMESTAMP
);

---------------------------------
-- Default Agency Preferences
---------------------------------
-- Set default preferences for the first agency
INSERT INTO agency_llm_preferences (
    agency_id,
    purpose,
    preferred_provider,
    preferred_model,
    temperature,
    max_tokens,
    created_at
) VALUES
(
    (SELECT id FROM agencies ORDER BY created_at LIMIT 1),
    'analyze',
    'openai',
    'gpt-4o',
    0.7,
    2000,
    CURRENT_TIMESTAMP
),
(
    (SELECT id FROM agencies ORDER BY created_at LIMIT 1),
    'generate-report',
    'anthropic',
    'claude-3-opus-20240229',
    0.5,
    4000,
    CURRENT_TIMESTAMP
),
(
    (SELECT id FROM agencies ORDER BY created_at LIMIT 1),
    'grant-analysis',
    'openai',
    'gpt-4o',
    0.3,
    2500,
    CURRENT_TIMESTAMP
),
(
    (SELECT id FROM agencies ORDER BY created_at LIMIT 1),
    'project-recommendations',
    'openai',
    'gpt-4o',
    0.7,
    1500,
    CURRENT_TIMESTAMP
),
(
    (SELECT id FROM agencies ORDER BY created_at LIMIT 1),
    'feedback-response',
    'anthropic',
    'claude-3-opus-20240229',
    0.6,
    1000,
    CURRENT_TIMESTAMP
);

---------------------------------
-- Row-Level Security Policies
---------------------------------
-- Apply RLS policies
ALTER TABLE llm_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_llm_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY admin_all_llm_configs ON llm_configs
    USING (is_admin());

CREATE POLICY admin_all_agency_llm_preferences ON agency_llm_preferences
    USING (is_admin());

CREATE POLICY admin_all_llm_usage_logs ON llm_usage_logs
    USING (is_admin());

-- Editors can view LLM configs and manage their agency's preferences
CREATE POLICY editor_view_llm_configs ON llm_configs
    FOR SELECT USING (is_admin_or_editor());

CREATE POLICY editor_agency_llm_preferences ON agency_llm_preferences
    USING (agency_id = get_current_user_agency() AND is_admin_or_editor());

-- Viewers can view but not edit
CREATE POLICY viewer_view_llm_configs ON llm_configs
    FOR SELECT USING (TRUE);

CREATE POLICY viewer_view_agency_llm_preferences ON agency_llm_preferences
    FOR SELECT USING (agency_id = get_current_user_agency());

-- Add audit logs for changes
CREATE TRIGGER llm_configs_audit
AFTER INSERT OR UPDATE OR DELETE ON llm_configs
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER agency_llm_preferences_audit
AFTER INSERT OR UPDATE OR DELETE ON agency_llm_preferences
FOR EACH ROW EXECUTE FUNCTION audit_log_changes(); 