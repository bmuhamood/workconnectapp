'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useInvoices, WorkerPayment, WorkerPaymentMethod } from '@/hooks/useInvoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Smartphone, Building2, Trash2, Star, Download, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const formatUGX = (n: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n || 0);

export default function PaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    workerPayments, paymentMethods,
    fetchWorkerPayments, fetchPaymentMethods,
    addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod,
    loading,
  } = useInvoices();

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodForm, setMethodForm] = useState({ method_type: 'mobile_money_mtn', account_number: '', account_name: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/payments');
      return;
    }
    if (user.role === 'employer') {
      router.push('/invoices');
      return;
    }
    fetchWorkerPayments();
    fetchPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodForm.account_number.trim()) {
      toast.error('Enter an account/phone number');
      return;
    }
    try {
      await addPaymentMethod(methodForm as any);
      setShowAddMethod(false);
      setMethodForm({ method_type: 'mobile_money_mtn', account_number: '', account_name: '' });
    } catch {
      // addPaymentMethod already toasts on failure
    }
  };

  const totalReceived = workerPayments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.net_amount, 0);
  const totalPending = workerPayments.filter((p) => p.status === 'pending' || p.status === 'processing').reduce((s, p) => s + p.net_amount, 0);

  if (authLoading || (user?.role === 'worker' && loading && workerPayments.length === 0)) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }
  if (!user || user.role !== 'worker') return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card><CardContent className="p-5">
          <div className="text-sm text-gray-500 mb-1">Total Received</div>
          <div className="text-2xl font-bold text-green-700">{formatUGX(totalReceived)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-600">{formatUGX(totalPending)}</div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList className="mb-4">
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="methods">Payout Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          {workerPayments.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-gray-500">No payments yet — they'll show up here once an employer pays an invoice for your contract.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {workerPayments.map((p: WorkerPayment) => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-900">{p.contract_title || 'Contract payment'}</div>
                      <div className="text-sm text-gray-500">
                        {p.payment_method.replace('_', ' ')} · Scheduled {new Date(p.scheduled_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-gray-900">{formatUGX(p.net_amount)}</div>
                      <Badge className={p.status === 'completed' ? 'bg-green-100 text-green-800' : p.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                        {p.status}
                      </Badge>
                    </div>
                    {p.status === 'completed' && (
                      <Link href={`/payments/${p.id}/payslip`}>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="methods">
          <div className="space-y-3 mb-4">
            {paymentMethods.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-gray-500">No payout methods added yet.</CardContent></Card>
            ) : (
              paymentMethods.map((m: WorkerPaymentMethod) => (
                <Card key={m.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {m.method_type === 'bank_transfer' ? <Building2 className="h-5 w-5 text-gray-400" /> : <Smartphone className="h-5 w-5 text-gray-400" />}
                      <div>
                        <div className="font-medium text-gray-900 capitalize">{m.method_type.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-gray-500">{m.account_number} {m.account_name ? `· ${m.account_name}` : ''}</div>
                      </div>
                      {m.is_default && <Badge variant="outline" className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> Default</Badge>}
                      {m.is_verified && <Badge className="bg-green-100 text-green-800">Verified</Badge>}
                    </div>
                    <div className="flex gap-2">
                      {!m.is_default && (
                        <Button variant="outline" size="sm" onClick={() => setDefaultPaymentMethod(m.id)}>Set Default</Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deletePaymentMethod(m.id)}>
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {!showAddMethod ? (
            <Button variant="outline" onClick={() => setShowAddMethod(true)}>+ Add Payout Method</Button>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Add Payout Method</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddMethod} className="space-y-4">
                  <div>
                    <Label>Method</Label>
                    <Select value={methodForm.method_type} onValueChange={(v) => setMethodForm({ ...methodForm, method_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile_money_mtn">MTN Mobile Money</SelectItem>
                        <SelectItem value="mobile_money_airtel">Airtel Money</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash_pickup">Cash Pickup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phone / Account Number</Label>
                    <Input value={methodForm.account_number} onChange={(e) => setMethodForm({ ...methodForm, account_number: e.target.value })} placeholder="256700000000" />
                  </div>
                  <div>
                    <Label>Account Name</Label>
                    <Input value={methodForm.account_name} onChange={(e) => setMethodForm({ ...methodForm, account_name: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Save</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddMethod(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
