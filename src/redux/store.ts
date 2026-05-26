import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';

import { STORAGE_KEYS } from '@/constants/storage';
import { safePersistStorage } from '@/utils/persistStorage';

import authReducer from './slices/authSlice';
import registrationReducer from './slices/registrationSlice';
import uiReducer from './slices/uiSlice';
import { authTransform, registrationTransform } from './transforms';

const authPersistConfig = {
  key: STORAGE_KEYS.AUTH,
  storage: safePersistStorage,
  whitelist: ['user', 'token', 'refreshToken', 'isAuthenticated'],
  transforms: [authTransform],
};

const registrationPersistConfig = {
  key: STORAGE_KEYS.REGISTRATION,
  storage: safePersistStorage,
  transforms: [registrationTransform],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  registration: persistReducer(registrationPersistConfig, registrationReducer),
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
