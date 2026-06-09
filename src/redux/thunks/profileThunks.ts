import { createAsyncThunk } from '@reduxjs/toolkit';

import { profileService } from '@/services/profile.service';
import { setUser } from '@/redux/slices/authSlice';
import {
  clearPreparednessCache,
  fetchCategories,
} from '@/redux/slices/preparednessSlice';
import {
  hydrateProfileFromApi,
  setAlertLocations,
  setProofOfOwnership,
  setProofOfResidency,
} from '@/redux/slices/registrationSlice';
import type { PatchUserRequest, ProfilePayload } from '@/types/api';
import type { AuthState } from '@/types/auth';
import type { AlertLocation, RegistrationState } from '@/types/registration';
import type { LocalProfileDocument, ProfileDocumentValue } from '@/types/profileDocument';
import { isLocalProfileDocument } from '@/types/profileDocument';
import { getErrorMessage } from '@/utils/error';
import type { ProfileDocumentKind } from '@/services/profile.service';

function getToken(getState: () => unknown): string | null {
  return (getState() as { auth: AuthState }).auth.token;
}

export const patchUserAccount = createAsyncThunk(
  'profile/patchUserAccount',
  async (body: PatchUserRequest, { getState, dispatch, rejectWithValue }) => {
    const token = getToken(getState);
    if (!token) return rejectWithValue('Not authenticated');
    try {
      const response = await profileService.patchUser(token, body);
      dispatch(setUser(response.user));
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not update account'));
    }
  },
);

export const patchEmergencyProfile = createAsyncThunk(
  'profile/patchEmergencyProfile',
  async (body: Partial<ProfilePayload>, { getState, dispatch, rejectWithValue }) => {
    const token = getToken(getState);
    if (!token) return rejectWithValue('Not authenticated');
    try {
      const response = await profileService.patchProfile(token, body);
      dispatch(hydrateProfileFromApi(response.profile));
      if (body.address) {
        dispatch(clearPreparednessCache());
        void dispatch(fetchCategories(undefined));
      }
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not update profile'));
    }
  },
);

export const uploadProfileAvatar = createAsyncThunk(
  'profile/uploadAvatar',
  async (
    file: { uri: string; mimeType: string; name: string },
    { getState, dispatch, rejectWithValue },
  ) => {
    const token = getToken(getState);
    if (!token) return rejectWithValue('Not authenticated');
    try {
      const response = await profileService.uploadAvatar(token, file);
      dispatch(setUser(response.user));
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not upload photo'));
    }
  },
);

export const deleteProfileAvatar = createAsyncThunk(
  'profile/deleteAvatar',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const token = getToken(getState);
    if (!token) return rejectWithValue('Not authenticated');
    try {
      const response = await profileService.deleteAvatar(token);
      dispatch(setUser(response.user));
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not remove photo'));
    }
  },
);

export const saveAlertLocations = createAsyncThunk(
  'profile/saveAlertLocations',
  async (locations: AlertLocation[], { getState, dispatch, rejectWithValue }) => {
    const token = getToken(getState);
    if (!token) return rejectWithValue('Not authenticated');
    try {
      const response = await profileService.putAlertLocations(token, locations);
      dispatch(setAlertLocations(response.alertLocations));
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not save alert locations'));
    }
  },
);

async function uploadLocalDocument(
  token: string,
  kind: ProfileDocumentKind,
  file: LocalProfileDocument,
  dispatch: (action: unknown) => void,
) {
  const response = await profileService.uploadProfileDocument(token, kind, {
    uri: file.uri,
    mimeType: file.mimeType,
    name: file.name,
  });
  if (response.profile) {
    dispatch(hydrateProfileFromApi(response.profile));
  } else {
    const setter = kind === 'ownership' ? setProofOfOwnership : setProofOfResidency;
    dispatch(setter(response.document));
  }
  return response.document;
}

export const uploadProfileDocument = createAsyncThunk(
  'profile/uploadDocument',
  async (
    payload: { kind: ProfileDocumentKind; file: LocalProfileDocument },
    { getState, dispatch, rejectWithValue },
  ) => {
    const token = getToken(getState);
    if (!token) return rejectWithValue('Not authenticated');
    try {
      const document = await uploadLocalDocument(token, payload.kind, payload.file, dispatch);
      return { kind: payload.kind, document };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not upload document'));
    }
  },
);

/** Upload any locally picked documents before profile/complete. */
export async function uploadPendingProfileDocuments(
  token: string,
  registration: RegistrationState,
  dispatch: (action: unknown) => void,
): Promise<void> {
  if (registration.proofOfOwnership && isLocalProfileDocument(registration.proofOfOwnership)) {
    await uploadLocalDocument(token, 'ownership', registration.proofOfOwnership, dispatch);
  }
  if (registration.proofOfResidency && isLocalProfileDocument(registration.proofOfResidency)) {
    await uploadLocalDocument(token, 'residency', registration.proofOfResidency, dispatch);
  }
}
