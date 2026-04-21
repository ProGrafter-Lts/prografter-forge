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
      chatbot_usage: {
        Row: {
          created_at: string
          id: string
          identifier: string
          message_count: number
          updated_at: string
          usage_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          message_count?: number
          updated_at?: string
          usage_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          message_count?: number
          updated_at?: string
          usage_date?: string
        }
        Relationships: []
      }
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
      funds_verification: {
        Row: {
          created_at: string
          document_path: string
          homeowner_id: string | null
          id: string
          job_id: string | null
          reviewed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          document_path: string
          homeowner_id?: string | null
          id?: string
          job_id?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          document_path?: string
          homeowner_id?: string | null
          id?: string
          job_id?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "funds_verification_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "homeowners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funds_verification_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      green_project_data: {
        Row: {
          created_at: string
          epc_after: string | null
          epc_after_ref: string | null
          epc_after_url: string | null
          epc_before: string | null
          epc_before_ref: string | null
          epc_before_url: string | null
          grant_reference: string | null
          grant_scheme: string | null
          grant_value: number | null
          hp_cylinder_size: string | null
          hp_flow_temp: string | null
          hp_model: string | null
          hp_output_kw: number | null
          hp_refrigerant: string | null
          hp_scop: number | null
          id: string
          installer_claim_ref: string | null
          insulation_bba_cert: string | null
          insulation_product: string | null
          insulation_thickness_mm: number | null
          insulation_u_value: number | null
          job_id: string
          mcs_cert_number: string | null
          mcs_cert_url: string | null
          mcs_install_date: string | null
          solar_battery: string | null
          solar_expected_yield: number | null
          solar_inverter: string | null
          solar_panel_count: number | null
          solar_panels_model: string | null
          solar_total_kwp: number | null
          system_specification: string | null
          system_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          epc_after?: string | null
          epc_after_ref?: string | null
          epc_after_url?: string | null
          epc_before?: string | null
          epc_before_ref?: string | null
          epc_before_url?: string | null
          grant_reference?: string | null
          grant_scheme?: string | null
          grant_value?: number | null
          hp_cylinder_size?: string | null
          hp_flow_temp?: string | null
          hp_model?: string | null
          hp_output_kw?: number | null
          hp_refrigerant?: string | null
          hp_scop?: number | null
          id?: string
          installer_claim_ref?: string | null
          insulation_bba_cert?: string | null
          insulation_product?: string | null
          insulation_thickness_mm?: number | null
          insulation_u_value?: number | null
          job_id: string
          mcs_cert_number?: string | null
          mcs_cert_url?: string | null
          mcs_install_date?: string | null
          solar_battery?: string | null
          solar_expected_yield?: number | null
          solar_inverter?: string | null
          solar_panel_count?: number | null
          solar_panels_model?: string | null
          solar_total_kwp?: number | null
          system_specification?: string | null
          system_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          epc_after?: string | null
          epc_after_ref?: string | null
          epc_after_url?: string | null
          epc_before?: string | null
          epc_before_ref?: string | null
          epc_before_url?: string | null
          grant_reference?: string | null
          grant_scheme?: string | null
          grant_value?: number | null
          hp_cylinder_size?: string | null
          hp_flow_temp?: string | null
          hp_model?: string | null
          hp_output_kw?: number | null
          hp_refrigerant?: string | null
          hp_scop?: number | null
          id?: string
          installer_claim_ref?: string | null
          insulation_bba_cert?: string | null
          insulation_product?: string | null
          insulation_thickness_mm?: number | null
          insulation_u_value?: number | null
          job_id?: string
          mcs_cert_number?: string | null
          mcs_cert_url?: string | null
          mcs_install_date?: string | null
          solar_battery?: string | null
          solar_expected_yield?: number | null
          solar_inverter?: string | null
          solar_panel_count?: number | null
          solar_panels_model?: string | null
          solar_total_kwp?: number | null
          system_specification?: string | null
          system_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "green_project_data_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowners: {
        Row: {
          created_at: string
          email: string
          id: string
          is_test: boolean
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_test?: boolean
          name: string
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_test?: boolean
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
          is_test: boolean
          job_id: string
          notified_at: string
          status: string
          trade_id: string
        }
        Insert: {
          created_at?: string
          estimated_value?: string | null
          id?: string
          is_test?: boolean
          job_id: string
          notified_at?: string
          status?: string
          trade_id: string
        }
        Update: {
          created_at?: string
          estimated_value?: string | null
          id?: string
          is_test?: boolean
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
          funds_verification_type: string | null
          funds_verified: boolean
          funds_verified_at: string | null
          homeowner_id: string | null
          id: string
          is_green_job: boolean
          is_test: boolean
          job_type: string
          photo_urls: string[] | null
          postcode: string
          specialism_id: string | null
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
          funds_verification_type?: string | null
          funds_verified?: boolean
          funds_verified_at?: string | null
          homeowner_id?: string | null
          id?: string
          is_green_job?: boolean
          is_test?: boolean
          job_type: string
          photo_urls?: string[] | null
          postcode: string
          specialism_id?: string | null
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
          funds_verification_type?: string | null
          funds_verified?: boolean
          funds_verified_at?: string | null
          homeowner_id?: string | null
          id?: string
          is_green_job?: boolean
          is_test?: boolean
          job_type?: string
          photo_urls?: string[] | null
          postcode?: string
          specialism_id?: string | null
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
          {
            foreignKeyName: "jobs_specialism_id_fkey"
            columns: ["specialism_id"]
            isOneToOne: false
            referencedRelation: "specialisms"
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
      manual_pro_purchases: {
        Row: {
          created_at: string
          id: string
          job_id: string
          purchased_at: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          purchased_at?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          purchased_at?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_pro_purchases_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      materials_log: {
        Row: {
          batch_reference: string | null
          category: string
          colour_finish: string | null
          created_at: string
          id: string
          job_id: string
          manufacturer: string
          product_name: string
          quantity: string | null
          specification: string | null
          supplier: string | null
          trade_id: string
        }
        Insert: {
          batch_reference?: string | null
          category?: string
          colour_finish?: string | null
          created_at?: string
          id?: string
          job_id: string
          manufacturer?: string
          product_name?: string
          quantity?: string | null
          specification?: string | null
          supplier?: string | null
          trade_id: string
        }
        Update: {
          batch_reference?: string | null
          category?: string
          colour_finish?: string | null
          created_at?: string
          id?: string
          job_id?: string
          manufacturer?: string
          product_name?: string
          quantity?: string | null
          specification?: string | null
          supplier?: string | null
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
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
          actioned: boolean
          address: string
          application_ref: string
          application_type: string
          approved_date: string | null
          created_at: string
          description: string | null
          distance_miles: number | null
          id: string
          letter_generated: boolean
          local_authority: string | null
          planning_portal_url: string | null
          postcode: string
          trade_id: string
          viewed: boolean
        }
        Insert: {
          actioned?: boolean
          address: string
          application_ref: string
          application_type: string
          approved_date?: string | null
          created_at?: string
          description?: string | null
          distance_miles?: number | null
          id?: string
          letter_generated?: boolean
          local_authority?: string | null
          planning_portal_url?: string | null
          postcode: string
          trade_id: string
          viewed?: boolean
        }
        Update: {
          actioned?: boolean
          address?: string
          application_ref?: string
          application_type?: string
          approved_date?: string | null
          created_at?: string
          description?: string | null
          distance_miles?: number | null
          id?: string
          letter_generated?: boolean
          local_authority?: string | null
          planning_portal_url?: string | null
          postcode?: string
          trade_id?: string
          viewed?: boolean
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
          is_test: boolean
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
          is_test?: boolean
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
          is_test?: boolean
          phone?: string
          postcode?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      project_certificates: {
        Row: {
          cert_type: string
          created_at: string
          document_name: string
          file_url: string | null
          id: string
          issue_date: string | null
          issuing_body: string | null
          job_id: string
          reference_number: string | null
        }
        Insert: {
          cert_type?: string
          created_at?: string
          document_name?: string
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          job_id: string
          reference_number?: string | null
        }
        Update: {
          cert_type?: string
          created_at?: string
          document_name?: string
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          job_id?: string
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_certificates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
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
          homeowner_confirmed: boolean
          homeowner_confirmed_at: string | null
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
          homeowner_confirmed?: boolean
          homeowner_confirmed_at?: string | null
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
          homeowner_confirmed?: boolean
          homeowner_confirmed_at?: string | null
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
      project_warranties: {
        Row: {
          claim_contact: string | null
          coverage: string | null
          created_at: string
          expiry_date: string | null
          id: string
          item: string
          job_id: string
          manufacturer: string
          trade_id: string
          warranty_period_months: number
        }
        Insert: {
          claim_contact?: string | null
          coverage?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          item?: string
          job_id: string
          manufacturer?: string
          trade_id: string
          warranty_period_months?: number
        }
        Update: {
          claim_contact?: string | null
          coverage?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          item?: string
          job_id?: string
          manufacturer?: string
          trade_id?: string
          warranty_period_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_warranties_job_id_fkey"
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
          lookup_token: string
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
          lookup_token?: string
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
          lookup_token?: string
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
          is_test: boolean
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
          is_test?: boolean
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
          is_test?: boolean
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
      specialisms: {
        Row: {
          applicable_trades: string[]
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          applicable_trades?: string[]
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          applicable_trades?: string[]
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
      trade_specialisms: {
        Row: {
          created_at: string
          is_primary: boolean
          specialism_id: string
          trade_id: string
        }
        Insert: {
          created_at?: string
          is_primary?: boolean
          specialism_id: string
          trade_id: string
        }
        Update: {
          created_at?: string
          is_primary?: boolean
          specialism_id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_specialisms_specialism_id_fkey"
            columns: ["specialism_id"]
            isOneToOne: false
            referencedRelation: "specialisms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_specialisms_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          bio: string | null
          calendar_token: string
          ciga_registered: boolean
          company_name: string
          created_at: string
          fgas_registered: boolean
          green_cert_expiry: string | null
          id: string
          inca_certified: boolean
          insurance_cert_url: string | null
          is_green_trade: boolean
          is_test: boolean
          mcs_number: string | null
          mcs_verified: boolean
          name: string
          ozev_approved: boolean
          pas_2030_accredited: boolean
          pas_2035_coordinator: boolean
          phone: string
          postcode: string
          specialisms_prompt_seen: boolean
          trade_type: string
          trustmark_number: string | null
          trustmark_verified: boolean
          user_id: string | null
          verified: boolean
          website: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          calendar_token?: string
          ciga_registered?: boolean
          company_name: string
          created_at?: string
          fgas_registered?: boolean
          green_cert_expiry?: string | null
          id?: string
          inca_certified?: boolean
          insurance_cert_url?: string | null
          is_green_trade?: boolean
          is_test?: boolean
          mcs_number?: string | null
          mcs_verified?: boolean
          name: string
          ozev_approved?: boolean
          pas_2030_accredited?: boolean
          pas_2035_coordinator?: boolean
          phone: string
          postcode: string
          specialisms_prompt_seen?: boolean
          trade_type: string
          trustmark_number?: string | null
          trustmark_verified?: boolean
          user_id?: string | null
          verified?: boolean
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          calendar_token?: string
          ciga_registered?: boolean
          company_name?: string
          created_at?: string
          fgas_registered?: boolean
          green_cert_expiry?: string | null
          id?: string
          inca_certified?: boolean
          insurance_cert_url?: string | null
          is_green_trade?: boolean
          is_test?: boolean
          mcs_number?: string | null
          mcs_verified?: boolean
          name?: string
          ozev_approved?: boolean
          pas_2030_accredited?: boolean
          pas_2035_coordinator?: boolean
          phone?: string
          postcode?: string
          specialisms_prompt_seen?: boolean
          trade_type?: string
          trustmark_number?: string | null
          trustmark_verified?: boolean
          user_id?: string | null
          verified?: boolean
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
