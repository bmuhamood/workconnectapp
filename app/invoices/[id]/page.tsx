'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchInvoiceById, payInvoice, checkPaymentStatus, InvoiceRow } from '@/lib/supabase/invoicesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, CreditCard, Calendar, Building, Briefcase, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [txStatus, setTxStatus] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/login?redirect=/invoices/${id}`);
  }, [authLoading, user, router, id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const inv = await fetchInvoiceById(id);
        setInvoice(inv);
        const tx = await checkPaymentStatus(id);
        setTxStatus(tx);
      } catch {
        toast.error('Invoice not found');
        router.push('/invoices');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const result = await payInvoice(id, 'mobile_money');
      if (result.payment_url) {
        toast.success('Redirecting to payment...');
        window.location.href = result.payment_url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate payment');
    } finally {
      setPaying(false);
    }
  };

  const formatUGX = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }
  if (!invoice) return null;

  const statusColor = invoice.status === 'paid' ? 'bg-green-100 text-green-800' : invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print / Save as PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Invoice {invoice.invoice_number}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Due {new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
            <Badge className={statusColor}>{invoice.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Building className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-gray-500">Employer</div>
                <div className="font-medium">{invoice.employer?.company_name || invoice.employer?.full_name}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-gray-500">Contract</div>
                <div className="font-medium">{invoice.contract?.job_title}</div>
                {invoice.contract?.worker && <div className="text-gray-500">{invoice.contract.worker.full_name}</div>}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Worker salary</span><span>{formatUGX(invoice.worker_salary_amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Service fee</span><span>{formatUGX(invoice.service_fee_amount)}</span></div>
            {invoice.additional_fees > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Additional fees</span><span>{formatUGX(invoice.additional_fees)}</span></div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatUGX(invoice.total_amount)}</span></div>
          </div>

          {invoice.status === 'paid' && invoice.paid_date && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              <Calendar className="h-4 w-4" /> Paid on {new Date(invoice.paid_date).toLocaleDateString()}
              {invoice.transaction_reference && <span className="text-gray-500">· ref {invoice.transaction_reference}</span>}
            </div>
          )}

          {txStatus && invoice.status !== 'paid' && (
            <div className="text-sm text-gray-500">
              Last payment attempt: <span className="font-medium">{txStatus.status}</span>
            </div>
          )}

          {invoice.status !== 'paid' && user?.role === 'employer' && (
            <Button onClick={handlePay} disabled={paying} className="w-full" size="lg">
              {paying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Pay Now via Mobile Money
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
