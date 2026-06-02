import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStorage } from '../context/StorageContext';
import type { Note } from '../types';
import { colors, fontSize, radius, spacing } from '../theme';
import { formatEventDate } from '../utils/date';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'NoteEdit'>;
type R = RouteProp<RootStackParamList, 'NoteEdit'>;

export const NoteEditScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { repo } = useStorage();
  const id = route.params?.id ?? null;
  const isNew = id === null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString());
  const [tagsInput, setTagsInput] = useState('');
  const [loaded, setLoaded] = useState(isNew);

  useEffect(() => {
    if (isNew || !repo) return;
    (async () => {
      const note = await repo.findById(id!);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setEventDate(note.eventDate);
        setTagsInput(note.tags.join(', '));
      }
      setLoaded(true);
    })();
  }, [id, isNew, repo]);

  const parseTags = (raw: string): string[] =>
    raw
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

  const handleSave = async () => {
    if (!repo || !title.trim()) return;
    const payload = {
      title: title.trim(),
      content: content.trim(),
      eventDate,
      tags: parseTags(tagsInput),
    };
    if (isNew) {
      await repo.create(payload);
    } else {
      await repo.update(id!, payload);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (isNew || !repo) return;
    const proceed = async () => {
      await repo.remove(id!);
      navigation.goBack();
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Удалить эту заметку?')) void proceed();
      return;
    }
    Alert.alert('Удалить заметку?', 'Действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => void proceed() },
    ]);
  };

  const canSave = title.trim().length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.headerLink}>‹ Назад</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{isNew ? 'Новая заметка' : 'Редактирование'}</Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={8}
        >
          <Text style={[styles.headerLink, styles.saveLink, !canSave && styles.saveDisabled]}>Готово</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Заголовок</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Например: Совещание по приёму 2026"
          placeholderTextColor={colors.textMuted}
          maxLength={120}
        />

        <Text style={styles.label}>Дата и время события</Text>
        <View style={styles.dateBox}>
          <Text style={styles.dateText}>{formatEventDate(eventDate)}</Text>
          <Pressable
            onPress={() => setEventDate(new Date().toISOString())}
            style={({ pressed }) => [styles.dateButton, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.dateButtonText}>Сейчас</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Содержание</Text>
        <TextInput
          style={[styles.input, styles.contentInput]}
          value={content}
          onChangeText={setContent}
          placeholder="Опишите ключевые тезисы, решения и поручения..."
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Теги (через запятую)</Text>
        <TextInput
          style={styles.input}
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholder="приёмная-комиссия, планёрка"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />

        {!isNew && (
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.85 }]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteText}>Удалить заметку</Text>
          </Pressable>
        )}
      </ScrollView>
      {!loaded && <View style={styles.overlay} />}
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
  saveLink: { fontWeight: '600', textAlign: 'right' },
  saveDisabled: { color: colors.textMuted },
  body: { padding: spacing.lg, paddingBottom: 80 },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
    color: colors.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  contentInput: { minHeight: 160 },
  dateBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: { fontSize: fontSize.md, color: colors.text },
  dateButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.tagBg,
    borderRadius: radius.sm,
  },
  dateButtonText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '500' },
  deleteBtn: {
    marginTop: spacing.xl,
    backgroundColor: '#FCE7E7',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: fontSize.md },
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(244,246,250,0.5)',
  },
});
