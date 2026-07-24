import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import {
  DISASTER_SURVEY_ROUTES,
  DRAWER_ROUTES,
  MAIN_STACK_ROUTES,
  ROOT_ROUTES,
} from '@/constants/routes';
import { setDisasterSurveyInvitation } from '@/redux/slices/disasterSurveySlice';
import { store } from '@/redux/store';
import { disasterSurveyService } from '@/services/disasterSurvey.service';
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

export function navigateToNotifications(): void {
  if (!navigationRef.isReady()) return;

  navigationRef.dispatch(
    CommonActions.navigate({
      name: ROOT_ROUTES.MAIN,
      params: {
        screen: DRAWER_ROUTES.MAIN,
        params: {
          screen: MAIN_STACK_ROUTES.NOTIFICATIONS,
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

/**
 * Opens the survey only when the user still has a pending/opened invitation.
 * After submit, taps do nothing (aside from a short info toast).
 */
export async function navigateToDisasterSurveyIfActive(): Promise<boolean> {
  const token = store.getState().auth.token;
  if (!token) return false;

  try {
    const { invitation } = await disasterSurveyService.getActive(token);
    if (!invitation || invitation.status === 'submitted') {
      store.dispatch(setDisasterSurveyInvitation(null));
      Toast.show({
        type: 'info',
        text1: 'This survey is already completed.',
        position: 'bottom',
      });
      return false;
    }
    store.dispatch(setDisasterSurveyInvitation(invitation));
    navigateToDisasterSurveyIntro();
    return true;
  } catch {
    return false;
  }
}
