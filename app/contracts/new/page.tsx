'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useContracts } from '@/hooks/useContracts';
import { useWorkers, WorkerProfile } from '@/hooks/useWorkers';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Star, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

export default function NewContractPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedWorkerId = searchParams.get('worker_id');

  const { createContract, loading: creating } = useContracts();
  const { searchWorkers } = useWorkers();


  const [categories, setCategories] = useState<Category[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [workerSearch, setWorkerSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  const [form, setForm] = useState({
    category_id: '',
    job_title: '',
    job_description: '',
    contract_type: 'full_time',
    worker_salary_amount: '',
    service_fee_amount: '',
    payment_frequency: 'monthly',
    start_date: '',
    work_location: '',
    work_hours_per_week: '40',
    is_trial: true,
    trial_duration_days: '14',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/contracts/new');
    } else if (!authLoading && user && user.role !== 'employer' && user.role !== 'admin' && user.role !== 'super_admin') {
      toast.error('Only employers can create contracts');
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    supabase.from('job_categories').select('id, name').eq('is_active', true).order('name').then(({ data }) => {
      setCategories(data ?? []);
    });
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingWorkers(true);
      try {
        const result = await searchWorkers({ verification_status: 'verified', search: workerSearch || undefined, page_size: 12 });
        setWorkers(result.results);
        if (preselectedWorkerId) {
          const match = result.results.find((w) => w.id === preselectedWorkerId);
          if (match) setSelectedWorker(match);
        }
      } finally {
        setLoadingWorkers(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) {
      toast.error('Select a worker first');
      return;
    }
    if (!form.category_id || !form.job_title || !form.job_description || !form.worker_salary_amount || !form.start_date) {
      toast.error('Fill in all required fields');
      return;
    }
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      let { data: employerProfile } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!employerProfile && (user.role === 'admin' || user.role === 'super_admin')) {
        const { data: created, error: createErr } = await supabase
          .from('employer_profiles')
          .insert({ user_id: user.id, first_name: user.first_name || 'WorkConnect', last_name: user.last_name || 'Admin', company_name: 'WorkConnect', city: 'Kampala', id_verified: true } as any)
          .select('id')
          .single();
        if (createErr) throw createErr;
        employerProfile = created;
      }
      if (!employerProfile) {
        toast.error('Only employers can create contracts — no employer profile found for your account.');
        return;
      }

      const contract = await createContract({
        employer_id: employerProfile.id,
        worker_id: selectedWorker.id,
        category_id: form.category_id,
        contract_type: form.contract_type as any,
        job_title: form.job_title,
        job_description: form.job_description,
        worker_salary_amount: parseInt(form.worker_salary_amount),
        service_fee_amount: parseInt(form.service_fee_amount || '0'),
        payment_frequency: form.payment_frequency,
        start_date: form.start_date,
        work_location: form.work_location,
        work_hours_per_week: parseInt(form.work_hours_per_week) || 40,
        is_trial: form.is_trial,
        trial_duration_days: parseInt(form.trial_duration_days) || 14,
      } as any);

      if (contract) {
        toast.success('Contract created! Both parties need to sign before it activates.');
        router.push(`/contracts/${contract.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create contract');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-gray-600">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a Contract</h1>
      <p className="text-gray-600 mb-8">
        Draft a contract with a worker. They'll need to sign it before it becomes active — see{' '}
        <a href="#worker" className="text-blue-600 underline">choose a worker</a> below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card id="worker">
          <CardHeader>
            <CardTitle>1. Choose a worker</CardTitle>
            <CardDescription>Search verified workers, or come here from a worker's profile / job application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name or profession..." value={workerSearch} onChange={(e) => setWorkerSearch(e.target.value)} className="pl-9" />
            </div>

            {loadingWorkers ? (
              <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></div>
            ) : workers.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No verified workers match your search.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {workers.map((w) => (
                  <button
                    type="button"
                    key={w.id}
                    onClick={() => setSelectedWorker(w)}
                    className={`text-left p-3 rounded-lg border transition ${
                      selectedWorker?.id === w.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{w.full_name}</div>
                    <div className="text-sm text-gray-500">{w.profession}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {w.rating_average?.toFixed(1) ?? 'New'} · {w.city}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedWorker && (
              <div className="text-sm bg-green-50 border border-green-200 rounded-lg p-3 text-green-800">
                Selected: <strong>{selectedWorker.full_name}</strong> ({selectedWorker.profession})
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Contract details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Category *</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Job Title *</Label>
              <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="e.g. Full-time Nanny" />
            </div>
            <div>
              <Label>Job Description *</Label>
              <Textarea value={form.job_description} onChange={(e) => setForm({ ...form, job_description: e.target.value })} rows={3} />
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
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Worker Salary (UGX/month) *</Label>
                <Input type="number" value={form.worker_salary_amount} onChange={(e) => setForm({ ...form, worker_salary_amount: e.target.value })} placeholder="500000" />
              </div>
              <div>
                <Label>Service Fee (UGX) — negotiable, enter manually *</Label>
                <Input type="number" value={form.service_fee_amount} onChange={(e) => setForm({ ...form, service_fee_amount: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Work Location</Label>
                <Input value={form.work_location} onChange={(e) => setForm({ ...form, work_location: e.target.value })} placeholder="e.g. Nakawa, Kampala" />
              </div>
              <div>
                <Label>Hours / week</Label>
                <Input type="number" value={form.work_hours_per_week} onChange={(e) => setForm({ ...form, work_hours_per_week: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="is_trial" checked={form.is_trial} onChange={(e) => setForm({ ...form, is_trial: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="is_trial" className="!mb-0">Start with a trial period</Label>
              </div>
              {form.is_trial && (
                <div>
                  <Label>Trial duration (days)</Label>
                  <Input type="number" value={form.trial_duration_days} onChange={(e) => setForm({ ...form, trial_duration_days: e.target.value })} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Create Contract
        </Button>
      </form>
    </div>
  );
}
