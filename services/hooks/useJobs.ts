// hooks/useJobs.ts — Supabase-backed replacement.
// Keeps the exact same exported interface as the old Django/axios version
// (JobPosting shape, CreateJobData, fetchJobs/fetchJobById/applyForJob/
// createJobPosting/updateJobPosting/deleteJobPosting/publishJobPosting/
// closeJobPosting/fetchEmployerJobs) so app/jobs/page.tsx, app/jobs/[id]/page.tsx
// and app/post-job/page.tsx don't need to change.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location: string;
  job_type: string;
  salary_range_min: number;
  salary_range_max: number;
  salary_currency: string;
  experience_level?: string;
  skills_required: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  employer: {
    id: string | number;
    company_name: string;
    company_description?: string;
  };
  application_count?: number;
  category_id?: string;
  work_schedule?: string;
  start_date?: string;
  status?: string;
  is_featured?: boolean;
  views_count?: number;
  published_at?: string;
  expires_at?: string;
}

interface JobFilters {
  search?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  min_salary?: number;
  max_salary?: number;
  skills?: string[];
  is_active?: boolean;
  status?: string;
}

export interface JobApplication {
  id: string | number;
  job_posting: string;
  worker: string | number;
  cover_letter?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  applied_at: string;
  reviewed_at?: string;
}

export interface CreateJobData {
  title: string;
  description: string;
  requirements?: string;
  salary_min: number;
  salary_max: number;
  location: string;
  work_schedule?: string;
  start_date?: string;
  category_id: string;
  is_featured?: boolean;
  job_type?: string;
  experience_level?: string;
  skills_required?: string[];
}

// Maps a `job_postings` row (joined with employer_profiles) to the shape
// the UI expects. job_type / experience_level / skills_required don't exist
// as columns yet — default sensibly. Add real columns via a follow-up
// migration if you need them as first-class filters.
function mapRow(row: any): JobPosting {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    requirements: row.requirements ?? undefined,
    location: row.location,
    job_type: row.job_type ?? 'Full-time',
    salary_range_min: row.salary_min,
    salary_range_max: row.salary_max,
    salary_currency: 'UGX',
    experience_level: row.experience_level ?? undefined,
    skills_required: row.skills_required ?? [],
    is_active: row.status === 'active',
    created_at: row.created_at,
    updated_at: row.updated_at,
    employer: {
      id: row.employer_profiles?.id ?? row.employer_id,
      company_name:
        row.employer_profiles?.company_name ||
        `${row.employer_profiles?.first_name ?? ''} ${row.employer_profiles?.last_name ?? ''}`.trim() ||
        'Employer',
    },
    application_count: row.applications_count,
    category_id: row.category_id ?? undefined,
    work_schedule: row.work_schedule ?? undefined,
    start_date: row.start_date ?? undefined,
    status: row.status,
    is_featured: row.is_featured,
    views_count: row.views_count,
    published_at: row.published_at ?? undefined,
    expires_at: row.expires_at ?? undefined,
  };
}

const SELECT_WITH_EMPLOYER = `*, employer_profiles ( id, company_name, first_name, last_name )`;

