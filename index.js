/**
 * Entry point — React Native App Registry.
 *
 * WHAT: Registra el componente raíz App con el runtime de React Native.
 * WHY: React Native espera un entry point que llame a AppRegistry.registerComponent.
 *      Este archivo es el punto de entrada estándar para apps RN bare (no Expo).
 * BENEFITS: Separación clara entre el registro nativo y el componente React raíz.
 */
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
