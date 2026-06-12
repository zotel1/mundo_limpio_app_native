// WHAT: Entidad de dominio que representa una sesión autenticada
// WHY: Single source of truth para datos del usuario autenticado.
//      Capa domain: NO depende de React, RN, Axios, Zustand ni TanStack.
// BENEFITS: Tipo inmutable, serializable, fácil de mockear en tests

export interface AuthSession {
  readonly userId: number;
  readonly username: string;
  readonly email: string | null;
  readonly roles: readonly string[];
}

// WHAT: Factory para crear AuthSession desde la respuesta del backend
// WHY: Centraliza la lógica de creación — si el backend cambia un campo,
//      solo se actualiza este factory
export function createAuthSession(params: {
  userId: number;
  username: string;
  email?: string | null;
  roles: string[];
}): AuthSession {
  return {
    userId: params.userId,
    username: params.username,
    email: params.email ?? null,
    roles: Object.freeze([...params.roles]),
  };
}
