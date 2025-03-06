export interface FeedbackItem {
  id: string;
  content: string;
  sentiment?: string;
  created_at: string;
  projects?: {
    title: string;
  } | { 
    title: string;
  }[] | null;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  status: string;
  primary_category?: string;
  cost_estimate?: number;
  created_at: string;
  updated_at?: string;
  score_total?: number;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
} 