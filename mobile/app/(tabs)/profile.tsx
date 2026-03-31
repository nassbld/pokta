import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useProfile, useUpdateProfile, Profile } from '../../hooks/useProfile';

const POSITIONS: { value: Profile['position']; label: string }[] = [
  { value: 'gardien', label: 'Gardien' },
  { value: 'defenseur', label: 'Défenseur' },
  { value: 'milieu', label: 'Milieu' },
  { value: 'attaquant', label: 'Attaquant' },
];

const LEVELS: { value: Profile['level']; label: string }[] = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
];

export default function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const { mutateAsync, isPending } = useUpdateProfile();

  const [username, setUsername] = useState('');
  const [position, setPosition] = useState<Profile['position']>(null);
  const [level, setLevel] = useState<Profile['level']>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setPosition(profile.position);
      setLevel(profile.level);
    }
  }, [profile]);

  async function handleSave() {
    if (!username.trim()) {
      Alert.alert('Erreur', 'Le pseudo ne peut pas être vide.');
      return;
    }
    try {
      await mutateAsync({ username: username.trim(), position, level });
      Alert.alert('Profil mis à jour');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Mon profil</Text>

      <Text style={styles.label}>Pseudo</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="Ton pseudo"
      />

      <Text style={styles.label}>Poste</Text>
      <View style={styles.row}>
        {POSITIONS.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.chip, position === p.value && styles.chipActive]}
            onPress={() => setPosition(position === p.value ? null : p.value)}
          >
            <Text style={[styles.chipText, position === p.value && styles.chipTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Niveau</Text>
      <View style={styles.row}>
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l.value}
            style={[styles.chip, level === l.value && styles.chipActive]}
            onPress={() => setLevel(level === l.value ? null : l.value)}
          >
            <Text style={[styles.chipText, level === l.value && styles.chipTextActive]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isPending}>
        {isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>Enregistrer</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutBtn} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  chipActive: { borderColor: '#16a34a', backgroundColor: '#16a34a' },
  chipText: { fontSize: 14, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: '#16a34a', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signOutBtn: { marginTop: 16, padding: 16, alignItems: 'center' },
  signOutText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
});
