import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DisasterSurveyCategoryRow } from '@/components/disaster/DisasterSurveyCategoryRow';
import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import { DISASTER_SURVEY_CATEGORIES } from '@/constants/disasterSurvey';
import { DISASTER_SURVEY_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';
import type { DisasterSurveyStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<
  DisasterSurveyStackParamList,
  typeof DISASTER_SURVEY_ROUTES.INTRO
>;

export function DisasterSurveyIntroScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppText variant="h2" color={colors.primary} center={true} style={styles.title}>
          DISASTER STATUS SURVEY
        </AppText>

        <AppText variant="body" color={colors.textSecondary} center={true} style={styles.intro}>
          Please take a few moments to let us know your current status and immediate needs.
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
        onPrimaryPress={() => navigation.navigate(DISASTER_SURVEY_ROUTES.IMMEDIATE_NEEDS)}
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
