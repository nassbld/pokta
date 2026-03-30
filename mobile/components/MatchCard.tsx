import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NearbyMatch } from '../hooks/useNearbyMatches';

interface Props {
  match: NearbyMatch;
  onPress?: () => void;
}

const FORMAT_LABEL: Record<string, string> = { '5v5': '5v5', '7v7': '7v7', '11v11': '11v11' };
const LEVEL_LABEL: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function MatchCard({ match, onPress }: Props) {
  const spotsLeft = match.max_players - Number(match.players_count);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.format}>{FORMAT_LABEL[match.format]}</Text>
        {match.level && <Text style={styles.level}>{LEVEL_LABEL[match.level]}</Text>}
        <Text style={styles.distance}>{formatDistance(match.distance_m)}</Text>
      </View>

      <Text style={styles.date}>{formatDate(match.scheduled_at)}</Text>

      <View style={styles.footer}>
        <Text style={styles.spots}>
          {Number(match.players_count)}/{match.max_players} joueurs
          {spotsLeft > 0 ? ` · ${spotsLeft} place${spotsLeft > 1 ? 's' : ''}` : ' · Complet'}
        </Text>
        {match.prix_par_joueur != null && (
          <Text style={styles.price}>{match.prix_par_joueur}€</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  format: { backgroundColor: '#16a34a', color: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 13, fontWeight: '700' },
  level: { color: '#666', fontSize: 13 },
  distance: { marginLeft: 'auto', color: '#999', fontSize: 13 },
  date: { fontSize: 15, fontWeight: '500', color: '#111', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spots: { fontSize: 13, color: '#555' },
  price: { fontSize: 13, fontWeight: '600', color: '#16a34a' },
});
