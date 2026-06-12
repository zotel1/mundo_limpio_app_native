/**
 * SplashRepository — Puerto para health check del backend.
 *
 * WHAT: Interfaz abstracta que define el contrato para verificar
 *       que el backend está operativo antes de mostrar la app.
 * WHY: Siguiendo Clean Architecture, el dominio define QUÉ se necesita
 *      (health check) sin saber CÓMO se implementa (HTTP, gRPC, etc.).
 * BENEFITS: Testeable — el adapter se mockea en tests de SplashScreen.
 *           Intercambiable — se puede cambiar la implementación sin
 *           tocar el dominio ni la presentación.
 *
 * TDD: GREEN — implementación mínima (interfaz pura, sin lógica).
 */

export interface SplashRepository {
  /**
   * Despierta el backend haciendo un health check.
   *
   * @returns true si el backend respondió con estado saludable (200),
   *          false si hubo error de red, timeout, o estado no saludable.
   */
  wakeBackend(): Promise<boolean>;
}
