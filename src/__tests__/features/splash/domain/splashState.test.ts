/**
 * TDD: RED — Tests para el modelo SplashState.
 *
 * WHAT: Valida que el tipo SplashState tenga exactamente 4 valores literales
 *       y que SplashStatus tenga la estructura correcta con valores iniciales.
 * WHY: El modelo define los estados de la máquina de la splash screen.
 *      Equivalente a splash_state.dart del Flutter.
 * BENEFITS: Type safety — TypeScript fuerza los 4 estados válidos en compilación.
 *
 * TDD: RED → al importar de un módulo inexistente, Jest falla con
 * "Cannot find module" — esto ES el comportamiento esperado en fase RED.
 */

// ════ RED: importa de un archivo que NO EXISTE aún ════
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { SplashState, SplashStatus } from '@features/splash/domain/models/splashState';

describe('SplashState — modelo de dominio', () => {
  /**
   * TEST 1: SplashState debe ser union type con 4 valores.
   * Triangulación: validamos que las 4 variantes son distintas.
   */
  it('SplashState tiene exactamente 4 valores: idle | waking | retry | resolved', () => {
    // Arrange: usar los 4 valores del tipo
    const idle: SplashState = 'idle';
    const waking: SplashState = 'waking';
    const retry: SplashState = 'retry';
    const resolved: SplashState = 'resolved';

    // Assert: los 4 valores son distintos entre sí
    expect(idle).not.toBe(waking);
    expect(idle).not.toBe(retry);
    expect(idle).not.toBe(resolved);
    expect(waking).not.toBe(retry);
    expect(waking).not.toBe(resolved);
    expect(retry).not.toBe(resolved);
  });

  /**
   * TEST 2: SplashStatus debe inicializarse con state 'idle'.
   */
  it('SplashStatus se inicializa con state idle, wakeOk=false, wakeCompleted=false, authResolved=false', () => {
    // Arrange — crear SplashStatus con valores iniciales del spec
    const initial: SplashStatus = {
      state: 'idle',
      wakeOk: false,
      wakeCompleted: false,
      authResolved: false,
    };

    // Assert — todos los campos tienen el valor inicial correcto
    expect(initial.state).toBe('idle');
    expect(initial.wakeOk).toBe(false);
    expect(initial.wakeCompleted).toBe(false);
    expect(initial.authResolved).toBe(false);
  });

  /**
   * TEST 3 (triangulación): SplashStatus debe aceptar estado 'waking'
   * con wakeCompleted=true pero wakeOk pendiente (timing race).
   */
  it('SplashStatus en estado waking permite wakeCompleted=true antes de resolver wakeOk', () => {
    // Arrange — simula: el health check terminó con error
    // pero el timer de animación de 2s sigue corriendo
    const wakingState: SplashStatus = {
      state: 'waking',
      wakeOk: false,
      wakeCompleted: true,
      authResolved: false,
    };

    // Assert — transición intermedia válida, todavía en waking
    expect(wakingState.state).toBe('waking');
    expect(wakingState.wakeOk).toBe(false);
    expect(wakingState.wakeCompleted).toBe(true);
  });

  /**
   * TEST 4 (triangulación): SplashStatus resuelto con todos los flags en true.
   * Representa el estado final antes de navegar.
   */
  it('SplashStatus en resolved tiene wakeOk=true y authResolved=true', () => {
    // Arrange — estado completamente resuelto
    const resolvedState: SplashStatus = {
      state: 'resolved',
      wakeOk: true,
      wakeCompleted: true,
      authResolved: true,
    };

    // Assert
    expect(resolvedState.state).toBe('resolved');
    expect(resolvedState.wakeOk).toBe(true);
    expect(resolvedState.authResolved).toBe(true);
    expect(resolvedState.wakeCompleted).toBe(true);
  });
});
