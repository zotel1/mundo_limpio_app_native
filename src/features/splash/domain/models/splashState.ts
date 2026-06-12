/**
 * SplashState — Estados de la pantalla splash.
 *
 * WHAT: Tipo de unión con 4 estados + entidad SplashStatus que modela
 *       la máquina de estados de la splash screen.
 * WHY: Equivalente exacto a splash_state.dart del Flutter. Los 4 estados
 *      cubren: reposo, transición, reintento, y resolución.
 * BENEFITS: Type-safe — TypeScript rechaza cualquier estado no definido
 *           en compilación. Sin errores de typo en strings mágicas.
 *
 * TDD: GREEN — implementación mínima para pasar splashState.test.ts.
 */

/**
 * SplashState — estados posibles de la máquina de la splash screen.
 *
 * - idle: Estado inicial, gato durmiendo, esperando tap del usuario.
 * - waking: Transición activa: health check + timer de animación corriendo.
 * - retry: Backend caído después de timeout. Muestra botón Reintentar.
 * - resolved: Health check OK + auth resuelto. Navega a Home o Login.
 */
export type SplashState = 'idle' | 'waking' | 'retry' | 'resolved';

/**
 * SplashStatus — entidad que agrupa el estado actual con los flags
 * de las 3 condiciones en paralelo.
 *
 * WHAT: Modela el estado completo de la splash screen en cualquier
 *       momento de su ciclo de vida.
 * WHY: Los 3 flags (wakeOk, wakeCompleted, authResolved) corren en
 *      paralelo. La combinación determina la transición de estado.
 * BENEFITS: Una sola entidad observable. Fácil de testear y debuggear.
 */
export interface SplashStatus {
  /** Estado actual de la máquina */
  state: SplashState;
  /** Health check del backend: true si GET /actuator/health respondió 200 */
  wakeOk: boolean;
  /** Health check completado (independientemente del resultado) */
  wakeCompleted: boolean;
  /** Auth resuelto: true si tokenStorage ya verificó si hay tokens */
  authResolved: boolean;
}
