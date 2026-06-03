import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DashboardScreenHeader } from '@/components/dashboard/DashboardTopBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { PROFILE_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/redux/hooks';
import { fontSize, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/types/navigation';
import { formatAddressLine } from '@/utils/formatAddress';

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={styles.label}>
        {label}:
      </Text>
      <AppText variant="body">
        {value}
      </AppText>
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  const { colors } = useAppTheme();
  const user = useAppSelector((s) => s.auth.user);
  const registration = useAppSelector((s) => s.registration);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

  return (
    <ScreenWrapper>
      <View>
        <DashboardScreenHeader
          title="Profile"
          rightElement={
            <Pressable
              onPress={() => navigation.navigate(PROFILE_STACK_ROUTES.EDIT_PROFILE)}
              hitSlop={12}
              accessibilityLabel="Edit profile">
              <Ionicons name="create-outline" size={24} color="black" />
            </Pressable>
          }
        />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, styles.tabBarInset]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Ionicons name="person" size={48} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <ProfileRow label="Name" value={fullName} />
            <ProfileRow label="Email" value={user?.email ?? '—'} />
            <ProfileRow label="Home" value={formatAddressLine(registration.address)} />
            <ProfileRow label="People" value={String(registration.householdSize)} />
            <ProfileRow
              label="Status"
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
  // headerPad: { paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  tabBarInset: { paddingBottom: 88 },
  profileHeader: { flexDirection: 'column', gap: spacing.lg, marginBottom: spacing.xxl, alignItems: 'center' },
  avatar: {
    width: 95,
    height: 95,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#33375D',
  },
  profileInfo: { flex: 1, gap: spacing.sm },
  row: {paddingBottom: spacing.sm, marginBottom: spacing.md, borderWidth: 0, borderColor: '#E2E3E6', borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', width: '100%' }, 
  label: { fontSize: fontSize.lg, fontWeight: '600' },
  sectionTitle: { marginBottom: spacing.md },
});
