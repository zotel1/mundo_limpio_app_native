/**
 * Barrel — core/storage.
 *
 * WHAT: Re-exporta todos los contratos e implementaciones del módulo storage:
 *       ITokenStorage, IKeyValueStorage, MMKVStorage, OfflineQueue.
 * WHY: Single import para los consumidores:
 *      `import { ITokenStorage, IKeyValueStorage, MMKVStorage } from '@core/storage'`.
 * BENEFITS: API pública clara, sin imports anidados.
 */
export type { ITokenStorage } from './tokenStorage';
export { InMemoryTokenStorage } from './tokenStorage';

export type { IKeyValueStorage } from './IKeyValueStorage';
export { MMKVStorage } from './MMKVStorage';
