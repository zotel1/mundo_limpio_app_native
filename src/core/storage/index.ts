/**
 * Barrel — core/storage.
 *
 * WHAT: Re-exporta la interfaz y la implementación de TokenStorage.
 * WHY: Single import para los consumidores:
 *      `import { ITokenStorage, InMemoryTokenStorage } from '@core/storage'`.
 * BENEFITS: API pública clara, sin imports anidados.
 */
export type { ITokenStorage } from './tokenStorage';
export { InMemoryTokenStorage } from './tokenStorage';
