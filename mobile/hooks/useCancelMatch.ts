import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCancelMatch(matchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'annule' })
        .eq('id', matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'nearby'] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'mine'] });
    },
  });
}
