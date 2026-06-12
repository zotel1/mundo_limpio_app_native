/**
 * TokenStorage — Almacenamiento de tokens JWT.
 *
 * WHAT: Interfaz ITokenStorage + implementación en memoria para desarrollo
 *       temprano. La implementación real con react-native-keychain se agrega
 *       en PR 1.4. Equivalente al `token_storage.dart` del Flutter.
 * WHY: Abstraer el almacenamiento de tokens para que el authInterceptor y
 *      AuthRepository no dependan directamente de Keychain.
 * BENEFITS: Fácil de mockear en tests, intercambiable (Keychain → otra lib),
 *           single source of truth para tokens.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de tokenStorage.test.ts.
 */

// ──── Interfaz ────

/**
 * WHAT: Interfaz para almacenamiento de tokens JWT.
 * WHY: Abstracción sobre react-native-keychain — permite mockear en tests.
 * BENEFITS: Single source of truth, cambiable sin tocar consumidores.
 */
export interface ITokenStorage {
  saveTokens(accessToken: string, refreshToken: string): Promise<void>;
  readAccessToken(): Promise<string | null>;
  readRefreshToken(): Promise<string | null>;
  hasTokens(): Promise<boolean>;
  clear(): Promise<void>;
}

// ──── Implementación en memoria ────

/**
 * WHAT: Implementación en memoria de ITokenStorage para desarrollo temprano.
 * WHY: Evita dependencia de módulo nativo (react-native-keychain) hasta que
 *      el proyecto esté corriendo en un dispositivo.
 * BENEFITS: Permite desarrollar y testear el authInterceptor sin device.
 */
export class InMemoryTokenStorage implements ITokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async readAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  async readRefreshToken(): Promise<string | null> {
    return this.refreshToken;
  }

  async hasTokens(): Promise<boolean> {
    return this.accessToken !== null && this.refreshToken !== null;
  }

  async clear(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
  }
}
