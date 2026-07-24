import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { DisasterSurveyCategoryRow } from '@/components/disaster/DisasterSurveyCategoryRow';
import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { DISASTER_SURVEY_CATEGORIES } from '@/constants/disasterSurvey';
import { DISASTER_SURVEY_ROUTES, MAIN_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { navigateToMainScreen } from '@/navigation/navigationHelpers';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  clearDisasterSurvey,
  setDisasterSurveyInvitation,
} from '@/redux/slices/disasterSurveySlice';
import { disasterSurveyService } from '@/services/disasterSurvey.service';
import { spacing } from '@/theme';
import type { DisasterSurveyStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<
  DisasterSurveyStackParamList,
  typeof DISASTER_SURVEY_ROUTES.INTRO
>;

export function DisasterSurveyIntroScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const authToken = useAppSelector((s) => s.auth.token);
  const invitation = useAppSelector((s) => s.disasterSurvey.invitation);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    void disasterSurveyService.getActive(authToken).then(({ invitation: active }) => {
      if (cancelled) return;
      if (!active || active.status === 'submitted') {
        dispatch(clearDisasterSurvey());
        navigateToMainScreen(navigation, MAIN_STACK_ROUTES.TABS);
        return;
      }
      dispatch(setDisasterSurveyInvitation(active));
    });

    return () => {
      cancelled = true;
    };
  }, [authToken, dispatch, navigation]);

  const startSurvey = async () => {
    if (!invitation || !authToken || invitation.status === 'submitted') return;
    try {
      await disasterSurveyService.markOpened(authToken, invitation.invitationId);
    } catch {
      // Non-blocking — user can still complete the form
    }
    navigation.navigate(DISASTER_SURVEY_ROUTES.IMMEDIATE_NEEDS);
  };

  const canStart =
    invitation != null &&
    (invitation.status === 'pending' || invitation.status === 'opened');

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppText variant="h2" color={colors.primary} center style={styles.title}>
          DISASTER STATUS SURVEY
        </AppText>

        <AppText variant="body" color={colors.textSecondary} center style={styles.intro}>
          {invitation?.campaign.title
            ? invitation.campaign.title
            : 'Please take a few moments to let us know your current status and immediate needs.'}
        </AppText>

        <View style={styles.list}>
          {DISASTER_SURVEY_CATEGORIES.map((category, index) => (
            <DisasterSurveyCategoryRow
              key={category.id}
              index={index + 1}
              title={category.title}
              icon={category.icon}
            />
          ))}
        </View>
      </ScreenWrapper>

      <BottomButtonBar
        primaryTitle="START SURVEY"
        onPrimaryPress={() => {
          if (canStart) void startSurvey();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: { marginBottom: spacing.md, letterSpacing: 0.5 },
  intro: { marginBottom: spacing.xl, lineHeight: 22 },
  list: { gap: spacing.xs },
});
