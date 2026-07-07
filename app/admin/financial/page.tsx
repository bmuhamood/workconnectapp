'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DollarSign, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

const formatUGX = (n: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n || 0);

export default function AdminFinancialPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: invs }, { data: txs }] = await Promise.all([
        supabase
          .from('employer_invoices')
          .select('*, employer_profiles(company_name, first_name, last_name), contracts(job_title)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('payment_transactions').select('*').order('initiated_at', { ascending: false }).limit(50),
      ]);

      setInvoices(invs ?? []);
      setTransactions(txs ?? []);

      const paid = (invs ?? []).filter((i: any) => i.status === 'paid');
      const pending = (invs ?? []).filter((i: any) => i.status === 'pending');
      const overdue = (invs ?? []).filter((i: any) => i.status === 'overdue');
      setStats({
        totalRevenue: paid.reduce((s: number, i: any) => s + (i.service_fee_amount || 0), 0),
        pendingAmount: pending.reduce((s: number, i: any) => s + (i.total_amount || 0), 0),
        paidCount: paid.length,
        pendingCount: pending.length,
        overdueCount: overdue.length,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Financial Overview</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><DollarSign className="h-4 w-4" /> Platform Revenue</div>
          <div className="text-2xl font-bold text-gray-900">{formatUGX(stats.totalRevenue)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Clock className="h-4 w-4" /> Pending Amount</div>
          <div className="text-2xl font-bold text-gray-900">{formatUGX(stats.pendingAmount)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><TrendingUp className="h-4 w-4" /> Paid Invoices</div>
          <div className="text-2xl font-bold text-gray-900">{stats.paidCount}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><AlertTriangle className="h-4 w-4" /> Overdue</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList className="mb-4">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Employer</th><th className="px-4 py-3">Contract</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Due</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                    <td className="px-4 py-3">{inv.employer_profiles?.company_name || `${inv.employer_profiles?.first_name} ${inv.employer_profiles?.last_name}`}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.contracts?.job_title}</td>
                    <td className="px-4 py-3">{formatUGX(inv.total_amount)}</td>
                    <td className="px-4 py-3"><Badge className={inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>{inv.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.length === 0 && <p className="text-center py-10 text-gray-500">No invoices yet.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{tx.external_reference}</td>
                    <td className="px-4 py-3 capitalize">{tx.transaction_type.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{formatUGX(tx.amount)}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{tx.payment_provider}</td>
                    <td className="px-4 py-3"><Badge className={tx.status === 'successful' ? 'bg-green-100 text-green-800' : tx.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>{tx.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(tx.initiated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && <p className="text-center py-10 text-gray-500">No transactions yet.</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
