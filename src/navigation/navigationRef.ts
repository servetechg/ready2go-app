import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import {
  DISASTER_SURVEY_ROUTES,
  DRAWER_ROUTES,
  IDA_ROUTES,
  MAIN_STACK_ROUTES,
  ROOT_ROUTES,
} from '@/constants/routes';
import { setDisasterSurveyInvitation } from '@/redux/slices/disasterSurveySlice';
import { setCitizenActivityPendingSupplement } from '@/redux/slices/citizenActivitySlice';
import { setIdaInvitation } from '@/redux/slices/idaSlice';
import { store } from '@/redux/store';
import { disasterSurveyService } from '@/services/disasterSurvey.service';
import { idaService } from '@/services/ida.service';
import { citizenActivityService } from '@/services/citizenActivity.service';
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

/**
 * Opens Citizen Assistant when the user has a pending missing-details request.
 */
export async function navigateToCitizenAssistanceIfPending(): Promise<boolean> {
  const token = store.getState().auth.token;
  if (!token) return false;

  try {
    const { pending } = await citizenActivityService.getPendingSupplement(token);
    if (!pending || pending.requestedMissingFields.length === 0) {
      store.dispatch(setCitizenActivityPendingSupplement(null));
      Toast.show({
        type: 'info',
        text1: 'No additional report details are needed right now.',
        position: 'bottom',
      });
      return false;
    }
    store.dispatch(setCitizenActivityPendingSupplement(pending));
    navigateToCitizenAssistance();
    return true;
  } catch {
    return false;
  }
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

export function navigateToIdaIntro(): void {
  if (!navigationRef.isReady()) return;

  navigationRef.dispatch(
    CommonActions.navigate({
      name: ROOT_ROUTES.MAIN,
      params: {
        screen: DRAWER_ROUTES.MAIN,
        params: {
          screen: MAIN_STACK_ROUTES.IDA,
          params: {
            screen: IDA_ROUTES.INTRO,
          },
        },
      },
    }),
  );
}

/**
 * Opens IDA only when the user still has a pending/opened/needs_info invitation.
 */
export async function navigateToIdaIfActive(): Promise<boolean> {
  const token = store.getState().auth.token;
  if (!token) return false;

  try {
    const { invitation } = await idaService.getActive(token);
    if (!invitation || invitation.status === 'submitted') {
      store.dispatch(setIdaInvitation(null));
      Toast.show({
        type: 'info',
        text1: 'This application is already completed.',
        position: 'bottom',
      });
      return false;
    }
    store.dispatch(setIdaInvitation(invitation));
    navigateToIdaIntro();
    return true;
  } catch {
    return false;
  }
}
