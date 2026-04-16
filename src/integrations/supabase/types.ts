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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      contracts: {
        Row: {
          agreed_price: number
          contract_text: string
          created_at: string
          homeowner_id: string
          homeowner_signed_at: string | null
          id: string
          job_id: string
          payment_schedule: Json
          quote_id: string
          status: string
          trade_id: string
          trade_signed_at: string | null
          updated_at: string
        }
        Insert: {
          agreed_price: number
          contract_text: string
          created_at?: string
          homeowner_id: string
          homeowner_signed_at?: string | null
          id?: string
          job_id: string
          payment_schedule?: Json
          quote_id: string
          status?: string
          trade_id: string
          trade_signed_at?: string | null
          updated_at?: string
        }
        Update: {
          agreed_price?: number
          contract_text?: string
          created_at?: string
          homeowner_id?: string
          homeowner_signed_at?: string | null
          id?: string
          job_id?: string
          payment_schedule?: Json
          quote_id?: string
          status?: string
          trade_id?: string
          trade_signed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      early_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          postcode: string
          user_type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          postcode: string
          user_type?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          postcode?: string
          user_type?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      homeowners: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      job_matches: {
        Row: {
          created_at: string
          estimated_value: string | null
          id: string
          job_id: string
          notified_at: string
          status: string
          trade_id: string
        }
        Insert: {
          created_at?: string
          estimated_value?: string | null
          id?: string
          job_id: string
          notified_at?: string
          status?: string
          trade_id: string
        }
        Update: {
          created_at?: string
          estimated_value?: string | null
          id?: string
          job_id?: string
          notified_at?: string
          status?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matches_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string
          budget: string | null
          created_at: string
          deposit_paid: boolean
          description: string
          homeowner_id: string | null
          id: string
          is_green_job: boolean
          job_type: string
          photo_urls: string[] | null
          postcode: string
          stage: string
          status: string
          stripe_payment_id: string | null
          title: string | null
        }
        Insert: {
          address: string
          budget?: string | null
          created_at?: string
          deposit_paid?: boolean
          description: string
          homeowner_id?: string | null
          id?: string
          is_green_job?: boolean
          job_type: string
          photo_urls?: string[] | null
          postcode: string
          stage?: string
          status?: string
          stripe_payment_id?: string | null
          title?: string | null
        }
        Update: {
          address?: string
          budget?: string | null
          created_at?: string
          deposit_paid?: boolean
          description?: string
          homeowner_id?: string | null
          id?: string
          is_green_job?: boolean
          job_type?: string
          photo_urls?: string[] | null
          postcode?: string
          stage?: string
          status?: string
          stripe_payment_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "homeowners"
            referencedColumns: ["id"]
          },
        ]
      }
      letters_sent: {
        Row: {
          address: string
          application_reference: string
          created_at: string
          id: string
          letter_content: string
          sent_at: string
          trade_id: string
        }
        Insert: {
          address: string
          application_reference: string
          created_at?: string
          id?: string
          letter_content: string
          sent_at?: string
          trade_id: string
        }
        Update: {
          address?: string
          application_reference?: string
          created_at?: string
          id?: string
          letter_content?: string
          sent_at?: string
          trade_id?: string
        }
        Relationships: []
      }
      planning_alert_subs: {
        Row: {
          active: boolean
          created_at: string
          id: string
          radius_miles: number
          stripe_subscription_id: string | null
          tier: string
          trade_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          radius_miles?: number
          stripe_subscription_id?: string | null
          tier: string
          trade_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          radius_miles?: number
          stripe_subscription_id?: string | null
          tier?: string
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_alert_subs_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_alerts: {
        Row: {
          address: string
          application_ref: string
          application_type: string
          approved_date: string | null
          created_at: string
          description: string | null
          distance_miles: number | null
          id: string
          letter_generated: boolean
          postcode: string
          trade_id: string
        }
        Insert: {
          address: string
          application_ref: string
          application_type: string
          approved_date?: string | null
          created_at?: string
          description?: string | null
          distance_miles?: number | null
          id?: string
          letter_generated?: boolean
          postcode: string
          trade_id: string
        }
        Update: {
          address?: string
          application_ref?: string
          application_type?: string
          approved_date?: string | null
          created_at?: string
          description?: string | null
          distance_miles?: number | null
          id?: string
          letter_generated?: boolean
          postcode?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_alerts_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          postcode: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          postcode: string
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          postcode?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      project_messages: {
        Row: {
          created_at: string
          id: string
          job_id: string
          message_text: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          message_text: string
          sender_id: string
          sender_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          message_text?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string
          id: string
          job_id: string
          payment_amount: number | null
          payment_status: string
          planned_end: string | null
          planned_start: string | null
          stage_name: string
          stage_order: number
          status: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          id?: string
          job_id: string
          payment_amount?: number | null
          payment_status?: string
          planned_end?: string | null
          planned_start?: string | null
          stage_name: string
          stage_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          id?: string
          job_id?: string
          payment_amount?: number | null
          payment_status?: string
          planned_end?: string | null
          planned_start?: string | null
          stage_name?: string
          stage_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_checks: {
        Row: {
          created_at: string
          description: string
          email: string
          id: string
          pdf_url: string
          postcode: string
          project_type: string
          report_html: string | null
          status: string
          stripe_payment_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          email: string
          id?: string
          pdf_url: string
          postcode?: string
          project_type: string
          report_html?: string | null
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          email?: string
          id?: string
          pdf_url?: string
          postcode?: string
          project_type?: string
          report_html?: string | null
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number
          budget_description: string | null
          budget_price: number | null
          created_at: string
          id: string
          job_id: string
          message: string | null
          premium_description: string | null
          premium_price: number | null
          selected_tier: string | null
          standard_description: string | null
          standard_price: number | null
          status: string
          tier_enabled: boolean
          trade_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          budget_description?: string | null
          budget_price?: number | null
          created_at?: string
          id?: string
          job_id: string
          message?: string | null
          premium_description?: string | null
          premium_price?: number | null
          selected_tier?: string | null
          standard_description?: string | null
          standard_price?: number | null
          status?: string
          tier_enabled?: boolean
          trade_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          budget_description?: string | null
          budget_price?: number | null
          created_at?: string
          id?: string
          job_id?: string
          message?: string | null
          premium_description?: string | null
          premium_price?: number | null
          selected_tier?: string | null
          standard_description?: string | null
          standard_price?: number | null
          status?: string
          tier_enabled?: boolean
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_updates: {
        Row: {
          created_at: string
          id: string
          photo_urls: string[] | null
          stage_id: string
          trade_id: string
          update_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_urls?: string[] | null
          stage_id: string
          trade_id: string
          update_text: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_urls?: string[] | null
          stage_id?: string
          trade_id?: string
          update_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_updates_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_updates_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_trade_assignments: {
        Row: {
          access_token: string
          created_at: string
          external_sub_email: string | null
          external_sub_name: string | null
          external_sub_phone: string | null
          id: string
          job_id: string
          main_trade_id: string
          stage_id: string
          status: string
          sub_trade_id: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string
          created_at?: string
          external_sub_email?: string | null
          external_sub_name?: string | null
          external_sub_phone?: string | null
          id?: string
          job_id: string
          main_trade_id: string
          stage_id: string
          status?: string
          sub_trade_id?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          external_sub_email?: string | null
          external_sub_name?: string | null
          external_sub_phone?: string | null
          id?: string
          job_id?: string
          main_trade_id?: string
          stage_id?: string
          status?: string
          sub_trade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_trade_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_trade_assignments_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          bio: string | null
          ciga_registered: boolean
          company_name: string
          created_at: string
          fgas_registered: boolean
          green_cert_expiry: string | null
          id: string
          inca_certified: boolean
          insurance_cert_url: string | null
          is_green_trade: boolean
          mcs_number: string | null
          name: string
          ozev_approved: boolean
          pas_2030_accredited: boolean
          pas_2035_coordinator: boolean
          phone: string
          postcode: string
          trade_type: string
          trustmark_number: string | null
          user_id: string | null
          verified: boolean
          website: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          ciga_registered?: boolean
          company_name: string
          created_at?: string
          fgas_registered?: boolean
          green_cert_expiry?: string | null
          id?: string
          inca_certified?: boolean
          insurance_cert_url?: string | null
          is_green_trade?: boolean
          mcs_number?: string | null
          name: string
          ozev_approved?: boolean
          pas_2030_accredited?: boolean
          pas_2035_coordinator?: boolean
          phone: string
          postcode: string
          trade_type: string
          trustmark_number?: string | null
          user_id?: string | null
          verified?: boolean
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          ciga_registered?: boolean
          company_name?: string
          created_at?: string
          fgas_registered?: boolean
          green_cert_expiry?: string | null
          id?: string
          inca_certified?: boolean
          insurance_cert_url?: string | null
          is_green_trade?: boolean
          mcs_number?: string | null
          name?: string
          ozev_approved?: boolean
          pas_2030_accredited?: boolean
          pas_2035_coordinator?: boolean
          phone?: string
          postcode?: string
          trade_type?: string
          trustmark_number?: string | null
          user_id?: string | null
          verified?: boolean
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      variations: {
        Row: {
          created_at: string
          description: string
          id: string
          job_id: string
          labour_cost: number
          materials_cost: number
          programme_impact_days: number
          reason: string | null
          signed_at: string | null
          signed_by: string | null
          status: string
          title: string
          trade_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          job_id: string
          labour_cost?: number
          materials_cost?: number
          programme_impact_days?: number
          reason?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          title: string
          trade_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          job_id?: string
          labour_cost?: number
          materials_cost?: number
          programme_impact_days?: number
          reason?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          title?: string
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variations_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
