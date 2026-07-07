// hooks/useInvoices.ts — Supabase-backed replacement.
// Not currently imported by any page (the old version wasn't either — the
// invoices page called axios directly, now migrated to
// lib/supabase/invoicesService.ts) but kept with the same public shape in
// case dashboard/admin views want a single hook for the payments domain.
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { fetchEmployerInvoices, fetchInvoiceById as fetchInvoiceByIdSvc, payInvoice as payInvoiceSvc } from '@/lib/supabase/invoicesService';

export interface PayrollCycle {
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
  cycle_name: string;
}

export interface EmployerInvoice {
  id: string;
  invoice_number: string;
  payroll_cycle: string;
  contract: string;
  employer: string;
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
  is_overdue?: boolean;
  employer_name?: string;
  employer_company?: string;
  contract_title?: string;
  worker_name?: string;
  cycle_name?: string;
}

export interface WorkerPayment {
  id: string;
  payment_reference: string;
  payroll_cycle: string;
  contract: string;
  worker: string;
  invoice: string;
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
  worker_name?: string;
  contract_title?: string;
}

export interface WorkerPaymentMethod {
  id: string;
  worker: string;
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
}

export interface PaymentTransaction {
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
  provider_response: Record<string, any> | null;
  payer_user: string | null;
  payee_user: string | null;
  invoice: string | null;
  worker_payment: string | null;
  initiated_at: string;
  completed_at: string | null;
}

