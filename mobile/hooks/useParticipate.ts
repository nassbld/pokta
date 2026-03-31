import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function useJoinMatch(matchId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('participations')
        .insert({ match_id: matchId, user_id: user!.id, statut: 'confirme' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'nearby'] });
    },
  });
}

export function useLeaveMatch(matchId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('participations')
        .update({ statut: 'annule' })
        .eq('match_id', matchId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'nearby'] });
    },
  });
}
