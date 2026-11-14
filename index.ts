// Expo's winter runtime polyfills the WHATWG URL API automatically.
import { registerRootComponent } from 'expo';

import App from './App';

// Registers the app with AppRegistry — Expo Go / dev clients look for "main".
registerRootComponent(App);
