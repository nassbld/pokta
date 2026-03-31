import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { useCreateMatch, CreateMatchPayload } from '../../hooks/useCreateMatch';
import { useVenueSearch, VenueSuggestion } from '../../hooks/useVenueSearch';

const FORMATS: CreateMatchPayload['format'][] = ['5v5', '7v7', '11v11'];
const LEVELS: { value: CreateMatchPayload['level']; label: string }[] = [
  { value: null, label: 'Tous niveaux' },
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
];
const MAX_PLAYERS: Record<CreateMatchPayload['format'], number> = { '5v5': 10, '7v7': 14, '11v11': 22 };

export default function CreateMatchScreen() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateMatch();

  const [format, setFormat] = useState<CreateMatchPayload['format']>('5v5');
  const [date, setDate] = useState(new Date(Date.now() + 3600_000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [level, setLevel] = useState<CreateMatchPayload['level']>(null);
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [joinMatch, setJoinMatch] = useState(true);
  const [venueQuery, setVenueQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<VenueSuggestion | null>(null);
  const { results: venueSuggestions, isLoading: venueLoading } = useVenueSearch(selectedVenue ? '' : venueQuery);

  async function handleSubmit() {
    const max = parseInt(maxPlayers, 10);
    if (isNaN(max) || max < 2) {
      Alert.alert('Erreur', 'Nombre de joueurs invalide.');
      return;
    }
    if (date <= new Date()) {
      Alert.alert('Erreur', 'La date doit être dans le futur.');
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erreur', 'Permission de localisation requise.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

    try {
      await mutateAsync({
        format,
        scheduled_at: date.toISOString(),
        max_players: max,
        level: level ?? null,
        description: description.trim() || null,
        prix_par_joueur: prix ? parseFloat(prix) : null,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        join_as_participant: joinMatch,
        venue: selectedVenue ? {
          name: selectedVenue.name,
          address: selectedVenue.display_name,
          lat: parseFloat(selectedVenue.lat),
          lng: parseFloat(selectedVenue.lon),
        } : null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Créer un match</Text>

      {/* Format */}
      <Text style={styles.label}>Format</Text>
      <View style={styles.row}>
        {FORMATS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, format === f && styles.chipActive]}
            onPress={() => { setFormat(f); setMaxPlayers(String(MAX_PLAYERS[f])); }}
          >
            <Text style={[styles.chipText, format === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date & heure */}
      <Text style={styles.label}>Date et heure</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateBtnText}>
            {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.dateBtnText}>
            {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(new Date(d.setHours(date.getHours(), date.getMinutes()))); }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          onChange={(_, d) => { setShowTimePicker(false); if (d) setDate(new Date(date.setHours(d.getHours(), d.getMinutes()))); }}
        />
      )}

      {/* Joueurs */}
      <Text style={styles.label}>Nombre de joueurs max</Text>
      <TextInput
        style={styles.input}
        value={maxPlayers}
        onChangeText={setMaxPlayers}
        keyboardType="number-pad"
      />

      {/* Niveau */}
      <Text style={styles.label}>Niveau</Text>
      <View style={styles.row}>
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={String(l.value)}
            style={[styles.chip, level === l.value && styles.chipActive]}
            onPress={() => setLevel(l.value)}
          >
            <Text style={[styles.chipText, level === l.value && styles.chipTextActive]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.label}>Description (optionnel)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Infos supplémentaires..."
      />

      {/* Prix */}
      <Text style={styles.label}>Prix par joueur en € (optionnel)</Text>
      <TextInput
        style={styles.input}
        value={prix}
        onChangeText={setPrix}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      {/* Terrain */}
      <Text style={styles.label}>Terrain (optionnel)</Text>
      {selectedVenue ? (
        <View style={styles.selectedVenue}>
          <View style={styles.selectedVenueText}>
            <Text style={styles.selectedVenueName}>{selectedVenue.name}</Text>
            <Text style={styles.selectedVenueAddress} numberOfLines={1}>{selectedVenue.display_name}</Text>
          </View>
          <TouchableOpacity onPress={() => { setSelectedVenue(null); setVenueQuery(''); }}>
            <Text style={styles.venueRemove}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TextInput
            style={styles.input}
            placeholder="Rechercher un terrain..."
            value={venueQuery}
            onChangeText={setVenueQuery}
          />
          {venueLoading && <ActivityIndicator size="small" color="#16a34a" style={{ marginTop: 8 }} />}
          {venueSuggestions.length > 0 && (
            <FlatList
              data={venueSuggestions}
              keyExtractor={(item) => String(item.place_id)}
              scrollEnabled={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestion}
                  onPress={() => { setSelectedVenue(item); setVenueQuery(''); }}
                >
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  <Text style={styles.suggestionAddress} numberOfLines={1}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Participation */}
      <TouchableOpacity style={styles.toggleRow} onPress={() => setJoinMatch((v) => !v)}>
        <View style={[styles.toggleBox, joinMatch && styles.toggleBoxActive]}>
          {joinMatch && <Text style={styles.toggleCheck}>✓</Text>}
        </View>
        <Text style={styles.toggleLabel}>Je participe à ce match</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isPending}>
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Créer le match</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 24, color: '#111' },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  chipActive: { borderColor: '#16a34a', backgroundColor: '#16a34a' },
  chipText: { fontSize: 14, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15 },
  textarea: { height: 80, textAlignVertical: 'top' },
  dateBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, flex: 1 },
  dateBtnText: { fontSize: 14, color: '#333', textAlign: 'center' },
  selectedVenue: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#16a34a', borderRadius: 8, padding: 12, gap: 8 },
  selectedVenueText: { flex: 1 },
  selectedVenueName: { fontSize: 14, fontWeight: '600', color: '#111' },
  selectedVenueAddress: { fontSize: 12, color: '#888', marginTop: 2 },
  venueRemove: { fontSize: 16, color: '#999', paddingHorizontal: 4 },
  suggestion: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff' },
  suggestionName: { fontSize: 14, fontWeight: '500', color: '#111' },
  suggestionAddress: { fontSize: 12, color: '#888', marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24 },
  toggleBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  toggleBoxActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  toggleCheck: { color: '#fff', fontSize: 14, fontWeight: '700' },
  toggleLabel: { fontSize: 15, color: '#333' },
  submitBtn: { backgroundColor: '#16a34a', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 32 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
