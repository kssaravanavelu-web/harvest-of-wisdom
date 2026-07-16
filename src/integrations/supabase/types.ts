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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          description: string
          icon: string
          id: string
          name: string
          slug: string
          xp_threshold: number
        }
        Insert: {
          description: string
          icon?: string
          id?: string
          name: string
          slug: string
          xp_threshold?: number
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          xp_threshold?: number
        }
        Relationships: []
      }
      lesson_questions: {
        Row: {
          correct_index: number
          id: string
          lesson_id: string
          options: Json
          question: string
          sort_order: number
        }
        Insert: {
          correct_index: number
          id?: string
          lesson_id: string
          options: Json
          question: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          id?: string
          lesson_id?: string
          options?: Json
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "video_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_submissions: {
        Row: {
          answers: Json
          id: string
          lesson_id: string
          score: number
          student_id: string
          submitted_at: string
          total: number
          xp_earned: number
        }
        Insert: {
          answers: Json
          id?: string
          lesson_id: string
          score: number
          student_id: string
          submitted_at?: string
          total: number
          xp_earned?: number
        }
        Update: {
          answers?: Json
          id?: string
          lesson_id?: string
          score?: number
          student_id?: string
          submitted_at?: string
          total?: number
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "video_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          class_level: number | null
          created_at: string
          display_name: string
          id: string
          last_active: string | null
          school_id: string | null
          streak_days: number
          total_xp: number
          village: string | null
        }
        Insert: {
          class_level?: number | null
          created_at?: string
          display_name?: string
          id: string
          last_active?: string | null
          school_id?: string | null
          streak_days?: number
          total_xp?: number
          village?: string | null
        }
        Update: {
          class_level?: number | null
          created_at?: string
          display_name?: string
          id?: string
          last_active?: string | null
          school_id?: string | null
          streak_days?: number
          total_xp?: number
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_completions: {
        Row: {
          completed_at: string
          id: string
          quest_id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          id?: string
          quest_id: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          id?: string
          quest_id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_completions_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          correct_index: number
          description: string
          difficulty: string
          id: string
          options: Json
          question: string
          sort_order: number
          subject_id: string
          title: string
          xp_reward: number
        }
        Insert: {
          correct_index: number
          description: string
          difficulty?: string
          id?: string
          options: Json
          question: string
          sort_order?: number
          subject_id: string
          title: string
          xp_reward?: number
        }
        Update: {
          correct_index?: number
          description?: string
          difficulty?: string
          id?: string
          options?: Json
          question?: string
          sort_order?: number
          subject_id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          student_code: string
          teacher_code: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          student_code: string
          teacher_code: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          student_code?: string
          teacher_code?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string
          description: string | null
          icon: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      video_lessons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          school_id: string
          subject_id: string | null
          teacher_id: string
          title: string
          video_path: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          school_id: string
          subject_id?: string | null
          teacher_id: string
          title: string
          video_path: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          school_id?: string
          subject_id?: string | null
          teacher_id?: string
          title?: string
          video_path?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_lessons_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_quest: { Args: { _quest_id: string }; Returns: Json }
      create_school: { Args: { _name: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_school_admin: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_member: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_teacher: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      join_school: { Args: { _code: string }; Returns: Json }
      submit_lesson: {
        Args: { _answers: Json; _lesson_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
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
    Enums: {
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const
