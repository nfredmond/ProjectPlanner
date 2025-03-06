import { LatLngExpression, LatLngBounds } from 'leaflet';

// User Role Type
export type UserRole = 'admin' | 'editor' | 'viewer' | 'community';

// Project Status Type
export type ProjectStatus = 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';

// Feedback Status Type
export type FeedbackStatus = 'pending' | 'approved' | 'rejected';

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'user' | 'viewer';
  agency_id: string;
  created_at: string;
  updated_at?: string;
}

// Agency types
export interface Agency {
  id: string;
  name: string;
  region: string;
  logo_url?: string;
  settings?: AgencySettings;
  created_at: string;
  updated_at?: string;
}

export interface AgencySettings {
  mapCenter?: [number, number]; // [longitude, latitude]
  defaultZoom?: number;
  primaryColor?: string;
  secondaryColor?: string;
  enableCommunityPortal?: boolean;
  enableLlm?: boolean;
  llm?: LlmSettings;
}

export interface LlmSettings {
  enabled: boolean;
  apiProvider: string;
  apiKey: string;
  apiEndpoint?: string;
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  presencePenalty: number;
  frequencyPenalty: number;
  contextWindow: number;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  agency_id: string;
  status: ProjectStatus;
  location?: string;
  geometry?: any; // GeoJSON
  cost?: number;
  funding_source?: string;
  timeline_start?: string;
  timeline_end?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

// Scoring types
export interface Criterion {
  id: string;
  agency_id: string;
  name: string;
  description?: string;
  max_points: number;
  weight: number;
  order: number;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Score {
  id: string;
  project_id: string;
  criterion_id: string;
  value: number;
  notes?: string;
  scored_by: string;
  created_at: string;
  updated_at?: string;
}

// User Profile Interface
export interface UserProfile {
  id: string;
  agency_id: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  title?: string;
  created_at: string;
  updated_at: string;
  email?: string; // Added from auth.users
}

// Project Metadata Interface
export interface ProjectMetadata {
  census_data?: {
    population?: number;
    median_income?: number;
    poverty_rate?: number;
    [key: string]: any;
  };
  traffic_data?: {
    aadt?: number; // Annual Average Daily Traffic
    peak_hour_volume?: number;
    [key: string]: any;
  };
  environmental_data?: {
    [key: string]: any;
  };
  community_support?: {
    positive_feedback_count?: number;
    negative_feedback_count?: number;
    total_feedback_count?: number;
  };
  [key: string]: any;
}

// Project Criteria Score Interface
export interface ProjectCriteriaScore {
  id: string;
  project_id: string;
  criterion_id: string;
  score_value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Feedback Interface
export interface Feedback {
  id: string;
  project_id?: string;
  agency_id: string;
  user_id?: string;
  content: string;
  sentiment?: string;
  upvotes: number;
  downvotes: number;
  status: FeedbackStatus;
  geom?: any; // PostGIS point
  coordinates?: LatLngExpression; // For client-side map
  created_at: string;
  attachment_url?: string;
}

// Vote Interface
export interface Vote {
  id: string;
  feedback_id: string;
  user_id: string;
  vote: boolean; // true for upvote, false for downvote
  created_at: string;
}

// Report Interface
export interface Report {
  id: string;
  agency_id: string;
  report_type: string;
  parameters?: Record<string, any>;
  generated_by?: string;
  content?: string;
  file_url?: string;
  created_at: string;
}

// Audit Log Interface
export interface AuditLog {
  id: string;
  timestamp: string;
  user_id?: string;
  action: string;
  details: Record<string, any>;
}

// LLM Config Interface
export interface LlmConfig {
  id: string;
  agency_id: string;
  model_preference: string;
  settings?: LlmSettings;
  created_at: string;
  updated_at: string;
}

// Map Feature Type
export type MapFeatureType = 'point' | 'linestring' | 'polygon' | 'rectangle' | 'circle';

// Map Feature Interface
export interface MapFeature {
  id: string;
  type: MapFeatureType;
  coordinates: any; // GeoJSON coordinates
  properties?: Record<string, any>;
}

// LLM Provider Type
export type LlmProvider = 'openai' | 'anthropic' | 'custom';

// LLM Request Interface
export interface LlmRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  user_id?: string;
  purpose: string;
}

// LLM Response Interface
export interface LlmResponse {
  text: string;
  model: string;
  tokens_used: number;
  created_at: string;
}

// Project Scoring Result Interface
export interface ProjectScoringResult {
  project_id: string;
  total_score: number;
  criterion_scores: Record<string, number>;
  explanation?: Record<string, string>;
  ml_prediction?: number;
  recommendations?: string[];
}

// Search Parameters Interface
export interface SearchParams {
  q?: string;
  status?: ProjectStatus[];
  category?: string[];
  min_score?: number;
  max_score?: number;
  min_cost?: number;
  max_cost?: number;
  bbox?: string; // "minLng,minLat,maxLng,maxLat"
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

// Pagination Result Interface
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
