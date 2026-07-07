'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const formatUGX = (n: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n || 0);

const STAGE_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'trial', label: 'On Trial' },
  { value: 'active', label: 'Active (Full Contract)' },
  { value: 'completed', label: 'Completed' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select('*, employer_profiles(company_name, first_name, last_name), worker_profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      toast.error('Failed to load contracts');
    } else {
      setContracts(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStage = async (contractId: string, newStatus: string) => {
    setUpdating(contractId);
    try {
      const patch: Record<string, any> = { status: newStatus };
      // Moving to a full contract should turn trial mode off explicitly —
      // otherwise the contract_defaults() trigger would flip it straight
      // back to 'trial' on the next save (is_trial=true + status='active').
      if (newStatus === 'active') patch.is_trial = false;
      if (newStatus === 'active' && !contracts.find((c) => c.id === contractId)?.activated_at) {
        patch.activated_at = new Date().toISOString();
      }
      if (newStatus === 'completed') patch.completed_at = new Date().toISOString();

      const { error } = await supabase.from('contracts').update(patch as any).eq('id', contractId);
      if (error) throw error;
      setContracts((prev) => prev.map((c) => (c.id === contractId ? { ...c, ...patch } : c)));
      toast.success(`Contract moved to "${newStatus}"`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update contract stage');
    } finally {
      setUpdating(null);
    }
  };

  const toggleSignature = async (contractId: string, field: 'signed_by_employer' | 'signed_by_worker', current: boolean) => {
    try {
      const patch: Record<string, any> = { [field]: !current };
      if (!current) patch[field === 'signed_by_employer' ? 'employer_signature_date' : 'worker_signature_date'] = new Date().toISOString();
      const { error } = await supabase.from('contracts').update(patch as any).eq('id', contractId);
      if (error) throw error;
      setContracts((prev) => prev.map((c) => (c.id === contractId ? { ...c, ...patch } : c)));
      toast.success('Signature status updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update signature status');
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const filtered = contracts.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch = !search || c.job_title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    draft: contracts.filter((c) => c.status === 'draft').length,
    trial: contracts.filter((c) => c.status === 'trial').length,
    active: contracts.filter((c) => c.status === 'active').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
    terminated: contracts.filter((c) => c.status === 'terminated').length,
    trialsEndingSoon: contracts.filter((c) => {
      if (c.status !== 'trial' || !c.trial_end_date) return false;
      const daysLeft = (new Date(c.trial_end_date).getTime() - new Date(today).getTime()) / 86400000;
      return daysLeft >= 0 && daysLeft <= 3;
    }).length,
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Contracts</h1>
      <p className="text-gray-500 text-sm mb-6">Every contract on the platform, with trial periods and unsigned agreements flagged.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">Draft</div><div className="text-xl font-bold text-gray-500">{counts.draft}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">On Trial</div><div className="text-xl font-bold text-amber-600">{counts.trial}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">Active</div><div className="text-xl font-bold text-green-600">{counts.active}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">Completed</div><div className="text-xl font-bold text-blue-600">{counts.completed}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">Terminated</div><div className="text-xl font-bold text-red-600">{counts.terminated}</div></CardContent></Card>
        <Card className={counts.trialsEndingSoon > 0 ? 'border-amber-300 bg-amber-50' : ''}>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 flex items-center gap-1">{counts.trialsEndingSoon > 0 && <AlertTriangle className="h-3 w-3 text-amber-600" />} Trials Ending Soon</div>
            <div className="text-xl font-bold text-amber-700">{counts.trialsEndingSoon}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by job title..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="trial">On Trial</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-500">No contracts match your filters.</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Job Title</th>
                <th className="px-4 py-3">Employer</th>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">Monthly Cost</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Signed</th>
                <th className="px-4 py-3">Trial Ends</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => {
                const trialSoon = c.status === 'trial' && c.trial_end_date && ((new Date(c.trial_end_date).getTime() - new Date(today).getTime()) / 86400000) <= 3;
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 ${trialSoon ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <Link href={`/contracts/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">{c.job_title}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.employer_profiles?.company_name || `${c.employer_profiles?.first_name ?? ''} ${c.employer_profiles?.last_name ?? ''}`.trim()}</td>
                    <td className="px-4 py-3 text-gray-600">{c.worker_profiles?.first_name} {c.worker_profiles?.last_name}</td>
                    <td className="px-4 py-3">{formatUGX(c.total_monthly_cost)}</td>
                    <td className="px-4 py-3">
                      <Select value={c.status} onValueChange={(v) => updateStage(c.id, v)} disabled={updating === c.id}>
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue>
                            <Badge className={
                              c.status === 'active' ? 'bg-green-100 text-green-800' :
                              c.status === 'trial' ? 'bg-amber-100 text-amber-800' :
                              c.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              c.status === 'terminated' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }>{c.status}</Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STAGE_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-xs space-y-1">
                      <button onClick={() => toggleSignature(c.id, 'signed_by_employer', c.signed_by_employer)} className={`block hover:underline ${c.signed_by_employer ? 'text-green-700' : 'text-gray-400'}`}>
                        Employer {c.signed_by_employer ? '✓ Signed' : '— Unsigned'}
                      </button>
                      <button onClick={() => toggleSignature(c.id, 'signed_by_worker', c.signed_by_worker)} className={`block hover:underline ${c.signed_by_worker ? 'text-green-700' : 'text-gray-400'}`}>
                        Worker {c.signed_by_worker ? '✓ Signed' : '— Unsigned'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.trial_end_date ? new Date(c.trial_end_date).toLocaleDateString() : '—'}
                      {trialSoon && <AlertTriangle className="h-3 w-3 text-amber-600 inline ml-1" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent></Card>
      )}
    </div>
  );
}
