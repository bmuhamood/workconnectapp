'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, MessageSquare } from 'lucide-react';

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('conversations')
        .select('id, last_message_at, p1:profiles!conversations_participant_1_fkey(first_name,last_name,role,email), p2:profiles!conversations_participant_2_fkey(first_name,last_name,role,email)')
        .order('last_message_at', { ascending: false })
        .limit(100);
      setConversations(data ?? []);
      setLoading(false);
    })();
  }, []);

  const openThread = async (conv: any) => {
    setSelected(conv);
    setLoadingThread(true);
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true });
    setThread(data ?? []);
    setLoadingThread(false);
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      `${c.p1?.first_name} ${c.p1?.last_name}`.toLowerCase().includes(s) ||
      `${c.p2?.first_name} ${c.p2?.last_name}`.toLowerCase().includes(s) ||
      c.p1?.email?.toLowerCase().includes(s) ||
      c.p2?.email?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages Oversight</h1>
      <p className="text-gray-500 text-sm mb-6">Every conversation on the platform, for moderation and dispute resolution.</p>

      <div className="grid md:grid-cols-5 gap-4" style={{ minHeight: '60vh' }}>
        <div className="md:col-span-2">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by participant..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Card className="overflow-hidden">
            <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center py-10 text-gray-500 text-sm">No conversations found.</p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openThread(c)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${selected?.id === c.id ? 'bg-emerald-50' : ''}`}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {c.p1?.first_name} {c.p1?.last_name} ({c.p1?.role}) ↔ {c.p2?.first_name} {c.p2?.last_name} ({c.p2?.role})
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Last active {new Date(c.last_message_at).toLocaleString()}</div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="h-full">
            <CardContent className="p-4 h-full max-h-[65vh] overflow-y-auto">
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                  <MessageSquare className="h-10 w-10 mb-2" />
                  <p className="text-sm">Select a conversation to view the thread</p>
                </div>
              ) : loadingThread ? (
                <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
              ) : (
                <div className="space-y-3">
                  {thread.map((m) => (
                    <div key={m.id} className="text-sm">
                      <div className="text-xs text-gray-400 mb-0.5">{new Date(m.created_at).toLocaleString()}</div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-800">{m.message_text}</div>
                    </div>
                  ))}
                  {thread.length === 0 && <p className="text-gray-500 text-sm text-center py-10">No messages in this conversation yet.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
