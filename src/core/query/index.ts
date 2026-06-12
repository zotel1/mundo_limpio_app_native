/**
 * Core/Query — Módulo de caché y estado servidor.
 *
 * WHAT: Barrel que re-exporta el QueryClient y las query keys tipadas.
 * WHY: Punto único de importación para toda la capa de caché de TanStack Query.
 * BENEFITS: Una sola importación: `import { queryClient, queryKeys } from '@core/query'`
 */
export { queryClient } from './queryClient';
export { queryKeys } from './queryKeys';
