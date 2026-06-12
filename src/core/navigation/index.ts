/**
 * Core/Navigation — Tipos de navegación type-safe.
 *
 * WHAT: Barrel que re-exporta los tipos de React Navigation para la app.
 * WHY: Punto único de importación para RootStackParamList y tipos relacionados.
 * BENEFITS: Una sola importación: `import type { RootStackParamList } from '@core/navigation'`
 */
export type { RootStackParamList } from './types';
