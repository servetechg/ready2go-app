import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DisasterNeedOption } from '@/components/disaster/DisasterNeedOption';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomButtonBar } from '@/components/layout/BottomButtonBar';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppText } from '@/components/ui/AppText';
import {
  DISASTER_IMMEDIATE_NEEDS,
  type DisasterImmediateNeedId,
} from '@/constants/disasterSurvey';
import { DISASTER_SURVEY_ROUTES } from '@/constants/routes';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useToast } from '@/hooks/useToast';
import { useAppDispatch } from '@/redux/hooks';
import { submitDisasterImmediateNeeds } from '@/redux/slices/disasterSurveySlice';
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
  const [selected, setSelected] = useState<DisasterImmediateNeedId[]>([]);

  const toggleNeed = (id: DisasterImmediateNeedId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    if (selected.length === 0) {
      showError('Select at least one immediate need to continue.');
      return;
    }

    dispatch(submitDisasterImmediateNeeds({ needs: selected, isTest: true }));
    navigation.navigate(DISASTER_SURVEY_ROUTES.COMPLETE);
  };

  return (
    <View style={styles.wrapper}>
      <ScreenWrapper contentContainerStyle={styles.content}>
        <AppHeader showBack={true} onBack={() => navigation.goBack()} />

        <AppText variant="h3" color={colors.primary} center={true} style={styles.title}>
          YOUR IMMEDIATE NEEDS
        </AppText>
        <AppText variant="label" color={colors.textSecondary} center={true} style={styles.subtitle}>
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

      <BottomButtonBar primaryTitle="CONTINUE" onPrimaryPress={handleContinue} />
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
