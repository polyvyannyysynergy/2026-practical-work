import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStorage } from '../context/StorageContext';
import type { StorageMode } from '../types';
import { colors, fontSize, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { mode, setMode } = useStorage();
  const [migrating, setMigrating] = useState(false);

  const confirmMigration = (next: StorageMode): Promise<boolean> => {
    return new Promise(resolve => {
      const msg = 'Скопировать имеющиеся заметки в новый режим хранения? Старые данные останутся на месте — их можно будет удалить вручную.';
      if (Platform.OS === 'web') {
        resolve(typeof window !== 'undefined' && window.confirm(msg));
        return;
      }
      Alert.alert('Переключить режим', msg, [
        { text: 'Отмена', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Только переключить', onPress: () => resolve(false) },
        { text: 'Скопировать', onPress: () => resolve(true) },
      ]);
    });
  };

  const handleSwitch = async (next: StorageMode) => {
    if (next === mode) return;
    setMigrating(true);
    try {
      const migrate = await confirmMigration(next);
      await setMode(next, migrate);
    } finally {
      setMigrating(false);
    }
  };

  const options: Array<{ value: StorageMode; title: string; desc: string }> = [
    { value: 'sqlite', title: 'База SQLite', desc: 'Локальная реляционная база; быстрый поиск по полям' },
    { value: 'files',  title: 'Файлы устройства', desc: 'Каждая заметка — отдельный JSON-файл в документной директории' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.headerLink}>‹ Назад</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>Режим хранения данных</Text>
        <View style={styles.card}>
          {options.map((opt, idx) => {
            const active = mode === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.row, idx > 0 && styles.rowBorder]}
                onPress={() => void handleSwitch(opt.value)}
                disabled={migrating}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{opt.title}</Text>
                  <Text style={styles.rowDesc}>{opt.desc}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
          {Platform.OS === 'web' && (
            <View style={styles.webBanner}>
              <Text style={styles.webBannerText}>
                В веб-демо данные хранятся в оперативной памяти, поэтому переключение режима недоступно. На устройстве оба режима работают штатно.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>О приложении</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Версия</Text>
              <Text style={styles.rowDesc}>NoteWork 1.0.0</Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Назначение</Text>
              <Text style={styles.rowDesc}>Ведение деловых заметок на совещаниях, встречах и консультациях Университета «Синергия».</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  headerLink: { fontSize: fontSize.md, color: colors.primary, minWidth: 60 },
  body: { padding: spacing.lg },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowText: { flex: 1, marginRight: spacing.md },
  rowTitle: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  rowDesc: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioInner: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary,
  },
  webBanner: {
    padding: spacing.md,
    backgroundColor: '#FFF7E6',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  webBannerText: {
    fontSize: fontSize.xs,
    color: '#8A5C00',
    lineHeight: 16,
  },
});
