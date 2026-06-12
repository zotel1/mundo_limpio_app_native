/**
 * Babel config — React Native preset (0.76+).
 *
 * WHAT: Configuración de Babel usando @react-native/babel-preset que incluye
 *       el parser de Hermes para manejar tipos Flow modernos (mapped types,
 *       keyof, etc.) presentes en react-native 0.76 internals.
 * WHY: metro-react-native-babel-preset usa @babel/plugin-syntax-flow que
 *      no soporta la sintaxis Flow más reciente. @react-native/babel-preset
 *      usa babel-plugin-syntax-hermes-parser que sí la soporta.
 * BENEFITS: Compatibilidad total con RN 0.76.9 para Jest y Metro.
 */
module.exports = {
  presets: ['@react-native/babel-preset'],
};
