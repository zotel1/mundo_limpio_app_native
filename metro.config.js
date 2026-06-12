/**
 * Metro config — React Native bundler.
 *
 * WHAT: Configuración del bundler Metro para React Native 0.76+.
 * WHY: Metro es el bundler por defecto de RN. Esta configuración mínima
 *      usa los defaults que vienen con react-native.
 * BENEFITS: Permite personalizar el bundling en el futuro (ej: SVGs, assets).
 */
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {};

module.exports = mergeConfig(defaultConfig, config);
