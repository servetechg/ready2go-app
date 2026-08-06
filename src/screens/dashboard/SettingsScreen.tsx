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
import { useAppTheme } from '@/hooks/useAppTheme';
import { navigateToDisasterSurveyIfActive } from '@/navigation/navigationRef';
import { useAppSelector } from '@/redux/hooks';
import { spacing } from '@/theme';
import type { MainStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.SETTINGS>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const authToken = useAppSelector((s) => s.auth.token);
  const { invitation, hasOpenSurvey } = useActiveDisasterSurvey(authToken);

  const openWeatherAlerts = () => {
    navigation.navigate(MAIN_STACK_ROUTES.TABS, {
      screen: TAB_ROUTES.HOME,
      params: { screen: HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS },
    });
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerPad}>
        <AppHeader title="Settings" showBack onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {hasOpenSurvey && invitation ? (
          <Pressable onPress={() => void navigateToDisasterSurveyIfActive()}>
            <AppCard style={[styles.card, styles.surveyCard]}>
              <AppText variant="label">Disaster relief survey</AppText>
              <AppText variant="bodySmall" color={colors.textSecondary}>
                {invitation.campaign.title}
              </AppText>
              <AppText variant="bodySmall" color={colors.primary} style={styles.surveyCta}>
                {invitation.status === 'needs_info'
                  ? 'Tap to add missing comments, pictures, or videos'
                  : 'Tap to complete your status assessment'}
              </AppText>
            </AppCard>
          </Pressable>
        ) : null}

        <Pressable onPress={() => navigation.navigate(MAIN_STACK_ROUTES.CITIZEN_ASSISTANCE)}>
          <AppCard style={styles.card}>
            <AppText variant="label">Citizen assistance</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Mark safe, request help, or report a need to coordinators
            </AppText>
          </AppCard>
        </Pressable>

        <Pressable onPress={openWeatherAlerts}>
          <AppCard style={styles.card}>
            <AppText variant="label">Weather alert subscriptions</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Manage flood, storm, and wind notifications
            </AppText>
          </AppCard>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerPad: {},
  content: { paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.md },
  surveyCard: { borderWidth: 1, borderColor: '#DC2626' },
  surveyCta: { marginTop: spacing.sm, fontWeight: '600' },
});
