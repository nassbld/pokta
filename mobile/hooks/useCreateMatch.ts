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
  venue?: { name: string; address: string; lat: number; lng: number } | null;
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (payload: CreateMatchPayload) => {
      const { lat, lng, join_as_participant, venue, ...rest } = payload;

      let venue_id: string | null = null;
      const matchLat = venue ? venue.lat : lat;
      const matchLng = venue ? venue.lng : lng;

      if (venue) {
        const { data: existing } = await supabase
          .from('venues')
          .select('id')
          .eq('name', venue.name)
          .eq('address', venue.address)
          .maybeSingle();

        if (existing) {
          venue_id = existing.id;
        } else {
          const { data: created, error: venueError } = await supabase
            .from('venues')
            .insert({
              name: venue.name,
              address: venue.address,
              location: `POINT(${venue.lng} ${venue.lat})`,
              created_by: user!.id,
            })
            .select('id')
            .single();
          if (venueError) throw venueError;
          venue_id = created.id;
        }
      }

      const { data, error } = await supabase.from('matches').insert({
        ...rest,
        creator_id: user!.id,
        venue_id,
        location: `POINT(${matchLng} ${matchLat})`,
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
