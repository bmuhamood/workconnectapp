'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Search, MessageSquare, Briefcase, FileText, ShieldAlert, ShieldOff, ShieldCheck, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileRow {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  is_verified: boolean;
  is_blocked: boolean;
  is_blacklisted: boolean;
  blocked_reason: string | null;
  created_at: string;
}

const RECORD_TYPES = [
  { value: 'misconduct', label: 'Misconduct' },
  { value: 'criminal_record', label: 'Criminal Record' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'warning', label: 'Warning' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'other', label: 'Other' },
];

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [activity, setActivity] = useState<{ conversations: any[]; applications: any[]; contracts: any[] } | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({ record_type: 'misconduct', severity: 'low', title: '', description: '', is_visible_to_public: false });

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500);
    setUsers((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      !search ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const openActivity = async (u: ProfileRow) => {
    setSelectedUser(u);
    setLoadingActivity(true);
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, last_message_at, p1:profiles!conversations_participant_1_fkey(first_name,last_name,role), p2:profiles!conversations_participant_2_fkey(first_name,last_name,role)')
        .or(`participant_1.eq.${u.id},participant_2.eq.${u.id}`)
        .order('last_message_at', { ascending: false })
        .limit(20);

      let applications: any[] = [];
      let contracts: any[] = [];

      if (u.role === 'worker') {
        const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', u.id).maybeSingle();
        if (workerProfile) {
          const { data: apps } = await supabase
            .from('job_applications')
            .select('id, status, applied_at, job_postings(title)')
            .eq('worker_id', workerProfile.id)
            .order('applied_at', { ascending: false });
          applications = apps ?? [];

          const { data: cons } = await supabase
            .from('contracts')
            .select('id, job_title, status, start_date')
            .eq('worker_id', workerProfile.id)
            .order('start_date', { ascending: false });
          contracts = cons ?? [];
        }
      } else if (u.role === 'employer') {
        const { data: employerProfile } = await supabase.from('employer_profiles').select('id').eq('user_id', u.id).maybeSingle();
        if (employerProfile) {
          const { data: cons } = await supabase
            .from('contracts')
            .select('id, job_title, status, start_date, worker_profiles(first_name,last_name)')
            .eq('employer_id', employerProfile.id)
            .order('start_date', { ascending: false });
          contracts = cons ?? [];
        }
      }

      const { data: disciplinary } = await supabase
        .from('disciplinary_records')
        .select('*')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false });

      setActivity({ conversations: conversations ?? [], applications, contracts });
      setRecords(disciplinary ?? []);
    } finally {
      setLoadingActivity(false);
    }
  };

  const toggleBlock = async (u: ProfileRow) => {
    const nowBlocked = !u.is_blocked;
    const reason = nowBlocked ? prompt('Reason for suspending this account (shown to the user):') : null;
    if (nowBlocked && reason === null) return;
    try {
      const patch: any = {
        is_blocked: nowBlocked,
        blocked_reason: nowBlocked ? reason : null,
        blocked_at: nowBlocked ? new Date().toISOString() : null,
        blocked_by: nowBlocked ? currentAdmin?.id : null,
      };
      const { error } = await supabase.from('profiles').update(patch).eq('id', u.id);
      if (error) throw error;
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...patch } : x)));
      if (selectedUser?.id === u.id) setSelectedUser((prev) => (prev ? { ...prev, ...patch } : prev));
      toast.success(nowBlocked ? 'Account suspended' : 'Account unblocked');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account status');
    }
  };

  const toggleBlacklist = async (u: ProfileRow) => {
    const nowBlacklisted = !u.is_blacklisted;
    if (nowBlacklisted && !confirm(`Permanently blacklist ${u.first_name} ${u.last_name}? This is a strong action reserved for serious violations.`)) return;
    try {
      const { error } = await supabase.from('profiles').update({ is_blacklisted: nowBlacklisted } as any).eq('id', u.id);
      if (error) throw error;
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_blacklisted: nowBlacklisted } : x)));
      if (selectedUser?.id === u.id) setSelectedUser((prev) => (prev ? { ...prev, is_blacklisted: nowBlacklisted } : prev));
      toast.success(nowBlacklisted ? 'Account blacklisted' : 'Removed from blacklist');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update blacklist status');
    }
  };

  const addRecord = async () => {
    if (!selectedUser || !newRecord.title.trim() || !newRecord.description.trim()) {
      toast.error('Fill in a title and description');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('disciplinary_records')
        .insert({ ...newRecord, user_id: selectedUser.id, reported_by: currentAdmin?.id } as any)
        .select()
        .single();
      if (error) throw error;
      setRecords((prev) => [data, ...prev]);
      setShowAddRecord(false);
      setNewRecord({ record_type: 'misconduct', severity: 'low', title: '', description: '', is_visible_to_public: false });
      toast.success('Disciplinary record added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add record');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="worker">Workers</SelectItem>
            <SelectItem value="employer">Employers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((u) => (
                    <tr key={u.id} className={`hover:bg-gray-50 ${u.is_blacklisted ? 'bg-red-50/50' : u.is_blocked ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
                      <td className="px-4 py-3 space-x-1">
                        {u.is_blacklisted ? (
                          <Badge className="bg-red-100 text-red-800">Blacklisted</Badge>
                        ) : u.is_blocked ? (
                          <Badge className="bg-amber-100 text-amber-800">Suspended</Badge>
                        ) : (
                          <Badge className={u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{u.status}</Badge>
                        )}
                        {u.is_verified && <Badge variant="outline" className="text-xs">✓ verified</Badge>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => openActivity(u)}>Manage</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="text-center py-10 text-gray-500">No users match your filters.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) { setSelectedUser(null); setShowAddRecord(false); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedUser?.first_name} {selectedUser?.last_name}</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="flex flex-wrap gap-2 pb-4 border-b">
              <Button
                size="sm"
                variant={selectedUser.is_blocked ? 'default' : 'outline'}
                className={selectedUser.is_blocked ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => toggleBlock(selectedUser)}
              >
                {selectedUser.is_blocked ? <><ShieldCheck className="h-4 w-4 mr-1" /> Unblock</> : <><ShieldAlert className="h-4 w-4 mr-1" /> Suspend</>}
              </Button>
              <Button
                size="sm"
                variant={selectedUser.is_blacklisted ? 'default' : 'outline'}
                className={selectedUser.is_blacklisted ? 'bg-green-600 hover:bg-green-700' : 'text-red-600 border-red-200 hover:bg-red-50'}
                onClick={() => toggleBlacklist(selectedUser)}
              >
                <ShieldOff className="h-4 w-4 mr-1" /> {selectedUser.is_blacklisted ? 'Remove from Blacklist' : 'Blacklist'}
              </Button>
              {selectedUser.is_blocked && selectedUser.blocked_reason && (
                <p className="w-full text-xs text-amber-700 mt-1">Reason: {selectedUser.blocked_reason}</p>
              )}
            </div>
          )}

          {loadingActivity ? (
            <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
          ) : activity ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-900"><ShieldAlert className="h-4 w-4" /> Disciplinary Records ({records.length})</h3>
                  <Button size="sm" variant="outline" onClick={() => setShowAddRecord((v) => !v)}><Plus className="h-3.5 w-3.5 mr-1" /> Add Record</Button>
                </div>
                {showAddRecord && (
                  <div className="border rounded-lg p-3 mb-3 space-y-2 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={newRecord.record_type} onValueChange={(v) => setNewRecord({ ...newRecord, record_type: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{RECORD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={newRecord.severity} onValueChange={(v) => setNewRecord({ ...newRecord, severity: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input placeholder="Title" value={newRecord.title} onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })} className="h-8 text-sm" />
                    <Textarea placeholder="Description / details" value={newRecord.description} onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })} rows={2} className="text-sm" />
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" checked={newRecord.is_visible_to_public} onChange={(e) => setNewRecord({ ...newRecord, is_visible_to_public: e.target.checked })} />
                      Visible to the user themselves (e.g. a formal warning) — leave unchecked for sensitive records like criminal background checks
                    </label>
                    <Button size="sm" onClick={addRecord}>Save Record</Button>
                  </div>
                )}
                {records.length === 0 ? <p className="text-sm text-gray-500">No disciplinary history.</p> : (
                  <ul className="space-y-2">
                    {records.map((r) => (
                      <li key={r.id} className="text-sm border rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize text-xs">{r.record_type.replace('_', ' ')}</Badge>
                          <Badge className={
                            r.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            r.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            r.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                          }>{r.severity}</Badge>
                          <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="font-medium text-gray-900">{r.title}</div>
                        <div className="text-gray-600">{r.description}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-2"><MessageSquare className="h-4 w-4" /> Conversations ({activity.conversations.length})</h3>
                {activity.conversations.length === 0 ? <p className="text-sm text-gray-500">No conversations yet.</p> : (
                  <ul className="space-y-1 text-sm">
                    {activity.conversations.map((c: any) => {
                      const other = c.p1?.first_name ? c.p1 : c.p2;
                      return <li key={c.id} className="text-gray-700">With {other?.first_name} {other?.last_name} ({other?.role}) · last active {new Date(c.last_message_at).toLocaleDateString()}</li>;
                    })}
                  </ul>
                )}
              </div>

              {selectedUser?.role === 'worker' && (
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-2"><Briefcase className="h-4 w-4" /> Job Applications ({activity.applications.length})</h3>
                  {activity.applications.length === 0 ? <p className="text-sm text-gray-500">No applications yet.</p> : (
                    <ul className="space-y-1 text-sm">
                      {activity.applications.map((a: any) => (
                        <li key={a.id} className="text-gray-700">{a.job_postings?.title} — <Badge variant="outline" className="capitalize">{a.status}</Badge></li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div>
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-2"><FileText className="h-4 w-4" /> Contracts ({activity.contracts.length})</h3>
                {activity.contracts.length === 0 ? <p className="text-sm text-gray-500">No contracts yet.</p> : (
                  <ul className="space-y-1 text-sm">
                    {activity.contracts.map((c: any) => (
                      <li key={c.id} className="text-gray-700">
                        {c.job_title} {c.worker_profiles ? `— ${c.worker_profiles.first_name} ${c.worker_profiles.last_name}` : ''} — <Badge variant="outline" className="capitalize">{c.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
