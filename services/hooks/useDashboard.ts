// hooks/useDashboard.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchDashboardData } from '@/services/dashboardService';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export const useDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user?.role) return;

    setLoading(true);
    setError(null);

    try {
      const dashboardData = await fetchDashboardData(user.role as any);
      setData(dashboardData);
    } catch (err: any) {
      console.error('Dashboard data error:', err);
      setError(err.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role) {
      loadDashboardData();
    }
  }, [loadDashboardData, user?.role]);

  const refreshData = async () => {
    await loadDashboardData();
    toast.success('Dashboard refreshed');
  };

  // ==================== DOCUMENTS ====================

  const uploadDocument = async (formData: FormData) => {
    try {
      if (!user) throw new Error('Not authenticated');
      const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).single();
      if (!workerProfile) throw new Error('Only workers can upload verification documents');

      const file = formData.get('document_file') as File;
      const documentType = formData.get('document_type') as string;
      const documentNumber = (formData.get('document_number') as string) || undefined;
      const issueDate = (formData.get('issue_date') as string) || undefined;
      const expiryDate = (formData.get('expiry_date') as string) || undefined;
      if (!file || !documentType) throw new Error('A file and document type are required');

      const path = `${user.id}/${documentType}-${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('worker-documents').upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: signedUrl } = await supabase.storage.from('worker-documents').createSignedUrl(path, 60 * 60 * 24 * 365);

      const { data: row, error: insertErr } = await supabase
        .from('worker_documents')
        .insert({
          worker_id: workerProfile.id,
          document_type: documentType as any,
          document_file_url: signedUrl?.signedUrl ?? path,
          document_number: documentNumber,
          issue_date: issueDate,
          expiry_date: expiryDate,
          uploaded_by: user.id,
        } as any)
        .select()
        .single();
      if (insertErr) throw insertErr;

      toast.success('Document uploaded successfully!');
      await refreshData();
      return row;
    } catch (error: any) {
      console.error('Document upload error:', error);
      toast.error(error.message || 'Failed to upload document');
      throw error;
    }
  };

  const fetchDocuments = async () => {
    try {
      if (!user) throw new Error('Not authenticated');
      const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).single();
      if (!workerProfile) return [];
      const { data: docs, error } = await supabase
        .from('worker_documents')
        .select('*')
        .eq('worker_id', workerProfile.id)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return docs ?? [];
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase.from('worker_documents').delete().eq('id', documentId);
      if (error) throw error;
      toast.success('Document deleted successfully');
      await refreshData();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(error.message || 'Failed to delete document');
      throw error;
    }
  };

  // ==================== NOTIFICATIONS ====================

  const markNotificationAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() } as any).eq('id', id);
      await refreshData();
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      if (!user) return [];
      const { data: rows, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return rows ?? [];
    } catch (error: any) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  };

  const clearAllNotifications = async () => {
    try {
      if (!user) return;
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
      if (error) throw error;
      await refreshData();
      toast.success('All notifications cleared');
    } catch (error: any) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
      throw error;
    }
  };

  // ==================== CONTRACTS ====================
  // Prefer hooks/useContracts.ts for anything beyond these simple wrappers.

  const fetchContracts = async () => {
    try {
      const { data: rows, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return rows ?? [];
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  };

  const fetchContractById = async (id: string) => {
    try {
      const { data: row, error } = await supabase.from('contracts').select('*').eq('id', id).single();
      if (error) throw error;
      return row;
    } catch (error: any) {
      console.error('Error fetching contract:', error);
      throw error;
    }
  };

  // ==================== JOB POSTINGS ====================
  // Prefer hooks/useJobs.ts for anything beyond these simple wrappers.

  const fetchMyJobPostings = async () => {
    try {
      if (!user) return [];
      const { data: employerProfile } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).single();
      if (!employerProfile) return [];
      const { data: rows, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('employer_id', employerProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return rows ?? [];
    } catch (error: any) {
      console.error('Error fetching job postings:', error);
      throw error;
    }
  };

  const publishJobPosting = async (id: string) => {
    try {
      const { data: row, error } = await supabase.from('job_postings').update({ status: 'active' } as any).eq('id', id).select().single();
      if (error) throw error;
      toast.success('Job posting published');
      await refreshData();
      return row;
    } catch (error: any) {
      toast.error('Failed to publish job posting');
      throw error;
    }
  };

  const closeJobPosting = async (id: string) => {
    try {
      const { data: row, error } = await supabase.from('job_postings').update({ status: 'closed' } as any).eq('id', id).select().single();
      if (error) throw error;
      toast.success('Job posting closed');
      await refreshData();
      return row;
    } catch (error: any) {
      toast.error('Failed to close job posting');
      throw error;
    }
  };

  // ==================== PROFILES ====================

  const fetchWorkerProfile = async (workerId?: string) => {
    try {
      const query = supabase.from('worker_profiles').select('*');
      const { data: row, error } = workerId
        ? await query.eq('id', workerId).single()
        : await query.eq('user_id', user?.id ?? '').single();
      if (error) throw error;
      return row;
    } catch (error: any) {
      console.error('Error fetching worker profile:', error);
      throw error;
    }
  };

  const fetchEmployerProfile = async (employerId?: string) => {
    try {
      const query = supabase.from('employer_profiles').select('*');
      const { data: row, error } = employerId
        ? await query.eq('id', employerId).single()
        : await query.eq('user_id', user?.id ?? '').single();
      if (error) throw error;
      return row;
    } catch (error: any) {
      console.error('Error fetching employer profile:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      if (!user) throw new Error('Not authenticated');
      const { data: row, error } = await supabase.from('profiles').update(profileData).eq('id', user.id).select().single();
      if (error) throw error;
      toast.success('Profile updated successfully');
      await refreshData();
      return row;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  // ==================== ANALYTICS ====================
  // Full metrics live in components/dashboard/SuperAdminDashboard.tsx (admin-only, next phase).

  const fetchMetricsSummary = async () => null;
  const fetchRecentActivity = async () => [];

  // ==================== MESSAGES ====================

  const fetchUnreadMessages = async () => {
    try {
      if (!user) return [];
      const { data: rows, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return rows ?? [];
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  return {
    data,
    loading,
    error,
    user,

    refreshData,

    uploadDocument,
    fetchDocuments,
    deleteDocument,

    markNotificationAsRead,
    fetchUnreadNotifications,
    clearAllNotifications,

    fetchContracts,
    fetchContractById,

    fetchMyJobPostings,
    publishJobPosting,
    closeJobPosting,

    fetchWorkerProfile,
    fetchEmployerProfile,
    updateProfile,

    fetchMetricsSummary,
    fetchRecentActivity,

    fetchUnreadMessages,
  };
};
