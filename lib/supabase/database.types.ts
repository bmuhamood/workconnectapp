// lib/supabase/database.types.ts
//
// Hand-written to match supabase/migrations/00001_initial_schema.sql.
// Once the project is linked, replace this file with the real generated
// types by running:
//
//   supabase gen types typescript --linked > lib/supabase/database.types.ts
//
// This file currently covers the tables the frontend touches in this phase
// (profiles, employer/worker profiles, job categories, job postings,
// applications). Add rows here as you migrate more pages, or just regenerate.

export type UserRole = 'employer' | 'worker' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type JobPostingStatus = 'draft' | 'active' | 'filled' | 'closed' | 'cancelled';
export type JobApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
export type AvailabilityStatus = 'available' | 'unavailable' | 'on_assignment' | 'full_time' | 'part_time' | 'flexible';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          phone: string;
          first_name: string;
          last_name: string;
          role: UserRole;
          status: UserStatus;
          registration_method: string;
          is_verified: boolean;
          email_verified: boolean;
          phone_verified: boolean;
          is_blocked: boolean;
          is_blacklisted: boolean;
          blocked_reason: string | null;
          blocked_at: string | null;
          blocked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string; phone: string; role: UserRole };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      disciplinary_records: {
        Row: {
          id: string;
          user_id: string;
          record_type: 'misconduct' | 'criminal_record' | 'complaint' | 'warning' | 'policy_violation' | 'other';
          severity: 'low' | 'medium' | 'high' | 'critical';
          title: string;
          description: string;
          occurred_at: string | null;
          is_visible_to_public: boolean;
          reported_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['disciplinary_records']['Row']> & { user_id: string; record_type: string; title: string; description: string };
        Update: Partial<Database['public']['Tables']['disciplinary_records']['Row']>;
        Relationships: [];
      };
      employer_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          company_name: string | null;
          address: string | null;
          city: string;
          district: string | null;
          location_lat: number | null;
          location_lng: number | null;
          profile_photo_url: string | null;
          id_number: string | null;
          id_verified: boolean;
          subscription_tier: 'basic' | 'premium' | 'business';
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['employer_profiles']['Row']> & { user_id: string; first_name: string; last_name: string };
        Update: Partial<Database['public']['Tables']['employer_profiles']['Row']>;
        Relationships: [];
      };
      worker_profiles: {
        Row: {
          id: string;
          user_id: string;
          completion_percentage: number;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          gender: string | null;
          national_id: string | null;
          profile_photo_url: string | null;
          bio: string | null;
          city: string;
          district: string | null;
          location_lat: number | null;
          location_lng: number | null;
          experience_years: number;
          education_level: string | null;
          languages: string[];
          profession: string;
          additional_skills: string;
          hourly_rate: number;
          availability: AvailabilityStatus;
          expected_salary_min: number | null;
          expected_salary_max: number | null;
          verification_status: VerificationStatus;
          trust_score: number;
          rating_average: number;
          rating_breakdown: Record<string, number>;
          total_reviews: number;
          total_placements: number;
          subscription_tier: 'basic' | 'premium' | 'pro';
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['worker_profiles']['Row']> & { user_id: string; first_name: string; last_name: string };
        Update: Partial<Database['public']['Tables']['worker_profiles']['Row']>;
        Relationships: [];
      };
      job_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['job_categories']['Row']> & { name: string };
        Update: Partial<Database['public']['Tables']['job_categories']['Row']>;
        Relationships: [];
      };
      worker_skills: {
        Row: {
          id: string;
          worker_id: string;
          category_id: string;
          skill_name: string;
          proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          years_of_experience: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['worker_skills']['Row']> & { worker_id: string; category_id: string; skill_name: string; proficiency_level: string };
        Update: Partial<Database['public']['Tables']['worker_skills']['Row']>;
        Relationships: [];
      };
      verifications: {
        Row: {
          id: string;
          worker_id: string;
          verification_type: 'identity' | 'background_check' | 'reference' | 'skills_certification' | 'medical';
          status: 'pending' | 'approved' | 'rejected';
          verified_by: string | null;
          verification_notes: string | null;
          verified_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['verifications']['Row']> & { worker_id: string; verification_type: string };
        Update: Partial<Database['public']['Tables']['verifications']['Row']>;
        Relationships: [];
      };
      job_postings: {
        Row: {
          id: string;
          employer_id: string;
          category_id: string | null;
          title: string;
          description: string;
          requirements: string | null;
          salary_min: number;
          salary_max: number;
          location: string;
          work_schedule: string | null;
          start_date: string | null;
          status: JobPostingStatus;
          is_featured: boolean;
          views_count: number;
          applications_count: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          expires_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['job_postings']['Row']> & {
          employer_id: string; title: string; description: string; salary_min: number; salary_max: number; location: string;
        };
        Update: Partial<Database['public']['Tables']['job_postings']['Row']>;
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
          job_posting_id: string;
          worker_id: string;
          cover_letter: string | null;
          expected_salary: number | null;
          availability_date: string | null;
          status: JobApplicationStatus;
          ai_match_score: number | null;
          ai_recommendation: string | null;
          applied_at: string;
          reviewed_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['job_applications']['Row']> & { job_posting_id: string; worker_id: string };
        Update: Partial<Database['public']['Tables']['job_applications']['Row']>;
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          employer_id: string | null;
          worker_id: string | null;
          category_id: string | null;
          contract_type: 'full_time' | 'part_time' | 'temporary' | 'on_demand';
          status: 'draft' | 'trial' | 'active' | 'completed' | 'terminated' | 'cancelled';
          job_title: string;
          job_description: string;
          worker_salary_amount: number;
          service_fee_amount: number;
          total_monthly_cost: number;
          payment_frequency: string;
          start_date: string;
          trial_end_date: string | null;
          end_date: string | null;
          work_location: string | null;
          work_hours_per_week: number;
          work_schedule: Record<string, string>;
          is_trial: boolean;
          trial_duration_days: number;
          trial_passed: boolean | null;
          trial_feedback: string | null;
          contract_document_url: string | null;
          signed_by_employer: boolean;
          signed_by_worker: boolean;
          employer_signature_date: string | null;
          worker_signature_date: string | null;
          signature_data_employer: string | null;
          signature_data_worker: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          activated_at: string | null;
          completed_at: string | null;
          termination_reason: string | null;
          termination_initiated_by: string | null;
        };
        Insert: Partial<Database['public']['Tables']['contracts']['Row']> & {
          job_title: string; job_description: string; worker_salary_amount: number; service_fee_amount: number; start_date: string;
        };
        Update: Partial<Database['public']['Tables']['contracts']['Row']>;
        Relationships: [];
      };
      contract_replacements: {
        Row: {
          id: string;
          original_contract_id: string;
          original_worker_id: string | null;
          replacement_worker_id: string | null;
          new_contract_id: string | null;
          reason: string;
          requested_by: string | null;
          status: 'requested' | 'processing' | 'completed' | 'cancelled';
          is_free_replacement: boolean;
          replacement_fee: number;
          requested_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['contract_replacements']['Row']> & { original_contract_id: string; reason: string };
        Update: Partial<Database['public']['Tables']['contract_replacements']['Row']>;
        Relationships: [];
      };
      contract_documents: {
        Row: {
          id: string;
          contract_id: string;
          document_type: 'contract' | 'amendment' | 'termination' | 'other';
          document_file_url: string | null;
          document_name: string;
          uploaded_by: string | null;
          uploaded_at: string;
          description: string | null;
        };
        Insert: Partial<Database['public']['Tables']['contract_documents']['Row']> & { contract_id: string; document_type: string; document_name: string };
        Update: Partial<Database['public']['Tables']['contract_documents']['Row']>;
        Relationships: [];
      };
      payroll_cycles: {
        Row: {
          id: string;
          month: number;
          year: number;
          total_contracts: number;
          total_worker_salaries: number;
          total_service_fees: number;
          total_revenue: number;
          invoices_generated: boolean;
          payments_processed: boolean;
          cycle_closed: boolean;
          invoice_generation_date: string | null;
          payment_processing_date: string | null;
          closed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['payroll_cycles']['Row']> & { month: number; year: number };
        Update: Partial<Database['public']['Tables']['payroll_cycles']['Row']>;
        Relationships: [];
      };
      employer_invoices: {
        Row: {
          id: string;
          invoice_number: string;
          payroll_cycle_id: string;
          contract_id: string;
          employer_id: string;
          worker_salary_amount: number;
          service_fee_amount: number;
          additional_fees: number;
          total_amount: number;
          status: 'pending' | 'paid' | 'overdue' | 'cancelled';
          due_date: string;
          paid_date: string | null;
          payment_method: string | null;
          transaction_reference: string | null;
          invoice_pdf_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['employer_invoices']['Row']> & {
          invoice_number: string; payroll_cycle_id: string; contract_id: string; employer_id: string; worker_salary_amount: number; service_fee_amount: number; total_amount: number; due_date: string;
        };
        Update: Partial<Database['public']['Tables']['employer_invoices']['Row']>;
        Relationships: [];
      };
      worker_payments: {
        Row: {
          id: string;
          payment_reference: string;
          payroll_cycle_id: string;
          contract_id: string;
          worker_id: string;
          invoice_id: string;
          salary_amount: number;
          deductions: number;
          net_amount: number;
          payment_method: string;
          payment_provider: string | null;
          account_number: string;
          account_name: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
          transaction_id: string | null;
          transaction_receipt_url: string | null;
          payslip_pdf_url: string | null;
          scheduled_date: string;
          disbursement_date: string | null;
          created_at: string;
          updated_at: string;
          failure_reason: string | null;
          retry_count: number;
        };
        Insert: Partial<Database['public']['Tables']['worker_payments']['Row']> & {
          payment_reference: string; payroll_cycle_id: string; contract_id: string; worker_id: string; invoice_id: string; salary_amount: number; net_amount: number; payment_method: string; account_number: string; scheduled_date: string;
        };
        Update: Partial<Database['public']['Tables']['worker_payments']['Row']>;
        Relationships: [];
      };
      worker_payment_methods: {
        Row: {
          id: string;
          worker_id: string;
          method_type: 'mobile_money_mtn' | 'mobile_money_airtel' | 'bank_transfer' | 'cash_pickup';
          provider_name: string | null;
          account_number: string;
          account_name: string | null;
          bank_name: string | null;
          branch_name: string | null;
          swift_code: string | null;
          is_default: boolean;
          is_verified: boolean;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['worker_payment_methods']['Row']> & { worker_id: string; method_type: string; account_number: string };
        Update: Partial<Database['public']['Tables']['worker_payment_methods']['Row']>;
        Relationships: [];
      };
      service_fee_config: {
        Row: {
          id: string;
          category_id: string;
          fee_type: 'fixed_amount' | 'percentage' | 'tiered';
          fixed_amount: number | null;
          percentage: number | null;
          tier_config: any;
          minimum_fee: number | null;
          maximum_fee: number | null;
          is_active: boolean;
          effective_from: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['service_fee_config']['Row']> & { category_id: string };
        Update: Partial<Database['public']['Tables']['service_fee_config']['Row']>;
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          id: string;
          transaction_type: 'employer_payment' | 'worker_disbursement' | 'refund';
          external_reference: string;
          internal_reference: string | null;
          amount: number;
          currency: string;
          payment_method: string;
          payment_provider: string;
          status: 'initiated' | 'pending' | 'successful' | 'failed' | 'cancelled';
          provider_status: string | null;
          provider_response: any;
          payer_user_id: string | null;
          payee_user_id: string | null;
          invoice_id: string | null;
          worker_payment_id: string | null;
          initiated_at: string;
          completed_at: string | null;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: Partial<Database['public']['Tables']['payment_transactions']['Row']> & {
          transaction_type: string; external_reference: string; amount: number; payment_method: string; payment_provider: string;
        };
        Update: Partial<Database['public']['Tables']['payment_transactions']['Row']>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          participant_1: string;
          participant_2: string;
          contract_id: string | null;
          is_archived_1: boolean;
          is_archived_2: boolean;
          is_blocked: boolean;
          blocked_by: string | null;
          last_message_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['conversations']['Row']> & { participant_1: string; participant_2: string };
        Update: Partial<Database['public']['Tables']['conversations']['Row']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          receiver_id: string;
          message_text: string;
          attachment_url: string | null;
          attachment_type: string | null;
          attachment_name: string | null;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          is_read: boolean;
          read_at: string | null;
          is_system_message: boolean;
          system_message_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['messages']['Row']> & { conversation_id: string; sender_id: string; receiver_id: string; message_text: string };
        Update: Partial<Database['public']['Tables']['messages']['Row']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'system' | 'payment' | 'contract' | 'message' | 'application' | 'review' | 'verification' | 'security' | 'reminder';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          title: string;
          message: string;
          action_url: string | null;
          action_text: string | null;
          data: any;
          entity_type: string | null;
          entity_id: string | null;
          is_read: boolean;
          read_at: string | null;
          sent_email: boolean;
          sent_sms: boolean;
          sent_push: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & { user_id: string; type: string; title: string; message: string };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_notifications: boolean;
          email_payments: boolean;
          email_contracts: boolean;
          email_messages: boolean;
          email_applications: boolean;
          email_reviews: boolean;
          email_verifications: boolean;
          email_security: boolean;
          email_promotions: boolean;
          sms_notifications: boolean;
          sms_payments: boolean;
          sms_contracts: boolean;
          sms_verifications: boolean;
          sms_security: boolean;
          push_notifications: boolean;
          push_payments: boolean;
          push_contracts: boolean;
          push_messages: boolean;
          push_applications: boolean;
          push_reviews: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notification_preferences']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['notification_preferences']['Row']>;
        Relationships: [];
      };
      device_tokens: {
        Row: {
          id: string;
          user_id: string;
          fcm_token: string;
          platform: 'ios' | 'android' | 'web';
          device_name: string | null;
          last_used_at: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['device_tokens']['Row']> & { user_id: string; fcm_token: string; platform: string };
        Update: Partial<Database['public']['Tables']['device_tokens']['Row']>;
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          user_type: string | null;
          subject: string;
          message: string;
          status: string;
          submitted_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['contact_submissions']['Row']> & { name: string; email: string; subject: string; message: string };
        Update: Partial<Database['public']['Tables']['contact_submissions']['Row']>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string | null;
          reported_user_id: string | null;
          category: 'harassment' | 'fraud' | 'safety' | 'fake_profile' | 'payment_dispute' | 'other';
          description: string;
          related_entity_type: string | null;
          related_entity_id: string | null;
          status: 'open' | 'investigating' | 'resolved' | 'dismissed';
          admin_notes: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['reports']['Row']> & { category: string; description: string };
        Update: Partial<Database['public']['Tables']['reports']['Row']>;
        Relationships: [];
      };
      saved_jobs: {
        Row: {
          id: string;
          worker_id: string;
          job_posting_id: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['saved_jobs']['Row']> & { worker_id: string; job_posting_id: string };
        Update: Partial<Database['public']['Tables']['saved_jobs']['Row']>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          contract_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string;
          professionalism_rating: number | null;
          punctuality_rating: number | null;
          communication_rating: number | null;
          quality_rating: number | null;
          is_verified: boolean;
          is_flagged: boolean;
          flagged_reason: string | null;
          response: string | null;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['reviews']['Row']> & { contract_id: string; reviewer_id: string; reviewee_id: string; rating: number; comment: string };
        Update: Partial<Database['public']['Tables']['reviews']['Row']>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PAYMENT' | 'VERIFICATION';
          entity_type: string | null;
          entity_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          old_values: any;
          new_values: any;
          timestamp: string;
        };
        Insert: Partial<Database['public']['Tables']['audit_logs']['Row']> & { action: string };
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>;
        Relationships: [];
      };
      worker_documents: {
        Row: {
          id: string;
          worker_id: string;
          document_type: string;
          document_file_url: string;
          document_number: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          issuing_authority: string | null;
          status: 'pending' | 'verified' | 'rejected' | 'expired';
          ai_ocr_result: any;
          ai_confidence_score: number | null;
          ai_extracted_data: any;
          verified_by: string | null;
          verification_notes: string | null;
          verified_at: string | null;
          uploaded_by: string | null;
          uploaded_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['worker_documents']['Row']> & { worker_id: string; document_type: string; document_file_url: string };
        Update: Partial<Database['public']['Tables']['worker_documents']['Row']>;
        Relationships: [];
      };
    };
    Functions: {
      increment_job_views: { Args: { job_id: string }; Returns: void };
      calculate_match_score: { Args: { p_job_id: string; p_worker_id: string }; Returns: number };
      calculate_service_fee: { Args: { p_category_id: string; p_salary_amount: number }; Returns: number };
    };
    Views: {};
    Enums: {};
    CompositeTypes: {};
  };
}
