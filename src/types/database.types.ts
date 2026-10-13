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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          client_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          project_id: string | null
          summary: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          client_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          project_id?: string | null
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          client_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          project_id?: string | null
          summary?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_active: boolean
          item_type: string
          tax_rate_id: string | null
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_active?: boolean
          item_type?: string
          tax_rate_id?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_active?: boolean
          item_type?: string
          tax_rate_id?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_locations: {
        Row: {
          address: string
          city: string | null
          client_id: string
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          notes: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          address: string
          city?: string | null
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          notes?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string | null
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          notes?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_locations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          client_type: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          identification: string | null
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          client_type?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          identification?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          client_type?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          identification?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          allow_operations_conflict_override: boolean
          city: string | null
          currency_code: string
          default_commercial_terms: string | null
          default_payment_terms: string | null
          default_quote_notes: string | null
          default_validity_days: number
          document_footer: string | null
          email: string | null
          id: number
          legal_name: string | null
          locale: string
          logo_path: string | null
          phone: string | null
          tax_configuration_validated: boolean
          tax_id: string | null
          technicians_can_update_stages: boolean
          timezone: string
          trade_name: string
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          allow_operations_conflict_override?: boolean
          city?: string | null
          currency_code?: string
          default_commercial_terms?: string | null
          default_payment_terms?: string | null
          default_quote_notes?: string | null
          default_validity_days?: number
          document_footer?: string | null
          email?: string | null
          id?: number
          legal_name?: string | null
          locale?: string
          logo_path?: string | null
          phone?: string | null
          tax_configuration_validated?: boolean
          tax_id?: string | null
          technicians_can_update_stages?: boolean
          timezone?: string
          trade_name?: string
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          allow_operations_conflict_override?: boolean
          city?: string | null
          currency_code?: string
          default_commercial_terms?: string | null
          default_payment_terms?: string | null
          default_quote_notes?: string | null
          default_validity_days?: number
          document_footer?: string | null
          email?: string | null
          id?: number
          legal_name?: string | null
          locale?: string
          logo_path?: string | null
          phone?: string | null
          tax_configuration_validated?: boolean
          tax_id?: string | null
          technicians_can_update_stages?: boolean
          timezone?: string
          trade_name?: string
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_confirmations: {
        Row: {
          confirmed_at: string
          confirmed_by: string | null
          created_at: string
          delivery_type: string
          id: string
          notes: string
          project_id: string
          work_order_id: string | null
        }
        Insert: {
          confirmed_at?: string
          confirmed_by?: string | null
          created_at?: string
          delivery_type?: string
          id?: string
          notes: string
          project_id: string
          work_order_id?: string | null
        }
        Update: {
          confirmed_at?: string
          confirmed_by?: string | null
          created_at?: string
          delivery_type?: string
          id?: string
          notes?: string
          project_id?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_confirmations_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_confirmations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_confirmations_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_counters: {
        Row: {
          doc_type: string
          last_value: number
          year: number
        }
        Insert: {
          doc_type: string
          last_value?: number
          year: number
        }
        Update: {
          doc_type?: string
          last_value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_counters_doc_type_fkey"
            columns: ["doc_type"]
            isOneToOne: false
            referencedRelation: "document_series"
            referencedColumns: ["doc_type"]
          },
        ]
      }
      document_series: {
        Row: {
          doc_type: string
          padding: number
          prefix: string
          updated_at: string
        }
        Insert: {
          doc_type: string
          padding?: number
          prefix: string
          updated_at?: string
        }
        Update: {
          doc_type?: string
          padding?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_type: string
          project_id: string
          quotation_id: string | null
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_type?: string
          project_id: string
          quotation_id?: string | null
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_type?: string
          project_id?: string
          quotation_id?: string | null
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_stages: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          id: string
          is_required_for_closure: boolean
          name: string
          notes: string | null
          project_id: string
          sequence: number
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required_for_closure?: boolean
          name: string
          notes?: string | null
          project_id: string
          sequence?: number
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required_for_closure?: boolean
          name?: string
          notes?: string | null
          project_id?: string
          sequence?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location_id: string | null
          notes: string | null
          priority: string
          project_code: string
          responsible_user_id: string | null
          scope_description: string | null
          start_date: string | null
          status: string
          target_end_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          priority?: string
          project_code: string
          responsible_user_id?: string | null
          scope_description?: string | null
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          priority?: string
          project_code?: string
          responsible_user_id?: string | null
          scope_description?: string | null
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_location_fk"
            columns: ["location_id", "client_id"]
            isOneToOne: false
            referencedRelation: "client_locations"
            referencedColumns: ["id", "client_id"]
          },
          {
            foreignKeyName: "projects_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_documents: {
        Row: {
          document_type: string
          file_name: string
          file_size: number | null
          generated_at: string
          generated_by: string | null
          id: string
          metadata: Json | null
          quotation_id: string
          storage_path: string | null
          version: number
        }
        Insert: {
          document_type: string
          file_name: string
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          quotation_id: string
          storage_path?: string | null
          version: number
        }
        Update: {
          document_type?: string
          file_name?: string
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          quotation_id?: string
          storage_path?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_documents_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_documents_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string
          description: string
          discount_type: string
          discount_value: number
          id: string
          item_type: string
          line_discount: number
          line_subtotal: number
          line_tax: number
          line_total: number
          quantity: number
          quotation_id: string
          sort_order: number
          tax_rate: number
          tax_rate_id: string | null
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_type?: string
          discount_value?: number
          id?: string
          item_type?: string
          line_discount?: number
          line_subtotal?: number
          line_tax?: number
          line_total?: number
          quantity?: number
          quotation_id: string
          sort_order?: number
          tax_rate?: number
          tax_rate_id?: string | null
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_type?: string
          discount_value?: number
          id?: string
          item_type?: string
          line_discount?: number
          line_subtotal?: number
          line_tax?: number
          line_total?: number
          quantity?: number
          quotation_id?: string
          sort_order?: number
          tax_rate?: number
          tax_rate_id?: string | null
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          commercial_terms: string | null
          created_at: string
          created_by: string | null
          deposit_amount: number
          deposit_type: string
          deposit_value: number
          discount_total: number
          estimated_balance: number
          execution_time_description: string | null
          id: string
          issue_date: string
          notes: string | null
          payment_terms: string | null
          project_id: string
          quotation_number: string
          response_at: string | null
          response_notes: string | null
          scope_description: string | null
          sent_at: string | null
          sent_via: string | null
          status: string
          subtotal: number
          superseded_by_id: string | null
          tax_total: number
          total: number
          updated_at: string
          valid_until: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          commercial_terms?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          deposit_type?: string
          deposit_value?: number
          discount_total?: number
          estimated_balance?: number
          execution_time_description?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          payment_terms?: string | null
          project_id: string
          quotation_number: string
          response_at?: string | null
          response_notes?: string | null
          scope_description?: string | null
          sent_at?: string | null
          sent_via?: string | null
          status?: string
          subtotal?: number
          superseded_by_id?: string | null
          tax_total?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          commercial_terms?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          deposit_type?: string
          deposit_value?: number
          discount_total?: number
          estimated_balance?: number
          execution_time_description?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          payment_terms?: string | null
          project_id?: string
          quotation_number?: string
          response_at?: string | null
          response_notes?: string | null
          scope_description?: string | null
          sent_at?: string | null
          sent_via?: string | null
          status?: string
          subtotal?: number
          superseded_by_id?: string | null
          tax_total?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          notes: string | null
          rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          notes?: string | null
          rate: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          notes?: string | null
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_technicians: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          user_id: string
          visit_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          user_id: string
          visit_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_technicians_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_technicians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_technicians_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          address_snapshot: string | null
          allow_conflict_override: boolean
          created_at: string
          created_by: string | null
          end_at: string
          id: string
          instructions: string | null
          notes: string | null
          start_at: string
          status: string
          updated_at: string
          work_order_id: string
        }
        Insert: {
          address_snapshot?: string | null
          allow_conflict_override?: boolean
          created_at?: string
          created_by?: string | null
          end_at: string
          id?: string
          instructions?: string | null
          notes?: string | null
          start_at: string
          status?: string
          updated_at?: string
          work_order_id: string
        }
        Update: {
          address_snapshot?: string | null
          allow_conflict_override?: boolean
          created_at?: string
          created_by?: string | null
          end_at?: string
          id?: string
          instructions?: string | null
          notes?: string | null
          start_at?: string
          status?: string
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_technicians: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_role: string
          id: string
          user_id: string
          work_order_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_role?: string
          id?: string
          user_id: string
          work_order_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_role?: string
          id?: string
          user_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_technicians_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_technicians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_technicians_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_number: string
          project_id: string
          quotation_id: string
          responsible_user_id: string | null
          scope_snapshot: string
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_number: string
          project_id: string
          quotation_id: string
          responsible_user_id?: string | null
          scope_snapshot?: string
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          project_id?: string
          quotation_id?: string
          responsible_user_id?: string | null
          scope_snapshot?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: true
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_user_roles: {
        Args: { p_roles: string[]; p_user_id: string }
        Returns: undefined
      }
      admin_toggle_user_active: {
        Args: { p_is_active: boolean; p_user_id: string }
        Returns: undefined
      }
      approve_quotation: {
        Args: { p_notes?: string; p_quotation_id: string }
        Returns: {
          approved_at: string | null
          approved_by_user_id: string | null
          commercial_terms: string | null
          created_at: string
          created_by: string | null
          deposit_amount: number
          deposit_type: string
          deposit_value: number
          discount_total: number
          estimated_balance: number
          execution_time_description: string | null
          id: string
          issue_date: string
          notes: string | null
          payment_terms: string | null
          project_id: string
          quotation_number: string
          response_at: string | null
          response_notes: string | null
          scope_description: string | null
          sent_at: string | null
          sent_via: string | null
          status: string
          subtotal: number
          superseded_by_id: string | null
          tax_total: number
          total: number
          updated_at: string
          valid_until: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "quotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_technician_conflicts: {
        Args: {
          p_end_at: string
          p_exclude_visit_id?: string
          p_start_at: string
          p_technician_ids: string[]
        }
        Returns: {
          conflict_end_at: string
          conflict_order_number: string
          conflict_project_title: string
          conflict_start_at: string
          conflict_visit_id: string
          technician_name: string
          user_id: string
        }[]
      }
      complete_project_stage: {
        Args: { p_notes?: string; p_stage_id: string }
        Returns: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          id: string
          is_required_for_closure: boolean
          name: string
          notes: string | null
          project_id: string
          sequence: number
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "project_stages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_project_delivery: {
        Args: {
          p_delivery_type?: string
          p_notes?: string
          p_project_id: string
          p_work_order_id?: string
        }
        Returns: {
          confirmed_at: string
          confirmed_by: string | null
          created_at: string
          delivery_type: string
          id: string
          notes: string
          project_id: string
          work_order_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "delivery_confirmations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      convert_quotation_to_work_order: {
        Args: { p_quotation_id: string; p_responsible_user_id?: string }
        Returns: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_number: string
          project_id: string
          quotation_id: string
          responsible_user_id: string | null
          scope_snapshot: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "work_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_quotation_version: {
        Args: { p_quotation_id: string }
        Returns: string
      }
      recalculate_quotation: {
        Args: { p_quotation_id: string }
        Returns: {
          approved_at: string | null
          approved_by_user_id: string | null
          commercial_terms: string | null
          created_at: string
          created_by: string | null
          deposit_amount: number
          deposit_type: string
          deposit_value: number
          discount_total: number
          estimated_balance: number
          execution_time_description: string | null
          id: string
          issue_date: string
          notes: string | null
          payment_terms: string | null
          project_id: string
          quotation_number: string
          response_at: string | null
          response_notes: string | null
          scope_description: string | null
          sent_at: string | null
          sent_via: string | null
          status: string
          subtotal: number
          superseded_by_id: string | null
          tax_total: number
          total: number
          updated_at: string
          valid_until: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "quotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reopen_project_stage: {
        Args: { p_reason: string; p_stage_id: string }
        Returns: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          id: string
          is_required_for_closure: boolean
          name: string
          notes: string | null
          project_id: string
          sequence: number
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "project_stages"
          isOneToOne: true
          isSetofReturn: false
        }
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
    Enums: {},
  },
} as const
