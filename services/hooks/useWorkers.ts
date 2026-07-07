// hooks/useWorkers.ts — Supabase-backed replacement.
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

export interface WorkerProfile {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  age?: string;
  gender?: string;
  national_id?: string;
  profile_photo_url?: string;
  bio?: string;
  city: string;
  district?: string;
  location_lat?: string;
  location_lng?: string;
  experience_years: number;
  education_level?: string;
  languages?: string[];
  profession?: string;
  additional_skills?: string;
  hourly_rate: number;
  availability: 'available' | 'unavailable' | 'on_assignment' | 'full_time' | 'part_time' | 'flexible';
  expected_salary_min?: number;
  expected_salary_max?: number;
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
  trust_score: number;
  rating_average: number;
  total_reviews: number;
  total_placements: number;
  completion_percentage: number;
  subscription_tier: 'basic' | 'premium' | 'pro';
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
}

function mapWorker(row: any): WorkerProfile {
  return {
    ...row,
    full_name: `${row.first_name} ${row.last_name}`.trim(),
    email: row.profiles?.email,
    phone: row.profiles?.phone,
  };
}

export function useWorkers() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkerProfile = useCallback(async (workerId: string) => {
    if (!workerId) throw new Error('Worker ID is required');
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('worker_profiles')
        .select('*, profiles ( email, phone )')
        .eq('id', workerId)
        .single();
      if (qErr) throw qErr;
      return mapWorker(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch worker profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyWorkerProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error('Not authenticated');
      const { data, error: qErr } = await supabase
        .from('worker_profiles')
        .select('*, profiles ( email, phone )')
        .eq('user_id', user.id)
        .single();
      if (qErr) throw qErr;
      return mapWorker(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchWorkerSkills = useCallback(async (workerId: string) => {
    try {
      const { data, error: qErr } = await supabase
        .from('worker_skills')
        .select('*, job_categories ( name )')
        .eq('worker_id', workerId);
      if (qErr) throw qErr;
      return data ?? [];
    } catch (err) {
      console.error('Error fetching worker skills:', err);
      return [];
    }
  }, []);

  const fetchWorkerVerifications = useCallback(async (workerId: string) => {
    try {
      const { data, error: qErr } = await supabase.from('verifications').select('*').eq('worker_id', workerId);
      if (qErr) throw qErr;
      return data ?? [];
    } catch (err) {
      console.error('Error fetching worker verifications:', err);
      return [];
    }
  }, []);

  const fetchWorkerReviews = useCallback(async (workerId: string) => {
    try {
      // reviewee_id on `reviews` is a profiles.id (auth user id), not a
      // worker_profiles.id — resolve it first.
      const { data: workerRow } = await supabase.from('worker_profiles').select('user_id').eq('id', workerId).single();
      if (!workerRow) return [];
      const { data, error: qErr } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey ( first_name, last_name )')
        .eq('reviewee_id', workerRow.user_id)
        .eq('is_verified', true)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      return data ?? [];
    } catch (err) {
      console.error('Error fetching worker reviews:', err);
      return [];
    }
  }, []);

  const searchWorkers = useCallback(
    async (filters?: {
      profession?: string;
      city?: string;
      availability?: string;
      verification_status?: string;
      min_rating?: number;
      min_experience?: number;
      search?: string;
      page?: number;
      page_size?: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const page = filters?.page || 1;
        const pageSize = filters?.page_size || 20;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('worker_profiles')
          .select('*, profiles ( email, phone )', { count: 'exact' });

        if (filters?.verification_status) query = query.eq('verification_status', filters.verification_status as any);

        if (filters?.profession) query = query.ilike('profession', `%${filters.profession}%`);
        if (filters?.city) query = query.ilike('city', `%${filters.city}%`);
        if (filters?.availability) query = query.eq('availability', filters.availability as any);
        if (filters?.min_rating) query = query.gte('rating_average', filters.min_rating);
        if (filters?.min_experience) query = query.gte('experience_years', filters.min_experience);
        if (filters?.search) query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,profession.ilike.%${filters.search}%`);

        query = query.order('rating_average', { ascending: false }).range(from, to);

        const { data, error: qErr, count } = await query;
        if (qErr) throw qErr;

        const results = (data ?? []).map(mapWorker);
        return { count: count ?? results.length, next: null, previous: null, results };
      } catch (err: any) {
        setError(err.message || 'Failed to search workers');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    fetchWorkerProfile,
    fetchMyWorkerProfile,
    fetchWorkerSkills,
    fetchWorkerVerifications,
    fetchWorkerReviews,
    searchWorkers,
  };
}
