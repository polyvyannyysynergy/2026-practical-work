import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { StorageProvider, useStorage } from './src/context/StorageContext';
import { NoteListScreen } from './src/screens/NoteListScreen';
import { NoteEditScreen } from './src/screens/NoteEditScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import type { RootStackParamList } from './src/navigation';
import { seedDemoData } from './src/seed';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const Shell: React.FC = () => {
  const { ready, repo, mode } = useStorage();
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!ready || !repo) return;
    if (Platform.OS === 'web') {
      (async () => {
        await seedDemoData(repo);
        setSeeded(true);
      })();
    } else {
      setSeeded(true);
    }
  }, [ready, repo, mode]);

  if (!ready || !seeded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="NoteList">
        <Stack.Screen name="NoteList" component={NoteListScreen} />
        <Stack.Screen name="NoteEdit" component={NoteEditScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StorageProvider defaultMode="sqlite">
        <StatusBar style="dark" />
        <Shell />
      </StorageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  loaderText: {
    marginTop: 12,
    color: colors.textMuted,
  },
});
