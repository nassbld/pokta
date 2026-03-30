import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface NearbyMatch {
  id: string;
  creator_id: string;
  venue_id: string | null;
  scheduled_at: string;
  duration_min: number;
  format: '5v5' | '7v7' | '11v11';
  max_players: number;
  level: 'debutant' | 'intermediaire' | 'avance' | null;
  status: 'ouvert' | 'complet' | 'annule' | 'termine';
  description: string | null;
  prix_par_joueur: number | null;
  distance_m: number;
  players_count: number;
}

export function useNearbyMatches(lat: number | null, lng: number | null, radiusM = 10000) {
  return useQuery({
    queryKey: ['matches', 'nearby', lat, lng, radiusM],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_nearby_matches', {
        lat,
        lng,
        radius_m: radiusM,
      });
      if (error) throw error;
      return data as NearbyMatch[];
    },
    enabled: lat !== null && lng !== null,
  });
}
