import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import * as Location from 'expo-location';
import { useNearbyMatches } from '../../hooks/useNearbyMatches';
import { MatchCard } from '../../components/MatchCard';

export default function MatchsScreen() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { data: matches, isLoading, error, refetch, isRefetching } = useNearbyMatches(
    coords?.lat ?? null,
    coords?.lng ?? null,
  );

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
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={matches}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MatchCard match={item} />}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Aucun match à proximité pour l'instant.</Text>
        </View>
      }
      ListHeaderComponent={<Text style={styles.heading}>Matchs à proximité</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#111' },
  loadingText: { marginTop: 12, color: '#666' },
  errorText: { color: '#dc2626', textAlign: 'center' },
  emptyText: { color: '#666', textAlign: 'center' },
});
