import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { palette, spacing } from '@/theme';
import type { PreparednessTask } from '@/types/dashboard';

function TaskRow({
  task,
  open,
  onToggle,
}: {
  task: PreparednessTask;
  open: boolean;
  onToggle: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <AppCard style={styles.card}>
      <Pressable
        onPress={onToggle}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}>
        <AppText variant="label" style={styles.title}>
          {task.title}
        </AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.primary}
        />
      </Pressable>
      {open ? (
        <AppText variant="body" color={colors.textSecondary} style={styles.body}>
          {task.body}
        </AppText>
      ) : null}
    </AppCard>
  );
}

interface PreparednessTaskListProps {
  tasks: PreparednessTask[];
}

export function PreparednessTaskList({ tasks }: PreparednessTaskListProps) {
  const { colors } = useAppTheme();
  const [openId, setOpenId] = useState<string>(tasks[0]?.id ?? '');

  if (tasks.length === 0) {
    return (
      <AppText variant="body" color={colors.textSecondary}>
        No tasks available in this category yet.
      </AppText>
    );
  }

  return (
    <View style={styles.list}>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          open={openId === task.id}
          onToggle={() => setOpenId(task.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: { paddingVertical: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { flex: 1 },
  body: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.borderLight,
    lineHeight: 22,
  },
});
