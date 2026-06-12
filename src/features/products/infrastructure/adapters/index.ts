/**
 * Barrel — products/infrastructure/adapters.
 *
 * WHAT: Re-exporta el ProductRepositoryAdapter.
 * WHY: Single import para consumers de infrastructure o composition root.
 * BENEFITS: API pública clara sin imports anidados profundos.
 */
export { ProductRepositoryAdapter } from './productRepositoryAdapter';
