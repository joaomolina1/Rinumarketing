export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      google_campaigns: {
        Row: {
          id: string;
          campaign_id: string;
          campaign_name: string;
          status: string | null;
          budget_amount_micros: number | null;
          impressions: number | null;
          clicks: number | null;
          cost_micros: number | null;
          conversions: number | null;
          conversion_value: number | null;
          date: string;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          campaign_name: string;
          status?: string | null;
          budget_amount_micros?: number | null;
          impressions?: number | null;
          clicks?: number | null;
          cost_micros?: number | null;
          conversions?: number | null;
          conversion_value?: number | null;
          date: string;
          synced_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["google_campaigns"]["Insert"]>;
        Relationships: [];
      };
      meta_campaigns: {
        Row: {
          id: string;
          campaign_id: string;
          campaign_name: string;
          status: string | null;
          daily_budget: number | null;
          impressions: number | null;
          clicks: number | null;
          spend: number | null;
          reach: number | null;
          frequency: number | null;
          conversions: number | null;
          conversion_value: number | null;
          date: string;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          campaign_name: string;
          status?: string | null;
          daily_budget?: number | null;
          impressions?: number | null;
          clicks?: number | null;
          spend?: number | null;
          reach?: number | null;
          frequency?: number | null;
          conversions?: number | null;
          conversion_value?: number | null;
          date: string;
          synced_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["meta_campaigns"]["Insert"]>;
        Relationships: [];
      };
      daily_kpis: {
        Row: {
          id: string;
          date: string;
          google_spend: number | null;
          google_conversions: number | null;
          google_revenue: number | null;
          meta_spend: number | null;
          meta_conversions: number | null;
          meta_revenue: number | null;
          total_spend: number | null;
          total_revenue: number | null;
          blended_roas: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          date: string;
          google_spend?: number | null;
          google_conversions?: number | null;
          google_revenue?: number | null;
          meta_spend?: number | null;
          meta_conversions?: number | null;
          meta_revenue?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["daily_kpis"]["Insert"]>;
        Relationships: [];
      };
      agent_runs: {
        Row: {
          id: string;
          agent_name: string;
          trigger_type: string;
          status: string;
          input: Json | null;
          reasoning: string | null;
          output: Json | null;
          error: string | null;
          started_at: string | null;
          completed_at: string | null;
          duration_ms: number | null;
        };
        Insert: {
          id?: string;
          agent_name: string;
          trigger_type: string;
          status?: string;
          input?: Json | null;
          reasoning?: string | null;
          output?: Json | null;
          error?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_runs"]["Insert"]>;
        Relationships: [];
      };
      agent_actions: {
        Row: {
          id: string;
          run_id: string | null;
          agent_name: string;
          action_type: string;
          platform: string;
          entity_type: string;
          entity_id: string;
          entity_name: string | null;
          current_value: Json | null;
          proposed_value: Json | null;
          reasoning: string;
          expected_impact: string | null;
          risk_level: string | null;
          status: string | null;
          approved_by: string | null;
          approved_at: string | null;
          executed_at: string | null;
          execution_result: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          run_id?: string | null;
          agent_name: string;
          action_type: string;
          platform: string;
          entity_type: string;
          entity_id: string;
          entity_name?: string | null;
          current_value?: Json | null;
          proposed_value?: Json | null;
          reasoning: string;
          expected_impact?: string | null;
          risk_level?: string | null;
          status?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          executed_at?: string | null;
          execution_result?: Json | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_actions"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          week_start: string;
          week_end: string;
          title: string;
          summary: string | null;
          html_content: string | null;
          metrics_snapshot: Json | null;
          actions_taken: Json | null;
          insights: Json | null;
          recommendations: Json | null;
          status: string | null;
          sent_at: string | null;
          sent_to: string[] | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          week_start: string;
          week_end: string;
          title: string;
          summary?: string | null;
          html_content?: string | null;
          metrics_snapshot?: Json | null;
          actions_taken?: Json | null;
          insights?: Json | null;
          recommendations?: Json | null;
          status?: string | null;
          sent_at?: string | null;
          sent_to?: string[] | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      integration_settings: {
        Row: {
          user_id: string;
          google_ads_client_id: string | null;
          google_ads_client_secret: string | null;
          google_ads_refresh_token: string | null;
          google_ads_developer_token: string | null;
          google_ads_customer_id: string | null;
          ga4_property_id: string | null;
          google_application_credentials_json: string | null;
          meta_app_id: string | null;
          meta_app_secret: string | null;
          meta_access_token: string | null;
          meta_ad_account_id: string | null;
          anthropic_api_key: string | null;
          slack_bot_token: string | null;
          slack_channel_id: string | null;
          resend_api_key: string | null;
          report_recipient_email: string | null;
          n8n_webhook_url: string | null;
          n8n_api_key: string | null;
          onboarding_step: number;
          onboarding_completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          google_ads_client_id?: string | null;
          google_ads_client_secret?: string | null;
          google_ads_refresh_token?: string | null;
          google_ads_developer_token?: string | null;
          google_ads_customer_id?: string | null;
          ga4_property_id?: string | null;
          google_application_credentials_json?: string | null;
          meta_app_id?: string | null;
          meta_app_secret?: string | null;
          meta_access_token?: string | null;
          meta_ad_account_id?: string | null;
          anthropic_api_key?: string | null;
          slack_bot_token?: string | null;
          slack_channel_id?: string | null;
          resend_api_key?: string | null;
          report_recipient_email?: string | null;
          n8n_webhook_url?: string | null;
          n8n_api_key?: string | null;
          onboarding_step?: number;
          onboarding_completed_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["integration_settings"]["Insert"]>;
        Relationships: [];
      };
      agent_settings: {
        Row: {
          user_id: string;
          mode: string;
          agents_master_enabled: boolean;
          google_agent_enabled: boolean;
          meta_agent_enabled: boolean;
          analytics_agent_enabled: boolean;
          action_policies: Json;
          max_budget_increase_per_action_eur: number;
          max_daily_budget_increase_eur: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          mode?: string;
          agents_master_enabled?: boolean;
          google_agent_enabled?: boolean;
          meta_agent_enabled?: boolean;
          analytics_agent_enabled?: boolean;
          action_policies?: Json;
          max_budget_increase_per_action_eur?: number;
          max_daily_budget_increase_eur?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
