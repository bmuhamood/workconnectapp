// hooks/useMessages.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface UIMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isSent: boolean; // true if sent by the current user
}

export interface UIConversation {
  id: string;
  participant: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    lastSeen: Date;
    isOnline: boolean; // presence isn't wired up yet — always false, see README
  };
  lastMessage: string;
  unreadCount: number;
  timestamp: Date;
  isPinned: boolean;
}

function fullName(p: any) {
  return `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || 'User';
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `*,
           p1:profiles!conversations_participant_1_fkey ( id, first_name, last_name, role, updated_at ),
           p2:profiles!conversations_participant_2_fkey ( id, first_name, last_name, role, updated_at )`
        )
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const mapped: UIConversation[] = await Promise.all(
        (data ?? []).map(async (row: any) => {
          const other = row.participant_1 === user.id ? row.p2 : row.p1;
          const [{ count }, { data: lastMsg }] = await Promise.all([
            supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', row.id)
              .eq('receiver_id', user.id)
              .eq('is_read', false),
            supabase
              .from('messages')
              .select('message_text')
              .eq('conversation_id', row.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          return {
            id: row.id,
            participant: {
              id: other?.id,
              name: fullName(other),
              role: other?.role ?? '',
              lastSeen: other?.updated_at ? new Date(other.updated_at) : new Date(),
              isOnline: false,
            },
            lastMessage: lastMsg?.message_text ?? '',
            unreadCount: count ?? 0,
            timestamp: new Date(row.last_message_at),
            isPinned: row.participant_1 === user.id ? row.is_archived_1 : row.is_archived_2,
          };
        })
      );

      setConversations(mapped);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles!messages_sender_id_fkey ( first_name, last_name )')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const mapped: UIMessage[] = (data ?? []).map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: fullName(m.sender),
          content: m.message_text,
          timestamp: new Date(m.created_at),
          isRead: m.is_read,
          isSent: m.sender_id === user.id,
        }));
        setMessages(mapped);

        // Mark incoming messages as read
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString(), status: 'read' } as any)
          .eq('conversation_id', conversationId)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
      } catch (err) {
        console.error('Error fetching messages:', err);
        toast.error('Failed to load messages');
      }
    },
    [user]
  );

  const sendMessage = useCallback(
    async (conversationId: string, text: string) => {
      if (!user || !text.trim()) return null;

      const { data: convRow } = await supabase
        .from('conversations')
        .select('participant_1, participant_2')
        .eq('id', conversationId)
        .single();
      if (!convRow) return null;

      const receiverId = convRow.participant_1 === user.id ? convRow.participant_2 : convRow.participant_1;

      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, receiver_id: receiverId, message_text: text } as any)
        .select()
        .single();

      if (error) {
        toast.error('Failed to send message');
        throw error;
      }

      // Optimistic local append — the Realtime subscription below will also
      // receive this insert, so we dedupe by id when it arrives.
      setMessages((prev) => [
        ...prev,
        { id: data.id, senderId: user.id, senderName: 'You', content: text, timestamp: new Date(data.created_at), isRead: true, isSent: true },
      ]);

      return data;
    },
    [user]
  );

  /** Subscribes to new messages in a conversation. Call once a conversation is opened. */
  const subscribeToConversation = useCallback(
    (conversationId: string) => {
      messagesChannelRef.current?.unsubscribe();

      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          (payload) => {
            const m = payload.new as any;
            setMessages((prev) => {
              if (prev.some((existing) => existing.id === m.id)) return prev;
              return [
                ...prev,
                {
                  id: m.id,
                  senderId: m.sender_id,
                  senderName: m.sender_id === user?.id ? 'You' : '',
                  content: m.message_text,
                  timestamp: new Date(m.created_at),
                  isRead: m.is_read,
                  isSent: m.sender_id === user?.id,
                },
              ];
            });
          }
        )
        .subscribe();

      messagesChannelRef.current = channel;
      return () => {
        channel.unsubscribe();
      };
    },
    [user]
  );

  /** Finds an existing 1:1 conversation with `otherUserId`, or creates one. */
  const getOrCreateConversation = useCallback(
    async (otherUserId: string, contractId?: string) => {
      if (!user) return null;
      const [p1, p2] = [user.id, otherUserId].sort();

      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_1', p1)
        .eq('participant_2', p2)
        .maybeSingle();
      if (existing) return existing.id as string;

      const { data, error } = await supabase
        .from('conversations')
        .insert({ participant_1: p1, participant_2: p2, contract_id: contractId } as any)
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    [user]
  );

  useEffect(() => {
    fetchConversations();
    return () => {
      messagesChannelRef.current?.unsubscribe();
    };
  }, [fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    subscribeToConversation,
    getOrCreateConversation,
  };
}
