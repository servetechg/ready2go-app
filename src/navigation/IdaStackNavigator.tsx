import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { IDA_ROUTES } from '@/constants/routes';
import { IdaApplicantHouseholdScreen } from '@/screens/ida/IdaApplicantHouseholdScreen';
import { IdaCompleteScreen } from '@/screens/ida/IdaCompleteScreen';
import { IdaDisasterHousingScreen } from '@/screens/ida/IdaDisasterHousingScreen';
import { IdaDocumentsScreen } from '@/screens/ida/IdaDocumentsScreen';
import { IdaIntroScreen } from '@/screens/ida/IdaIntroScreen';
import { IdaNeedsInsuranceScreen } from '@/screens/ida/IdaNeedsInsuranceScreen';
import type { IdaStackParamList } from '@/types/navigation';

import { stackScreenOptions } from './screenOptions';

const Stack = createStackNavigator<IdaStackParamList>();

export function IdaStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name={IDA_ROUTES.INTRO}
        component={IdaIntroScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={IDA_ROUTES.APPLICANT}
        component={IdaApplicantHouseholdScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={IDA_ROUTES.DISASTER_HOUSING}
        component={IdaDisasterHousingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={IDA_ROUTES.NEEDS_INSURANCE}
        component={IdaNeedsInsuranceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={IDA_ROUTES.DOCUMENTS}
        component={IdaDocumentsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={IDA_ROUTES.COMPLETE}
        component={IdaCompleteScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
