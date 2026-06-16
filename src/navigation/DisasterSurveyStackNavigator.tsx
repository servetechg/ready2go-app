import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { DISASTER_SURVEY_ROUTES } from '@/constants/routes';
import { DisasterImmediateNeedsScreen } from '@/screens/disaster/DisasterImmediateNeedsScreen';
import { DisasterSurveyCompleteScreen } from '@/screens/disaster/DisasterSurveyCompleteScreen';
import { DisasterSurveyIntroScreen } from '@/screens/disaster/DisasterSurveyIntroScreen';
import type { DisasterSurveyStackParamList } from '@/types/navigation';

import { stackScreenOptions } from './screenOptions';

const Stack = createStackNavigator<DisasterSurveyStackParamList>();

export function DisasterSurveyStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name={DISASTER_SURVEY_ROUTES.INTRO}
        component={DisasterSurveyIntroScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={DISASTER_SURVEY_ROUTES.IMMEDIATE_NEEDS}
        component={DisasterImmediateNeedsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={DISASTER_SURVEY_ROUTES.COMPLETE}
        component={DisasterSurveyCompleteScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
