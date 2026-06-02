import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Note } from '../types';
import { colors, fontSize, radius, spacing } from '../theme';
import { formatEventDate } from '../utils/date';

interface Props {
  note: Note;
  onPress: () => void;
  onLongPress: () => void;
}

export const NoteCard: React.FC<Props> = ({ note, onPress, onLongPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: colors.tagBg }}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{note.title}</Text>
        <Text style={styles.date}>{formatEventDate(note.eventDate)}</Text>
      </View>
      {!!note.content && (
        <Text style={styles.content} numberOfLines={2}>{note.content}</Text>
      )}
      {note.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {note.tags.slice(0, 4).map(tag => (
            <View style={styles.tag} key={tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  content: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.tagBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginRight: spacing.xs,
    marginTop: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.tagText,
    fontWeight: '500',
  },
});
