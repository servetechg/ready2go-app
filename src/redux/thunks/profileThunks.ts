import { createAsyncThunk } from '@reduxjs/toolkit';

import { profileService } from '@/services/profile.service';
import { setUser } from '@/redux/slices/authSlice';
import { hydrateProfileFromApi, setAlertLocations } from '@/redux/slices/registrationSlice';
import type { PatchUserRequest, ProfilePayload } from '@/types/api';
import type { AuthState } from '@/types/auth';
import type { AlertLocation } from '@/types/registration';
import { getErrorMessage } from '@/utils/error';

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
