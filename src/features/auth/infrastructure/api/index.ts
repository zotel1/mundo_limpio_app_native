/**
 * Barrel — auth/infrastructure/api.
 *
 * WHAT: Re-exporta AuthApi, DTOs y mappers.
 * WHY: Single import para consumidores dentro de infrastructure/.
 * BENEFITS: API pública clara sin imports anidados profundos.
 */
export { AuthApi } from './authApi';
export * from './dtos';
export { mapAuthResponseToSession, mapDtoToAuthResponse } from './mappers';
