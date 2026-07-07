// hooks/useReviews.ts
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface Review {
  id: string;
  contract_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  professionalism_rating: number | null;
  punctuality_rating: number | null;
  communication_rating: number | null;
  quality_rating: number | null;
  is_verified: boolean;
  response: string | null;
  created_at: string;
  reviewer?: { first_name: string; last_name: string };
}

/**
 * Reviews are keyed to a completed contract. The `reviews_update_rating`
 * trigger (see supabase/migrations/00002) automatically recalculates
 * worker_profiles.rating_average whenever a review is inserted/updated.
 */
export function useReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviewsForUser = useCallback(async (revieweeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(first_name, last_name)')
        .eq('reviewee_id', revieweeId)
        .eq('is_verified', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReviews((data ?? []) as unknown as Review[]);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitReview = useCallback(
    async (
      contractId: string,
      revieweeId: string,
      data: { rating: number; comment: string; professionalism_rating?: number; punctuality_rating?: number; communication_rating?: number; quality_rating?: number }
    ) => {
      if (!user) throw new Error('You must be logged in to leave a review');
      setLoading(true);
      try {
        const { data: row, error } = await supabase
          .from('reviews')
          .insert({ contract_id: contractId, reviewer_id: user.id, reviewee_id: revieweeId, ...data } as any)
          .select()
          .single();
        if (error) throw error;
        toast.success('Review submitted');
        return row;
      } catch (err: any) {
        toast.error(err.message || 'Failed to submit review');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const respondToReview = useCallback(async (reviewId: string, response: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .update({ response, responded_at: new Date().toISOString() } as any)
      .eq('id', reviewId)
      .select()
      .single();
    if (error) throw error;
    toast.success('Response posted');
    return data;
  }, []);

  return { reviews, loading, fetchReviewsForUser, submitReview, respondToReview };
}
