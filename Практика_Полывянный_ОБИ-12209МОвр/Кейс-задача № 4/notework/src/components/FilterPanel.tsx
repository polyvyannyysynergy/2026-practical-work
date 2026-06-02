import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Note } from '../types';
import { colors, fontSize, radius, spacing } from '../theme';

export interface FilterState {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  tags: string[];
}

interface Props {
  state: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  notes: Note[];
}

const inputProps = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

export const FilterPanel: React.FC<Props> = ({ state, onChange, onReset, notes }) => {
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => set.add(t)));
    return [...set].sort();
  }, [notes]);

  const toggleTag = (tag: string) => {
    const next = state.tags.includes(tag)
      ? state.tags.filter(t => t !== tag)
      : [...state.tags, tag];
    onChange({ ...state, tags: next });
  };

  const setDate = (key: 'dateFrom' | 'dateTo', value: string) => {
    onChange({ ...state, [key]: value });
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Фильтры</Text>
        <Pressable onPress={onReset} hitSlop={6}>
          <Text style={styles.resetText}>Сбросить</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Диапазон дат события</Text>
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>с</Text>
          <TextInput
            style={[styles.dateInput, inputProps]}
            placeholder="ГГГГ-ММ-ДД"
            placeholderTextColor={colors.textMuted}
            value={state.dateFrom}
            onChangeText={v => setDate('dateFrom', v)}
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="numeric"
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>по</Text>
          <TextInput
            style={[styles.dateInput, inputProps]}
            placeholder="ГГГГ-ММ-ДД"
            placeholderTextColor={colors.textMuted}
            value={state.dateTo}
            onChangeText={v => setDate('dateTo', v)}
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="numeric"
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Теги</Text>
      {allTags.length === 0 ? (
        <Text style={styles.emptyTags}>Тегов пока нет — они появятся, когда создадите заметки.</Text>
      ) : (
        <View style={styles.tagsRow}>
          {allTags.map(tag => {
            const active = state.tags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.tagChip, active && styles.tagChipActive]}
              >
                <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                  #{tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  resetText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '500' },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  dateRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  dateField: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dateLabel: {
    width: 22,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.bg,
    borderRadius: 16,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  tagChipTextActive: {
    color: colors.surface,
    fontWeight: '500',
  },
  emptyTags: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
