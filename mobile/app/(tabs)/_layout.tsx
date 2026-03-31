import { Redirect, Tabs } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function TabsLayout() {
  const { session, initialized } = useAuthStore();

  if (initialized && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#16a34a' }}>
      <Tabs.Screen name="index" options={{ title: 'Matchs' }} />
      <Tabs.Screen name="my-matches" options={{ title: 'Mes matchs' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
