import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { DISASTER_SURVEY_ROUTES, MAIN_STACK_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { navigateToMainScreen } from '@/navigation/navigationHelpers';
import { useAppSelector } from '@/redux/hooks';
import { spacing } from '@/theme';
import type { DisasterSurveyStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<
  DisasterSurveyStackParamList,
  typeof DISASTER_SURVEY_ROUTES.COMPLETE
>;

export function DisasterSurveyCompleteScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const needs = useAppSelector((s) => s.disasterSurvey.immediateNeeds);

  const goHome = () => {
    navigateToMainScreen(navigation, MAIN_STACK_ROUTES.TABS);
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
        </View>

        <AppText variant="h2" color={colors.primary} center={true} style={styles.title}>
          Thank you
        </AppText>

        <AppText variant="body" color={colors.textSecondary} center={true} style={styles.body}>
          Your immediate needs have been recorded. Relief coordination and funding will be handled
          in a future update — for now this is a test submission.
        </AppText>

        {needs.length > 0 ? (
          <AppText variant="bodySmall" color={colors.textMuted} center={true} style={styles.summary}>
            {needs.length} need{needs.length === 1 ? '' : 's'} selected
          </AppText>
        ) : null}
      </ScreenWrapper>

      <BottomButtonBar primaryTitle="BACK TO HOME" onPrimaryPress={goHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  iconWrap: { marginBottom: spacing.xl },
  title: { marginBottom: spacing.md },
  body: { lineHeight: 24, marginBottom: spacing.lg },
  summary: { marginTop: spacing.sm },
});
