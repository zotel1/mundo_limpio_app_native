/**
 * Barrel — products/infrastructure.
 *
 * WHAT: Re-exporta la API HTTP y el adapter (cuando exista).
 * WHY: Single import para consumidores de la capa de presentación.
 * BENEFITS: API pública clara sin imports anidados profundos.
 *
 * REGLA DE ORO: infrastructure/ PUEDE importar de domain/.
 *               infrastructure/ PUEDE importar de core/.
 *               infrastructure/ NUNCA importa de presentation/.
 */
export * from './api';
