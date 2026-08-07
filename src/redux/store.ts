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
  type Persistor,
} from 'redux-persist';

import { STORAGE_KEYS } from '@/constants/storage';
import { safePersistStorage } from '@/utils/persistStorage';

import alertsReducer from './slices/alertsSlice';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import disasterSurveyReducer from './slices/disasterSurveySlice';
import emergencyNewsReducer from './slices/emergencyNewsSlice';
import notificationsReducer from './slices/notificationsSlice';
import preparednessReducer from './slices/preparednessSlice';
import registrationReducer from './slices/registrationSlice';
import uiReducer from './slices/uiSlice';
import { bindPersistor } from './persistFlush';
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
  alerts: alertsReducer,
  dashboard: dashboardReducer,
  emergencyNews: emergencyNewsReducer,
  disasterSurvey: disasterSurveyReducer,
  notifications: notificationsReducer,
  preparedness: preparednessReducer,
  ui: uiReducer,
});

/** Large GIS/alert payloads can exceed RTK's default 32ms dev check threshold. */
const DEV_SERIALIZABLE_WARN_MS = 128;

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: DEV_SERIALIZABLE_WARN_MS,
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: [
          'dashboard.emergency',
          'dashboard.home',
          'alerts.items',
          'emergencyNews.items',
          'preparedness.tasksByCategoryId',
          'preparedness.categoryDetails',
        ],
      },
      immutableCheck: {
        warnAfter: DEV_SERIALIZABLE_WARN_MS,
        ignoredPaths: [
          'dashboard.emergency',
          'dashboard.home',
          'alerts.items',
          'emergencyNews.items',
          'preparedness.tasksByCategoryId',
          'preparedness.categoryDetails',
        ],
      },
    }),
});

let persistorInstance: Persistor | null = null;

/**
 * Start redux-persist rehydration only after storage migration finishes.
 * Call once from App bootstrap before mounting PersistGate.
 */
export function initPersistor(): Persistor {
  if (!persistorInstance) {
    persistorInstance = persistStore(store);
    bindPersistor(persistorInstance);
  }
  return persistorInstance;
}

export function getPersistor(): Persistor | null {
  return persistorInstance;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
