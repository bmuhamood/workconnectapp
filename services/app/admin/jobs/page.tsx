'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, CheckCircle, XCircle, Star, Eye, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const formatUGX = (n: number) => new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n || 0);

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_postings')
      .select('*, employer_profiles(company_name, first_name, last_name), job_categories(name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      toast.error('Failed to load job postings');
    } else {
      setJobs(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateJob = async (id: string, patch: Record<string, any>, successMsg: string) => {
    try {
      const { error } = await supabase.from('job_postings').update(patch as any).eq('id', id);
      if (error) throw error;
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update job');
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Delete this job posting permanently? This also removes its applications.')) return;
    try {
      const { error } = await supabase.from('job_postings').delete().eq('id', id);
      if (error) throw error;
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success('Job posting deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete job');
    }
  };

  const filtered = jobs.filter((j) => {
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    const matchesSearch = !search || j.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    draft: jobs.filter((j) => j.status === 'draft').length,
    active: jobs.filter((j) => j.status === 'active').length,
    filled: jobs.filter((j) => j.status === 'filled').length,
    closed: jobs.filter((j) => j.status === 'closed').length,
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Postings</h1>
      <p className="text-gray-500 text-sm mb-6">Every job posted platform-wide — publish drafts, feature listings, or take down violations.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">Draft (awaiting publish)</div><div className="text-xl font-bold text-amber-600">{counts.draft}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">Active</div><div className="text-xl font-bold text-green-600">{counts.active}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">Filled</div><div className="text-xl font-bold text-blue-600">{counts.filled}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">Closed</div><div className="text-xl font-bold text-gray-500">{counts.closed}</div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-500">No job postings match your filters.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-blue-600 truncate">{job.title}</Link>
                    <Badge className={
                      job.status === 'active' ? 'bg-green-100 text-green-800' :
                      job.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                      job.status === 'filled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }>{job.status}</Badge>
                    {job.is_featured && <Badge variant="outline" className="text-yellow-700 border-yellow-300"><Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />Featured</Badge>}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {job.employer_profiles?.company_name || `${job.employer_profiles?.first_name ?? ''} ${job.employer_profiles?.last_name ?? ''}`.trim()}
                    {' · '}{job.job_categories?.name} · {job.location} · {formatUGX(job.salary_min)}-{formatUGX(job.salary_max)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                    <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applications_count ?? 0} applicants</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{job.views_count ?? 0} views</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <Link href={`/jobs/${job.id}/applications`}>
                    <Button variant="outline" size="sm">Applicants</Button>
                  </Link>
                  {job.status === 'draft' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateJob(job.id, { status: 'active' }, 'Job published')}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Publish
                    </Button>
                  )}
                  {job.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => updateJob(job.id, { is_featured: !job.is_featured }, job.is_featured ? 'Unfeatured' : 'Featured')}>
                      <Star className={`h-4 w-4 mr-1 ${job.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} /> {job.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                  )}
                  {(job.status === 'active' || job.status === 'draft') && (
                    <Button size="sm" variant="outline" onClick={() => updateJob(job.id, { status: 'closed' }, 'Job closed')}>
                      <XCircle className="h-4 w-4 mr-1" /> Close
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => deleteJob(job.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
