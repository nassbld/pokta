import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mon profil</Text>
      <TouchableOpacity style={styles.button} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 18, color: '#333' },
  button: { backgroundColor: '#dc2626', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
