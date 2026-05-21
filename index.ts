import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { registerRootComponent } from 'expo';

import App from './App';

// JS stack — avoids native Screen boolean prop crashes on Android
enableScreens(false);

registerRootComponent(App);