export interface InvoiceFilters {
  status?: string;
  payroll_cycle?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

function errMsg(err: any, fallback: string) {
  return err?.message || fallback;
}

function cycleName(month: number, year: number) {
  try {
    return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return `Month ${month}, ${year}`;
  }
}

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<EmployerInvoice[]>([]);
  const [payrollCycles, setPayrollCycles] = useState<PayrollCycle[]>([]);
  const [workerPayments, setWorkerPayments] = useState<WorkerPayment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<WorkerPaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ count: 0, next: null as string | null, previous: null as string | null });

  // ============= INVOICES =============

  const fetchInvoices = useCallback(async (filters?: InvoiceFilters) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchEmployerInvoices();
      const filtered = filters?.status ? rows.filter((r) => r.status === filters.status) : rows;
      const mapped: EmployerInvoice[] = filtered.map((r: any) => ({
        id: r.id,
        invoice_number: r.invoice_number,
        payroll_cycle: r.payroll_cycle ?? '',
        contract: r.contract?.id ?? '',
        employer: r.employer?.id ?? '',
        worker_salary_amount: r.worker_salary_amount,
        service_fee_amount: r.service_fee_amount,
        additional_fees: r.additional_fees,
        total_amount: r.total_amount,
        status: r.status,
        due_date: r.due_date,
        paid_date: r.paid_date,
        payment_method: r.payment_method,
        transaction_reference: r.transaction_reference,
        invoice_pdf_url: r.invoice_pdf_url,
        created_at: r.created_at,
        updated_at: r.updated_at,
        is_overdue: r.status === 'pending' && new Date(r.due_date) < new Date(),
        employer_name: r.employer?.full_name,
        employer_company: r.employer?.company_name,
        contract_title: r.contract?.job_title,
        worker_name: r.contract?.worker?.full_name,
      }));
      setInvoices(mapped);
      setPagination({ count: mapped.length, next: null, previous: null });
      return { count: mapped.length, next: null, previous: null, results: mapped };
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch invoices');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoiceById = useCallback(async (invoiceId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await fetchInvoiceByIdSvc(invoiceId);
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch invoice');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /** PDF export needs a server-side renderer — not wired up yet (same as contracts). */
  const downloadInvoice = useCallback(async (invoiceId: string, _format: 'pdf' | 'csv' = 'pdf') => {
    const { data } = await supabase.from('employer_invoices').select('invoice_pdf_url').eq('id', invoiceId).single();
    if (data?.invoice_pdf_url) return data.invoice_pdf_url;
    const msg = 'Invoice PDF export needs a Supabase Edge Function (not set up yet).';
    toast.error(msg);
    throw new Error(msg);
  }, []);

  const payInvoice = useCallback(async (invoiceId: string, paymentMethod?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await payInvoiceSvc(invoiceId, paymentMethod || 'mobile_money');
      toast.success('Payment initiated successfully');
      return result;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to process payment');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getInvoiceStats = useCallback(async () => {
    const rows = await fetchEmployerInvoices();
    return {
      total: rows.length,
      paid: rows.filter((r) => r.status === 'paid').length,
      pending: rows.filter((r) => r.status === 'pending').length,
      overdue: rows.filter((r) => r.status === 'overdue').length,
      total_amount: rows.reduce((s, r) => s + r.total_amount, 0),
      pending_amount: rows.filter((r) => r.status !== 'paid').reduce((s, r) => s + r.total_amount, 0),
    };
  }, []);

  // ============= PAYROLL CYCLES (admin only, per RLS) =============

  const fetchPayrollCycles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase.from('payroll_cycles').select('*').order('year', { ascending: false }).order('month', { ascending: false });
      if (qErr) throw qErr;
      const mapped = (data ?? []).map((c: any) => ({ ...c, cycle_name: cycleName(c.month, c.year) }));
      setPayrollCycles(mapped);
      return { count: mapped.length, next: null, previous: null, results: mapped };
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch payroll cycles');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentPayrollCycle = useCallback(async () => {
    const now = new Date();
    return getPayrollCycle(now.getMonth() + 1, now.getFullYear());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPayrollCycle = useCallback(async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase.from('payroll_cycles').select('*').eq('month', month).eq('year', year).maybeSingle();
      if (qErr) throw qErr;
      return data ? { ...data, cycle_name: cycleName(month, year) } : null;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch payroll cycle');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============= WORKER PAYMENTS =============

  const fetchWorkerPayments = useCallback(async (filters?: { status?: string; worker_id?: string }) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('worker_payments')
        .select('*, worker_profiles(id, first_name, last_name), contracts(job_title)')
        .order('created_at', { ascending: false });
      if (filters?.status) query = query.eq('status', filters.status as any);
      if (filters?.worker_id) query = query.eq('worker_id', filters.worker_id);

      const { data, error: qErr } = await query;
      if (qErr) throw qErr;
      const mapped = (data ?? []).map((p: any) => ({
        ...p,
        worker: p.worker_id,
        contract: p.contract_id,
        invoice: p.invoice_id,
        payroll_cycle: p.payroll_cycle_id,
        worker_name: p.worker_profiles ? `${p.worker_profiles.first_name} ${p.worker_profiles.last_name}`.trim() : undefined,
        contract_title: p.contracts?.job_title,
      })) as WorkerPayment[];
      setWorkerPayments(mapped);
      return { count: mapped.length, next: null, previous: null, results: mapped };
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch worker payments');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkerPaymentById = useCallback(async (paymentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase.from('worker_payments').select('*').eq('id', paymentId).single();
      if (qErr) throw qErr;
      return data;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch worker payment');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadPayslip = useCallback(async (paymentId: string) => {
    const { data } = await supabase.from('worker_payments').select('payslip_pdf_url').eq('id', paymentId).single();
    if (data?.payslip_pdf_url) return data.payslip_pdf_url;
    const msg = 'Payslip PDF export needs a Supabase Edge Function (not set up yet).';
    toast.error(msg);
    throw new Error(msg);
  }, []);

  // ============= PAYMENT METHODS =============

  const fetchPaymentMethods = useCallback(async (workerId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('worker_payment_methods').select('*').order('created_at', { ascending: false });
      if (workerId) query = query.eq('worker_id', workerId);
      const { data, error: qErr } = await query;
      if (qErr) throw qErr;
      const mapped = (data ?? []).map((m: any) => ({ ...m, worker: m.worker_id })) as WorkerPaymentMethod[];
      setPaymentMethods(mapped);
      return { count: mapped.length, next: null, previous: null, results: mapped };
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch payment methods');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addPaymentMethod = useCallback(
    async (methodData: Partial<WorkerPaymentMethod>) => {
      setLoading(true);
      setError(null);
      try {
        if (!user) throw new Error('You must be logged in');
        const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).single();
        if (!workerProfile) throw new Error('Only workers can add payment methods');

        const { data, error: insertErr } = await supabase
          .from('worker_payment_methods')
          .insert({ ...methodData, worker_id: workerProfile.id } as any)
          .select()
          .single();
        if (insertErr) throw insertErr;
        const mapped = { ...data, worker: data.worker_id } as WorkerPaymentMethod;
        setPaymentMethods((prev) => [mapped, ...prev]);
        toast.success('Payment method added successfully');
        return mapped;
      } catch (err: any) {
        const msg = errMsg(err, 'Failed to add payment method');
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updatePaymentMethod = useCallback(async (methodId: string, methodData: Partial<WorkerPaymentMethod>) => {
    setLoading(true);
    setError(null);
    try {
      const { worker, ...rest } = methodData as any;
      const { data, error: updateErr } = await supabase.from('worker_payment_methods').update(rest).eq('id', methodId).select().single();
      if (updateErr) throw updateErr;
      const mapped = { ...data, worker: data.worker_id } as WorkerPaymentMethod;
      setPaymentMethods((prev) => prev.map((m) => (m.id === methodId ? mapped : m)));
      toast.success('Payment method updated');
      return mapped;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to update payment method');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePaymentMethod = useCallback(async (methodId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: delErr } = await supabase.from('worker_payment_methods').delete().eq('id', methodId);
      if (delErr) throw delErr;
      setPaymentMethods((prev) => prev.filter((m) => m.id !== methodId));
      toast.success('Payment method removed');
      return true;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to delete payment method');
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(
    async (methodId: string) => {
      // The `worker_payment_method_single_default` trigger clears other
      // defaults for this worker automatically once this one is set true.
      const mapped = await updatePaymentMethod(methodId, { is_default: true });
      setPaymentMethods((prev) => prev.map((m) => ({ ...m, is_default: m.id === methodId })));
      toast.success('Default payment method updated');
      return mapped;
    },
    [updatePaymentMethod]
  );

  /** Marking a method verified is an admin action in this schema — RLS will reject it from a non-admin caller. */
  const verifyPaymentMethod = useCallback(
    async (methodId: string) => updatePaymentMethod(methodId, { is_verified: true, verified_at: new Date().toISOString() } as any),
    [updatePaymentMethod]
  );

  // ============= TRANSACTIONS =============

  const fetchTransactions = useCallback(async (filters?: { status?: string; transaction_type?: string; page?: number }) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('payment_transactions').select('*').order('initiated_at', { ascending: false });
      if (filters?.status) query = query.eq('status', filters.status as any);
      if (filters?.transaction_type) query = query.eq('transaction_type', filters.transaction_type as any);

      const { data, error: qErr } = await query;
      if (qErr) throw qErr;
      const mapped = (data ?? []).map((t: any) => ({
        ...t,
        payer_user: t.payer_user_id,
        payee_user: t.payee_user_id,
        invoice: t.invoice_id,
        worker_payment: t.worker_payment_id,
      })) as PaymentTransaction[];
      setTransactions(mapped);
      return { count: mapped.length, next: null, previous: null, results: mapped };
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch transactions');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactionById = useCallback(async (transactionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase.from('payment_transactions').select('*').eq('id', transactionId).single();
      if (qErr) throw qErr;
      return data;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch transaction');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============= SERVICE FEE CONFIG =============

  const fetchServiceFeeConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase.from('service_fee_config').select('*, job_categories(name)').eq('is_active', true);
      if (qErr) throw qErr;
      return data;
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to fetch fee configs');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Backed by the calculate_service_fee() Postgres function (supabase/migrations/00005). */
  const calculateServiceFee = useCallback(async (categoryId: string, salaryAmount: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('calculate_service_fee', {
        p_category_id: categoryId,
        p_salary_amount: salaryAmount,
      });
      if (rpcErr) throw rpcErr;
      return { service_fee_amount: data as number };
    } catch (err: any) {
      const msg = errMsg(err, 'Failed to calculate service fee');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    invoices,
    payrollCycles,
    workerPayments,
    paymentMethods,
    transactions,
    loading,
    error,
    pagination,

    fetchInvoices,
    fetchInvoiceById,
    downloadInvoice,
    payInvoice,
    getInvoiceStats,

    fetchPayrollCycles,
    getCurrentPayrollCycle,
    getPayrollCycle,

    fetchWorkerPayments,
    fetchWorkerPaymentById,
    downloadPayslip,

    fetchPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    verifyPaymentMethod,

    fetchTransactions,
    fetchTransactionById,

    fetchServiceFeeConfigs,
    calculateServiceFee,
  };
}
