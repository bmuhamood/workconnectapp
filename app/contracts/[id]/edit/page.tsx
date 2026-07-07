'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useContracts, Contract } from '@/hooks/useContracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function EditContractPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { fetchContractById, updateContract, loading: saving } = useContracts();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    job_title: '', job_description: '', contract_type: 'full_time', payment_frequency: 'monthly',
    worker_salary_amount: '', service_fee_amount: '', work_location: '', work_hours_per_week: '40',
  });

  useEffect(() => {
    if (!authLoading && !user) router.push(`/login?redirect=/contracts/${id}/edit`);
  }, [authLoading, user, router, id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const c = await fetchContractById(id);
        setContract(c);
        setForm({
          job_title: c.job_title, job_description: c.job_description,
          contract_type: c.contract_type, payment_frequency: c.payment_frequency,
          worker_salary_amount: String(c.worker_salary_amount), service_fee_amount: String(c.service_fee_amount),
          work_location: c.work_location || '', work_hours_per_week: String(c.work_hours_per_week),
        });
      } catch {
        toast.error('Contract not found');
        router.push('/contracts');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const locked = contract && contract.status !== 'draft';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateContract(id, {
        job_title: form.job_title,
        job_description: form.job_description,
        contract_type: form.contract_type as any,
        payment_frequency: form.payment_frequency,
        worker_salary_amount: parseInt(form.worker_salary_amount),
        service_fee_amount: parseInt(form.service_fee_amount),
        work_location: form.work_location,
        work_hours_per_week: parseInt(form.work_hours_per_week) || 40,
      } as any);
      router.push(`/contracts/${id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update contract');
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }
  if (!contract) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-gray-600">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Contract</h1>

      {locked && (
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            This contract is <strong>{contract.status}</strong> — editing terms after signing can create a mismatch between what
            each party agreed to. Consider a contract amendment (upload a signed document) instead, or proceed only if both
            parties have agreed to the change out-of-band.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Contract Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Job Title</Label>
              <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
            </div>
            <div>
              <Label>Job Description</Label>
              <Textarea rows={3} value={form.job_description} onChange={(e) => setForm({ ...form, job_description: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Contract Type</Label>
                <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                    <SelectItem value="on_demand">On-demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Frequency</Label>
                <Select value={form.payment_frequency} onValueChange={(v) => setForm({ ...form, payment_frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Worker Salary (UGX)</Label>
                <Input type="number" value={form.worker_salary_amount} onChange={(e) => setForm({ ...form, worker_salary_amount: e.target.value })} />
              </div>
              <div>
                <Label>Service Fee (UGX)</Label>
                <Input type="number" value={form.service_fee_amount} onChange={(e) => setForm({ ...form, service_fee_amount: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Work Location</Label>
                <Input value={form.work_location} onChange={(e) => setForm({ ...form, work_location: e.target.value })} />
              </div>
              <div>
                <Label>Hours / week</Label>
                <Input type="number" value={form.work_hours_per_week} onChange={(e) => setForm({ ...form, work_hours_per_week: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/contracts/${id}`)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
