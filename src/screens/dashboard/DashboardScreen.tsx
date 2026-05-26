import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MainLayout } from '@/components/layout/MainLayout';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logoutUser } from '@/redux/slices/authSlice';
import { resetRegistration } from '@/redux/slices/registrationSlice';
import { spacing } from '@/theme';
import { toBoolean } from '@/utils/coerce';

export function DashboardScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const registration = useAppSelector((s) => s.registration);
  const { colors } = useAppTheme();

  const profileComplete = toBoolean(user?.profileComplete ?? registration.isComplete);

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(resetRegistration());
  };

  return (
    <MainLayout title="Dashboard">
      <AppCard style={styles.card}>
        <AppText variant="h3">Welcome, {user?.firstName ?? 'User'}!</AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
          Your emergency profile is {profileComplete ? 'complete' : 'in progress'}.
        </AppText>
      </AppCard>

      <View style={styles.stats}>
        <StatItem icon="home" label="Household" value={String(registration.householdSize)} />
        <StatItem
          icon="location"
          label="City"
          value={registration.address.city || '—'}
        />
        <StatItem
          icon="checkmark-circle"
          label="Status"
          value={profileComplete ? 'Registered' : 'Pending'}
        />
      </View>

      <AppButton title="SIGN OUT" variant="outline" onPress={handleLogout} style={styles.logout} />
    </MainLayout>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();
  return (
    <AppCard style={styles.statCard} padded={true}>
      <Ionicons name={icon} size={28} color={colors.primary} />
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="h3">{value}</AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  sub: { marginTop: spacing.sm },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', gap: spacing.xs },
  logout: { marginTop: spacing.xxxl },
});
