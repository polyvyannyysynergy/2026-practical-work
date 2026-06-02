import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme';

interface Props {
  title: string;
  hint?: string;
}

export const EmptyState: React.FC<Props> = ({ title, hint }) => (
  <View style={styles.root}>
    <View style={styles.iconCircle}>
      <Text style={styles.icon}>📝</Text>
    </View>
    <Text style={styles.title}>{title}</Text>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: { fontSize: 32 },
  title: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
