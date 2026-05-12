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
      consents_log: {
        Row: {
          consent_type: string
          consented: boolean
          created_at: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          consented: boolean
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          consented?: boolean
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contract_events: {
        Row: {
          actor_ip: unknown
          actor_role: string | null
          actor_user_id: string | null
          contract_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json
        }
        Insert: {
          actor_ip?: unknown
          actor_role?: string | null
          actor_user_id?: string | null
          contract_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
        }
        Update: {
          actor_ip?: unknown
          actor_role?: string | null
          actor_user_id?: string | null
          contract_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "contract_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_compat"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          created_at: string
          drafted_by: string | null
          effective_from: string | null
          guidance_notes: Json
          id: string
          legal_text: string
          plain_english_summary: string
          signing_enabled: boolean
          status: string
          superseded_at: string | null
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          drafted_by?: string | null
          effective_from?: string | null
          guidance_notes?: Json
          id?: string
          legal_text: string
          plain_english_summary: string
          signing_enabled?: boolean
          status?: string
          superseded_at?: string | null
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          drafted_by?: string | null
          effective_from?: string | null
          guidance_notes?: Json
          id?: string
          legal_text?: string
          plain_english_summary?: string
          signing_enabled?: boolean
          status?: string
          superseded_at?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      contract_variations: {
        Row: {
          activated_at: string | null
          contract_id: string
          cost_change_pence: number
          created_at: string
          description: string
          homeowner_signature_hash: string | null
          homeowner_signed_at: string | null
          id: string
          programme_impact_days: number
          proposed_by: string
          reason: string | null
          rejected_at: string | null
          rejection_reason: string | null
          sequence: number
          status: string
          title: string
          trade_signature_hash: string | null
          trade_signed_at: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          contract_id: string
          cost_change_pence?: number
          created_at?: string
          description: string
          homeowner_signature_hash?: string | null
          homeowner_signed_at?: string | null
          id?: string
          programme_impact_days?: number
          proposed_by: string
          reason?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sequence: number
          status?: string
          title: string
          trade_signature_hash?: string | null
          trade_signed_at?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          contract_id?: string
          cost_change_pence?: number
          created_at?: string
          description?: string
          homeowner_signature_hash?: string | null
          homeowner_signed_at?: string | null
          id?: string
          programme_impact_days?: number
          proposed_by?: string
          reason?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sequence?: number
          status?: string
          title?: string
          trade_signature_hash?: string | null
          trade_signed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_variations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_variations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts_compat"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          activated_at: string | null
          applicable_standards: string[] | null
          closed_at: string | null
          completed_at: string | null
          created_at: string
          defects_period_ends_at: string | null
          estimated_completion_date: string | null
          estimated_start_date: string | null
          full_text_hash: string | null
          homeowner_bespoke_terms: string | null
          homeowner_id: string
          homeowner_signature_hash: string | null
          homeowner_signature_ip: unknown
          homeowner_signed_at: string | null
          homeowner_snapshot: Json
          id: string
          job_id: string
          latest_pdf_generated_at: string | null
          latest_pdf_hash: string | null
          latest_pdf_path: string | null
          materials_specification: Json | null
          payment_milestones: Json
          property_address: Json
          quote_id: string
          reference: string | null
          rendered_legal_text: string | null
          required_certificates: string[] | null
          scope_of_works: string
          status: string
          template_id: string
          template_version: string | null
          terminated_at: string | null
          termination_reason: string | null
          total_value_excl_vat_pence: number
          total_value_incl_vat_pence: number
          trade_bespoke_terms: string | null
          trade_id: string
          trade_signature_hash: string | null
          trade_signature_ip: unknown
          trade_signed_at: string | null
          trade_snapshot: Json
          updated_at: string
          vat_rate_basis_points: number
        }
        Insert: {
          activated_at?: string | null
          applicable_standards?: string[] | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string
          defects_period_ends_at?: string | null
          estimated_completion_date?: string | null
          estimated_start_date?: string | null
          full_text_hash?: string | null
          homeowner_bespoke_terms?: string | null
          homeowner_id: string
          homeowner_signature_hash?: string | null
          homeowner_signature_ip?: unknown
          homeowner_signed_at?: string | null
          homeowner_snapshot: Json
          id?: string
          job_id: string
          latest_pdf_generated_at?: string | null
          latest_pdf_hash?: string | null
          latest_pdf_path?: string | null
          materials_specification?: Json | null
          payment_milestones?: Json
          property_address: Json
          quote_id: string
          reference?: string | null
          rendered_legal_text?: string | null
          required_certificates?: string[] | null
          scope_of_works: string
          status?: string
          template_id: string
          template_version?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          total_value_excl_vat_pence: number
          total_value_incl_vat_pence: number
          trade_bespoke_terms?: string | null
          trade_id: string
          trade_signature_hash?: string | null
          trade_signature_ip?: unknown
          trade_signed_at?: string | null
          trade_snapshot: Json
          updated_at?: string
          vat_rate_basis_points?: number
        }
        Update: {
          activated_at?: string | null
          applicable_standards?: string[] | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string
          defects_period_ends_at?: string | null
          estimated_completion_date?: string | null
          estimated_start_date?: string | null
          full_text_hash?: string | null
          homeowner_bespoke_terms?: string | null
          homeowner_id?: string
          homeowner_signature_hash?: string | null
          homeowner_signature_ip?: unknown
          homeowner_signed_at?: string | null
          homeowner_snapshot?: Json
          id?: string
          job_id?: string
          latest_pdf_generated_at?: string | null
          latest_pdf_hash?: string | null
          latest_pdf_path?: string | null
          materials_specification?: Json | null
          payment_milestones?: Json
          property_address?: Json
          quote_id?: string
          reference?: string | null
          rendered_legal_text?: string | null
          required_certificates?: string[] | null
          scope_of_works?: string
          status?: string
          template_id?: string
          template_version?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          total_value_excl_vat_pence?: number
          total_value_incl_vat_pence?: number
          trade_bespoke_terms?: string | null
          trade_id?: string
          trade_signature_hash?: string | null
          trade_signature_ip?: unknown
          trade_signed_at?: string | null
          trade_snapshot?: Json
          updated_at?: string
          vat_rate_basis_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts_legacy: {
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
          {
            foreignKeyName: "job_matches_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          created_at: string
          id: string
          job_id: string
          label: string
          photo_url: string
          stage: number
          uploaded_by: string
          uploader_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          label?: string
          photo_url: string
          stage?: number
          uploaded_by?: string
          uploader_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          label?: string
          photo_url?: string
          stage?: number
          uploaded_by?: string
          uploader_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
          ref: string
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
          ref?: string
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
          ref?: string
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
      planning_alert_shortlist: {
        Row: {
          contact_status: Database["public"]["Enums"]["shortlist_contact_status"]
          created_at: string
          id: string
          last_status_change_at: string
          next_action_date: string | null
          note: string | null
          planning_alert_id: string
          trade_id: string
          updated_at: string
        }
        Insert: {
          contact_status?: Database["public"]["Enums"]["shortlist_contact_status"]
          created_at?: string
          id?: string
          last_status_change_at?: string
          next_action_date?: string | null
          note?: string | null
          planning_alert_id: string
          trade_id: string
          updated_at?: string
        }
        Update: {
          contact_status?: Database["public"]["Enums"]["shortlist_contact_status"]
          created_at?: string
          id?: string
          last_status_change_at?: string
          next_action_date?: string | null
          note?: string | null
          planning_alert_id?: string
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_alert_shortlist_planning_alert_id_fkey"
            columns: ["planning_alert_id"]
            isOneToOne: false
            referencedRelation: "planning_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_alert_shortlist_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_alert_shortlist_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_alert_subs: {
        Row: {
          active: boolean
          created_at: string
          hide_dismissed_leads: boolean
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
          hide_dismissed_leads?: boolean
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
          hide_dismissed_leads?: boolean
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
          {
            foreignKeyName: "planning_alert_subs_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_alerts: {
        Row: {
          actioned: boolean
          address: string
          applicant_phone: string | null
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
          applicant_phone?: string | null
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
          applicant_phone?: string | null
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
          {
            foreignKeyName: "planning_alerts_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
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
      quickbuild_generations: {
        Row: {
          actual_labour_days: number | null
          actual_materials_pence: number | null
          ai_output: Json
          created_at: string
          final_output: Json | null
          id: string
          photo_paths: string[]
          quote_id: string | null
          structured_input: Json
          trade_user_id: string
          transcript: string
          updated_at: string
          was_sent: boolean
          won_lost: string | null
        }
        Insert: {
          actual_labour_days?: number | null
          actual_materials_pence?: number | null
          ai_output?: Json
          created_at?: string
          final_output?: Json | null
          id?: string
          photo_paths?: string[]
          quote_id?: string | null
          structured_input?: Json
          trade_user_id: string
          transcript?: string
          updated_at?: string
          was_sent?: boolean
          won_lost?: string | null
        }
        Update: {
          actual_labour_days?: number | null
          actual_materials_pence?: number | null
          ai_output?: Json
          created_at?: string
          final_output?: Json | null
          id?: string
          photo_paths?: string[]
          quote_id?: string | null
          structured_input?: Json
          trade_user_id?: string
          transcript?: string
          updated_at?: string
          was_sent?: boolean
          won_lost?: string | null
        }
        Relationships: []
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
      quote_materials: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          line_total_ex_vat: number | null
          line_total_inc_vat: number | null
          merchant_hint: string | null
          model_or_spec: string | null
          quantity: number
          quote_id: string
          unit: string
          unit_price_ex_vat: number
          vat_rate_pct: number
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          line_total_ex_vat?: number | null
          line_total_inc_vat?: number | null
          merchant_hint?: string | null
          model_or_spec?: string | null
          quantity: number
          quote_id: string
          unit?: string
          unit_price_ex_vat: number
          vat_rate_pct?: number
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          line_total_ex_vat?: number | null
          line_total_inc_vat?: number | null
          merchant_hint?: string | null
          model_or_spec?: string | null
          quantity?: number
          quote_id?: string
          unit?: string
          unit_price_ex_vat?: number
          vat_rate_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_materials_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_pdf_events: {
        Row: {
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          ip: unknown
          metadata: Json
          quote_id: string
          user_agent: string | null
        }
        Insert: {
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip?: unknown
          metadata?: Json
          quote_id: string
          user_agent?: string | null
        }
        Update: {
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip?: unknown
          metadata?: Json
          quote_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          accept_token: string
          ai_verdict: string | null
          ai_verdict_at: string | null
          ai_verdict_summary: string | null
          amount: number
          budget_description: string | null
          budget_price: number | null
          created_at: string
          estimated_start_date: string | null
          exclusions: string | null
          id: string
          is_test: boolean
          job_id: string
          last_viewed_at: string | null
          materials_spec: Json
          message: string | null
          methodology: string | null
          pdf_generated_at: string | null
          pdf_path: string | null
          pdf_version: number
          premium_description: string | null
          premium_price: number | null
          reference: string | null
          selected_tier: string | null
          share_materials_with_homeowner: boolean
          standard_description: string | null
          standard_price: number | null
          status: string
          tier_enabled: boolean
          trade_id: string
          updated_at: string
          valid_until: string | null
          vat_registered: boolean
          view_count: number
          working_days: number | null
        }
        Insert: {
          accept_token?: string
          ai_verdict?: string | null
          ai_verdict_at?: string | null
          ai_verdict_summary?: string | null
          amount: number
          budget_description?: string | null
          budget_price?: number | null
          created_at?: string
          estimated_start_date?: string | null
          exclusions?: string | null
          id?: string
          is_test?: boolean
          job_id: string
          last_viewed_at?: string | null
          materials_spec?: Json
          message?: string | null
          methodology?: string | null
          pdf_generated_at?: string | null
          pdf_path?: string | null
          pdf_version?: number
          premium_description?: string | null
          premium_price?: number | null
          reference?: string | null
          selected_tier?: string | null
          share_materials_with_homeowner?: boolean
          standard_description?: string | null
          standard_price?: number | null
          status?: string
          tier_enabled?: boolean
          trade_id: string
          updated_at?: string
          valid_until?: string | null
          vat_registered?: boolean
          view_count?: number
          working_days?: number | null
        }
        Update: {
          accept_token?: string
          ai_verdict?: string | null
          ai_verdict_at?: string | null
          ai_verdict_summary?: string | null
          amount?: number
          budget_description?: string | null
          budget_price?: number | null
          created_at?: string
          estimated_start_date?: string | null
          exclusions?: string | null
          id?: string
          is_test?: boolean
          job_id?: string
          last_viewed_at?: string | null
          materials_spec?: Json
          message?: string | null
          methodology?: string | null
          pdf_generated_at?: string | null
          pdf_path?: string | null
          pdf_version?: number
          premium_description?: string | null
          premium_price?: number | null
          reference?: string | null
          selected_tier?: string | null
          share_materials_with_homeowner?: boolean
          standard_description?: string | null
          standard_price?: number | null
          status?: string
          tier_enabled?: boolean
          trade_id?: string
          updated_at?: string
          valid_until?: string | null
          vat_registered?: boolean
          view_count?: number
          working_days?: number | null
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
          {
            foreignKeyName: "quotes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
      review_followups: {
        Row: {
          body: string
          created_at: string
          homeowner_id: string
          id: string
          is_test: boolean
          review_id: string
        }
        Insert: {
          body: string
          created_at?: string
          homeowner_id: string
          id?: string
          is_test?: boolean
          review_id: string
        }
        Update: {
          body?: string
          created_at?: string
          homeowner_id?: string
          id?: string
          is_test?: boolean
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_followups_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "homeowners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_followups_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          communication_rating: number | null
          created_at: string
          headline: string | null
          homeowner_id: string
          homeowner_overall: number | null
          homeowner_review_submitted_at: string | null
          id: string
          is_test: boolean
          job_id: string
          published_at: string | null
          rating: number | null
          reliability_rating: number | null
          tidiness_rating: number | null
          trade_access_rating: number | null
          trade_communication_rating: number | null
          trade_id: string
          trade_overall: number | null
          trade_payment_rating: number | null
          trade_reasonable_rating: number | null
          trade_responded_at: string | null
          trade_response: string | null
          trade_review_comment: string | null
          trade_review_submitted_at: string | null
          trade_scope_rating: number | null
          updated_at: string
          value_rating: number | null
          workmanship_rating: number | null
          would_recommend: boolean | null
        }
        Insert: {
          body?: string | null
          communication_rating?: number | null
          created_at?: string
          headline?: string | null
          homeowner_id: string
          homeowner_overall?: number | null
          homeowner_review_submitted_at?: string | null
          id?: string
          is_test?: boolean
          job_id: string
          published_at?: string | null
          rating?: number | null
          reliability_rating?: number | null
          tidiness_rating?: number | null
          trade_access_rating?: number | null
          trade_communication_rating?: number | null
          trade_id: string
          trade_overall?: number | null
          trade_payment_rating?: number | null
          trade_reasonable_rating?: number | null
          trade_responded_at?: string | null
          trade_response?: string | null
          trade_review_comment?: string | null
          trade_review_submitted_at?: string | null
          trade_scope_rating?: number | null
          updated_at?: string
          value_rating?: number | null
          workmanship_rating?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          body?: string | null
          communication_rating?: number | null
          created_at?: string
          headline?: string | null
          homeowner_id?: string
          homeowner_overall?: number | null
          homeowner_review_submitted_at?: string | null
          id?: string
          is_test?: boolean
          job_id?: string
          published_at?: string | null
          rating?: number | null
          reliability_rating?: number | null
          tidiness_rating?: number | null
          trade_access_rating?: number | null
          trade_communication_rating?: number | null
          trade_id?: string
          trade_overall?: number | null
          trade_payment_rating?: number | null
          trade_reasonable_rating?: number | null
          trade_responded_at?: string | null
          trade_response?: string | null
          trade_review_comment?: string | null
          trade_review_submitted_at?: string | null
          trade_scope_rating?: number | null
          updated_at?: string
          value_rating?: number | null
          workmanship_rating?: number | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "homeowners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
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
          {
            foreignKeyName: "stage_updates_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
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
      testimonials: {
        Row: {
          approved: boolean
          author_first_name: string
          author_photo_url: string | null
          author_trade_or_role: string
          contract_id: string | null
          created_at: string
          id: string
          quote: string
          rating: number | null
          source: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          author_first_name: string
          author_photo_url?: string | null
          author_trade_or_role: string
          contract_id?: string | null
          created_at?: string
          id?: string
          quote: string
          rating?: number | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          author_first_name?: string
          author_photo_url?: string | null
          author_trade_or_role?: string
          contract_id?: string | null
          created_at?: string
          id?: string
          quote?: string
          rating?: number | null
          source?: string | null
          updated_at?: string
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
          {
            foreignKeyName: "trade_specialisms_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_verification_documents: {
        Row: {
          doc_type: string
          expiry_date: string | null
          file_path: string
          id: string
          original_filename: string | null
          trade_id: string
          uploaded_at: string
        }
        Insert: {
          doc_type: string
          expiry_date?: string | null
          file_path: string
          id?: string
          original_filename?: string | null
          trade_id: string
          uploaded_at?: string
        }
        Update: {
          doc_type?: string
          expiry_date?: string | null
          file_path?: string
          id?: string
          original_filename?: string | null
          trade_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_verification_documents_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_verification_documents_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          avg_rating: number | null
          bio: string | null
          business_logo_path: string | null
          calendar_token: string
          ciga_registered: boolean
          companies_house_number: string | null
          company_name: string
          completed_jobs_count: number
          created_at: string
          fgas_registered: boolean
          green_cert_expiry: string | null
          id: string
          inca_certified: boolean
          insurance_cert_url: string | null
          insurance_expiry: string | null
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
          professional_indemnity_cover_pence: number | null
          professional_indemnity_expiry: string | null
          professional_indemnity_insurer: string | null
          professional_indemnity_policy_number: string | null
          public_liability_cover_pence: number | null
          public_liability_expiry: string | null
          public_liability_insurer: string | null
          public_liability_policy_number: string | null
          rejected_at: string | null
          rejection_reason: string | null
          review_count: number
          specialisms_prompt_seen: boolean
          submitted_for_review_at: string | null
          tier: string
          tier_updated_at: string | null
          trade_type: string
          trustmark_number: string | null
          trustmark_verified: boolean
          user_id: string
          vat_number: string | null
          vat_registered: boolean
          verification_notes: string | null
          verification_status: string
          verified: boolean
          verified_on_prografter_at: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          avg_rating?: number | null
          bio?: string | null
          business_logo_path?: string | null
          calendar_token?: string
          ciga_registered?: boolean
          companies_house_number?: string | null
          company_name: string
          completed_jobs_count?: number
          created_at?: string
          fgas_registered?: boolean
          green_cert_expiry?: string | null
          id?: string
          inca_certified?: boolean
          insurance_cert_url?: string | null
          insurance_expiry?: string | null
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
          professional_indemnity_cover_pence?: number | null
          professional_indemnity_expiry?: string | null
          professional_indemnity_insurer?: string | null
          professional_indemnity_policy_number?: string | null
          public_liability_cover_pence?: number | null
          public_liability_expiry?: string | null
          public_liability_insurer?: string | null
          public_liability_policy_number?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          review_count?: number
          specialisms_prompt_seen?: boolean
          submitted_for_review_at?: string | null
          tier?: string
          tier_updated_at?: string | null
          trade_type: string
          trustmark_number?: string | null
          trustmark_verified?: boolean
          user_id: string
          vat_number?: string | null
          vat_registered?: boolean
          verification_notes?: string | null
          verification_status?: string
          verified?: boolean
          verified_on_prografter_at?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          avg_rating?: number | null
          bio?: string | null
          business_logo_path?: string | null
          calendar_token?: string
          ciga_registered?: boolean
          companies_house_number?: string | null
          company_name?: string
          completed_jobs_count?: number
          created_at?: string
          fgas_registered?: boolean
          green_cert_expiry?: string | null
          id?: string
          inca_certified?: boolean
          insurance_cert_url?: string | null
          insurance_expiry?: string | null
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
          professional_indemnity_cover_pence?: number | null
          professional_indemnity_expiry?: string | null
          professional_indemnity_insurer?: string | null
          professional_indemnity_policy_number?: string | null
          public_liability_cover_pence?: number | null
          public_liability_expiry?: string | null
          public_liability_insurer?: string | null
          public_liability_policy_number?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          review_count?: number
          specialisms_prompt_seen?: boolean
          submitted_for_review_at?: string | null
          tier?: string
          tier_updated_at?: string | null
          trade_type?: string
          trustmark_number?: string | null
          trustmark_verified?: boolean
          user_id?: string
          vat_number?: string | null
          vat_registered?: boolean
          verification_notes?: string | null
          verification_status?: string
          verified?: boolean
          verified_on_prografter_at?: string | null
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
          {
            foreignKeyName: "variations_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      contracts_compat: {
        Row: {
          agreed_price: number | null
          contract_text: string | null
          created_at: string | null
          homeowner_id: string | null
          homeowner_signed_at: string | null
          id: string | null
          job_id: string | null
          payment_schedule: Json | null
          quote_id: string | null
          status: string | null
          trade_id: string | null
          trade_signed_at: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      trades_public: {
        Row: {
          avg_rating: number | null
          bio: string | null
          company_name: string | null
          completed_jobs_count: number | null
          id: string | null
          is_green_trade: boolean | null
          mcs_verified: boolean | null
          name: string | null
          review_count: number | null
          tier: string | null
          trade_type: string | null
          trustmark_verified: boolean | null
          verified: boolean | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          avg_rating?: number | null
          bio?: string | null
          company_name?: string | null
          completed_jobs_count?: number | null
          id?: string | null
          is_green_trade?: boolean | null
          mcs_verified?: boolean | null
          name?: string | null
          review_count?: number | null
          tier?: string | null
          trade_type?: string | null
          trustmark_verified?: boolean | null
          verified?: boolean | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          avg_rating?: number | null
          bio?: string | null
          company_name?: string | null
          completed_jobs_count?: number | null
          id?: string | null
          is_green_trade?: boolean | null
          mcs_verified?: boolean | null
          name?: string | null
          review_count?: number | null
          tier?: string | null
          trade_type?: string | null
          trustmark_verified?: boolean | null
          verified?: boolean | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_practical_completion: {
        Args: { _contract_id: string }
        Returns: undefined
      }
      active_projects_for_user: {
        Args: { _user_id: string }
        Returns: {
          address: string
          contract_id: string
          contract_status: string
          created_at: string
          homeowner_id: string
          id: string
          is_green_job: boolean
          job_type: string
          postcode: string
          role: string
          stage: string
          status: string
          title: string
          trade_id: string
        }[]
      }
      add_bespoke_terms: {
        Args: { _contract_id: string; _terms: string }
        Returns: undefined
      }
      compute_contract_hash: { Args: { _contract_id: string }; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_contract_for_quote: {
        Args: { _quote_id: string }
        Returns: string
      }
      generate_contract_reference: { Args: never; Returns: string }
      generate_job_ref: { Args: never; Returns: string }
      generate_quote_reference: { Args: never; Returns: string }
      get_review_context: {
        Args: { _ref: string }
        Returns: {
          homeowner_id: string
          job_id: string
          role: string
          trade_id: string
        }[]
      }
      get_trade_for_job: {
        Args: { _job_id: string }
        Returns: {
          avg_rating: number
          bio: string
          company_name: string
          completed_jobs_count: number
          id: string
          is_green_trade: boolean
          mcs_verified: boolean
          name: string
          review_count: number
          tier: string
          trade_type: string
          trustmark_verified: boolean
          verified: boolean
          website: string
          years_experience: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      homeowner_has_relationship_with_trade: {
        Args: { _trade_id: string; _user_id: string }
        Returns: boolean
      }
      log_contract_email_sent: {
        Args: {
          _contract_id: string
          _email_type: string
          _recipient_email: string
          _recipient_role: string
        }
        Returns: undefined
      }
      log_contract_event: {
        Args: { _contract_id: string; _event_type: string; _payload?: Json }
        Returns: undefined
      }
      mark_practical_completion: {
        Args: { _contract_id: string }
        Returns: undefined
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
      propose_variation: {
        Args: {
          _contract_id: string
          _cost_change_pence: number
          _description: string
          _programme_impact_days: number
          _reason: string
          _title: string
        }
        Returns: string
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recompute_trade_stats: { Args: { _trade_id: string }; Returns: undefined }
      record_quote_pdf_event: {
        Args: { _event_type: string; _metadata?: Json; _quote_id: string }
        Returns: undefined
      }
      sign_contract: {
        Args: { _contract_id: string; _ip?: unknown; _signature_hash: string }
        Returns: Json
      }
      sign_variation: {
        Args: {
          _accept?: boolean
          _rejection_reason?: string
          _signature_hash: string
          _variation_id: string
        }
        Returns: Json
      }
      trade_can_access_homeowner: {
        Args: { _homeowner_id: string; _user_id: string }
        Returns: boolean
      }
      trade_can_access_job: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_contract_party: {
        Args: { _contract_id: string; _user_id: string }
        Returns: boolean
      }
      user_owns_homeowner: {
        Args: { _homeowner_id: string; _user_id: string }
        Returns: boolean
      }
      verify_contract_integrity: {
        Args: { _contract_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      shortlist_contact_status: "todo" | "contacted" | "quoted" | "won" | "dead"
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
      shortlist_contact_status: ["todo", "contacted", "quoted", "won", "dead"],
    },
  },
} as const
