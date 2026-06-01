import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { DashboardScreenHeader } from '@/components/dashboard/DashboardTopBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/redux/hooks';
import { spacing } from '@/theme';
import { formatAddressLine } from '@/utils/formatAddress';

function ProfileRow({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <AppText variant="body" style={styles.rowText}>
        {value}
      </AppText>
    </View>
  );
}

export function ProfileScreen() {
  const { colors } = useAppTheme();
  const user = useAppSelector((s) => s.auth.user);
  const registration = useAppSelector((s) => s.registration);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <DashboardScreenHeader title="Profile" />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, styles.tabBarInset]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Ionicons name="person" size={48} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <AppText variant="h2">{fullName}</AppText>
            <ProfileRow icon="mail" value={user?.email ?? '—'} />
            <ProfileRow icon="home" value={formatAddressLine(registration.address)} />
            <ProfileRow icon="people" value={String(registration.householdSize)} />
            <ProfileRow
              icon="checkmark-circle"
              value={registration.isComplete ? 'Complete' : 'In progress'}
            />
          </View>
        </View>

        <AppText variant="h3" style={styles.sectionTitle}>
          Emergency profile
        </AppText>
        <AppCard>
          <AppText variant="body" color={colors.textSecondary}>
            Your onboarding data (medical, pets, transport, lodging) is stored securely and will be
            used for emergency planning features.
          </AppText>
        </AppCard>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  tabBarInset: { paddingBottom: 88 },
  profileHeader: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xxl, alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  rowText: { flex: 1, flexShrink: 1 },
  sectionTitle: { marginBottom: spacing.md },
});
