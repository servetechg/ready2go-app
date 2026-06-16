import { useNavigation } from '@react-navigation/native';

import { StackNavigationProp } from '@react-navigation/stack';

import React, { useState } from 'react';

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';



import { AppCheckbox } from '@/components/form/AppCheckbox';

import { AppHeader } from '@/components/layout/AppHeader';

import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

import { AppButton } from '@/components/ui/AppButton';

import { AppCard } from '@/components/ui/AppCard';

import { AppText } from '@/components/ui/AppText';

import { HOME_STACK_ROUTES, MAIN_STACK_ROUTES, TAB_ROUTES } from '@/constants/routes';

import { useAppTheme } from '@/hooks/useAppTheme';

import { useToast } from '@/hooks/useToast';

import { navigateToDisasterSurveyIntro } from '@/navigation/navigationRef';

import { useAppSelector } from '@/redux/hooks';

import {
  getNotificationsUnavailableReason,

  notificationService,
} from '@/services/notification.service';

import { profileService } from '@/services/profile.service';

import { spacing } from '@/theme';

import type { MainStackParamList } from '@/types/navigation';



type Nav = StackNavigationProp<MainStackParamList, typeof MAIN_STACK_ROUTES.SETTINGS>;



export function SettingsScreen() {

  const navigation = useNavigation<Nav>();

  const { colors } = useAppTheme();

  const { showSuccess, showError, showInfo } = useToast();

  const authToken = useAppSelector((s) => s.auth.token);

  const [disasterTestEnabled, setDisasterTestEnabled] = useState(false);



  const openWeatherAlerts = () => {

    navigation.navigate(MAIN_STACK_ROUTES.TABS, {

      screen: TAB_ROUTES.HOME,

      params: { screen: HOME_STACK_ROUTES.WEATHER_ALERT_SETTINGS },

    });

  };



  const handleTestLocalNotification = async () => {

    const limitation = getNotificationsUnavailableReason();

    if (limitation) {

      showError(limitation);

      return;

    }



    const id = await notificationService.sendImmediateTestNotification();

    if (id) {

      showSuccess('Local test notification sent!');

    } else {

      showError('Failed to send notification. Check permissions.');

    }

  };



  const handleTestServerPush = async () => {

    const limitation = getNotificationsUnavailableReason();

    if (limitation) {

      showError(limitation);

      return;

    }

    if (!authToken) {

      showError('Sign in to test server push.');

      return;

    }



    try {

      await profileService.sendTestServerPush(authToken);

      showSuccess('Server push sent! Check your device.');

    } catch (e) {

      const message =

        e instanceof Error ? e.message : 'Failed to send server push. Ensure token is registered.';

      showError(message);

    }

  };



  const handleSendDisasterNotification = async () => {

    const limitation = getNotificationsUnavailableReason();

    if (limitation) {

      showInfo('Notifications limited in Expo Go. Use "Open survey directly" below.');

      return;

    }



    const id = await notificationService.sendDisasterSurveyTestNotification();

    if (id) {

      showSuccess('Disaster alert sent! Tap the notification to open the survey.');

    } else {

      showError('Failed to send disaster alert. Check notification permissions.');

    }

  };



  const handleOpenDisasterSurvey = () => {

    navigateToDisasterSurveyIntro();

  };



  return (

    <ScreenWrapper>

      <View style={styles.headerPad}>

        <AppHeader title="Settings" showBack={true} onBack={() => navigation.goBack()} />

      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <Pressable onPress={() => navigation.navigate(MAIN_STACK_ROUTES.SPLASH_PREVIEW)}>
          <AppCard style={styles.card}>
            <AppText variant="label">Preview splash screen (APK style)</AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Full-screen preview — same logo size and background as the native launch splash
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



        <AppCard style={styles.card}>

          <AppText variant="label" style={styles.sectionTitle}>

            Disaster relief survey (testing)

          </AppText>

          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.sectionBody}>

            Simulate the post-disaster notification and status survey flow. Funding integration

            will be added later.

          </AppText>



          <AppCheckbox

            label="Enable disaster survey test mode"

            checked={disasterTestEnabled}

            onToggle={() => setDisasterTestEnabled((v) => !v)}

          />



          {disasterTestEnabled ? (

            <View style={styles.testActions}>

              <AppButton
 
                title="Send disaster notification"

                size="sm"

                onPress={() => void handleSendDisasterNotification()}

              />

              <AppButton

                title="Open survey directly"

                variant="outline"

                size="sm"

                onPress={handleOpenDisasterSurvey}

              />

            </View>

          ) : null}

        </AppCard>



        <Pressable onPress={handleTestLocalNotification}>

          <AppCard style={styles.card}>

            <AppText variant="label">Test local notification</AppText>

            <AppText variant="bodySmall" color={colors.textSecondary}>

              Fires on this device only (no backend)

            </AppText>

          </AppCard>

        </Pressable>



        <Pressable onPress={handleTestServerPush}>

          <AppCard style={styles.card}>

            <AppText variant="label">Test server push</AppText>

            <AppText variant="bodySmall" color={colors.textSecondary}>

              Sends via backend Expo API (same path as profile reminder cron)

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

  sectionTitle: { marginBottom: spacing.xs },

  sectionBody: { marginBottom: spacing.md, lineHeight: 20 },

  testActions: { gap: spacing.sm, marginTop: spacing.sm },

});


