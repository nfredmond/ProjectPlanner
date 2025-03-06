export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string
          name: string
          region: string
          created_at: string
          settings: Json
        }
        Insert: {
          id?: string
          name: string
          region: string
          created_at?: string
          settings?: Json
        }
        Update: {
          id?: string
          name?: string
          region?: string
          created_at?: string
          settings?: Json
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string
          role: string
          agency_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          role?: string
          agency_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          role?: string
          agency_id?: string | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          primary_category: string | null
          cost_estimate: number | null
          created_at: string
          updated_at: string
          user_id: string
          agency_id: string
          score_total: number | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          primary_category?: string | null
          cost_estimate?: number | null
          created_at?: string
          updated_at?: string
          user_id: string
          agency_id: string
          score_total?: number | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          primary_category?: string | null
          cost_estimate?: number | null
          created_at?: string
          updated_at?: string
          user_id?: string
          agency_id?: string
          score_total?: number | null
        }
      }
      feedback: {
        Row: {
          id: string
          content: string
          sentiment: string | null
          status: string
          created_at: string
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          content: string
          sentiment?: string | null
          status?: string
          created_at?: string
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          content?: string
          sentiment?: string | null
          status?: string
          created_at?: string
          project_id?: string | null
          user_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 