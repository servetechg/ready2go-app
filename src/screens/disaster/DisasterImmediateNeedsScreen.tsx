import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DisasterNeedOption } from '@/components/disaster/DisasterNeedOption';
import { DisasterSurveyThankYouModal } from '@/components/disaster/DisasterSurveyThankYouModal';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import {
  DISASTER_IMMEDIATE_NEEDS,
  type DisasterImmediateNeedId,
} from '@/constants/disasterSurvey';
import { DISASTER_SURVEY_ROUTES, MAIN_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { navigateToMainScreen } from '@/navigation/navigationHelpers';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  markDisasterSubmitted,
  setDisasterImmediateNeeds,
  clearDisasterSurvey,
  setDisasterSurveyInvitation,
} from '@/redux/slices/disasterSurveySlice';
import { disasterSurveyService } from '@/services/disasterSurvey.service';
import { spacing } from '@/theme';
import type { DisasterSurveyStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<
  DisasterSurveyStackParamList,
  typeof DISASTER_SURVEY_ROUTES.IMMEDIATE_NEEDS
>;

export function DisasterImmediateNeedsScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { showError } = useToast();
  const authToken = useAppSelector((s) => s.auth.token);
  const invitation = useAppSelector((s) => s.disasterSurvey.invitation);
  const [selected, setSelected] = useState<DisasterImmediateNeedId[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const toggleNeed = (id: DisasterImmediateNeedId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleContinue = async () => {
    if (selected.length === 0) {
      showError('Select at least one immediate need to continue.');
      return;
    }
    if (!authToken || !invitation) {
      showError('Survey invitation expired. Please reopen from Settings or your notification.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await disasterSurveyService.submit(authToken, {
        invitationId: invitation.invitationId,
        immediateNeeds: selected,
      });
      dispatch(setDisasterImmediateNeeds(selected));
      dispatch(markDisasterSubmitted(result.submittedAt));
      // Hide survey entry in Settings immediately after submit.
      dispatch(setDisasterSurveyInvitation(null));
      setShowThankYou(true);
    } catch {
      showError('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    setShowThankYou(false);
    dispatch(clearDisasterSurvey());
    navigateToMainScreen(navigation, MAIN_STACK_ROUTES.TABS);
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppHeader showBack onBack={() => navigation.goBack()} />

        <AppText variant="h3" color={colors.primary} center style={styles.title}>
          YOUR IMMEDIATE NEEDS
        </AppText>
        <AppText variant="label" color={colors.textSecondary} center style={styles.subtitle}>
          (Next 72 Hours)
        </AppText>

        <AppText variant="body" color={colors.textSecondary} style={styles.hint}>
          Select all that apply:
        </AppText>

        <View style={styles.options}>
          {DISASTER_IMMEDIATE_NEEDS.map((need) => (
            <DisasterNeedOption
              key={need.id}
              label={need.label}
              icon={need.icon}
              selected={selected.includes(need.id)}
              onPress={() => toggleNeed(need.id)}
            />
          ))}
        </View>
      </ScreenWrapper>

      <BottomButtonBar
        primaryTitle="SUBMIT SURVEY"
        onPrimaryPress={() => void handleContinue()}
        primaryLoading={submitting}
      />

      <DisasterSurveyThankYouModal
        visible={showThankYou}
        needsCount={selected.length}
        onGoHome={goHome}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: { marginBottom: spacing.xs, marginTop: spacing.sm },
  subtitle: { marginBottom: spacing.lg },
  hint: { marginBottom: spacing.md },
  options: { marginTop: spacing.sm },
});
