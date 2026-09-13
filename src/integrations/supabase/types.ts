export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      expert_applications: {
        Row: {
          created_at: string
          credentials: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          specialization: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credentials?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          project_id: string
          read: boolean
          read_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          project_id: string
          read?: boolean
          read_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          read?: boolean
          read_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completed_date: string | null
          created_at: string
          deliverables: Json
          expert_confirmed: boolean
          feedback: string | null
          gross_amount: number
          id: string
          net_amount: number
          payout_released: boolean
          platform_fee_amount: number
          project_id: string
          rating: number | null
          seq: number
          status: Database["public"]["Enums"]["milestone_status"]
          student_confirmed: boolean
          title: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          deliverables?: Json
          expert_confirmed?: boolean
          feedback?: string | null
          gross_amount?: number
          id?: string
          net_amount?: number
          payout_released?: boolean
          platform_fee_amount?: number
          project_id: string
          rating?: number | null
          seq: number
          status?: Database["public"]["Enums"]["milestone_status"]
          student_confirmed?: boolean
          title: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          deliverables?: Json
          expert_confirmed?: boolean
          feedback?: string | null
          gross_amount?: number
          id?: string
          net_amount?: number
          payout_released?: boolean
          platform_fee_amount?: number
          project_id?: string
          rating?: number | null
          seq?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          student_confirmed?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string
          id: string
          link: string | null
          project_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          link?: string | null
          project_id?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          link?: string | null
          project_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          description: string
          id: string
          milestone_count: number
          price_ngn: number
          title: string
        }
        Insert: {
          description: string
          id: string
          milestone_count: number
          price_ngn: number
          title: string
        }
        Update: {
          description?: string
          id?: string
          milestone_count?: number
          price_ngn?: number
          title?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          account_name: string | null
          account_number: string
          amount_ngn: number
          bank_name: string
          expert_id: string
          id: string
          processed_at: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          account_name?: string | null
          account_number: string
          amount_ngn: number
          bank_name: string
          expert_id: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          account_name?: string | null
          account_number?: string
          amount_ngn?: number
          bank_name?: string
          expert_id?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          institution: string | null
          location: string | null
          onboarding_completed: boolean | null
          phone: string | null
          specialization: string | null
          updated_at: string
          user_id: string
          verification_status: string
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          institution?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          institution?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      project_events: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          project_id: string
          user_id: string
          user_role: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          project_id: string
          user_id: string
          user_role: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          project_id?: string
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      project_files: {
        Row: {
          created_at: string
          file_name: string
          file_size_bytes: number | null
          id: string
          project_id: string
          storage_path: string
          uploaded_by: string
          uploader_role: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          project_id: string
          storage_path: string
          uploaded_by: string
          uploader_role: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          project_id?: string
          storage_path?: string
          uploaded_by?: string
          uploader_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          current_stage: string
          deadline: string | null
          description: string
          expert_id: string | null
          id: string
          package_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stage?: string
          deadline?: string | null
          description: string
          expert_id?: string | null
          id?: string
          package_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stage?: string
          deadline?: string | null
          description?: string
          expert_id?: string | null
          id?: string
          package_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_ngn: number
          created_at: string
          gateway: string
          gateway_reference: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount_ngn: number
          created_at?: string
          gateway?: string
          gateway_reference: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount_ngn?: number
          created_at?: string
          gateway?: string
          gateway_reference?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          institution: string | null
          location: string | null
          onboarding_completed: boolean | null
          specialization: string | null
          updated_at: string | null
          user_id: string | null
          verification_status: string | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          institution?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          specialization?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          institution?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          specialization?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_project_after_payment: {
        Args: { _project_id: string }
        Returns: {
          created_at: string
          current_stage: string
          deadline: string | null
          description: string
          expert_id: string | null
          id: string
          package_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          student_id: string
          title: string
          updated_at: string
        }
      }
      assign_expert: {
        Args: { _expert_id: string; _project_id: string }
        Returns: {
          created_at: string
          current_stage: string
          deadline: string | null
          description: string
          expert_id: string | null
          id: string
          package_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          student_id: string
          title: string
          updated_at: string
        }
      }
      confirm_milestone: {
        Args: { _milestone_id: string }
        Returns: {
          completed_date: string | null
          created_at: string
          deliverables: Json
          expert_confirmed: boolean
          feedback: string | null
          gross_amount: number
          id: string
          net_amount: number
          payout_released: boolean
          platform_fee_amount: number
          project_id: string
          rating: number | null
          seq: number
          status: Database["public"]["Enums"]["milestone_status"]
          student_confirmed: boolean
          title: string
        }
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      request_payout: {
        Args: {
          _account_name: string
          _account_number: string
          _amount_ngn: number
          _bank_name: string
        }
        Returns: {
          account_name: string | null
          account_number: string
          amount_ngn: number
          bank_name: string
          expert_id: string
          id: string
          processed_at: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
        }
      }
      review_expert_application: {
        Args: { _application_id: string; _approve: boolean }
        Returns: {
          created_at: string
          credentials: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          specialization: string
          status: string
          user_id: string
        }
      }
      set_milestone_feedback: {
        Args: { _feedback: string; _milestone_id: string; _rating?: number }
        Returns: {
          completed_date: string | null
          created_at: string
          deliverables: Json
          expert_confirmed: boolean
          feedback: string | null
          gross_amount: number
          id: string
          net_amount: number
          payout_released: boolean
          platform_fee_amount: number
          project_id: string
          rating: number | null
          seq: number
          status: Database["public"]["Enums"]["milestone_status"]
          student_confirmed: boolean
          title: string
        }
      }
      start_milestone: {
        Args: { _milestone_id: string }
        Returns: {
          completed_date: string | null
          created_at: string
          deliverables: Json
          expert_confirmed: boolean
          feedback: string | null
          gross_amount: number
          id: string
          net_amount: number
          payout_released: boolean
          platform_fee_amount: number
          project_id: string
          rating: number | null
          seq: number
          status: Database["public"]["Enums"]["milestone_status"]
          student_confirmed: boolean
          title: string
        }
      }
    }
    Enums: {
      app_role: "student" | "expert" | "admin"
      milestone_status:
        | "pending"
        | "in_progress"
        | "pending_review"
        | "completed"
      payment_status: "unpaid" | "paid" | "refunded"
      payout_status: "pending" | "processing" | "paid" | "failed"
      project_status:
        | "pending_payment"
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
      transaction_status: "pending" | "success" | "failed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["student", "expert", "admin"],
      milestone_status: [
        "pending",
        "in_progress",
        "pending_review",
        "completed",
      ],
      payment_status: ["unpaid", "paid", "refunded"],
      payout_status: ["pending", "processing", "paid", "failed"],
      project_status: [
        "pending_payment",
        "pending",
        "in_progress",
        "completed",
        "cancelled",
      ],
      transaction_status: ["pending", "success", "failed"],
    },
  },
} as const
