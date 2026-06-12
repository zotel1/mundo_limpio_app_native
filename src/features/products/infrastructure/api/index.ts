/**
 * Barrel — products/infrastructure/api.
 *
 * WHAT: Re-exporta ProductApi, DTOs y mappers.
 * WHY: Single import para consumidores dentro de infrastructure/.
 * BENEFITS: API pública clara sin imports anidados profundos.
 */
export { ProductApi } from './productApi';
export * from './dtos';
export * from './mappers';
