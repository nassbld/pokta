import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface CreateMatchPayload {
  format: '5v5' | '7v7' | '11v11';
  scheduled_at: string;
  max_players: number;
  level?: 'debutant' | 'intermediaire' | 'avance' | null;
  description?: string | null;
  prix_par_joueur?: number | null;
  lat: number;
  lng: number;
  join_as_participant?: boolean;
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (payload: CreateMatchPayload) => {
      const { lat, lng, join_as_participant, ...rest } = payload;
      const { data, error } = await supabase.from('matches').insert({
        ...rest,
        creator_id: user!.id,
        location: `POINT(${lng} ${lat})`,
      }).select().single();
      if (error) throw error;

      if (join_as_participant) {
        const { error: participationError } = await supabase
          .from('participations')
          .insert({ match_id: data.id, user_id: user!.id, statut: 'confirme' });
        if (participationError) throw participationError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', 'nearby'] });
    },
  });
}
