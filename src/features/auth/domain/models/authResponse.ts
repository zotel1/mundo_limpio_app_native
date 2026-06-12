// WHAT: Respuesta del backend para login/register/refresh
// WHY: Campos exactos del AuthResponse del backend Spring Boot
export interface AuthResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly roles: string[];
  readonly username: string;
  readonly email?: string | null;
  readonly userId?: number | null;
}
