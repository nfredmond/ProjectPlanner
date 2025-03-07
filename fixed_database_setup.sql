-- Complete Database Setup for Project Planner Application
-- Run this entire script in the Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer', 'community');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'planned', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

---------------------------------
-- Agencies table
---------------------------------
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::JSONB,
    CONSTRAINT agencies_name_unique UNIQUE (name)
);

-- Create a default agency if none exists
INSERT INTO public.agencies (name, region)
SELECT 'Green DOT Transportation Solutions', 'National'
WHERE NOT EXISTS (SELECT 1 FROM public.agencies WHERE name = 'Green DOT Transportation Solutions');

---------------------------------
-- Profiles table
---------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer',
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::JSONB
);

---------------------------------
-- Criteria table
---------------------------------
CREATE TABLE IF NOT EXISTS public.criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    cost_estimate NUMERIC(15,2),
    primary_category TEXT,
    geom GEOMETRY(GEOMETRY, 4326),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    score_total NUMERIC(10,2),
    score_breakdown JSONB DEFAULT '{}'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Create a GiST index on the geometry column for spatial queries
CREATE INDEX IF NOT EXISTS projects_geom_idx ON public.projects USING GIST (geom);

---------------------------------
-- Project Criteria Scores table
---------------------------------
CREATE TABLE IF NOT EXISTS public.project_criteria_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES public.criteria(id) ON DELETE CASCADE,
    score_value NUMERIC(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT project_criteria_unique UNIQUE (project_id, criterion_id)
);

---------------------------------
-- Feedback table
---------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT,
    email TEXT,
    comment TEXT NOT NULL,
    sentiment TEXT,
    status feedback_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::JSONB
);

---------------------------------
-- Feedback Responses table
---------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------
-- Scoring Scenarios table
---------------------------------
CREATE TABLE IF NOT EXISTS public.scoring_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    criteria_weights JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_default BOOLEAN DEFAULT FALSE
);

---------------------------------
-- Environment Variables table
---------------------------------
CREATE TABLE IF NOT EXISTS public.environment_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    is_secret BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT env_var_key_unique UNIQUE (agency_id, key)
);

---------------------------------
-- LLM Configs table
---------------------------------
CREATE TABLE IF NOT EXISTS public.llm_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    api_key TEXT,
    max_tokens INTEGER DEFAULT 1000,
    temperature NUMERIC(3,2) DEFAULT 0.7,
    top_p NUMERIC(3,2) DEFAULT 1.0,
    frequency_penalty NUMERIC(3,2) DEFAULT 0.0,
    presence_penalty NUMERIC(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT llm_config_unique UNIQUE (agency_id, name)
);

---------------------------------
-- Prompt Templates table
---------------------------------
CREATE TABLE IF NOT EXISTS public.prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT,
    user_prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT prompt_template_unique UNIQUE (agency_id, name)
);

---------------------------------
-- Response Templates table
---------------------------------
CREATE TABLE IF NOT EXISTS public.response_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT response_template_unique UNIQUE (agency_id, name)
);

-- Add metadata column to tables that might need it
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- Set up Row Level Security policies
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_criteria_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environment_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_templates ENABLE ROW LEVEL SECURITY;

-- Create helper functions for RLS
CREATE OR REPLACE FUNCTION public.get_current_user_id() 
RETURNS UUID 
LANGUAGE SQL STABLE
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_agency() 
RETURNS UUID 
LANGUAGE SQL STABLE
AS $$
  SELECT agency_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN 
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_editor() 
RETURNS BOOLEAN 
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
$$;

-- Drop existing policies if they exist to avoid errors
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                  rec.policyname, rec.schemaname, rec.tablename);
  END LOOP;
END
$$;

-- Basic RLS policies
CREATE POLICY "Agency admins can see their agency"
  ON public.agencies
  FOR SELECT
  TO authenticated
  USING (
    is_admin() OR id = get_current_user_agency()
  );

CREATE POLICY "Agency admins can update their agency"
  ON public.agencies
  FOR UPDATE
  TO authenticated
  USING (
    is_admin() AND id = get_current_user_agency()
  );

CREATE POLICY "Users can see profiles in their agency"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (is_admin() AND agency_id = get_current_user_agency()) OR
    id = auth.uid()
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
  );

CREATE POLICY "Admins can update profiles in their agency"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    is_admin() AND agency_id = get_current_user_agency() AND id != auth.uid()
  );

-- Add more RLS policies as needed for other tables

-- Create superuser account
DO $$
DECLARE
    agency_id UUID;
    user_id UUID;
BEGIN
    -- Get agency ID
    SELECT id INTO agency_id FROM public.agencies WHERE name = 'Green DOT Transportation Solutions' LIMIT 1;
    
    -- Check if user exists
    SELECT id INTO user_id FROM auth.users WHERE email = 'nfredmond@gmail.com' LIMIT 1;
    
    IF user_id IS NULL THEN
        -- Create user if not exists
        user_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, 
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            'nfredmond@gmail.com',
            -- This is a hashed version of 'Password123!'
            crypt('Password123!', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Nathaniel","last_name":"Redmond","is_superuser":true}',
            now(),
            now()
        );
    END IF;
    
    -- Create or update profile
    INSERT INTO public.profiles (id, agency_id, role, first_name, last_name, title, metadata)
    VALUES (
        user_id,
        agency_id,
        'admin',
        'Nathaniel',
        'Redmond',
        'Administrator',
        '{"is_superuser":true}'
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
        role = 'admin',
        agency_id = agency_id,
        first_name = 'Nathaniel',
        last_name = 'Redmond',
        title = 'Administrator',
        metadata = '{"is_superuser":true}',
        updated_at = now();
        
    RAISE NOTICE 'Superuser account set up with ID: %', user_id;
END
$$;

-- Output success message
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Database setup complete!';
    RAISE NOTICE 'You can now log in with:';
    RAISE NOTICE 'Email: nfredmond@gmail.com';
    RAISE NOTICE 'Password: Password123!';
    RAISE NOTICE '===========================================';
END
$$; 