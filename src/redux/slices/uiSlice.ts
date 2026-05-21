import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { ColorScheme } from '@/theme';

interface UiState {
  colorScheme: ColorScheme;
  globalLoading: boolean;
  globalError: string | null;
  toastMessage: string | null;
}

const initialState: UiState = {
  colorScheme: 'light',
  globalLoading: false,
  globalError: null,
  toastMessage: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setColorScheme: (state, action: PayloadAction<ColorScheme>) => {
      state.colorScheme = action.payload;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload;
    },
    showToast: (state, action: PayloadAction<string>) => {
      state.toastMessage = action.payload;
    },
    clearToast: (state) => {
      state.toastMessage = null;
    },
  },
});

export const { setColorScheme, setGlobalLoading, setGlobalError, showToast, clearToast } =
  uiSlice.actions;

export default uiSlice.reducer;
