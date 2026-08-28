import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { HOME_STACK_ROUTES, MAIN_STACK_ROUTES, TAB_ROUTES } from '@/constants/routes';
import { useActiveDisasterSurvey } from '@/hooks/useActiveDisasterSurvey';
import { useActiveIda } from '@/hooks/useActiveIda';
import { usePendingCitizenActivitySupplement } from '@/hooks/usePendingCitizenActivitySupplement';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PROFILE_STACK_ROUTES } from '@/constants/routes';
import {
  navigateToCitizenAssistanceIfPending,
  navigateToDisasterSurveyIfActive,
  navigateToIdaIfActive,
} from '@/navigation/navigationRef';
import { useAppSelector } from '@/redux/hooks';
import { spacing } from '@/theme';
import type { MainStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.SETTINGS>;

function SettingItem({
  title,
  subtitle,
  icon,
  onPress,
  isDanger
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isDanger?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
      <AppCard style={{ ...styles.card, ...(isDanger ? styles.surveyCard : {}) }}>
        <View style={styles.itemRow}>
          <View style={[styles.iconContainer, { backgroundColor: isDanger ? '#FEE2E2' : colors.accent }]}>
            <Ionicons name={icon} size={24} color={isDanger ? '#DC2626' : colors.primary} />
          </View>
          <View style={styles.itemText}>
            <AppText variant="label">{title}</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>{subtitle}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </AppCard>
    </Pressable>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const authToken = useAppSelector((s) => s.auth.token);
  const { invitation, hasOpenSurvey } = useActiveDisasterSurvey(authToken);
  const { invitation: idaInvitation, hasOpenIda } = useActiveIda(authToken);
  const { pending: citizenPending, hasPendingSupplement } =
    usePendingCitizenActivitySupplement(authToken);

  const openWeatherAlerts = () => {
    navigation.navigate(MAIN_STACK_ROUTES.TABS, {
      screen: TAB_ROUTES.HOME,
      params: { screen: HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS },
    });
  };

  const openEditProfile = () => {
    navigation.navigate(MAIN_STACK_ROUTES.TABS, {
      screen: TAB_ROUTES.PROFILE,
      params: { screen: PROFILE_STACK_ROUTES.EDIT_PROFILE },
    });
  };

  const handleUpdatePassword = () => {
    navigation.navigate(MAIN_STACK_ROUTES.CHANGE_PASSWORD);
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title="Settings" showBack onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {hasOpenSurvey && invitation ? (
          <SettingItem
            title="Disaster relief survey"
            subtitle={
              invitation.status === 'needs_info'
                ? 'Tap to add missing comments, pictures, or videos'
                : 'Tap to complete your status assessment'
            }
            icon="clipboard-outline"
            isDanger={true}
            onPress={() => void navigateToDisasterSurveyIfActive()}
          />
        ) : null}

        {hasOpenIda && idaInvitation ? (
          <SettingItem
            title="Initial Disaster Assistance"
            subtitle={
              idaInvitation.status === 'needs_info'
                ? 'Tap to add missing documents or details'
                : 'Tap to complete your assistance application'
            }
            icon="document-text-outline"
            isDanger={true}
            onPress={() => void navigateToIdaIfActive()}
          />
        ) : null}

        {hasPendingSupplement && citizenPending ? (
          <SettingItem
            title="Citizen report — details needed"
            subtitle="Tap to add missing details, pictures, or videos"
            icon="alert-circle-outline"
            isDanger
            onPress={() => void navigateToCitizenAssistanceIfPending()}
          />
        ) : null}

        <SettingItem
          title="Citizen Assistant"
          subtitle="Mark safe, request help, or report a need with photos or video"
          icon="shield-checkmark-outline"
          onPress={() => navigation.navigate(MAIN_STACK_ROUTES.CITIZEN_ASSISTANCE)}
        />

        <SettingItem
          title="Weather alert subscriptions"
          subtitle="Manage flood, storm, and wind notifications"
          icon="thunderstorm-outline"
          onPress={openWeatherAlerts}
        />

        <SettingItem
          title="Edit Profile"
          subtitle="Update your personal details and contact information"
          icon="person-circle-outline"
          onPress={openEditProfile}
        />

        <SettingItem
          title="Update Password"
          subtitle="Change your account password securely"
          icon="lock-closed-outline"
          onPress={handleUpdatePassword}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: {},
  content: { paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.md, paddingVertical: spacing.md },
  surveyCard: { borderWidth: 1, borderColor: '#DC2626' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemText: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
