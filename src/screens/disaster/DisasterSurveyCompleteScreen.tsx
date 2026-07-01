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

        <AppText variant="h2" color={colors.primary} center style={styles.title}>
          Thank you
        </AppText>

        <AppText variant="body" color={colors.textSecondary} center style={styles.body}>
          Your disaster status survey has been submitted. Relief coordinators will review your
          responses for emergency lodging and funding assistance.
        </AppText>

        {needs.length > 0 ? (
          <AppText variant="bodySmall" color={colors.textMuted} center style={styles.summary}>
            {needs.length} immediate need{needs.length === 1 ? '' : 's'} reported
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
