/**
 * ESLint configuration — MundoLimpio React Native.
 *
 * WHAT: Reglas de linting con enfoque en arquitectura hexagonal: no-restricted-imports
 *       bloquea imports entre capas que violan la regla de dependencia.
 * WHY: La arquitectura hexagonal exige que domain/ no dependa de frameworks (React, RN,
 *      Axios, etc.) y que application/ no dependa de infrastructure/. ESLint lo fuerza
 *      en tiempo de compilación, no solo en code review.
 * BENEFITS: Previene acoplamiento accidental entre capas. El error se detecta en CI
 *           antes de que llegue a revisión humana.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    es2022: true,
    node: true,
    jest: true,
  },
  rules: {
    // Reglas generales de TypeScript
    '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', {allow: ['warn', 'error']}],
  },

  overrides: [
    // ============================================================
    // CAPA DOMAIN: No puede importar de frameworks, infraestructura, ni presentación.
    // domain/ solo depende de tipos puros y contratos (ports).
    // ============================================================
    {
      files: ['src/**/domain/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['react', 'react-native', 'react-native/*'],
                message:
                  'domain/ NO puede importar de React o React Native. ' +
                  'La capa de dominio es TypeScript puro, sin dependencias de UI.',
              },
              {
                group: ['axios', '@tanstack/*', 'zustand'],
                message:
                  'domain/ NO puede importar frameworks externos (Axios, TanStack Query, Zustand). ' +
                  'Usá contratos (ports) y dejá que infrastructure/ implemente.',
              },
              {
                group: ['@react-navigation/*', 'react-hook-form', 'zod'],
                message:
                  'domain/ NO puede importar librerías de navegación o formularios. ' +
                  'La lógica de dominio es independiente de la UI.',
              },
              {
                group: ['**/infrastructure/**', '**/presentation/**'],
                message:
                  'domain/ NO puede importar de infrastructure/ ni presentation/. ' +
                  'La regla de dependencia hexagonal va de exterior → interior, nunca al revés.',
              },
            ],
          },
        ],
      },
    },

    // ============================================================
    // CAPA APPLICATION (usecases): Restricciones intermedias
    // ============================================================
    {
      files: ['src/features/*/domain/usecases/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/infrastructure/**', '**/presentation/**'],
                message:
                  'usecases/ NO puede importar de infrastructure/ ni presentation/. ' +
                  'Los casos de usos dependen solo de puertos (ports) del dominio.',
              },
            ],
          },
        ],
      },
    },
  ],

  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'babel.config.js',
    'metro.config.js',
    'jest.config.js',
    'jest.setup.ts',
    'coverage/',
  ],
};
