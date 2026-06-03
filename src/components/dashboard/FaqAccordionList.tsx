import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { FAQ_ITEMS } from '@/constants/faq';
import { useAppTheme } from '@/hooks/useAppTheme';
import { palette, spacing } from '@/theme';

function FaqRow({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
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
        <AppText variant="label" style={styles.question}>
          {question}
        </AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.primary}
        />
      </Pressable>
      {open ? (
        <AppText variant="body" color={colors.textSecondary} style={styles.answer}>
          {answer}
        </AppText>
      ) : null}
    </AppCard>
  );
}

export function FaqAccordionList() {
  const [openId, setOpenId] = useState<string>(FAQ_ITEMS[0]?.id ?? '');

  const handleToggle = (id: string) => {
    setOpenId(id);
  };

  return (
    <View style={styles.list}>
      {FAQ_ITEMS.map((item) => (
        <FaqRow
          key={item.id}
          question={item.question}
          answer={item.answer}
          open={openId === item.id}
          onToggle={() => handleToggle(item.id)}
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
  question: { flex: 1 },
  answer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.borderLight,
  },
});
