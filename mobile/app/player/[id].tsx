import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

const POSITION_LABEL: Record<string, string> = {
  gardien: 'Gardien',
  defenseur: 'Défenseur',
  milieu: 'Milieu',
  attaquant: 'Attaquant',
};

const LEVEL_LABEL: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, position, level')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  if (error || !profile) {
    return <View style={styles.centered}><Text style={styles.errorText}>Profil introuvable.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{profile.username.charAt(0).toUpperCase()}</Text>
      </View>

      <Text style={styles.username}>{profile.username}</Text>

      <View style={styles.badges}>
        {profile.position && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{POSITION_LABEL[profile.position]}</Text>
          </View>
        )}
        {profile.level && (
          <View style={[styles.badge, styles.badgeLevel]}>
            <Text style={styles.badgeText}>{LEVEL_LABEL[profile.level]}</Text>
          </View>
        )}
      </View>

      {!profile.position && !profile.level && (
        <Text style={styles.empty}>Ce joueur n'a pas encore complété son profil.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { alignItems: 'center', padding: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#dc2626' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  username: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 16 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#16a34a', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14 },
  badgeLevel: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  badgeText: { fontSize: 14, fontWeight: '600', color: '#333' },
  empty: { color: '#888', marginTop: 16, textAlign: 'center' },
});
