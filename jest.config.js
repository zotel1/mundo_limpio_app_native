/**
 * Jest configuration — MundoLimpio React Native.
 *
 * WHAT: Configuración de Jest para testing con React Native Testing Library + MSW.
 * WHY: Jest es el test runner estándar para proyectos React Native. Configuramos
 *      el preset de RN, path aliases, y transformIgnorePatterns para librerías
 *      que no vienen pre-transpiladas.
 * BENEFITS: Tests unitarios y de integración rápidos. MSW mockea la capa de red
 *           sin necesidad de un servidor real. Coverage gate en CI (70%).
 */
module.exports = {
  preset: 'react-native',

  // Raíz del proyecto
  rootDir: '.',

  // Archivos de test: cualquier .test.ts(x) o .spec.ts(x) dentro de src/
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.spec.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}',
  ],

  // Path aliases — sincronizados con tsconfig.json
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
  },

  // Archivo de setup ejecutado antes de cada suite de tests.
  // Inicializa MSW server para mockear la capa de red.
  setupFiles: ['./jest.setup.ts'],

  // Transform: ignora node_modules EXCEPTO paquetes que necesitan Babel
  // (librerías que no vienen pre-transpiladas a sintaxis compatible con RN).
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|react-native|@react-navigation|' +
      '@tanstack/react-query|zustand|' +
      'axios|' +
      'react-native-keychain|react-native-mmkv|' +
      '@react-native-community/netinfo' +
      ')/)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.ts', // barrel files — no contienen lógica
  ],

  // Coverage gate: lines < 70% → falla CI.
  // En Fase 0 no aplica porque no hay código fuente para testear.
  // Se activará cuando exista implementación en fases posteriores.
  coverageThreshold: {
    global: {
      lines: 70,
    },
  },

  // Fake timers para tests que usan debounce, timeouts, etc.
  fakeTimers: {
    enableGlobally: false,
  },

  // Limpiar mocks automáticamente entre tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
