/**
 * Babel config — React Native preset + TypeScript.
 *
 * WHAT: Configuración de Babel para compilar TypeScript y JSX en React Native.
 * WHY: React Native usa Babel para transpilar el código fuente. El preset
 *      `module:metro-react-native-babel-preset` es el estándar para RN 0.76+.
 * BENEFITS: Soporte para path aliases (@core/*, @features/*) y syntax moderno.
 */
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
};
