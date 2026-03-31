import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';

import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useNearbyMatches, NearbyMatch } from '../../hooks/useNearbyMatches';
import { MatchCard } from '../../components/MatchCard';

type Format = '5v5' | '7v7' | '11v11';
type Niveau = 'debutant' | 'intermediaire' | 'avance';

const FORMATS: Format[] = ['5v5', '7v7', '11v11'];
const NIVEAUX: { value: Niveau; label: string }[] = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
];

export default function MatchsScreen() {
  const router = useRouter();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<Format | null>(null);
  const [niveauFilter, setNiveauFilter] = useState<Niveau | null>(null);

  const { data: matches, isLoading, error, refetch, isRefetching } = useNearbyMatches(
    coords?.lat ?? null,
    coords?.lng ?? null,
  );

  const filtered = (matches ?? []).filter((m: NearbyMatch) => {
    if (formatFilter && m.format !== formatFilter) return false;
    if (niveauFilter && m.level !== niveauFilter) return false;
    return true;
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission de localisation refusée.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
    })();
  }, []);

  if (locationError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{locationError}</Text>
      </View>
    );
  }

  if (!coords || isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>{!coords ? 'Localisation...' : 'Chargement des matchs...'}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Impossible de charger les matchs.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} onPress={() => router.push(`/match/${item.id}`)} />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Aucun match à proximité pour l'instant.</Text>
          </View>
        }
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>Matchs à proximité</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
              {FORMATS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, formatFilter === f && styles.chipActive]}
                  onPress={() => setFormatFilter(formatFilter === f ? null : f)}
                >
                  <Text style={[styles.chipText, formatFilter === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.filterSeparator} />
              {NIVEAUX.map((n) => (
                <TouchableOpacity
                  key={n.value}
                  style={[styles.chip, niveauFilter === n.value && styles.chipActive]}
                  onPress={() => setNiveauFilter(niveauFilter === n.value ? null : n.value)}
                >
                  <Text style={[styles.chipText, niveauFilter === n.value && styles.chipTextActive]}>{n.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(modals)/create-match')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#111' },
  loadingText: { marginTop: 12, color: '#666' },
  errorText: { color: '#dc2626', textAlign: 'center' },
  emptyText: { color: '#666', textAlign: 'center' },
  filterBar: { marginBottom: 12 },
  filterContent: { gap: 8, paddingVertical: 2 },
  filterSeparator: { width: 1, backgroundColor: '#ddd', marginHorizontal: 4 },
  chip: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, backgroundColor: '#fff' },
  chipActive: { borderColor: '#16a34a', backgroundColor: '#16a34a' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
