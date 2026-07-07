// lib/supabase/invoicesService.ts
import { supabase } from './client';

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  total_amount: number;
  worker_salary_amount: number;
  service_fee_amount: number;
  additional_fees: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
  transaction_reference: string | null;
  invoice_pdf_url: string | null;
  created_at: string;
  updated_at: string;
  employer?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    company_name?: string;
  };
  contract?: {
    id: string;
    job_title: string;
    worker?: { id: string; full_name: string };
  };
  payroll_cycle?: string;
}

const SELECT = `
  *,
  employer_profiles ( id, first_name, last_name, company_name ),
  contracts ( id, job_title, worker_profiles ( id, first_name, last_name ) )
`;

function mapInvoice(row: any): InvoiceRow {
  return {
    id: row.id,
    invoice_number: row.invoice_number,
    total_amount: row.total_amount,
    worker_salary_amount: row.worker_salary_amount,
    service_fee_amount: row.service_fee_amount,
    additional_fees: row.additional_fees,
    status: row.status,
    due_date: row.due_date,
    paid_date: row.paid_date,
    payment_method: row.payment_method,
    transaction_reference: row.transaction_reference,
    invoice_pdf_url: row.invoice_pdf_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    employer: row.employer_profiles
      ? {
          id: row.employer_profiles.id,
          first_name: row.employer_profiles.first_name,
          last_name: row.employer_profiles.last_name,
          full_name: `${row.employer_profiles.first_name} ${row.employer_profiles.last_name}`.trim(),
          company_name: row.employer_profiles.company_name,
        }
      : undefined,
    contract: row.contracts
      ? {
          id: row.contracts.id,
          job_title: row.contracts.job_title,
          worker: row.contracts.worker_profiles
            ? {
                id: row.contracts.worker_profiles.id,
                full_name: `${row.contracts.worker_profiles.first_name} ${row.contracts.worker_profiles.last_name}`.trim(),
              }
            : undefined,
        }
      : undefined,
    payroll_cycle: row.payroll_cycle_id,
  };
}

/** RLS already scopes this to the caller's own invoices (or admin sees all). */
export async function fetchEmployerInvoices(): Promise<InvoiceRow[]> {
  const { data, error } = await supabase.from('employer_invoices').select(SELECT).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapInvoice);
}

export async function fetchInvoiceById(invoiceId: string): Promise<InvoiceRow> {
  const { data, error } = await supabase.from('employer_invoices').select(SELECT).eq('id', invoiceId).single();
  if (error) throw error;
  return mapInvoice(data);
}

/**
 * Kicks off a real payment via the `initiate-payment` Edge Function
 * (Flutterwave). Returns a payment_url to redirect the employer to.
 * Requires `supabase secrets set FLUTTERWAVE_SECRET_KEY=...` to be run —
 * see supabase/functions/initiate-payment/index.ts.
 */
export async function payInvoice(invoiceId: string, paymentMethod: string = 'mobile_money') {
  const { data, error } = await supabase.functions.invoke('initiate-payment', {
    body: { invoice_id: invoiceId, payment_method: paymentMethod },
  });
  if (error) throw error;
  return data as { transaction_id: string; status: string; payment_url: string };
}

/** Polls the transaction status straight from the DB (webhook keeps it current). */
export async function checkPaymentStatus(invoiceId: string) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('initiated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