export const useJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = useCallback(async (filters: JobFilters = {}, page: number = 1, pageSize: number = 12) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('job_postings').select(SELECT_WITH_EMPLOYER, { count: 'exact' });

      // Public listing defaults to active postings only, unless the caller
      // explicitly asks for a specific status (e.g. an employer's drafts).
      if (filters.status) {
        query = query.eq('status', filters.status as any);
      } else if (filters.is_active !== false) {
        query = query.eq('status', 'active');
      }

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
        );
      }
      if (filters.location) query = query.ilike('location', `%${filters.location}%`);
      if (filters.min_salary) query = query.gte('salary_max', filters.min_salary);
      if (filters.max_salary) query = query.lte('salary_min', filters.max_salary);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error: queryError, count } = await query;
      if (queryError) throw queryError;

      const mapped = (data ?? []).map(mapRow);
      setJobs(mapped);
      setTotalJobs(count ?? mapped.length);
      setTotalPages(Math.max(1, Math.ceil((count ?? mapped.length) / pageSize)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobById = useCallback(async (jobId: string): Promise<JobPosting | null> => {
    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('job_postings')
        .select(SELECT_WITH_EMPLOYER)
        .eq('id', jobId)
        .single();

      if (queryError) throw queryError;

      // fire-and-forget view counter (RPC runs as security definer)
      supabase.rpc('increment_job_views', { job_id: jobId }).then(() => {});

      return mapRow(data);
    } catch (err) {
      console.error('Error fetching job:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const applyForJob = useCallback(
    async (jobId: string, coverLetter?: string): Promise<JobApplication | null> => {
      setLoading(true);
      try {
        if (!user) throw new Error('Authentication required to apply for jobs');

        const { data: workerProfile, error: workerErr } = await supabase
          .from('worker_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (workerErr || !workerProfile) throw new Error('Only workers can apply for jobs');

        const { data, error: insertErr } = await supabase
          .from('job_applications')
          .insert({ job_posting_id: jobId, worker_id: workerProfile.id, cover_letter: coverLetter || '' } as any)
          .select()
          .single();

        if (insertErr) throw insertErr;
        return data as unknown as JobApplication;
      } catch (err) {
        console.error('Error applying for job:', err);
        setError(err instanceof Error ? err.message : 'Failed to apply for job');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const createJobPosting = useCallback(
    async (jobData: CreateJobData): Promise<JobPosting | null> => {
      setLoading(true);
      try {
        if (!user) throw new Error('Authentication required to create job postings');

        let { data: employerProfile, error: empErr } = await supabase
          .from('employer_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        // Admins don't naturally have an employer_profiles row (job_postings.employer_id
        // is a required FK to that table) — auto-provision a lightweight one the first
        // time an admin posts a job, so official/example listings work out of the box.
        if (!employerProfile && (user.role === 'admin' || user.role === 'super_admin')) {
          const { data: created, error: createErr } = await supabase
            .from('employer_profiles')
            .insert({
              user_id: user.id,
              first_name: user.first_name || 'WorkConnect',
              last_name: user.last_name || 'Admin',
              company_name: 'WorkConnect',
              city: 'Kampala',
              id_verified: true,
            } as any)
            .select('id')
            .single();
          if (createErr) throw createErr;
          employerProfile = created;
        } else if (empErr) {
          throw empErr;
        }

        if (!employerProfile) throw new Error('Only employers can create job postings');

        const { data, error: insertErr } = await supabase
          .from('job_postings')
          .insert({
            employer_id: employerProfile.id,
            title: jobData.title,
            description: jobData.description,
            requirements: jobData.requirements || '',
            salary_min: jobData.salary_min,
            salary_max: jobData.salary_max,
            location: jobData.location,
            work_schedule: jobData.work_schedule || '',
            start_date: jobData.start_date || null,
            category_id: jobData.category_id,
            is_featured: jobData.is_featured || false,
            status: 'draft',
          } as any)
          .select(SELECT_WITH_EMPLOYER)
          .single();

        if (insertErr) throw insertErr;
        return mapRow(data);
      } catch (err) {
        console.error('Error creating job posting:', err);
        setError(err instanceof Error ? err.message : 'Failed to create job posting');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateJobPosting = useCallback(
    async (jobId: string, jobData: Partial<CreateJobData>): Promise<JobPosting | null> => {
      setLoading(true);
      try {
        const { data, error: updateErr } = await supabase
          .from('job_postings')
          .update(jobData as any)
          .eq('id', jobId)
          .select(SELECT_WITH_EMPLOYER)
          .single();
        if (updateErr) throw updateErr;
        return mapRow(data);
      } catch (err) {
        console.error('Error updating job posting:', err);
        setError(err instanceof Error ? err.message : 'Failed to update job posting');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteJobPosting = useCallback(async (jobId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error: deleteErr } = await supabase.from('job_postings').delete().eq('id', jobId);
      if (deleteErr) throw deleteErr;
      return true;
    } catch (err) {
      console.error('Error deleting job posting:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete job posting');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishJobPosting = useCallback(
    (jobId: string) => updateJobPosting(jobId, { status: 'active' } as any),
    [updateJobPosting]
  );

  const closeJobPosting = useCallback(
    (jobId: string) => updateJobPosting(jobId, { status: 'closed' } as any),
    [updateJobPosting]
  );

  const fetchEmployerJobs = useCallback(
    async (employerId?: string): Promise<JobPosting[]> => {
      setLoading(true);
      try {
        let targetEmployerId = employerId;
        if (!targetEmployerId) {
          if (!user) throw new Error('Authentication required to fetch employer jobs');
          const { data: employerProfile } = await supabase
            .from('employer_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
          targetEmployerId = employerProfile?.id;
        }
        if (!targetEmployerId) return [];

        const { data, error: queryError } = await supabase
          .from('job_postings')
          .select(SELECT_WITH_EMPLOYER)
          .eq('employer_id', targetEmployerId)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;
        return (data ?? []).map(mapRow);
      } catch (err) {
        console.error('Error fetching employer jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch employer jobs');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchJobs({ is_active: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    jobs,
    loading,
    error,
    totalJobs,
    totalPages,
    fetchJobs,
    fetchJobById,
    applyForJob,
    createJobPosting,
    updateJobPosting,
    deleteJobPosting,
    publishJobPosting,
    closeJobPosting,
    fetchEmployerJobs,
  };
};
