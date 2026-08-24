// Generated from the Supabase project schema. Do not hand-edit — regenerate
// via the Supabase MCP `generate_typescript_types` tool (or
// `supabase gen types typescript`) after any migration change.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      children: {
        Row: {
          birth_year: number
          created_at: string
          display_name: string
          grade_level: string | null
          id: string
          locale: string
          owner_id: string
        }
        Insert: {
          birth_year: number
          created_at?: string
          display_name: string
          grade_level?: string | null
          id?: string
          locale?: string
          owner_id: string
        }
        Update: {
          birth_year?: number
          created_at?: string
          display_name?: string
          grade_level?: string | null
          id?: string
          locale?: string
          owner_id?: string
        }
        Relationships: []
      }
      classroom_members: {
        Row: {
          added_at: string
          child_id: string
          classroom_id: string
        }
        Insert: {
          added_at?: string
          child_id: string
          classroom_id: string
        }
        Update: {
          added_at?: string
          child_id?: string
          classroom_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_members_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_members_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          created_at: string
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          child_id: string
          completed_at: string | null
          config: Json
          device: Json
          difficulty_level: number
          duration_ms: number | null
          game_id: string
          id: string
          started_at: string
          status: string
        }
        Insert: {
          child_id: string
          completed_at?: string | null
          config?: Json
          device?: Json
          difficulty_level?: number
          duration_ms?: number | null
          game_id: string
          id?: string
          started_at?: string
          status?: string
        }
        Update: {
          child_id?: string
          completed_at?: string | null
          config?: Json
          device?: Json
          difficulty_level?: number
          duration_ms?: number | null
          game_id?: string
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_trials: {
        Row: {
          created_at: string
          error_type: string | null
          id: string
          is_correct: boolean | null
          reaction_time_ms: number | null
          response: Json
          session_id: string
          stimulus: Json
          time_to_first_move_ms: number | null
          trial_index: number
        }
        Insert: {
          created_at?: string
          error_type?: string | null
          id?: string
          is_correct?: boolean | null
          reaction_time_ms?: number | null
          response?: Json
          session_id: string
          stimulus: Json
          time_to_first_move_ms?: number | null
          trial_index: number
        }
        Update: {
          created_at?: string
          error_type?: string | null
          id?: string
          is_correct?: boolean | null
          reaction_time_ms?: number | null
          response?: Json
          session_id?: string
          stimulus?: Json
          time_to_first_move_ms?: number | null
          trial_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_trials_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          id: string
          name: string
          skill_domain: string
        }
        Insert: {
          id: string
          name: string
          skill_domain: string
        }
        Update: {
          id?: string
          name?: string
          skill_domain?: string
        }
        Relationships: []
      }
      ld_letter_pairs: {
        Row: {
          confusion_type: string
          difficulty_tier: number
          id: string
          letter_a: string
          letter_b: string
        }
        Insert: {
          confusion_type: string
          difficulty_tier?: number
          id?: string
          letter_a: string
          letter_b: string
        }
        Update: {
          confusion_type?: string
          difficulty_tier?: number
          id?: string
          letter_a?: string
          letter_b?: string
        }
        Relationships: []
      }
      ld_word_items: {
        Row: {
          difficulty_tier: number
          id: string
          position: string
          target_letter: string
          word: string
        }
        Insert: {
          difficulty_tier?: number
          id?: string
          position: string
          target_letter: string
          word: string
        }
        Update: {
          difficulty_tier?: number
          id?: string
          position?: string
          target_letter?: string
          word?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      screening_reports: {
        Row: {
          child_id: string
          generated_at: string
          id: string
          model_version: string | null
          needs_practice: Json
          progress: Json
          risk_band: string
          sessions_included: string[]
          shap_explanations: Json | null
          strengths: Json
        }
        Insert: {
          child_id: string
          generated_at?: string
          id?: string
          model_version?: string | null
          needs_practice?: Json
          progress?: Json
          risk_band: string
          sessions_included?: string[]
          shap_explanations?: Json | null
          strengths?: Json
        }
        Update: {
          child_id?: string
          generated_at?: string
          id?: string
          model_version?: string | null
          needs_practice?: Json
          progress?: Json
          risk_band?: string
          sessions_included?: string[]
          shap_explanations?: Json | null
          strengths?: Json
        }
        Relationships: [
          {
            foreignKeyName: "screening_reports_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      session_scores: {
        Row: {
          accuracy: number | null
          computed_at: string
          mean_rt_ms: number | null
          median_rt_ms: number | null
          mirror_error_rate: number | null
          raw_features: Json
          rt_cv: number | null
          session_id: string
          throughput: number | null
        }
        Insert: {
          accuracy?: number | null
          computed_at?: string
          mean_rt_ms?: number | null
          median_rt_ms?: number | null
          mirror_error_rate?: number | null
          raw_features?: Json
          rt_cv?: number | null
          session_id: string
          throughput?: number | null
        }
        Update: {
          accuracy?: number | null
          computed_at?: string
          mean_rt_ms?: number | null
          median_rt_ms?: number | null
          mirror_error_rate?: number | null
          raw_features?: Json
          rt_cv?: number | null
          session_id?: string
          throughput?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_states: {
        Row: {
          child_id: string
          difficulty_level: number
          mastery: number
          skill_key: string
          streak: number
          updated_at: string
        }
        Insert: {
          child_id: string
          difficulty_level?: number
          mastery?: number
          skill_key: string
          streak?: number
          updated_at?: string
        }
        Update: {
          child_id?: string
          difficulty_level?: number
          mastery?: number
          skill_key?: string
          streak?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_states_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owns_child: { Args: { child: string }; Returns: boolean }
      teaches_child: { Args: { child: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
