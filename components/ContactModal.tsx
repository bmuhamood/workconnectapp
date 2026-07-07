// components/ContactModal.tsx
'use client';

import { useState } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  User, Phone, Mail, Clock, Shield, Star,
  Send, X, CheckCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Create a minimal interface for ContactModal
interface ContactWorker {
  id: string;
  user_id?: string; // profiles.id — required to actually open a conversation
  first_name: string;
  last_name: string;
  full_name: string;
  profession?: string;
  verification_status?: string;
  rating_average?: string;
  city?: string;
  experience_years?: number;
  hourly_rate?: string;
  availability?: string;
  district?: string;
  total_reviews?: number;
  profile_photo_url?: string;
  email?: string;
  phone?: string;
  skills?: string[];
}

interface ContactModalProps {
  worker: ContactWorker;
  onClose: () => void;
}

export default function ContactModal({ worker, onClose }: ContactModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to contact workers');
      return;
    }
    if (!worker.user_id) {
      toast.error("This worker's account details are incomplete — can't start a conversation yet.");
      return;
    }
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      // Find or create the 1:1 conversation (participant order doesn't
      // matter — sorted the same way useMessages.getOrCreateConversation does).
      const [p1, p2] = [user.id, worker.user_id].sort();
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_1', p1)
        .eq('participant_2', p2)
        .maybeSingle();

      let conversationId = existing?.id as string | undefined;
      if (!conversationId) {
        const { data: created, error: convErr } = await supabase
          .from('conversations')
          .insert({ participant_1: p1, participant_2: p2 } as any)
          .select('id')
          .single();
        if (convErr) throw convErr;
        conversationId = created.id;
      }

      const { error: msgErr } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: worker.user_id,
        message_text: message,
      } as any);
      if (msgErr) throw msgErr;

      toast.success('Message sent!');
      onClose();
      router.push('/messages');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Contact {worker.full_name}
          </DialogTitle>
          <DialogDescription>
            Send a message to discuss opportunities
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {worker.first_name[0]}{worker.last_name[0]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{worker.full_name}</h3>
            <p className="text-sm text-gray-600">
              {worker.profession || 'Professional Worker'}
              {worker.city && ` • ${worker.city}`}
              {worker.experience_years && ` • ${worker.experience_years} yrs exp`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              placeholder="Hi, I'm interested in discussing a potential opportunity with you..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}