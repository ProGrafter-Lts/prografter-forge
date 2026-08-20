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
      atlas_audit_events: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          performed_by: string | null
          previous_value: Json | null
          reason: string | null
          survey_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          performed_by?: string | null
          previous_value?: Json | null
          reason?: string | null
          survey_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          performed_by?: string | null
          previous_value?: Json | null
          reason?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_audit_events_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "atlas_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_evidence: {
        Row: {
          archived_at: string | null
          caption: string | null
          captured_at: string
          captured_by: string | null
          corrected_transcript: string | null
          created_at: string
          duration_seconds: number | null
          elevation: string | null
          evidence_type: string
          file_url: string | null
          id: string
          is_ai_suggestion: boolean
          mime_type: string | null
          observation_id: string | null
          room_name: string | null
          storage_path: string | null
          survey_id: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          caption?: string | null
          captured_at?: string
          captured_by?: string | null
          corrected_transcript?: string | null
          created_at?: string
          duration_seconds?: number | null
          elevation?: string | null
          evidence_type: string
          file_url?: string | null
          id?: string
          is_ai_suggestion?: boolean
          mime_type?: string | null
          observation_id?: string | null
          room_name?: string | null
          storage_path?: string | null
          survey_id: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          caption?: string | null
          captured_at?: string
          captured_by?: string | null
          corrected_transcript?: string | null
          created_at?: string
          duration_seconds?: number | null
          elevation?: string | null
          evidence_type?: string
          file_url?: string | null
          id?: string
          is_ai_suggestion?: boolean
          mime_type?: string | null
          observation_id?: string | null
          room_name?: string | null
          storage_path?: string | null
          survey_id?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_evidence_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "atlas_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_evidence_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "atlas_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_field_photos: {
        Row: {
          caption: string | null
          captured_at: string
          created_at: string
          field_key: string
          id: string
          local_id: string | null
          storage_path: string
          survey_id: string
        }
        Insert: {
          caption?: string | null
          captured_at?: string
          created_at?: string
          field_key: string
          id?: string
          local_id?: string | null
          storage_path: string
          survey_id: string
        }
        Update: {
          caption?: string | null
          captured_at?: string
          created_at?: string
          field_key?: string
          id?: string
          local_id?: string | null
          storage_path?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_field_photos_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "atlas_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_observations: {
        Row: {
          acknowledged_at_completion: boolean | null
          classification: string
          confidence_level: string
          created_at: string
          customer_visible_note: string | null
          elevation: string | null
          further_action: string | null
          id: string
          internal_note: string | null
          is_critical: boolean
          is_required: boolean
          location: string | null
          measurement_method: string | null
          measurement_unit: string | null
          measurement_value: number | null
          observation_text: string | null
          observed_at: string
          observed_by: string | null
          recommendation: string | null
          response_status: string
          responsible_professional: string | null
          room_name: string | null
          section_id: string
          severity: string | null
          skip_reason: string | null
          survey_id: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at_completion?: boolean | null
          classification?: string
          confidence_level?: string
          created_at?: string
          customer_visible_note?: string | null
          elevation?: string | null
          further_action?: string | null
          id?: string
          internal_note?: string | null
          is_critical?: boolean
          is_required?: boolean
          location?: string | null
          measurement_method?: string | null
          measurement_unit?: string | null
          measurement_value?: number | null
          observation_text?: string | null
          observed_at?: string
          observed_by?: string | null
          recommendation?: string | null
          response_status?: string
          responsible_professional?: string | null
          room_name?: string | null
          section_id: string
          severity?: string | null
          skip_reason?: string | null
          survey_id: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at_completion?: boolean | null
          classification?: string
          confidence_level?: string
          created_at?: string
          customer_visible_note?: string | null
          elevation?: string | null
          further_action?: string | null
          id?: string
          internal_note?: string | null
          is_critical?: boolean
          is_required?: boolean
          location?: string | null
          measurement_method?: string | null
          measurement_unit?: string | null
          measurement_value?: number | null
          observation_text?: string | null
          observed_at?: string
          observed_by?: string | null
          recommendation?: string | null
          response_status?: string
          responsible_professional?: string | null
          room_name?: string | null
          section_id?: string
          severity?: string | null
          skip_reason?: string | null
          survey_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_observations_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "atlas_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_observations_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "atlas_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_sections: {
        Row: {
          category: string
          completion_percentage: number
          completion_status: string
          created_at: string
          critical_outstanding_count: number
          id: string
          relevance_status: string
          section_key: string
          sequence: number
          survey_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          completion_percentage?: number
          completion_status?: string
          created_at?: string
          critical_outstanding_count?: number
          id?: string
          relevance_status?: string
          section_key: string
          sequence?: number
          survey_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completion_percentage?: number
          completion_status?: string
          created_at?: string
          critical_outstanding_count?: number
          id?: string
          relevance_status?: string
          section_key?: string
          sequence?: number
          survey_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_sections_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "atlas_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_survey_fields: {
        Row: {
          captured_at: string
          field_key: string
          id: string
          survey_id: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          captured_at?: string
          field_key: string
          id?: string
          survey_id: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          captured_at?: string
          field_key?: string
          id?: string
          survey_id?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_survey_fields_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "atlas_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_surveys: {
        Row: {
          access_limitations: string | null
          acknowledged_outstanding: boolean | null
          completed_at: string | null
          completion_percentage: number
          created_at: string
          created_by: string
          customer_email: string | null
          customer_intent: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_present: boolean | null
          final_notes: string | null
          id: string
          job_id: string | null
          paused_at: string | null
          postcode: string | null
          project_title: string
          project_type: string
          property_address: string | null
          property_occupied: boolean | null
          relevant_trades: string[]
          revision_number: number
          revision_reason: string | null
          schema_version: string | null
          start_route: string
          started_at: string | null
          status: string
          supersedes_survey_id: string | null
          survey_limitations: string | null
          survey_type: string
          surveyor_company: string | null
          surveyor_name: string | null
          updated_at: string
          weather_conditions: string | null
        }
        Insert: {
          access_limitations?: string | null
          acknowledged_outstanding?: boolean | null
          completed_at?: string | null
          completion_percentage?: number
          created_at?: string
          created_by: string
          customer_email?: string | null
          customer_intent?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_present?: boolean | null
          final_notes?: string | null
          id?: string
          job_id?: string | null
          paused_at?: string | null
          postcode?: string | null
          project_title: string
          project_type: string
          property_address?: string | null
          property_occupied?: boolean | null
          relevant_trades?: string[]
          revision_number?: number
          revision_reason?: string | null
          schema_version?: string | null
          start_route?: string
          started_at?: string | null
          status?: string
          supersedes_survey_id?: string | null
          survey_limitations?: string | null
          survey_type?: string
          surveyor_company?: string | null
          surveyor_name?: string | null
          updated_at?: string
          weather_conditions?: string | null
        }
        Update: {
          access_limitations?: string | null
          acknowledged_outstanding?: boolean | null
          completed_at?: string | null
          completion_percentage?: number
          created_at?: string
          created_by?: string
          customer_email?: string | null
          customer_intent?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_present?: boolean | null
          final_notes?: string | null
          id?: string
          job_id?: string | null
          paused_at?: string | null
          postcode?: string | null
          project_title?: string
          project_type?: string
          property_address?: string | null
          property_occupied?: boolean | null
          relevant_trades?: string[]
          revision_number?: number
          revision_reason?: string | null
          schema_version?: string | null
          start_route?: string
          started_at?: string | null
          status?: string
          supersedes_survey_id?: string | null
          survey_limitations?: string | null
          survey_type?: string
          surveyor_company?: string | null
          surveyor_name?: string | null
          updated_at?: string
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_surveys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_surveys_supersedes_survey_id_fkey"
            columns: ["supersedes_survey_id"]
            isOneToOne: false
            referencedRelation: "atlas_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
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
          user_id: string | null
        }
        Insert: {
          consent_type: string
          consented: boolean
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          consented?: boolean
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
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
      cost_guide_area_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          notified: boolean
          outcode: string | null
          postcode: string
          project_type: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified?: boolean
          outcode?: string | null
          postcode: string
          project_type?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified?: boolean
          outcode?: string | null
          postcode?: string
          project_type?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_call_insights: {
        Row: {
          agent_training_note: string | null
          anonymised: boolean
          call_note_id: string | null
          common_confusion: string | null
          created_at: string
          created_by: string | null
          homeowner_concern_type: string | null
          id: string
          missing_information: string | null
          project_type: string | null
          quote_issue_type: string | null
          useful_question: string | null
        }
        Insert: {
          agent_training_note?: string | null
          anonymised?: boolean
          call_note_id?: string | null
          common_confusion?: string | null
          created_at?: string
          created_by?: string | null
          homeowner_concern_type?: string | null
          id?: string
          missing_information?: string | null
          project_type?: string | null
          quote_issue_type?: string | null
          useful_question?: string | null
        }
        Update: {
          agent_training_note?: string | null
          anonymised?: boolean
          call_note_id?: string | null
          common_confusion?: string | null
          created_at?: string
          created_by?: string | null
          homeowner_concern_type?: string | null
          id?: string
          missing_information?: string | null
          project_type?: string | null
          quote_issue_type?: string | null
          useful_question?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_call_insights_call_note_id_fkey"
            columns: ["call_note_id"]
            isOneToOne: false
            referencedRelation: "customer_call_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_call_notes: {
        Row: {
          admin_user_id: string | null
          ai_summary: string | null
          answers: Json
          budget_notes: string | null
          call_date: string | null
          call_status: string
          call_type: string
          consent_given: boolean
          consent_recorded_at: string | null
          created_at: string
          follow_up_date: string | null
          homeowner_email: string | null
          homeowner_id: string | null
          homeowner_name: string | null
          homeowner_phone: string | null
          id: string
          job_brief_id: string | null
          key_concerns: string | null
          next_steps: string | null
          outputs: Json
          planning_notes: string | null
          project_id: string | null
          project_reference: string | null
          quote_check_id: string | null
          quote_notes: string | null
          recording_path: string | null
          scope_notes: string | null
          trade_notes: string | null
          transcript_text: string | null
          updated_at: string
        }
        Insert: {
          admin_user_id?: string | null
          ai_summary?: string | null
          answers?: Json
          budget_notes?: string | null
          call_date?: string | null
          call_status?: string
          call_type?: string
          consent_given?: boolean
          consent_recorded_at?: string | null
          created_at?: string
          follow_up_date?: string | null
          homeowner_email?: string | null
          homeowner_id?: string | null
          homeowner_name?: string | null
          homeowner_phone?: string | null
          id?: string
          job_brief_id?: string | null
          key_concerns?: string | null
          next_steps?: string | null
          outputs?: Json
          planning_notes?: string | null
          project_id?: string | null
          project_reference?: string | null
          quote_check_id?: string | null
          quote_notes?: string | null
          recording_path?: string | null
          scope_notes?: string | null
          trade_notes?: string | null
          transcript_text?: string | null
          updated_at?: string
        }
        Update: {
          admin_user_id?: string | null
          ai_summary?: string | null
          answers?: Json
          budget_notes?: string | null
          call_date?: string | null
          call_status?: string
          call_type?: string
          consent_given?: boolean
          consent_recorded_at?: string | null
          created_at?: string
          follow_up_date?: string | null
          homeowner_email?: string | null
          homeowner_id?: string | null
          homeowner_name?: string | null
          homeowner_phone?: string | null
          id?: string
          job_brief_id?: string | null
          key_concerns?: string | null
          next_steps?: string | null
          outputs?: Json
          planning_notes?: string | null
          project_id?: string | null
          project_reference?: string | null
          quote_check_id?: string | null
          quote_notes?: string | null
          recording_path?: string | null
          scope_notes?: string | null
          trade_notes?: string | null
          transcript_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_call_notes_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "homeowners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_call_notes_job_brief_id_fkey"
            columns: ["job_brief_id"]
            isOneToOne: false
            referencedRelation: "job_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_call_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_call_notes_quote_check_id_fkey"
            columns: ["quote_check_id"]
            isOneToOne: false
            referencedRelation: "quote_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_call_tasks: {
        Row: {
          assigned_admin_id: string | null
          call_note_id: string | null
          created_at: string
          due_date: string | null
          homeowner_id: string | null
          id: string
          job_brief_id: string | null
          project_id: string | null
          quote_check_id: string | null
          status: string
          task_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          call_note_id?: string | null
          created_at?: string
          due_date?: string | null
          homeowner_id?: string | null
          id?: string
          job_brief_id?: string | null
          project_id?: string | null
          quote_check_id?: string | null
          status?: string
          task_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          call_note_id?: string | null
          created_at?: string
          due_date?: string | null
          homeowner_id?: string | null
          id?: string
          job_brief_id?: string | null
          project_id?: string | null
          quote_check_id?: string | null
          status?: string
          task_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_call_tasks_call_note_id_fkey"
            columns: ["call_note_id"]
            isOneToOne: false
            referencedRelation: "customer_call_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_call_tasks_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "homeowners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_call_tasks_job_brief_id_fkey"
            columns: ["job_brief_id"]
            isOneToOne: false
            referencedRelation: "job_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_call_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_call_tasks_quote_check_id_fkey"
            columns: ["quote_check_id"]
            isOneToOne: false
            referencedRelation: "quote_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_events: {
        Row: {
          created_at: string
          dispute_id: string
          event_text: string
          event_type: string
          id: string
          occurred_at: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          event_text: string
          event_type: string
          id?: string
          occurred_at?: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          event_text?: string
          event_type?: string
          id?: string
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_events_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_evidence: {
        Row: {
          dispute_id: string
          id: string
          item_type: string
          label: string
          uploaded_at: string
          uploaded_by: string
          url: string | null
        }
        Insert: {
          dispute_id: string
          id?: string
          item_type: string
          label: string
          uploaded_at?: string
          uploaded_by: string
          url?: string | null
        }
        Update: {
          dispute_id?: string
          id?: string
          item_type?: string
          label?: string
          uploaded_at?: string
          uploaded_by?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          against_user_id: string | null
          amount_disputed_pence: number | null
          claimant_statement: string
          created_at: string
          desired_outcome: string | null
          evidence_notes: string | null
          frozen_amount_pence: number | null
          id: string
          job_id: string
          raised_by_role: string
          raised_by_user_id: string
          reason: string
          reason_label: string | null
          recommendation: string | null
          ref: string
          resolution: string | null
          resolved_at: string | null
          respondent_statement: string | null
          status: string
          updated_at: string
        }
        Insert: {
          against_user_id?: string | null
          amount_disputed_pence?: number | null
          claimant_statement: string
          created_at?: string
          desired_outcome?: string | null
          evidence_notes?: string | null
          frozen_amount_pence?: number | null
          id?: string
          job_id: string
          raised_by_role: string
          raised_by_user_id: string
          reason: string
          reason_label?: string | null
          recommendation?: string | null
          ref?: string
          resolution?: string | null
          resolved_at?: string | null
          respondent_statement?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          against_user_id?: string | null
          amount_disputed_pence?: number | null
          claimant_statement?: string
          created_at?: string
          desired_outcome?: string | null
          evidence_notes?: string | null
          frozen_amount_pence?: number | null
          id?: string
          job_id?: string
          raised_by_role?: string
          raised_by_user_id?: string
          reason?: string
          reason_label?: string | null
          recommendation?: string | null
          ref?: string
          resolution?: string | null
          resolved_at?: string | null
          respondent_statement?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      early_signups: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          is_test: boolean
          name: string
          postcode: string
          status: string
          status_updated_at: string | null
          user_type: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          is_test?: boolean
          name: string
          postcode: string
          status?: string
          status_updated_at?: string | null
          user_type?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          is_test?: boolean
          name?: string
          postcode?: string
          status?: string
          status_updated_at?: string | null
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
      job_brief_files: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          job_brief_id: string | null
          job_id: string | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          job_brief_id?: string | null
          job_id?: string | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          job_brief_id?: string | null
          job_id?: string | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_brief_files_job_brief_id_fkey"
            columns: ["job_brief_id"]
            isOneToOne: false
            referencedRelation: "job_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_brief_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_briefs: {
        Row: {
          access_arrangement: string | null
          additional_notes: string | null
          address_line1: string
          address_line2: string | null
          budget_band: string | null
          building_regs: string | null
          city: string
          created_at: string
          decision_criteria: string | null
          email: string
          existing_quotes_count: number
          full_name: string
          homeowner_id: string | null
          homeowner_user_id: string | null
          id: string
          is_test: boolean
          job_description: string | null
          job_id: string | null
          job_title: string | null
          known_issues: string | null
          matched_trade_count: number | null
          needs_planning_guidance: boolean
          needs_scoping: boolean
          override_reason: string | null
          parking_available: string | null
          phone: string
          planning_guidance_at: string | null
          planning_guidance_by: string | null
          planning_notes: string | null
          planning_permission: string | null
          postcode: string
          preferred_days: string | null
          property_type: string | null
          published_at: string | null
          published_by: string | null
          quotes_received: string | null
          ref: string
          scope_items: string | null
          scoped_at: string | null
          scoped_by: string | null
          scoping_notes: string | null
          status: string
          timeline: string | null
          trade_category_id: string | null
        }
        Insert: {
          access_arrangement?: string | null
          additional_notes?: string | null
          address_line1: string
          address_line2?: string | null
          budget_band?: string | null
          building_regs?: string | null
          city: string
          created_at?: string
          decision_criteria?: string | null
          email: string
          existing_quotes_count?: number
          full_name: string
          homeowner_id?: string | null
          homeowner_user_id?: string | null
          id?: string
          is_test?: boolean
          job_description?: string | null
          job_id?: string | null
          job_title?: string | null
          known_issues?: string | null
          matched_trade_count?: number | null
          needs_planning_guidance?: boolean
          needs_scoping?: boolean
          override_reason?: string | null
          parking_available?: string | null
          phone: string
          planning_guidance_at?: string | null
          planning_guidance_by?: string | null
          planning_notes?: string | null
          planning_permission?: string | null
          postcode: string
          preferred_days?: string | null
          property_type?: string | null
          published_at?: string | null
          published_by?: string | null
          quotes_received?: string | null
          ref: string
          scope_items?: string | null
          scoped_at?: string | null
          scoped_by?: string | null
          scoping_notes?: string | null
          status?: string
          timeline?: string | null
          trade_category_id?: string | null
        }
        Update: {
          access_arrangement?: string | null
          additional_notes?: string | null
          address_line1?: string
          address_line2?: string | null
          budget_band?: string | null
          building_regs?: string | null
          city?: string
          created_at?: string
          decision_criteria?: string | null
          email?: string
          existing_quotes_count?: number
          full_name?: string
          homeowner_id?: string | null
          homeowner_user_id?: string | null
          id?: string
          is_test?: boolean
          job_description?: string | null
          job_id?: string | null
          job_title?: string | null
          known_issues?: string | null
          matched_trade_count?: number | null
          needs_planning_guidance?: boolean
          needs_scoping?: boolean
          override_reason?: string | null
          parking_available?: string | null
          phone?: string
          planning_guidance_at?: string | null
          planning_guidance_by?: string | null
          planning_notes?: string | null
          planning_permission?: string | null
          postcode?: string
          preferred_days?: string | null
          property_type?: string | null
          published_at?: string | null
          published_by?: string | null
          quotes_received?: string | null
          ref?: string
          scope_items?: string | null
          scoped_at?: string | null
          scoped_by?: string | null
          scoping_notes?: string | null
          status?: string
          timeline?: string | null
          trade_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_briefs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matches: {
        Row: {
          created_at: string
          estimated_value: string | null
          id: string
          interested_at: string | null
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
          interested_at?: string | null
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
          interested_at?: string | null
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
      job_publish_overrides: {
        Row: {
          admin_id: string
          blocking_flags: Json
          brief_id: string | null
          created_at: string
          id: string
          job_id: string | null
          override_reason: string
        }
        Insert: {
          admin_id: string
          blocking_flags?: Json
          brief_id?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          override_reason: string
        }
        Update: {
          admin_id?: string
          blocking_flags?: Json
          brief_id?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          override_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_publish_overrides_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "job_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_publish_overrides_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_trade_invitations: {
        Row: {
          batch_number: number
          brief_id: string | null
          created_at: string
          decline_reason: string | null
          distance_miles: number | null
          expires_at: string | null
          id: string
          invited_at: string | null
          job_id: string
          quote_submitted_at: string | null
          rank: number | null
          released: boolean
          responded_at: string | null
          status: string
          trade_id: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          batch_number?: number
          brief_id?: string | null
          created_at?: string
          decline_reason?: string | null
          distance_miles?: number | null
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          job_id: string
          quote_submitted_at?: string | null
          rank?: number | null
          released?: boolean
          responded_at?: string | null
          status?: string
          trade_id: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          batch_number?: number
          brief_id?: string | null
          created_at?: string
          decline_reason?: string | null
          distance_miles?: number | null
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          job_id?: string
          quote_submitted_at?: string | null
          rank?: number | null
          released?: boolean
          responded_at?: string | null
          status?: string
          trade_id?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_trade_invitations_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "job_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_trade_invitations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_trade_invitations_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_trade_invitations_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
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
      manual_quote_review_requests: {
        Row: {
          created_at: string
          email: string
          file_name: string | null
          file_path: string | null
          id: string
          name: string
          note: string | null
          phone: string | null
          quote_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          name: string
          note?: string | null
          phone?: string | null
          quote_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          name?: string
          note?: string | null
          phone?: string | null
          quote_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      pending_module_checks: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          analysed_at: string | null
          analysed_check_id: string | null
          created_at: string
          currency: string
          email: string
          id: string
          intake: Json
          lookup_token: string | null
          module_id: string
          paid_at: string | null
          payment_status: string
          pdf_path: string
          price_band: string | null
          project_type: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          supporting_files: Json
          user_id: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          analysed_at?: string | null
          analysed_check_id?: string | null
          created_at?: string
          currency?: string
          email: string
          id?: string
          intake?: Json
          lookup_token?: string | null
          module_id: string
          paid_at?: string | null
          payment_status?: string
          pdf_path: string
          price_band?: string | null
          project_type?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          supporting_files?: Json
          user_id?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          analysed_at?: string | null
          analysed_check_id?: string | null
          created_at?: string
          currency?: string
          email?: string
          id?: string
          intake?: Json
          lookup_token?: string | null
          module_id?: string
          paid_at?: string | null
          payment_status?: string
          pdf_path?: string
          price_band?: string | null
          project_type?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          supporting_files?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      plan_my_project_submissions: {
        Row: {
          answers: Json
          category: string
          category_label: string | null
          considerations: Json
          cost_band_high: number | null
          cost_band_label: string | null
          cost_band_low: number | null
          created_at: string
          drivers: Json
          email: string | null
          exclusions_acknowledged: boolean
          id: string
          user_id: string | null
        }
        Insert: {
          answers?: Json
          category: string
          category_label?: string | null
          considerations?: Json
          cost_band_high?: number | null
          cost_band_label?: string | null
          cost_band_low?: number | null
          created_at?: string
          drivers?: Json
          email?: string | null
          exclusions_acknowledged?: boolean
          id?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          category?: string
          category_label?: string | null
          considerations?: Json
          cost_band_high?: number | null
          cost_band_label?: string | null
          cost_band_low?: number | null
          created_at?: string
          drivers?: Json
          email?: string | null
          exclusions_acknowledged?: boolean
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      planning_access: {
        Row: {
          access_level: string
          created_at: string
          features_enabled: Json
          monthly_limit: number | null
          subscription_ends_at: string | null
          subscription_started_at: string | null
          subscription_status: string
          trade_id: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          features_enabled?: Json
          monthly_limit?: number | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          trade_id: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          created_at?: string
          features_enabled?: Json
          monthly_limit?: number | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_access_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: true
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_access_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: true
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_agents: {
        Row: {
          address: string | null
          avg_job_value_estimate: number | null
          company_name: string | null
          contact_name: string
          councils_active: string[]
          created_at: string
          email: string | null
          id: string
          intro_sent: boolean
          meeting_held: boolean
          notes: string | null
          phone: string | null
          relationship_status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          avg_job_value_estimate?: number | null
          company_name?: string | null
          contact_name: string
          councils_active?: string[]
          created_at?: string
          email?: string | null
          id?: string
          intro_sent?: boolean
          meeting_held?: boolean
          notes?: string | null
          phone?: string | null
          relationship_status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          avg_job_value_estimate?: number | null
          company_name?: string | null
          contact_name?: string
          councils_active?: string[]
          created_at?: string
          email?: string | null
          id?: string
          intro_sent?: boolean
          meeting_held?: boolean
          notes?: string | null
          phone?: string | null
          relationship_status?: string
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "planning_alerts_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_invite_links: {
        Row: {
          clicked_at: string | null
          created_at: string
          expires_at: string
          id: string
          planning_application_id: string
          project_type: string | null
          submitted_project_id: string | null
          token: string
          trade_id: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          planning_application_id: string
          project_type?: string | null
          submitted_project_id?: string | null
          token: string
          trade_id: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          planning_application_id?: string
          project_type?: string | null
          submitted_project_id?: string | null
          token?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_invite_links_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_invite_links_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_leads: {
        Row: {
          agent_address: string | null
          agent_contact: string | null
          agent_contact_methods: string[]
          agent_contacted: boolean
          agent_contacted_at: string | null
          agent_id: string | null
          agent_name: string | null
          applicant_address: string | null
          applicant_contact: string | null
          applicant_name: string | null
          application_ref: string
          application_type: string | null
          council_application_url: string | null
          council_name: string
          created_at: string
          description: string | null
          documents_available: boolean
          estimated_value_max: number | null
          estimated_value_min: number | null
          form1app_extracted: boolean
          homeowner_contact_methods: string[]
          homeowner_contacted: boolean
          homeowner_contacted_at: string | null
          homeowner_interested: string | null
          id: string
          letter_sent_at: string | null
          next_action: string | null
          notes: string | null
          outreach_status: string
          pdf_enriched_at: string | null
          pdf_source_url: string | null
          pipeline_status: string
          postcode: string | null
          priority_score: number
          proposal_type: string | null
          site_address: string
          status: string
          submitted_date: string | null
          trades_likely: string[]
          updated_at: string
        }
        Insert: {
          agent_address?: string | null
          agent_contact?: string | null
          agent_contact_methods?: string[]
          agent_contacted?: boolean
          agent_contacted_at?: string | null
          agent_id?: string | null
          agent_name?: string | null
          applicant_address?: string | null
          applicant_contact?: string | null
          applicant_name?: string | null
          application_ref: string
          application_type?: string | null
          council_application_url?: string | null
          council_name: string
          created_at?: string
          description?: string | null
          documents_available?: boolean
          estimated_value_max?: number | null
          estimated_value_min?: number | null
          form1app_extracted?: boolean
          homeowner_contact_methods?: string[]
          homeowner_contacted?: boolean
          homeowner_contacted_at?: string | null
          homeowner_interested?: string | null
          id?: string
          letter_sent_at?: string | null
          next_action?: string | null
          notes?: string | null
          outreach_status?: string
          pdf_enriched_at?: string | null
          pdf_source_url?: string | null
          pipeline_status?: string
          postcode?: string | null
          priority_score?: number
          proposal_type?: string | null
          site_address: string
          status?: string
          submitted_date?: string | null
          trades_likely?: string[]
          updated_at?: string
        }
        Update: {
          agent_address?: string | null
          agent_contact?: string | null
          agent_contact_methods?: string[]
          agent_contacted?: boolean
          agent_contacted_at?: string | null
          agent_id?: string | null
          agent_name?: string | null
          applicant_address?: string | null
          applicant_contact?: string | null
          applicant_name?: string | null
          application_ref?: string
          application_type?: string | null
          council_application_url?: string | null
          council_name?: string
          created_at?: string
          description?: string | null
          documents_available?: boolean
          estimated_value_max?: number | null
          estimated_value_min?: number | null
          form1app_extracted?: boolean
          homeowner_contact_methods?: string[]
          homeowner_contacted?: boolean
          homeowner_contacted_at?: string | null
          homeowner_interested?: string | null
          id?: string
          letter_sent_at?: string | null
          next_action?: string | null
          notes?: string | null
          outreach_status?: string
          pdf_enriched_at?: string | null
          pdf_source_url?: string | null
          pipeline_status?: string
          postcode?: string | null
          priority_score?: number
          proposal_type?: string | null
          site_address?: string
          status?: string
          submitted_date?: string | null
          trades_likely?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "planning_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_opportunity_interactions: {
        Row: {
          created_at: string
          follow_up_date: string | null
          id: string
          intro_letter_generated: boolean
          invite_link_id: string | null
          notes: string | null
          planning_application_id: string
          status: string
          trade_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          follow_up_date?: string | null
          id?: string
          intro_letter_generated?: boolean
          invite_link_id?: string | null
          notes?: string | null
          planning_application_id: string
          status?: string
          trade_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          follow_up_date?: string | null
          id?: string
          intro_letter_generated?: boolean
          invite_link_id?: string | null
          notes?: string | null
          planning_application_id?: string
          status?: string
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_opportunity_interactions_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_opportunity_interactions_trade_id_fkey"
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
      project_intelligence_records: {
        Row: {
          address: Json | null
          analysis: Json | null
          budget_band: string | null
          builder_data: Json
          construction_confidence: number | null
          created_at: string
          current_stage: string | null
          current_step: number
          description: string | null
          documents: Json
          edit_token: string
          id: string
          project_type: string | null
          property_age: string | null
          property_type: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          analysis?: Json | null
          budget_band?: string | null
          builder_data?: Json
          construction_confidence?: number | null
          created_at?: string
          current_stage?: string | null
          current_step?: number
          description?: string | null
          documents?: Json
          edit_token?: string
          id?: string
          project_type?: string | null
          property_age?: string | null
          property_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          analysis?: Json | null
          budget_band?: string | null
          builder_data?: Json
          construction_confidence?: number | null
          created_at?: string
          current_stage?: string | null
          current_step?: number
          description?: string | null
          documents?: Json
          edit_token?: string
          id?: string
          project_type?: string | null
          property_age?: string | null
          property_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
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
      quote_check_consistency_tests: {
        Row: {
          category: string
          created_at: string
          extraction_json: Json
          id: string
          passed: boolean | null
          run_number: number
          test_quote_label: string
          test_quote_path: string
          tested_at: string
          tested_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          extraction_json: Json
          id?: string
          passed?: boolean | null
          run_number: number
          test_quote_label: string
          test_quote_path: string
          tested_at?: string
          tested_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          extraction_json?: Json
          id?: string
          passed?: boolean | null
          run_number?: number
          test_quote_label?: string
          test_quote_path?: string
          tested_at?: string
          tested_by?: string | null
        }
        Relationships: []
      }
      quote_check_entitlements: {
        Row: {
          consumed_at: string | null
          granted_at: string
          id: string
          quote_check_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          granted_at?: string
          id?: string
          quote_check_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          granted_at?: string
          id?: string
          quote_check_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_check_extractions: {
        Row: {
          category: string
          created_at: string
          id: string
          model: string | null
          pass0_json: Json
          pass1_json: Json
          quote_check_id: string
          raw_model_output: string | null
          schema_version: string
          source_text_available: boolean
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          model?: string | null
          pass0_json?: Json
          pass1_json?: Json
          quote_check_id: string
          raw_model_output?: string | null
          schema_version: string
          source_text_available?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          model?: string | null
          pass0_json?: Json
          pass1_json?: Json
          quote_check_id?: string
          raw_model_output?: string | null
          schema_version?: string
          source_text_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "quote_check_extractions_quote_check_id_fkey"
            columns: ["quote_check_id"]
            isOneToOne: false
            referencedRelation: "simple_quote_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_checks: {
        Row: {
          addressed_count: number | null
          admin_call_notes: string | null
          analysis_mode: string | null
          analysis_snapshot: Json | null
          certification_readiness: string | null
          checker_type: string
          checklist_results: Json | null
          checklist_score: number | null
          clarification_count: number | null
          comparison_readiness: string | null
          completeness_pct: number | null
          consistency_diagnostic: Json | null
          created_at: string
          created_project: boolean
          description: string
          document_extractions: Json | null
          document_score: number | null
          email: string
          evidence_validation: Json | null
          file_hash: string | null
          id: string
          intake: Json
          labour_material: string | null
          lookup_token: string
          merged_evidence: Json | null
          missing_count: number | null
          pdf_url: string
          postcode: string
          project_confidence: string | null
          project_confidence_score: number | null
          project_type: string
          qs_scoring: Json | null
          quality_score: number | null
          quote_evidence: Json | null
          quote_total_text: string | null
          recommended_next_step: string | null
          report_html: string | null
          report_json: Json | null
          requested_matched_trades: boolean
          risk_level: string | null
          standard_id: string | null
          standard_mismatch: boolean | null
          standard_name: string | null
          standard_version: string | null
          status: string
          stripe_payment_id: string | null
          subtotal_text: string | null
          supporting_docs_diagnostic: Json | null
          supporting_files: Json
          top_issues: Json | null
          total_checks: number | null
          total_text: string | null
          updated_at: string
          user_id: string | null
          vat_text: string | null
        }
        Insert: {
          addressed_count?: number | null
          admin_call_notes?: string | null
          analysis_mode?: string | null
          analysis_snapshot?: Json | null
          certification_readiness?: string | null
          checker_type?: string
          checklist_results?: Json | null
          checklist_score?: number | null
          clarification_count?: number | null
          comparison_readiness?: string | null
          completeness_pct?: number | null
          consistency_diagnostic?: Json | null
          created_at?: string
          created_project?: boolean
          description?: string
          document_extractions?: Json | null
          document_score?: number | null
          email: string
          evidence_validation?: Json | null
          file_hash?: string | null
          id?: string
          intake?: Json
          labour_material?: string | null
          lookup_token?: string
          merged_evidence?: Json | null
          missing_count?: number | null
          pdf_url: string
          postcode?: string
          project_confidence?: string | null
          project_confidence_score?: number | null
          project_type: string
          qs_scoring?: Json | null
          quality_score?: number | null
          quote_evidence?: Json | null
          quote_total_text?: string | null
          recommended_next_step?: string | null
          report_html?: string | null
          report_json?: Json | null
          requested_matched_trades?: boolean
          risk_level?: string | null
          standard_id?: string | null
          standard_mismatch?: boolean | null
          standard_name?: string | null
          standard_version?: string | null
          status?: string
          stripe_payment_id?: string | null
          subtotal_text?: string | null
          supporting_docs_diagnostic?: Json | null
          supporting_files?: Json
          top_issues?: Json | null
          total_checks?: number | null
          total_text?: string | null
          updated_at?: string
          user_id?: string | null
          vat_text?: string | null
        }
        Update: {
          addressed_count?: number | null
          admin_call_notes?: string | null
          analysis_mode?: string | null
          analysis_snapshot?: Json | null
          certification_readiness?: string | null
          checker_type?: string
          checklist_results?: Json | null
          checklist_score?: number | null
          clarification_count?: number | null
          comparison_readiness?: string | null
          completeness_pct?: number | null
          consistency_diagnostic?: Json | null
          created_at?: string
          created_project?: boolean
          description?: string
          document_extractions?: Json | null
          document_score?: number | null
          email?: string
          evidence_validation?: Json | null
          file_hash?: string | null
          id?: string
          intake?: Json
          labour_material?: string | null
          lookup_token?: string
          merged_evidence?: Json | null
          missing_count?: number | null
          pdf_url?: string
          postcode?: string
          project_confidence?: string | null
          project_confidence_score?: number | null
          project_type?: string
          qs_scoring?: Json | null
          quality_score?: number | null
          quote_evidence?: Json | null
          quote_total_text?: string | null
          recommended_next_step?: string | null
          report_html?: string | null
          report_json?: Json | null
          requested_matched_trades?: boolean
          risk_level?: string | null
          standard_id?: string | null
          standard_mismatch?: boolean | null
          standard_name?: string | null
          standard_version?: string | null
          status?: string
          stripe_payment_id?: string | null
          subtotal_text?: string | null
          supporting_docs_diagnostic?: Json | null
          supporting_files?: Json
          top_issues?: Json | null
          total_checks?: number | null
          total_text?: string | null
          updated_at?: string
          user_id?: string | null
          vat_text?: string | null
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
      quote_standard_checks: {
        Row: {
          check_id: string
          check_title: string
          created_at: string
          display_order: number
          id: string
          pass_condition: string | null
          section_name: string | null
          standard_id: string
          standard_uuid: string
          trade_type: string
          version: string
          why_it_matters: string | null
        }
        Insert: {
          check_id: string
          check_title: string
          created_at?: string
          display_order: number
          id?: string
          pass_condition?: string | null
          section_name?: string | null
          standard_id: string
          standard_uuid: string
          trade_type: string
          version: string
          why_it_matters?: string | null
        }
        Update: {
          check_id?: string
          check_title?: string
          created_at?: string
          display_order?: number
          id?: string
          pass_condition?: string | null
          section_name?: string | null
          standard_id?: string
          standard_uuid?: string
          trade_type?: string
          version?: string
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_standard_checks_standard_uuid_fkey"
            columns: ["standard_uuid"]
            isOneToOne: false
            referencedRelation: "quote_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_standards: {
        Row: {
          author: string | null
          created_at: string
          effective_date: string | null
          excluded_scope: string | null
          id: string
          included_scope: string | null
          scope_summary: string | null
          standard_id: string
          standard_name: string
          status: string
          trade_type: string
          updated_at: string
          version: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          effective_date?: string | null
          excluded_scope?: string | null
          id?: string
          included_scope?: string | null
          scope_summary?: string | null
          standard_id: string
          standard_name: string
          status?: string
          trade_type: string
          updated_at?: string
          version: string
        }
        Update: {
          author?: string | null
          created_at?: string
          effective_date?: string | null
          excluded_scope?: string | null
          id?: string
          included_scope?: string | null
          scope_summary?: string | null
          standard_id?: string
          standard_name?: string
          status?: string
          trade_type?: string
          updated_at?: string
          version?: string
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
          assumptions: string | null
          budget_description: string | null
          budget_price: number | null
          certifications: Json | null
          created_at: string
          deposit_amount: number | null
          deposit_required: boolean | null
          estimated_duration_text: string | null
          estimated_start_date: string | null
          exclusions: string | null
          id: string
          is_test: boolean
          job_id: string
          last_viewed_at: string | null
          line_items: Json | null
          materials_spec: Json
          message: string | null
          methodology: string | null
          payment_schedule: Json | null
          pdf_generated_at: string | null
          pdf_path: string | null
          pdf_version: number
          premium_description: string | null
          premium_price: number | null
          provisional_sums: string | null
          reference: string | null
          scope_of_works: string | null
          selected_tier: string | null
          share_materials_with_homeowner: boolean
          standard_description: string | null
          standard_price: number | null
          status: string
          terms: Json | null
          tier_enabled: boolean
          trade_id: string
          updated_at: string
          valid_until: string | null
          vat_amount: number | null
          vat_registered: boolean
          vat_status: string | null
          view_count: number
          working_days: number | null
        }
        Insert: {
          accept_token?: string
          ai_verdict?: string | null
          ai_verdict_at?: string | null
          ai_verdict_summary?: string | null
          amount: number
          assumptions?: string | null
          budget_description?: string | null
          budget_price?: number | null
          certifications?: Json | null
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean | null
          estimated_duration_text?: string | null
          estimated_start_date?: string | null
          exclusions?: string | null
          id?: string
          is_test?: boolean
          job_id: string
          last_viewed_at?: string | null
          line_items?: Json | null
          materials_spec?: Json
          message?: string | null
          methodology?: string | null
          payment_schedule?: Json | null
          pdf_generated_at?: string | null
          pdf_path?: string | null
          pdf_version?: number
          premium_description?: string | null
          premium_price?: number | null
          provisional_sums?: string | null
          reference?: string | null
          scope_of_works?: string | null
          selected_tier?: string | null
          share_materials_with_homeowner?: boolean
          standard_description?: string | null
          standard_price?: number | null
          status?: string
          terms?: Json | null
          tier_enabled?: boolean
          trade_id: string
          updated_at?: string
          valid_until?: string | null
          vat_amount?: number | null
          vat_registered?: boolean
          vat_status?: string | null
          view_count?: number
          working_days?: number | null
        }
        Update: {
          accept_token?: string
          ai_verdict?: string | null
          ai_verdict_at?: string | null
          ai_verdict_summary?: string | null
          amount?: number
          assumptions?: string | null
          budget_description?: string | null
          budget_price?: number | null
          certifications?: Json | null
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean | null
          estimated_duration_text?: string | null
          estimated_start_date?: string | null
          exclusions?: string | null
          id?: string
          is_test?: boolean
          job_id?: string
          last_viewed_at?: string | null
          line_items?: Json | null
          materials_spec?: Json
          message?: string | null
          methodology?: string | null
          payment_schedule?: Json | null
          pdf_generated_at?: string | null
          pdf_path?: string | null
          pdf_version?: number
          premium_description?: string | null
          premium_price?: number | null
          provisional_sums?: string | null
          reference?: string | null
          scope_of_works?: string | null
          selected_tier?: string | null
          share_materials_with_homeowner?: boolean
          standard_description?: string | null
          standard_price?: number | null
          status?: string
          terms?: Json | null
          tier_enabled?: boolean
          trade_id?: string
          updated_at?: string
          valid_until?: string | null
          vat_amount?: number | null
          vat_registered?: boolean
          vat_status?: string | null
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
      scraped_trades: {
        Row: {
          address: string | null
          audit_notes: string | null
          audit_sent: boolean
          audit_sent_date: string | null
          call_attempts: number
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contacted: boolean
          contacted_at: string | null
          created_at: string
          ctps_checked: boolean
          date_checked: string | null
          do_not_call: boolean
          email: string | null
          follow_up_at: string | null
          has_website: boolean
          id: string
          interested: boolean | null
          last_call_outcome: string | null
          last_contacted_at: string | null
          last_contacted_date: string | null
          last_scraped_at: string
          lost_reason: string | null
          main_website_issue: string | null
          mini_audit_sent: boolean
          mini_audit_sent_at: string | null
          monthly_care_interest: string | null
          monthly_care_price: number | null
          next_follow_up_date: string | null
          notes: string | null
          objection_reason: string | null
          opportunity_angle: string | null
          outreach_stage: string
          package_recommended: string | null
          phone: string | null
          pipeline: string
          postcode: string | null
          preferred_contact_method: string | null
          proposal_sent: boolean
          proposal_sent_at: string | null
          proposal_sent_bool: boolean
          proposal_sent_date: string | null
          quoted_value: number | null
          rating: number | null
          reviews_count: number | null
          search_query: string | null
          source: string
          source_id: string | null
          source_of_number: string | null
          tps_checked: boolean
          trade_name: string
          trade_type: string | null
          updated_at: string
          website: string | null
          website_quality: string | null
          website_score: number | null
          website_status: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          audit_notes?: string | null
          audit_sent?: boolean
          audit_sent_date?: string | null
          call_attempts?: number
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contacted?: boolean
          contacted_at?: string | null
          created_at?: string
          ctps_checked?: boolean
          date_checked?: string | null
          do_not_call?: boolean
          email?: string | null
          follow_up_at?: string | null
          has_website?: boolean
          id?: string
          interested?: boolean | null
          last_call_outcome?: string | null
          last_contacted_at?: string | null
          last_contacted_date?: string | null
          last_scraped_at?: string
          lost_reason?: string | null
          main_website_issue?: string | null
          mini_audit_sent?: boolean
          mini_audit_sent_at?: string | null
          monthly_care_interest?: string | null
          monthly_care_price?: number | null
          next_follow_up_date?: string | null
          notes?: string | null
          objection_reason?: string | null
          opportunity_angle?: string | null
          outreach_stage?: string
          package_recommended?: string | null
          phone?: string | null
          pipeline?: string
          postcode?: string | null
          preferred_contact_method?: string | null
          proposal_sent?: boolean
          proposal_sent_at?: string | null
          proposal_sent_bool?: boolean
          proposal_sent_date?: string | null
          quoted_value?: number | null
          rating?: number | null
          reviews_count?: number | null
          search_query?: string | null
          source?: string
          source_id?: string | null
          source_of_number?: string | null
          tps_checked?: boolean
          trade_name: string
          trade_type?: string | null
          updated_at?: string
          website?: string | null
          website_quality?: string | null
          website_score?: number | null
          website_status?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          audit_notes?: string | null
          audit_sent?: boolean
          audit_sent_date?: string | null
          call_attempts?: number
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contacted?: boolean
          contacted_at?: string | null
          created_at?: string
          ctps_checked?: boolean
          date_checked?: string | null
          do_not_call?: boolean
          email?: string | null
          follow_up_at?: string | null
          has_website?: boolean
          id?: string
          interested?: boolean | null
          last_call_outcome?: string | null
          last_contacted_at?: string | null
          last_contacted_date?: string | null
          last_scraped_at?: string
          lost_reason?: string | null
          main_website_issue?: string | null
          mini_audit_sent?: boolean
          mini_audit_sent_at?: string | null
          monthly_care_interest?: string | null
          monthly_care_price?: number | null
          next_follow_up_date?: string | null
          notes?: string | null
          objection_reason?: string | null
          opportunity_angle?: string | null
          outreach_stage?: string
          package_recommended?: string | null
          phone?: string | null
          pipeline?: string
          postcode?: string | null
          preferred_contact_method?: string | null
          proposal_sent?: boolean
          proposal_sent_at?: string | null
          proposal_sent_bool?: boolean
          proposal_sent_date?: string | null
          quoted_value?: number | null
          rating?: number | null
          reviews_count?: number | null
          search_query?: string | null
          source?: string
          source_id?: string | null
          source_of_number?: string | null
          tps_checked?: boolean
          trade_name?: string
          trade_type?: string | null
          updated_at?: string
          website?: string | null
          website_quality?: string | null
          website_score?: number | null
          website_status?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      simple_quote_checks: {
        Row: {
          created_at: string
          email: string | null
          error: string | null
          id: string
          intake: Json
          lookup_token: string
          pdf_url: string | null
          project_type: string | null
          report_json: Json | null
          status: string
          supporting_files: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          error?: string | null
          id?: string
          intake?: Json
          lookup_token?: string
          pdf_url?: string | null
          project_type?: string | null
          report_json?: Json | null
          status?: string
          supporting_files?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          error?: string | null
          id?: string
          intake?: Json
          lookup_token?: string
          pdf_url?: string | null
          project_type?: string | null
          report_json?: Json | null
          status?: string
          supporting_files?: Json
          user_id?: string | null
        }
        Relationships: []
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
      supplier_interest: {
        Row: {
          admin_notes: string | null
          business_name: string
          category: string
          contact_name: string
          contacted_at: string | null
          created_at: string
          email: string
          has_public_liability: boolean
          id: string
          notes: string | null
          phone: string
          postcode: string
          public_liability_amount: string | null
          qualified_at: string | null
          service_area: string
          specialist_type: string | null
          status: string
          updated_at: string
          website: string | null
          years_trading: number
        }
        Insert: {
          admin_notes?: string | null
          business_name: string
          category: string
          contact_name: string
          contacted_at?: string | null
          created_at?: string
          email: string
          has_public_liability?: boolean
          id?: string
          notes?: string | null
          phone: string
          postcode: string
          public_liability_amount?: string | null
          qualified_at?: string | null
          service_area?: string
          specialist_type?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          years_trading?: number
        }
        Update: {
          admin_notes?: string | null
          business_name?: string
          category?: string
          contact_name?: string
          contacted_at?: string | null
          created_at?: string
          email?: string
          has_public_liability?: boolean
          id?: string
          notes?: string | null
          phone?: string
          postcode?: string
          public_liability_amount?: string | null
          qualified_at?: string | null
          service_area?: string
          specialist_type?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          years_trading?: number
        }
        Relationships: []
      }
      supplier_waitlist: {
        Row: {
          also_a_trade: boolean
          business_name: string
          consent: boolean
          contact_name: string | null
          created_at: string
          email: string
          id: string
          notes: string | null
          phone: string | null
          postcode: string | null
          service_area: string | null
          source: string | null
          supplier_types: string[] | null
          trade_type: string | null
        }
        Insert: {
          also_a_trade?: boolean
          business_name: string
          consent?: boolean
          contact_name?: string | null
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          service_area?: string | null
          source?: string | null
          supplier_types?: string[] | null
          trade_type?: string | null
        }
        Update: {
          also_a_trade?: boolean
          business_name?: string
          consent?: boolean
          contact_name?: string | null
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          service_area?: string | null
          source?: string | null
          supplier_types?: string[] | null
          trade_type?: string | null
        }
        Relationships: []
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
      trade_application_events: {
        Row: {
          actor_email: string | null
          actor_user_id: string | null
          application_id: string
          created_at: string
          detail: Json
          event_type: string
          id: string
        }
        Insert: {
          actor_email?: string | null
          actor_user_id?: string | null
          application_id: string
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
        }
        Update: {
          actor_email?: string | null
          actor_user_id?: string | null
          application_id?: string
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "trade_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_applications: {
        Row: {
          admin_notes: string | null
          applicant_email: string | null
          business_name: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          document_paths: Json
          form_data: Json
          full_name: string | null
          id: string
          qualification_path: string | null
          status: string
          trade_category_id: string | null
          updated_at: string
          verification_checks: Json
          verification_status: string
        }
        Insert: {
          admin_notes?: string | null
          applicant_email?: string | null
          business_name?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          document_paths?: Json
          form_data?: Json
          full_name?: string | null
          id?: string
          qualification_path?: string | null
          status?: string
          trade_category_id?: string | null
          updated_at?: string
          verification_checks?: Json
          verification_status?: string
        }
        Update: {
          admin_notes?: string | null
          applicant_email?: string | null
          business_name?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          document_paths?: Json
          form_data?: Json
          full_name?: string | null
          id?: string
          qualification_path?: string | null
          status?: string
          trade_category_id?: string | null
          updated_at?: string
          verification_checks?: Json
          verification_status?: string
        }
        Relationships: []
      }
      trade_portfolio_items: {
        Row: {
          approx_date: string | null
          area_or_address: string | null
          caption: string | null
          created_at: string
          id: string
          storage_path: string
          trade_id: string
        }
        Insert: {
          approx_date?: string | null
          area_or_address?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          storage_path: string
          trade_id: string
        }
        Update: {
          approx_date?: string | null
          area_or_address?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          storage_path?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_portfolio_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_portfolio_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_references: {
        Row: {
          admin_notes: string | null
          applicant_email: string | null
          contact_name: string
          created_at: string
          email: string | null
          id: string
          phone: string | null
          relationship: Database["public"]["Enums"]["trade_reference_relationship"]
          status: Database["public"]["Enums"]["trade_reference_status"]
          status_updated_at: string | null
          status_updated_by: string | null
          trade_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          applicant_email?: string | null
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          relationship?: Database["public"]["Enums"]["trade_reference_relationship"]
          status?: Database["public"]["Enums"]["trade_reference_status"]
          status_updated_at?: string | null
          status_updated_by?: string | null
          trade_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          applicant_email?: string | null
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          relationship?: Database["public"]["Enums"]["trade_reference_relationship"]
          status?: Database["public"]["Enums"]["trade_reference_status"]
          status_updated_at?: string | null
          status_updated_by?: string | null
          trade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_references_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_references_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
            referencedColumns: ["id"]
          },
        ]
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
          accepting_jobs: boolean
          assessment_evidence_complete: boolean
          assessment_notes: string | null
          assessor_name: string | null
          avg_rating: number | null
          band: string | null
          bio: string | null
          building_control_self_notify: boolean
          business_logo_path: string | null
          business_structure: string | null
          calendar_token: string
          ciga_registered: boolean
          companies_house_checked_at: string | null
          companies_house_number: string | null
          companies_house_registered_name: string | null
          companies_house_status: string
          company_name: string
          competence_interview_done: boolean
          completed_jobs_count: number
          cps_registration_number: string | null
          cps_scheme: string | null
          created_at: string
          fgas_registered: boolean
          gas_safe_number: string | null
          green_cert_expiry: string | null
          id: string
          inca_certified: boolean
          insurance_cert_url: string | null
          insurance_expiry: string | null
          is_green_trade: boolean
          is_test: boolean
          last_verification_reminder_at: string | null
          mcs_number: string | null
          mcs_verified: boolean
          name: string
          on_probation: boolean
          ozev_approved: boolean
          pas_2030_accredited: boolean
          pas_2035_coordinator: boolean
          phone: string
          postcode: string
          probation_jobs_remaining: number
          professional_indemnity_cover_pence: number | null
          professional_indemnity_expiry: string | null
          professional_indemnity_insurer: string | null
          professional_indemnity_policy_number: string | null
          public_liability_cover_pence: number | null
          public_liability_expiry: string | null
          public_liability_insurer: string | null
          public_liability_policy_number: string | null
          references_called: boolean
          rejected_at: string | null
          rejection_reason: string | null
          review_count: number
          service_radius_miles: number
          site_assessment_done: boolean
          specialisms_prompt_seen: boolean
          submitted_for_review_at: string | null
          tier: string
          tier_updated_at: string | null
          trade_type: string
          trade_type_other: string | null
          trustmark_number: string | null
          trustmark_verified: boolean
          user_id: string
          vat_number: string | null
          vat_registered: boolean
          verification_last_checked_at: string | null
          verification_notes: string | null
          verification_reminder_count: number
          verification_route: string | null
          verification_status: string
          verified: boolean
          verified_on_prografter_at: string | null
          website: string | null
          years_experience: number | null
          years_in_trade: number | null
        }
        Insert: {
          accepting_jobs?: boolean
          assessment_evidence_complete?: boolean
          assessment_notes?: string | null
          assessor_name?: string | null
          avg_rating?: number | null
          band?: string | null
          bio?: string | null
          building_control_self_notify?: boolean
          business_logo_path?: string | null
          business_structure?: string | null
          calendar_token?: string
          ciga_registered?: boolean
          companies_house_checked_at?: string | null
          companies_house_number?: string | null
          companies_house_registered_name?: string | null
          companies_house_status?: string
          company_name: string
          competence_interview_done?: boolean
          completed_jobs_count?: number
          cps_registration_number?: string | null
          cps_scheme?: string | null
          created_at?: string
          fgas_registered?: boolean
          gas_safe_number?: string | null
          green_cert_expiry?: string | null
          id?: string
          inca_certified?: boolean
          insurance_cert_url?: string | null
          insurance_expiry?: string | null
          is_green_trade?: boolean
          is_test?: boolean
          last_verification_reminder_at?: string | null
          mcs_number?: string | null
          mcs_verified?: boolean
          name: string
          on_probation?: boolean
          ozev_approved?: boolean
          pas_2030_accredited?: boolean
          pas_2035_coordinator?: boolean
          phone: string
          postcode: string
          probation_jobs_remaining?: number
          professional_indemnity_cover_pence?: number | null
          professional_indemnity_expiry?: string | null
          professional_indemnity_insurer?: string | null
          professional_indemnity_policy_number?: string | null
          public_liability_cover_pence?: number | null
          public_liability_expiry?: string | null
          public_liability_insurer?: string | null
          public_liability_policy_number?: string | null
          references_called?: boolean
          rejected_at?: string | null
          rejection_reason?: string | null
          review_count?: number
          service_radius_miles?: number
          site_assessment_done?: boolean
          specialisms_prompt_seen?: boolean
          submitted_for_review_at?: string | null
          tier?: string
          tier_updated_at?: string | null
          trade_type: string
          trade_type_other?: string | null
          trustmark_number?: string | null
          trustmark_verified?: boolean
          user_id: string
          vat_number?: string | null
          vat_registered?: boolean
          verification_last_checked_at?: string | null
          verification_notes?: string | null
          verification_reminder_count?: number
          verification_route?: string | null
          verification_status?: string
          verified?: boolean
          verified_on_prografter_at?: string | null
          website?: string | null
          years_experience?: number | null
          years_in_trade?: number | null
        }
        Update: {
          accepting_jobs?: boolean
          assessment_evidence_complete?: boolean
          assessment_notes?: string | null
          assessor_name?: string | null
          avg_rating?: number | null
          band?: string | null
          bio?: string | null
          building_control_self_notify?: boolean
          business_logo_path?: string | null
          business_structure?: string | null
          calendar_token?: string
          ciga_registered?: boolean
          companies_house_checked_at?: string | null
          companies_house_number?: string | null
          companies_house_registered_name?: string | null
          companies_house_status?: string
          company_name?: string
          competence_interview_done?: boolean
          completed_jobs_count?: number
          cps_registration_number?: string | null
          cps_scheme?: string | null
          created_at?: string
          fgas_registered?: boolean
          gas_safe_number?: string | null
          green_cert_expiry?: string | null
          id?: string
          inca_certified?: boolean
          insurance_cert_url?: string | null
          insurance_expiry?: string | null
          is_green_trade?: boolean
          is_test?: boolean
          last_verification_reminder_at?: string | null
          mcs_number?: string | null
          mcs_verified?: boolean
          name?: string
          on_probation?: boolean
          ozev_approved?: boolean
          pas_2030_accredited?: boolean
          pas_2035_coordinator?: boolean
          phone?: string
          postcode?: string
          probation_jobs_remaining?: number
          professional_indemnity_cover_pence?: number | null
          professional_indemnity_expiry?: string | null
          professional_indemnity_insurer?: string | null
          professional_indemnity_policy_number?: string | null
          public_liability_cover_pence?: number | null
          public_liability_expiry?: string | null
          public_liability_insurer?: string | null
          public_liability_policy_number?: string | null
          references_called?: boolean
          rejected_at?: string | null
          rejection_reason?: string | null
          review_count?: number
          service_radius_miles?: number
          site_assessment_done?: boolean
          specialisms_prompt_seen?: boolean
          submitted_for_review_at?: string | null
          tier?: string
          tier_updated_at?: string | null
          trade_type?: string
          trade_type_other?: string | null
          trustmark_number?: string | null
          trustmark_verified?: boolean
          user_id?: string
          vat_number?: string | null
          vat_registered?: boolean
          verification_last_checked_at?: string | null
          verification_notes?: string | null
          verification_reminder_count?: number
          verification_route?: string | null
          verification_status?: string
          verified?: boolean
          verified_on_prografter_at?: string | null
          website?: string | null
          years_experience?: number | null
          years_in_trade?: number | null
        }
        Relationships: []
      }
      tradevault_documents: {
        Row: {
          admin_notes: string | null
          cover_amount: number | null
          created_at: string
          document_type: string
          expiry_date: string | null
          file_url: string | null
          id: string
          is_current: boolean
          issue_date: string | null
          legacy_source: string | null
          original_filename: string | null
          policy_or_membership_number: string | null
          provider_name: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_bucket: string
          status: string
          trade_id: string
          trade_notes: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          cover_amount?: number | null
          created_at?: string
          document_type: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          is_current?: boolean
          issue_date?: string | null
          legacy_source?: string | null
          original_filename?: string | null
          policy_or_membership_number?: string | null
          provider_name?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_bucket?: string
          status?: string
          trade_id: string
          trade_notes?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          cover_amount?: number | null
          created_at?: string
          document_type?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          is_current?: boolean
          issue_date?: string | null
          legacy_source?: string | null
          original_filename?: string | null
          policy_or_membership_number?: string | null
          provider_name?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_bucket?: string
          status?: string
          trade_id?: string
          trade_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tradevault_documents_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tradevault_documents_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_public"
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
          cps_registration_number: string | null
          cps_scheme: string | null
          gas_safe_number: string | null
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
          cps_registration_number?: string | null
          cps_scheme?: string | null
          gas_safe_number?: string | null
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
          cps_registration_number?: string | null
          cps_scheme?: string | null
          gas_safe_number?: string | null
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
      admin_approve_trade: { Args: { _trade_id: string }; Returns: Json }
      admin_area_coverage: {
        Args: never
        Returns: {
          area: string
          job_count: number
          match_count: number
          trade_count: number
        }[]
      }
      admin_lead_distribution: {
        Args: never
        Returns: {
          job_created_at: string
          job_id: string
          job_postcode: string
          job_ref: string
          job_type: string
          match_id: string
          match_status: string
          notified_at: string
          trade_company: string
          trade_id: string
          trade_name: string
          trade_postcode: string
          trade_type: string
          trade_verified: boolean
        }[]
      }
      compute_contract_hash: { Args: { _contract_id: string }; Returns: string }
      count_verified_trades: { Args: never; Returns: number }
      create_quote_check: {
        Args: {
          _description: string
          _email: string
          _pdf_url: string
          _postcode: string
          _project_type: string
        }
        Returns: {
          id: string
          lookup_token: string
        }[]
      }
      create_quote_check_v2: {
        Args: {
          _checker_type: string
          _description: string
          _email: string
          _intake: Json
          _pdf_url: string
          _postcode: string
          _project_type: string
          _supporting_files?: Json
        }
        Returns: {
          id: string
          lookup_token: string
        }[]
      }
      current_user_owns_trade: { Args: { _trade_id: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
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
      get_planning_invite: {
        Args: { _token: string }
        Returns: {
          company_name: string
          planning_application_id: string
          project_type: string
          trade_name: string
          trade_type: string
          verification_status: string
          verified: boolean
        }[]
      }
      get_public_trade: {
        Args: { _id: string }
        Returns: {
          avg_rating: number
          bio: string
          business_logo_path: string
          company_name: string
          completed_jobs_count: number
          id: string
          is_green_trade: boolean
          mcs_verified: boolean
          name: string
          postcode: string
          review_count: number
          tier: string
          trade_type: string
          trustmark_verified: boolean
          verified: boolean
          website: string
          years_experience: number
        }[]
      }
      get_review_context: {
        Args: { _ref: string }
        Returns: {
          homeowner_id: string
          job_id: string
          role: string
          trade_id: string
        }[]
      }
      get_signup_stats: {
        Args: never
        Returns: {
          genuine_homeowners: number
          genuine_homeowners_30d: number
          genuine_homeowners_7d: number
          genuine_trades: number
          genuine_trades_30d: number
          genuine_trades_7d: number
          total_homeowners: number
          total_trades: number
        }[]
      }
      get_trade_for_homeowner: {
        Args: { _trade_id: string }
        Returns: {
          avg_rating: number
          company_name: string
          completed_jobs_count: number
          id: string
          is_green_trade: boolean
          mcs_verified: boolean
          name: string
          phone: string
          review_count: number
          tier: string
          trade_type: string
          trustmark_verified: boolean
          verified: boolean
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
      is_test_email: { Args: { _email: string }; Returns: boolean }
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
      mark_planning_invite_clicked: {
        Args: { _token: string }
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
      owns_trade: {
        Args: { _trade_id: string; _user_id: string }
        Returns: boolean
      }
      pc_path_belongs_to_user: {
        Args: { _name: string; _uid: string }
        Returns: boolean
      }
      pir_guest_create: {
        Args: never
        Returns: {
          edit_token: string
          id: string
        }[]
      }
      pir_guest_get: {
        Args: { _id: string; _token: string }
        Returns: {
          address: Json | null
          analysis: Json | null
          budget_band: string | null
          builder_data: Json
          construction_confidence: number | null
          created_at: string
          current_stage: string | null
          current_step: number
          description: string | null
          documents: Json
          edit_token: string
          id: string
          project_type: string | null
          property_age: string | null
          property_type: string | null
          status: string
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "project_intelligence_records"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      pir_guest_update: {
        Args: {
          _builder_data?: Json
          _current_stage?: string
          _current_step?: number
          _id: string
          _project_type?: string
          _status?: string
          _token: string
        }
        Returns: undefined
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
      search_public_trades: {
        Args: { _limit?: number; _q: string }
        Returns: {
          avg_rating: number
          bio: string
          business_logo_path: string
          company_name: string
          completed_jobs_count: number
          id: string
          is_green_trade: boolean
          mcs_verified: boolean
          name: string
          postcode: string
          review_count: number
          tier: string
          trade_type: string
          trustmark_verified: boolean
          verified: boolean
          website: string
          years_experience: number
        }[]
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
      user_is_job_participant: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      user_owns_atlas_survey: {
        Args: { _survey: string; _user: string }
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
      trade_reference_relationship:
        | "past_customer"
        | "trade_contact"
        | "supplier"
        | "other"
      trade_reference_status:
        | "not_contacted"
        | "contacted"
        | "verified"
        | "no_response"
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
      trade_reference_relationship: [
        "past_customer",
        "trade_contact",
        "supplier",
        "other",
      ],
      trade_reference_status: [
        "not_contacted",
        "contacted",
        "verified",
        "no_response",
      ],
    },
  },
} as const
