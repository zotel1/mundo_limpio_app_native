import { AuthSession, LoginRequest, RegisterRequest } from '../models';

// WHAT: Puerto de autenticación — contrato entre domain e infrastructure
// WHY: La capa domain define QUÉ se necesita, infrastructure define CÓMO.
//      Mismo patrón que AuthRepository abstracto en Flutter.
// BENEFITS: UI y use cases no conocen Axios, Keychain ni HTTP.
//           Fácil de mockear en tests de use cases y stores.

export interface AuthRepository {
  /**
   * Inicia sesión con email y contraseña.
   * @throws AuthException si credenciales inválidas (401)
   * @throws NetworkException si no hay conexión
   */
  login(request: LoginRequest): Promise<AuthSession>;

  /**
   * Registra un nuevo usuario. NO autentica automáticamente (R2.1).
   * El usuario debe iniciar sesión después del registro.
   * @throws ConflictException si el email ya existe (409)
   */
  register(request: RegisterRequest): Promise<AuthSession>;

  /**
   * Refresca el access token usando el refresh token.
   * @throws AuthException si el refresh token expiró
   */
  refreshToken(refreshToken: string): Promise<AuthSession>;

  /**
   * Cierra sesión: limpia tokens locales. NO llama al backend.
   */
  logout(): Promise<void>;

  /**
   * Verifica si hay tokens guardados localmente.
   * NO valida expiración — solo existencia.
   */
  isLoggedIn(): Promise<boolean>;
}
