import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NoteCard } from '../components/NoteCard';
import { EmptyState } from '../components/EmptyState';
import { FilterPanel, type FilterState } from '../components/FilterPanel';
import { useNotes } from '../hooks/useNotes';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useStorage } from '../context/StorageContext';
import { colors, fontSize, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation';
import type { Note, SearchQuery } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'NoteList'>;

const EMPTY_FILTER: FilterState = { dateFrom: '', dateTo: '', tags: [] };

function dateRangeToIso(value: string, end = false): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return end ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`;
}

export const NoteListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { notes, refresh, remove, query } = useNotes();
  const { mode, repo } = useStorage();
  const [text, setText] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const debouncedText = useDebouncedValue(text, 300);
  const [allNotes, setAllNotes] = useState<Note[]>([]);

  // Re-fetch the full set for tag chips when underlying mode/repo changes
  useEffect(() => {
    if (!repo) return;
    void repo.findAll().then(setAllNotes);
  }, [repo, mode]);

  useEffect(() => {
    const q: SearchQuery = {};
    if (debouncedText.trim()) q.text = debouncedText.trim();
    if (filter.dateFrom) q.dateFrom = dateRangeToIso(filter.dateFrom);
    if (filter.dateTo)   q.dateTo   = dateRangeToIso(filter.dateTo, true);
    if (filter.tags.length) q.tags = filter.tags;
    void query(q);
  }, [debouncedText, filter, query]);

  const subtitle = useMemo(() => {
    if (mode === 'sqlite') return 'Хранение: SQLite';
    if (mode === 'files') return 'Хранение: файлы';
    return 'Хранение: память (демо)';
  }, [mode]);

  const activeFilterCount =
    (filter.dateFrom ? 1 : 0) + (filter.dateTo ? 1 : 0) + filter.tags.length;

  const handleDelete = (id: string, title: string) => {
    const proceed = async () => {
      await remove(id);
      if (repo) setAllNotes(await repo.findAll());
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Удалить заметку «${title}»?`)) void proceed();
      return;
    }
    Alert.alert('Удалить заметку?', `«${title}» будет удалена без возможности восстановления.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => void proceed() },
    ]);
  };

  const resetFilters = () => setFilter(EMPTY_FILTER);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appTitle}>NoteWork</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Pressable
          accessibilityLabel="Открыть настройки"
          onPress={() => navigation.navigate('Settings')}
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Text style={styles.iconText}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по заметкам"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          returnKeyType="search"
        />
        {text.length > 0 && (
          <Pressable onPress={() => setText('')} hitSlop={8} style={{ marginRight: spacing.sm }}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel="Фильтры по дате и тегам"
          onPress={() => setFilterOpen(v => !v)}
          style={({ pressed }) => [styles.filterButton, filterOpen && styles.filterButtonOpen, pressed && { opacity: 0.7 }]}
          hitSlop={6}
        >
          <Text style={[styles.filterIcon, filterOpen && styles.filterIconActive]}>≡</Text>
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {filterOpen && (
        <FilterPanel
          state={filter}
          onChange={setFilter}
          onReset={resetFilters}
          notes={allNotes}
        />
      )}

      {notes.length === 0 ? (
        <EmptyState
          title={text || activeFilterCount > 0 ? 'Ничего не найдено' : 'Заметок пока нет'}
          hint={
            text || activeFilterCount > 0
              ? 'Попробуйте изменить запрос или сбросить фильтры'
              : 'Нажмите кнопку «+», чтобы создать первую запись'
          }
        />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 96 }}
          onRefresh={refresh}
          refreshing={false}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => navigation.navigate('NoteEdit', { id: item.id })}
              onLongPress={() => handleDelete(item.id, item.title)}
            />
          )}
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
        onPress={() => navigation.navigate('NoteEdit', { id: null })}
        accessibilityLabel="Создать новую заметку"
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
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
    alignItems: 'flex-end',
  },
  appTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  iconText: { fontSize: 22, color: colors.primary },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    paddingLeft: spacing.md,
    paddingRight: 4,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm, color: colors.textMuted },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  clearText: { color: colors.textMuted, fontSize: 16 },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonOpen: { backgroundColor: colors.primary },
  filterIcon: { fontSize: 22, color: colors.primary, fontWeight: '700', lineHeight: 24 },
  filterIconActive: { color: colors.surface },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.surface, fontSize: 10, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  fabIcon: {
    color: colors.surface,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '500',
  },
});
