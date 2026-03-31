import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface MyMatch {
  id: string;
  scheduled_at: string;
  format: '5v5' | '7v7' | '11v11';
  max_players: number;
  status: 'ouvert' | 'complet' | 'annule' | 'termine';
  prix_par_joueur: number | null;
  venue: { name: string } | null;
  players_count: number;
  my_statut: 'confirme' | 'liste_attente' | 'creator';
}

export function useMyMatches() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['matches', 'mine', user?.id],
    queryFn: async () => {
      // Matchs où je suis participant (non annulé)
      const { data: participations, error: pError } = await supabase
        .from('participations')
        .select(`
          statut,
          match:matches(
            id, scheduled_at, format, max_players, status, prix_par_joueur,
            venue:venues(name),
            participations(id, statut)
          )
        `)
        .eq('user_id', user!.id)
        .neq('statut', 'annule');
      if (pError) throw pError;

      // Matchs que j'ai créés sans participation (ex: créé sans cocher "je participe")
      const { data: created, error: cError } = await supabase
        .from('matches')
        .select(`
          id, scheduled_at, format, max_players, status, prix_par_joueur,
          venue:venues(name),
          participations(id, statut)
        `)
        .eq('creator_id', user!.id);
      if (cError) throw cError;

      const seen = new Set<string>();
      const results: MyMatch[] = [];

      // Participations d'abord
      for (const p of participations ?? []) {
        const m = p.match as any;
        if (!m || seen.has(m.id)) continue;
        seen.add(m.id);
        results.push({
          ...m,
          venue: m.venue,
          players_count: (m.participations as any[]).filter((x: any) => x.statut === 'confirme').length,
          my_statut: p.statut as 'confirme' | 'liste_attente',
        });
      }

      // Matchs créés sans participation
      for (const m of created ?? []) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);
        results.push({
          ...m,
          venue: (m.venue as any),
          players_count: (m.participations as any[]).filter((x: any) => x.statut === 'confirme').length,
          my_statut: 'creator',
        });
      }

      return results.sort((a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
    },
    enabled: !!user,
  });
}
