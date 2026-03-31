import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface MatchDetail {
  id: string;
  creator_id: string;
  scheduled_at: string;
  duration_min: number;
  format: '5v5' | '7v7' | '11v11';
  max_players: number;
  level: 'debutant' | 'intermediaire' | 'avance' | null;
  status: 'ouvert' | 'complet' | 'annule' | 'termine';
  description: string | null;
  prix_par_joueur: number | null;
  creator: { username: string; avatar_url: string | null } | null;
  venue: { name: string; address: string | null } | null;
  participations: {
    id: string;
    statut: 'confirme' | 'liste_attente' | 'annule';
    user: { id: string; username: string; avatar_url: string | null; position: string | null };
  }[];
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          creator:profiles!creator_id(username, avatar_url),
          venue:venues(name, address),
          participations(
            id, statut,
            user:profiles!user_id(id, username, avatar_url, position)
          )
        `)
        .eq('id', id)
        .neq('participations.statut', 'annule')
        .single();
      if (error) throw error;
      return data as MatchDetail;
    },
  });
}
