/**
 * Mappers — Funciones de mapeo DTO ↔ Domain.
 *
 * WHAT: Funciones puras que transforman datos entre capas.
 * WHY: El adapter recibe DTOs validados de la API y los convierte a entidades
 *      de dominio. La capa domain nunca ve DTOs.
 * BENEFITS: Si el backend cambia el nombre de un campo, solo se actualiza
 *           el mapper. Domain permanece intacto.
 */
import { AuthResponseDto } from './dtos';
import { AuthSession, createAuthSession, AuthResponse } from '../../domain';

// WHAT: Convierte DTO de auth response a entidad de dominio AuthSession
// WHY: El adapter transforma datos externos (API) en entidades puras (domain)
// BENEFITS: Domain nunca conoce la forma de los DTOs del backend
export function mapAuthResponseToSession(dto: AuthResponseDto): AuthSession {
  return createAuthSession({
    userId: dto.userId ?? 0,
    username: dto.username,
    email: dto.email,
    roles: dto.roles,
  });
}

// WHAT: Convierte DTO a AuthResponse (DTO de dominio)
// WHY: Útil para el authInterceptor que necesita los tokens
export function mapDtoToAuthResponse(dto: AuthResponseDto): AuthResponse {
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    roles: dto.roles,
    username: dto.username,
    email: dto.email,
    userId: dto.userId,
  };
}
