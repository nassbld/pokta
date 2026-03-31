import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMatch } from '../../hooks/useMatch';
import { useJoinMatch, useLeaveMatch } from '../../hooks/useParticipate';
import { useCancelMatch } from '../../hooks/useCancelMatch';
import { useAuthStore } from '../../store/authStore';

const LEVEL_LABEL: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: match, isLoading, error } = useMatch(id);
  const join = useJoinMatch(id);
  const leave = useLeaveMatch(id);
  const cancel = useCancelMatch(id);

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }
  if (error || !match) {
    return <View style={styles.centered}><Text style={styles.errorText}>Match introuvable.</Text></View>;
  }

  const confirmed = match.participations.filter((p) => p.statut === 'confirme');
  const waiting = match.participations.filter((p) => p.statut === 'liste_attente');
  const myParticipation = match.participations.find((p) => p.user.id === user?.id);
  const isCreator = match.creator_id === user?.id;
  const isFull = confirmed.length >= match.max_players;

  async function handleJoin() {
    try {
      await join.mutateAsync();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }

  async function handleCancel() {
    Alert.alert('Annuler le match', 'Tous les joueurs inscrits seront prévenus. Cette action est irréversible.', [
      { text: 'Retour', style: 'cancel' },
      { text: 'Annuler le match', style: 'destructive', onPress: async () => {
        try {
          await cancel.mutateAsync();
          router.back();
        } catch (e: any) {
          Alert.alert('Erreur', e.message);
        }
      }},
    ]);
  }

  async function handleLeave() {
    Alert.alert('Quitter le match', 'Tu es sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Quitter', style: 'destructive', onPress: async () => {
        try {
          await leave.mutateAsync();
          router.back();
        } catch (e: any) {
          Alert.alert('Erreur', e.message);
        }
      }},
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.formatBadge}>
            <Text style={styles.formatText}>{match.format}</Text>
          </View>
          {match.level && <Text style={styles.level}>{LEVEL_LABEL[match.level]}</Text>}
          <View style={[styles.statusBadge, match.status === 'complet' && styles.statusFull]}>
            <Text style={styles.statusText}>{match.status === 'complet' ? 'Complet' : 'Ouvert'}</Text>
          </View>
        </View>

        <Text style={styles.date}>{formatDate(match.scheduled_at)}</Text>
        <Text style={styles.duration}>{match.duration_min} min</Text>

        {/* Infos */}
        {match.venue && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Terrain</Text>
            <Text style={styles.sectionValue}>{match.venue.name}</Text>
            {match.venue.address && <Text style={styles.sectionSub}>{match.venue.address}</Text>}
          </View>
        )}

        {match.prix_par_joueur != null && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Prix</Text>
            <Text style={styles.sectionValue}>{match.prix_par_joueur} € / joueur</Text>
          </View>
        )}

        {match.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.sectionValue}>{match.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Organisateur</Text>
          <Text style={styles.sectionValue}>{match.creator?.username ?? '—'}</Text>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Joueurs ({confirmed.length}/{match.max_players})
          </Text>
          {confirmed.map((p) => (
            <View key={p.id} style={styles.playerRow}>
              <Text style={styles.playerName}>{p.user.username}</Text>
              {p.user.position && <Text style={styles.playerPosition}>{p.user.position}</Text>}
            </View>
          ))}
        </View>

        {waiting.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Liste d'attente ({waiting.length})</Text>
            {waiting.map((p) => (
              <View key={p.id} style={styles.playerRow}>
                <Text style={[styles.playerName, { color: '#999' }]}>{p.user.username}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        {isCreator && match.status !== 'annule' && (
          <TouchableOpacity style={styles.ctaBtnCancel} onPress={handleCancel} disabled={cancel.isPending}>
            {cancel.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>Annuler le match</Text>
            }
          </TouchableOpacity>
        )}

          {match.status !== 'annule' && match.status !== 'termine' && (
            !myParticipation ? (
              <TouchableOpacity
                style={[styles.ctaBtn, isFull && styles.ctaBtnSecondary]}
                onPress={handleJoin}
                disabled={join.isPending}
              >
                {join.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.ctaText}>{isFull ? "Rejoindre la liste d'attente" : 'Rejoindre le match'}</Text>
                }
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.ctaBtnLeave} onPress={handleLeave} disabled={leave.isPending}>
                {leave.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.ctaText}>Quitter le match</Text>
                }
              </TouchableOpacity>
            )
          )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#dc2626' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  formatBadge: { backgroundColor: '#16a34a', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  formatText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  level: { color: '#666', fontSize: 14 },
  statusBadge: { marginLeft: 'auto', backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusFull: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#333' },
  date: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4, textTransform: 'capitalize' },
  duration: { fontSize: 14, color: '#888', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  sectionValue: { fontSize: 15, color: '#111' },
  sectionSub: { fontSize: 13, color: '#666', marginTop: 2 },
  playerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  playerName: { fontSize: 14, color: '#222' },
  playerPosition: { fontSize: 13, color: '#888', textTransform: 'capitalize' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  ctaBtn: { backgroundColor: '#16a34a', borderRadius: 10, padding: 16, alignItems: 'center' },
  ctaBtnSecondary: { backgroundColor: '#f59e0b' },
  ctaBtnLeave: { backgroundColor: '#dc2626', borderRadius: 10, padding: 16, alignItems: 'center' },
  ctaBtnCancel: { backgroundColor: '#dc2626', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
