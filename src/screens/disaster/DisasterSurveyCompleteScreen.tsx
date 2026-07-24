import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DisasterSurveyThankYouModal } from '@/components/disaster/DisasterSurveyThankYouModal';
import { DISASTER_SURVEY_ROUTES, MAIN_STACK_ROUTES } from '@/constants/routes';
import { navigateToMainScreen } from '@/navigation/navigationHelpers';
import { useAppSelector } from '@/redux/hooks';
import type { DisasterSurveyStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<
  DisasterSurveyStackParamList,
  typeof DISASTER_SURVEY_ROUTES.COMPLETE
>;

/** Route fallback — primary thank-you UX is the modal after submit. */
export function DisasterSurveyCompleteScreen() {
  const navigation = useNavigation<Nav>();
  const needs = useAppSelector((s) => s.disasterSurvey.immediateNeeds);

  const goHome = () => {
    navigateToMainScreen(navigation, MAIN_STACK_ROUTES.TABS);
  };

  return (
    <View style={styles.wrapper}>
      <DisasterSurveyThankYouModal visible needsCount={needs.length} onGoHome={goHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
});
