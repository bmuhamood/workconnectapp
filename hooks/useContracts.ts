// hooks/useContracts.ts — Supabase-backed replacement.
// Same public shape as the old Django/axios version so app/contracts/page.tsx
// and app/contracts/[id]/page.tsx don't need to change.
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export interface ContractWorker {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  profile_photo_url?: string;
  profession?: string;
  hourly_rate?: number;
  rating_average?: number;
}

export interface ContractEmployer {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  company_name?: string;
  profile_photo_url?: string;
}

export interface Contract {
  id: string;
  employer: string;
  worker: string;
  category: string;
  category_name?: string;

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

  created_by: string | null;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  completed_at: string | null;

  termination_reason: string | null;

  worker_details?: ContractWorker;
  employer_details?: ContractEmployer;

  // Computed client-side (mirrors the old Django model @properties)
  days_until_trial_end?: number | null;
  is_active_trial?: boolean;
  can_request_replacement?: boolean;
}

export interface ContractReplacement {
  id: string;
  original_contract: string;
  original_worker: string | null;
  replacement_worker: string | null;
  new_contract: string | null;
  reason: string;
  requested_by: string | null;
  status: 'requested' | 'processing' | 'completed' | 'cancelled';
  is_free_replacement: boolean;
  replacement_fee: number;
  requested_at: string;
  completed_at: string | null;
  replacement_cost: number;
}

export interface ContractDocument {
  id: string;
  contract: string;
  document_type: 'contract' | 'amendment' | 'termination' | 'other';
  document_url: string | null;
  document_name: string;
  uploaded_by: string | null;
  uploaded_at: string;
  description: string | null;
}

