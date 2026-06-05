import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AlertLocationsEditor } from '@/components/dashboard/AlertLocationsEditor';
import { ProfileAvatarDisplay } from '@/components/profile/ProfileAvatarDisplay';
import { DashboardScreenHeader } from '@/components/dashboard/DashboardTopBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { EMERGENCY_PROFILE_MESSAGE } from '@/constants/faq';
import { MAIN_STACK_ROUTES, PROFILE_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useRefreshProfileOnFocus } from '@/hooks/useRefreshProfileOnFocus';
import { useToast } from '@/hooks/useToast';
import { navigateToMainScreen } from '@/navigation/navigationHelpers';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { saveAlertLocations } from '@/redux/thunks/profileThunks';
import { fontSize, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/types/navigation';
import type { AlertLocation } from '@/types/registration';
import { formatAddressLine } from '@/utils/formatAddress';
import { toBoolean } from '@/utils/coerce';
import { e164ToPhoneDisplay } from '@/utils/phone';

const MAX_ALERT_LOCATIONS = 5;

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const registration = useAppSelector((s) => s.registration);
  const [savingLocations, setSavingLocations] = useState(false);

  useRefreshProfileOnFocus();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const profileComplete = toBoolean(user?.profileComplete ?? registration.isComplete);

  const persistAlertLocations = useCallback(
    async (locations: AlertLocation[]) => {
      if (locations.length > MAX_ALERT_LOCATIONS) {
        showError('Maximum 5 alert locations allowed');
        return;
      }
      setSavingLocations(true);
      const result = await dispatch(saveAlertLocations(locations));
      setSavingLocations(false);
      if (saveAlertLocations.fulfilled.match(result)) {
        showSuccess('Alert locations updated');
      } else {
        const message =
          typeof result.payload === 'string' ? result.payload : 'Could not save locations';
        showError(message);
      }
    },
    [dispatch, showError, showSuccess],
  );

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
          <ProfileAvatarDisplay />
          <View style={styles.profileInfo}>
            <ProfileRow label="Name" value={fullName} />
            <ProfileRow label="Email" value={user?.email ?? '—'} />
            <ProfileRow
              label="Phone"
              value={user?.phone ? e164ToPhoneDisplay(user.phone) : '—'}
            />
            <ProfileRow label="Home" value={formatAddressLine(registration.address)} />
            <ProfileRow label="People" value={String(registration.householdSize)} />
            <ProfileRow label="Status" value={profileComplete ? 'Complete' : 'In progress'} />
          </View>
        </View>

        <AppText variant="h3" style={styles.sectionTitle}>
          Emergency profile
        </AppText>
        <AppCard>
          <AppText variant="body" color={colors.textSecondary}>
            {EMERGENCY_PROFILE_MESSAGE}
          </AppText>
          <Pressable
            onPress={() => navigateToMainScreen(navigation, MAIN_STACK_ROUTES.FAQ)}
            style={styles.faqLink}
            accessibilityRole="link">
            <AppText variant="label" color={colors.primary}>
              Refer to the FAQs for more information →
            </AppText>
          </Pressable>
        </AppCard>

        <AppText variant="h3" style={styles.sectionTitle}>
          Alert locations
        </AppText>
        <AppCard>
          {savingLocations ? (
            <ActivityIndicator color={colors.primary} style={styles.locationsLoader} />
          ) : null}
          <AlertLocationsEditor
            locations={registration.alertLocations}
            maxLocations={MAX_ALERT_LOCATIONS}
            onChange={(locations) => void persistAlertLocations(locations)}
            compact={true}
          />
        </AppCard>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xxxl },
  tabBarInset: { paddingBottom: 72 },
  profileHeader: {
    flexDirection: 'column',
    gap: spacing.lg,
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  profileInfo: { flex: 1, gap: spacing.sm },
  row: {
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#E2E3E6',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    width: '100%',
  },
  label: { fontSize: fontSize.lg, fontWeight: '600' },
  sectionTitle: { marginBottom: spacing.md, marginTop: spacing.lg },
  faqLink: { marginTop: spacing.md },
  locationsLoader: { marginBottom: spacing.sm },
});
