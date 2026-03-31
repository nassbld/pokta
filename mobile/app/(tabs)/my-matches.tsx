import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useMyMatches, MyMatch } from '../../hooks/useMyMatches';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ouvert:   { label: 'Ouvert',   color: '#16a34a' },
  complet:  { label: 'Complet',  color: '#f59e0b' },
  annule:   { label: 'Annulé',   color: '#dc2626' },
  termine:  { label: 'Terminé',  color: '#9ca3af' },
};

const MY_STATUT_LABEL: Record<string, string> = {
  confirme:       'Inscrit',
  liste_attente:  "Liste d'attente",
  creator:        'Organisateur',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function MatchRow({ match, onPress }: { match: MyMatch; onPress: () => void }) {
  const isPast = new Date(match.scheduled_at) < new Date();
  const status = STATUS_LABEL[match.status];

  return (
    <TouchableOpacity style={[styles.row, isPast && styles.rowPast]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowLeft}>
        <View style={styles.rowTop}>
          <Text style={styles.format}>{match.format}</Text>
          <Text style={[styles.statusDot, { color: status.color }]}>● {status.label}</Text>
        </View>
        <Text style={styles.date}>{formatDate(match.scheduled_at)}</Text>
        {match.venue && <Text style={styles.venue}>{match.venue.name}</Text>}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.players}>{match.players_count}/{match.max_players}</Text>
        <Text style={styles.myStatut}>{MY_STATUT_LABEL[match.my_statut]}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MyMatchesScreen() {
  const router = useRouter();
  const { data: matches, isLoading, error, refetch, isRefetching } = useMyMatches();

  const now = new Date();
  const upcoming = matches?.filter((m) => new Date(m.scheduled_at) >= now && m.status !== 'annule') ?? [];
  const past = matches?.filter((m) => new Date(m.scheduled_at) < now || m.status === 'annule') ?? [];

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>Impossible de charger tes matchs.</Text></View>;
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <>
          <Text style={styles.heading}>Mes matchs</Text>

          {upcoming.length === 0 && past.length === 0 && (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>Tu n'as pas encore de match prévu.</Text>
            </View>
          )}

          {upcoming.length > 0 && (
            <>
              <Text style={styles.section}>À venir</Text>
              {upcoming.map((m) => (
                <MatchRow key={m.id} match={m} onPress={() => router.push(`/match/${m.id}`)} />
              ))}
            </>
          )}

          {past.length > 0 && (
            <>
              <Text style={styles.section}>Passés</Text>
              {past.map((m) => (
                <MatchRow key={m.id} match={m} onPress={() => router.push(`/match/${m.id}`)} />
              ))}
            </>
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  heading: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 16 },
  section: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 8 },
  emptyText: { color: '#888', textAlign: 'center' },
  errorText: { color: '#dc2626' },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  rowPast: { opacity: 0.6 },
  rowLeft: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  format: { fontWeight: '700', fontSize: 13, color: '#111' },
  statusDot: { fontSize: 12 },
  date: { fontSize: 14, color: '#333' },
  venue: { fontSize: 13, color: '#888' },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  players: { fontSize: 13, fontWeight: '600', color: '#555' },
  myStatut: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
});
