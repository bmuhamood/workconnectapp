// hooks/useSavedJobs.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

export function useSavedJobs() {
  const { user } = useAuth();
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedJobIds = useCallback(async () => {
    if (!user) {
      setSavedJobIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!workerProfile) {
        setSavedJobIds([]);
        return;
      }
      const { data } = await supabase.from('saved_jobs').select('job_posting_id').eq('worker_id', workerProfile.id);
      setSavedJobIds((data ?? []).map((r) => r.job_posting_id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const toggleSaveJob = useCallback(
    async (jobPostingId: string) => {
      if (!user) throw new Error('You must be logged in to save jobs');
      const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).single();
      if (!workerProfile) throw new Error('Only workers can save jobs');

      const isSaved = savedJobIds.includes(jobPostingId);
      if (isSaved) {
        await supabase.from('saved_jobs').delete().eq('worker_id', workerProfile.id).eq('job_posting_id', jobPostingId);
        setSavedJobIds((prev) => prev.filter((id) => id !== jobPostingId));
        return false;
      } else {
        await supabase.from('saved_jobs').insert({ worker_id: workerProfile.id, job_posting_id: jobPostingId } as any);
        setSavedJobIds((prev) => [...prev, jobPostingId]);
        return true;
      }
    },
    [user, savedJobIds]
  );

  /** Full job details for the "My Saved Jobs" page. */
  const fetchSavedJobs = useCallback(async () => {
    if (!user) return [];
    const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (!workerProfile) return [];

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id, created_at, job_postings ( *, employer_profiles ( id, company_name, first_name, last_name ) )')
      .eq('worker_id', workerProfile.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }, [user]);

  useEffect(() => {
    fetchSavedJobIds();
  }, [fetchSavedJobIds]);

  return { savedJobIds, loading, toggleSaveJob, fetchSavedJobs, refetch: fetchSavedJobIds };
}