export interface ContractFilters {
  status?: string;
  contract_type?: string;
  is_trial?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const SELECT_WITH_PARTIES = `
  *,
  employer_profiles ( id, first_name, last_name, company_name, profile_photo_url ),
  worker_profiles ( id, first_name, last_name, profile_photo_url, profession, hourly_rate, rating_average ),
  job_categories ( id, name )
`;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function mapRow(row: any): Contract {
  const isActiveTrial =
    row.is_trial && row.status === 'trial' && row.trial_end_date && row.start_date <= today() && today() <= row.trial_end_date;
  const daysUntilTrialEnd = isActiveTrial
    ? Math.round((new Date(row.trial_end_date).getTime() - new Date(today()).getTime()) / 86400000)
    : null;

  return {
    id: row.id,
    employer: row.employer_id,
    worker: row.worker_id,
    category: row.category_id,
    category_name: row.job_categories?.name,
    contract_type: row.contract_type,
    status: row.status,
    job_title: row.job_title,
    job_description: row.job_description,
    worker_salary_amount: row.worker_salary_amount,
    service_fee_amount: row.service_fee_amount,
    total_monthly_cost: row.total_monthly_cost,
    payment_frequency: row.payment_frequency,
    start_date: row.start_date,
    trial_end_date: row.trial_end_date,
    end_date: row.end_date,
    work_location: row.work_location,
    work_hours_per_week: row.work_hours_per_week,
    work_schedule: row.work_schedule || {},
    is_trial: row.is_trial,
    trial_duration_days: row.trial_duration_days,
    trial_passed: row.trial_passed,
    trial_feedback: row.trial_feedback,
    contract_document_url: row.contract_document_url,
    signed_by_employer: row.signed_by_employer,
    signed_by_worker: row.signed_by_worker,
    employer_signature_date: row.employer_signature_date,
    worker_signature_date: row.worker_signature_date,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    activated_at: row.activated_at,
    completed_at: row.completed_at,
    termination_reason: row.termination_reason,
    employer_details: row.employer_profiles
      ? {
          id: row.employer_profiles.id,
          first_name: row.employer_profiles.first_name,
          last_name: row.employer_profiles.last_name,
          full_name: `${row.employer_profiles.first_name} ${row.employer_profiles.last_name}`.trim(),
          company_name: row.employer_profiles.company_name,
          profile_photo_url: row.employer_profiles.profile_photo_url,
        }
      : undefined,
    worker_details: row.worker_profiles
      ? {
          id: row.worker_profiles.id,
          first_name: row.worker_profiles.first_name,
          last_name: row.worker_profiles.last_name,
          full_name: `${row.worker_profiles.first_name} ${row.worker_profiles.last_name}`.trim(),
          profile_photo_url: row.worker_profiles.profile_photo_url,
          profession: row.worker_profiles.profession,
          hourly_rate: row.worker_profiles.hourly_rate,
          rating_average: row.worker_profiles.rating_average,
        }
      : undefined,
    is_active_trial: !!isActiveTrial,
    days_until_trial_end: daysUntilTrialEnd,
    can_request_replacement: !!isActiveTrial && (daysUntilTrialEnd ?? 0) > 0,
  };
}

function errMsg(err: any, fallback: string) {
  return err?.message || fallback;
}

export function useContracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [replacements, setReplacements] = useState<ContractReplacement[]>([]);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ count: 0, next: null as string | null, previous: null as string | null });

  // RLS already scopes rows to the two contracting parties (or admin), so no
  // need to filter by user id client-side — just apply the requested filters.
  const fetchContracts = useCallback(async (filters?: ContractFilters) => {
    setLoading(true);
    setError(null);
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.page_size || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from('contracts').select(SELECT_WITH_PARTIES, { count: 'exact' });
      if (filters?.status) query = query.eq('status', filters.status as any);
      if (filters?.contract_type) query = query.eq('contract_type', filters.contract_type as any);
      if (filters?.is_trial !== undefined) query = query.eq('is_trial', filters.is_trial);
      if (filters?.search) query = query.ilike('job_title', `%${filters.search}%`);

      const orderRaw = filters?.ordering || '-created_at';
      const orderCol = orderRaw.startsWith('-') ? orderRaw.slice(1) : orderRaw;
      const orderAsc = !orderRaw.startsWith('-');
      query = query.order(orderCol, { ascending: orderAsc }).range(from, to);

      const { data, error: qErr, count } = await query;
      if (qErr) throw qErr;

      const mapped = (data ?? []).map(mapRow);
      setContracts(mapped);
      setPagination({ count: count ?? mapped.length, next: null, previous: null });
      return { count: count ?? mapped.length, next: null, previous: null, results: mapped } as PaginatedResponse<Contract>;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch contracts');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContractById = useCallback(async (contractId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('contracts')
        .select(SELECT_WITH_PARTIES)
        .eq('id', contractId)
        .single();
      if (qErr) throw qErr;
      return mapRow(data);
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch contract');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createContract = useCallback(
    async (contractData: Partial<Contract> & { employer_id?: string; worker_id?: string; category_id?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: insertErr } = await supabase
          .from('contracts')
          .insert({
            employer_id: contractData.employer_id ?? contractData.employer,
            worker_id: contractData.worker_id ?? contractData.worker,
            category_id: contractData.category_id ?? contractData.category,
            contract_type: contractData.contract_type ?? 'full_time',
            job_title: contractData.job_title,
            job_description: contractData.job_description,
            worker_salary_amount: contractData.worker_salary_amount,
            service_fee_amount: contractData.service_fee_amount,
            payment_frequency: contractData.payment_frequency ?? 'monthly',
            start_date: contractData.start_date,
            work_location: contractData.work_location,
            work_hours_per_week: contractData.work_hours_per_week ?? 40,
            work_schedule: contractData.work_schedule ?? {},
            is_trial: contractData.is_trial ?? true,
            trial_duration_days: contractData.trial_duration_days ?? 14,
            created_by: user?.id,
          } as any)
          .select(SELECT_WITH_PARTIES)
          .single();

        if (insertErr) throw insertErr;
        const mapped = mapRow(data);
        setContracts((prev) => [mapped, ...prev]);
        toast.success('Contract created successfully');
        return mapped;
      } catch (err: any) {
        const msg = errMsg(err, 'Failed to create contract');
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateContract = useCallback(async (contractId: string, contractData: Partial<Contract>) => {
    setLoading(true);
    setError(null);
    try {
      const {
        id, employer, worker, category, employer_details, worker_details,
        category_name, is_active_trial, can_request_replacement, days_until_trial_end,
        ...rest
      } = contractData as any;
      const { data, error: updateErr } = await supabase
        .from('contracts')
        .update(rest)
        .eq('id', contractId)
        .select(SELECT_WITH_PARTIES)
        .single();
      if (updateErr) throw updateErr;
      const mapped = mapRow(data);
      setContracts((prev) => prev.map((c) => (c.id === contractId ? mapped : c)));
      toast.success('Contract updated successfully');
      return mapped;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to update contract');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteContract = useCallback(async (contractId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: delErr } = await supabase.from('contracts').delete().eq('id', contractId);
      if (delErr) throw delErr;
      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      toast.success('Contract deleted successfully');
      return true;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to delete contract');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Signs as employer or worker, whichever role the current user has on this contract. */
  const signContract = useCallback(
    async (contractId: string, signatureData?: string) => {
      setLoading(true);
      setError(null);
      try {
        if (!user) throw new Error('You must be logged in to sign a contract');

        const { data: contractRow, error: fetchErr } = await supabase
          .from('contracts')
          .select('id, employer_id, worker_id, employer_profiles(user_id), worker_profiles(user_id)')
          .eq('id', contractId)
          .single();
        if (fetchErr || !contractRow) throw fetchErr || new Error('Contract not found');

        const isEmployer = (contractRow as any).employer_profiles?.user_id === user.id;
        const isWorker = (contractRow as any).worker_profiles?.user_id === user.id;
        if (!isEmployer && !isWorker) throw new Error('You are not a party to this contract');

        const signature = signatureData || `signed-${Date.now()}-${contractId.slice(0, 8)}`;
        const patch: any = isEmployer
          ? { signed_by_employer: true, signature_data_employer: signature, employer_signature_date: new Date().toISOString() }
          : { signed_by_worker: true, signature_data_worker: signature, worker_signature_date: new Date().toISOString() };

        const { data, error: updateErr } = await supabase
          .from('contracts')
          .update(patch)
          .eq('id', contractId)
          .select(SELECT_WITH_PARTIES)
          .single();
        if (updateErr) throw updateErr;

        const mapped = mapRow(data);
        setContracts((prev) => prev.map((c) => (c.id === contractId ? mapped : c)));
        toast.success('Contract signed successfully');
        return mapped;
      } catch (err: any) {
        const msg = errMsg(err, 'Failed to sign contract');
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /** PDF generation needs a server-side renderer — not wired up yet. */
  const generateContractDocument = useCallback(async (_contractId: string) => {
    const msg = 'Contract PDF generation needs a Supabase Edge Function (not set up yet) — upload a document manually for now.';
    toast.error(msg);
    throw new Error(msg);
  }, []);

  const getContractDocument = useCallback(async (contractId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase.from('contracts').select('contract_document_url').eq('id', contractId).single();
      if (qErr) throw qErr;
      return data?.contract_document_url ?? null;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to get document');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const activateContract = useCallback(
    async (contractId: string) => updateContract(contractId, { status: 'active', activated_at: new Date().toISOString() } as any),
    [updateContract]
  );

  const submitTrialFeedback = useCallback(
    async (contractId: string, feedback: { feedback_text: string; performance_rating: number; will_continue: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: updateErr } = await supabase
          .from('contracts')
          .update({ trial_feedback: feedback.feedback_text, trial_passed: feedback.will_continue } as any)
          .eq('id', contractId)
          .select(SELECT_WITH_PARTIES)
          .single();
        if (updateErr) throw updateErr;
        const mapped = mapRow(data);
        setContracts((prev) => prev.map((c) => (c.id === contractId ? mapped : c)));
        toast.success('Feedback submitted successfully');
        return mapped;
      } catch (err: any) {
        const msg = errMsg(err, 'Failed to submit feedback');
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const completeTrial = useCallback(
    async (contractId: string, data: { feedback?: string; rating?: number; comment?: string }) =>
      updateContract(contractId, {
        status: 'active',
        trial_passed: true,
        trial_feedback: data.feedback ?? data.comment,
      } as any),
    [updateContract]
  );

  const requestReplacement = useCallback(
    async (contractId: string, reason: string) => {
      setLoading(true);
      setError(null);
      try {
        if (!user) throw new Error('You must be logged in');
        const { data: contractRow } = await supabase.from('contracts').select('worker_id').eq('id', contractId).single();

        const { data, error: insertErr } = await supabase
          .from('contract_replacements')
          .insert({
            original_contract_id: contractId,
            original_worker_id: contractRow?.worker_id,
            reason,
            requested_by: user.id,
          } as any)
          .select()
          .single();
        if (insertErr) throw insertErr;

        toast.success('Replacement request submitted');
        return { replacement_id: data.id, is_free: data.is_free_replacement, suggestions: [] as any[] };
      } catch (err: any) {
        const msg = errMsg(err, 'Failed to request replacement');
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const terminateContract = useCallback(
    async (contractId: string, reason?: string, _termination_date?: string) =>
      updateContract(contractId, {
        status: 'terminated',
        termination_reason: reason || 'Contract terminated by user',
        completed_at: new Date().toISOString(),
      } as any),
    [updateContract]
  );

  const getActiveContracts = useCallback(async () => fetchContracts({ status: 'active' }), [fetchContracts]);
  const getContractHistory = useCallback(async () => fetchContracts({ status: 'completed' }), [fetchContracts]);

  // ============= REPLACEMENTS =============

  const fetchReplacements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('contract_replacements')
        .select('*')
        .order('requested_at', { ascending: false });
      if (qErr) throw qErr;
      const mapped = (data ?? []).map((r: any) => ({ ...r, replacement_cost: r.is_free_replacement ? 0 : r.replacement_fee }));
      setReplacements(mapped);
      return { count: mapped.length, next: null, previous: null, results: mapped };
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch replacements');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveReplacement = useCallback(async (replacementId: string, replacementWorkerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: updateErr } = await supabase
        .from('contract_replacements')
        .update({ replacement_worker_id: replacementWorkerId, status: 'processing' } as any)
        .eq('id', replacementId)
        .select()
        .single();
      if (updateErr) throw updateErr;
      toast.success('Replacement approved');
      return { new_contract_id: data.new_contract_id, replacement_status: data.status };
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to approve replacement');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============= DOCUMENTS =============

  const fetchContractDocuments = useCallback(async (contractId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('contract_documents').select('*').order('uploaded_at', { ascending: false });
      if (contractId) query = query.eq('contract_id', contractId);
      const { data, error: qErr } = await query;
      if (qErr) throw qErr;
      const mapped = (data ?? []).map((d: any) => ({
        id: d.id,
        contract: d.contract_id,
        document_type: d.document_type,
        document_url: d.document_file_url,
        document_name: d.document_name,
        uploaded_by: d.uploaded_by,
        uploaded_at: d.uploaded_at,
        description: d.description,
      })) as ContractDocument[];
      setDocuments(mapped);
      return { count: mapped.length, next: null, previous: null, results: mapped };
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch documents');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadContractDocument = useCallback(
    async (contractId: string, file: File, documentType: string, description?: string) => {
      setLoading(true);
      setError(null);
      try {
        const path = `${contractId}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage.from('contract-documents').upload(path, file);
        if (uploadErr) throw uploadErr;

        const { data: signedUrlData } = await supabase.storage
          .from('contract-documents')
          .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

        const { data, error: insertErr } = await supabase
          .from('contract_documents')
          .insert({
            contract_id: contractId,
            document_type: documentType,
            document_file_url: signedUrlData?.signedUrl ?? path,
            document_name: file.name,
            description,
          } as any)
          .select()
          .single();
        if (insertErr) throw insertErr;

        const mapped: ContractDocument = {
          id: data.id,
          contract: contractId,
          document_type: data.document_type,
          document_url: data.document_file_url,
          document_name: data.document_name,
          uploaded_by: data.uploaded_by,
          uploaded_at: data.uploaded_at,
          description: data.description,
        };
        setDocuments((prev) => [mapped, ...prev]);
        toast.success('Document uploaded successfully');
        return mapped;
      } catch (err: any) {
        const msg = errMsg(err, 'Failed to upload document');
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteContractDocument = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: delErr } = await supabase.from('contract_documents').delete().eq('id', documentId);
      if (delErr) throw delErr;
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      toast.success('Document deleted');
      return true;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to delete document');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    contracts,
    replacements,
    documents,
    loading,
    error,
    pagination,

    fetchContracts,
    fetchContractById,
    createContract,
    updateContract,
    deleteContract,

    signContract,
    generateContractDocument,
    getContractDocument,
    activateContract,
    submitTrialFeedback,
    completeTrial,
    requestReplacement,
    terminateContract,
    getActiveContracts,
    getContractHistory,

    fetchReplacements,
    approveReplacement,

    fetchContractDocuments,
    uploadContractDocument,
    deleteContractDocument,
  };
}
