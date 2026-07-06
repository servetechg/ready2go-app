import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

import {
  DISASTER_SURVEY_ROUTES,
  DRAWER_ROUTES,
  MAIN_STACK_ROUTES,
  ROOT_ROUTES,
} from '@/constants/routes';
import type { RootStackParamList } from '@/types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToCitizenAssistance(): void {
  if (!navigationRef.isReady()) return;

  navigationRef.dispatch(
    CommonActions.navigate({
      name: ROOT_ROUTES.MAIN,
      params: {
        screen: DRAWER_ROUTES.MAIN,
        params: {
          screen: MAIN_STACK_ROUTES.CITIZEN_ASSISTANCE,
        },
      },
    }),
  );
}

export function navigateToDisasterSurveyIntro(): void {
  if (!navigationRef.isReady()) return;

  navigationRef.dispatch(
    CommonActions.navigate({
      name: ROOT_ROUTES.MAIN,
      params: {
        screen: DRAWER_ROUTES.MAIN,
        params: {
          screen: MAIN_STACK_ROUTES.DISASTER_SURVEY,
          params: {
            screen: DISASTER_SURVEY_ROUTES.INTRO,
          },
        },
      },
    }),
  );
}
