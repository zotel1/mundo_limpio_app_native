/**
 * Core/Navigation — Tipos de navegación type-safe y RootNavigator.
 *
 * WHAT: Barrel que re-exporta tipos de React Navigation y el RootNavigator
 *       con auth guard integrado.
 * WHY: Punto único de importación para navegación.
 * BENEFITS: Una sola importación: `import { RootNavigator } from '@core/navigation'`
 *           o `import type { RootStackParamList } from '@core/navigation'`
 */
export type { RootStackParamList } from './types';
export { RootNavigator } from './RootNavigator';
