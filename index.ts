import { LogBox } from 'react-native';

// Suppress the warning/error overlay related to Expo Go SDK 53+ remote notification restrictions.
// This must be configured before importing any other modules (including App) to catch evaluation-time errors.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Android Push notifications (remote notifications)',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { registerRootComponent } from 'expo';

import App from './App';

// JS stack — avoids native Screen boolean prop crashes on Android
enableScreens(false);

registerRootComponent(App);
