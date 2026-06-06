import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import type { PreparednessTask } from '@/types/preparedness';

function getTaskDisplayText(task: PreparednessTask): string {
  const title = task.title.trim();
  const body = task.body?.trim();

  if (!body) return title;

  const redundantPrefixes = [
    `Complete this step: ${title}`,
    `Complete this step: ${title}.`,
  ];

  if (redundantPrefixes.includes(body)) return title;

  const stripped = body.replace(/^Complete this step:\s*/i, '').trim();
  if (!stripped || stripped === title) return title;

  return stripped;
}

interface PreparednessTaskListProps {
  tasks: PreparednessTask[];
}

export function PreparednessTaskList({ tasks }: PreparednessTaskListProps) {
  const { colors } = useAppTheme();

  if (tasks.length === 0) {
    return (
      <AppCard>
        <AppText variant="body" color={colors.textSecondary} center={true}>
          No steps available in this guide yet.
        </AppText>
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <AppText variant="label" color={colors.primary}>
          Key Steps
        </AppText>
        <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
          <AppText variant="caption" color={colors.primary}>
            {tasks.length}
          </AppText>
        </View>
      </View>

      <View style={styles.list}>
        {tasks.map((task, index) => (
          <View key={task.id}>
            <View style={styles.row}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <AppText variant="body" color={colors.text} style={styles.text}>
                {getTaskDisplayText(task)}
              </AppText>
            </View>
            {index < tasks.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            ) : null}
          </View>
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  list: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  text: {
    flex: 1,
    lineHeight: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md + 6,
  },
});
