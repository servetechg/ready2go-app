import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { palette, spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';

import { AppText } from '../ui/AppText';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  rightElement?: React.ReactNode;
}

export function AppHeader({
  title,
  showBack = false,
  onBack,
  icon,
  rightElement,
}: AppHeaderProps) {
  const navigation = useNavigation();
  const shouldShowBack = toBoolean(showBack);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };
 
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {shouldShowBack ? (
          <Pressable onPress={handleBack} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={palette.primary} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <View style={styles.centerCol}>
        {icon ? <Ionicons name={icon} size={42} color={palette.primary} style={styles.icon} /> : null}
        {title ? (
          <AppText variant="h3" center={true} numberOfLines={2}>
            {title}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>{rightElement ?? <View style={styles.placeholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  left: { width: 40 },
  centerCol: { flex: 1, alignItems: 'center' },
  right: { width: 40, alignItems: 'flex-end' },
  icon: { marginBottom: spacing.xs },
  placeholder: { width: 24 },
});
