/**
 * AuthStore — Estado global de autenticación con Zustand.
 *
 * WHAT: Store Zustand para el estado de autenticación.
 *       Equivalente a AuthProvider (ChangeNotifier) del Flutter.
 * WHY: Zustand maneja estado global de auth (status, sesión, error)
 *      fuera del árbol de React, sin Provider wrapper.
 *      Las screens se suscriben selectivamente para evitar re-renders.
 * BENEFITS: Sin Provider wrapper, selectores atómicos para evitar
 *           re-renders innecesarios, actions async nativas.
 *
 * TDD: GREEN — implementación mínima para pasar los tests
 */

import { create } from 'zustand';
import type { AuthSession } from '../../domain';

// ──── Tipos ────

/**
 * WHAT: Estados posibles de autenticación.
 * Mismo concepto que AuthStatus del Flutter.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * WHAT: Contrato del estado y acciones del store de autenticación.
 */
interface AuthState {
  // ──── Estado ────
  status: AuthStatus;
  session: AuthSession | null;
  error: string | null;

  // ──── Actions ────
  setLoading: () => void;
  setAuthenticated: (session: AuthSession) => void;
  setUnauthenticated: (error?: string) => void;
  clearError: () => void;
  reset: () => void;
}

// ──── Estado inicial ────

const initialState = {
  status: 'loading' as AuthStatus,
  session: null,
  error: null,
};

// ──── Store ────

/**
 * WHAT: Hook Zustand para el estado global de autenticación.
 * Uso: `const status = useAuthStore(s => s.status);`
 *       Solo se re-renderiza si `status` cambió.
 */
export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  /**
   * WHAT: Transición a estado "cargando".
   * WHY: Se usa al iniciar login/register/checkAuth.
   * BENEFITS: Limpia errores previos sin perder la sesión actual.
   */
  setLoading: () => set({ status: 'loading', error: null }),

  /**
   * WHAT: Transición a estado "autenticado".
   * WHY: Se llama tras login exitoso o restauración de sesión.
   * BENEFITS: Guarda la sesión y limpia cualquier error previo.
   */
  setAuthenticated: (session: AuthSession) =>
    set({
      status: 'authenticated',
      session,
      error: null,
    }),

  /**
   * WHAT: Transición a estado "no autenticado".
   * WHY: Se llama tras logout, error de login, o sesión expirada.
   * BENEFITS: Limpia la sesión. Opcionalmente guarda mensaje de error.
   */
  setUnauthenticated: (error?: string) =>
    set({
      status: 'unauthenticated',
      session: null,
      error: error ?? null,
    }),

  /**
   * WHAT: Limpia el error actual sin cambiar el estado de auth.
   * WHY: Útil después de mostrar un error al usuario (ej: banner dismiss).
   * BENEFITS: No altera el status ni la sesión.
   */
  clearError: () => set({ error: null }),

  /**
   * WHAT: Resetea el store a su estado inicial.
   * WHY: Se usa en logout para garantizar estado limpio.
   * BENEFITS: Vuelve a 'loading' (estado inicial de la app).
   */
  reset: () => set({ ...initialState }),
}));

// ──── Selectores atómicos ────

/**
 * WHAT: Selectores que evitan re-renders innecesarios.
 * WHY: Zustand re-renderiza solo si el slice seleccionado cambió.
 *      Sin estos selectores, cualquier cambio en el store re-renderiza
 *      todos los componentes suscritos.
 * BENEFITS: Performance — solo se re-renderiza lo necesario.
 * Uso: `const isLoading = useAuthStore(selectIsLoading);`
 */

export const selectIsLoading = (state: AuthState): boolean =>
  state.status === 'loading';

export const selectIsAuthenticated = (state: AuthState): boolean =>
  state.status === 'authenticated';

export const selectStatus = (state: AuthState): AuthStatus => state.status;

export const selectSession = (state: AuthState): AuthSession | null =>
  state.session;

export const selectError = (state: AuthState): string | null => state.error;

export const selectRoles = (state: AuthState): readonly string[] =>
  state.session?.roles ?? [];

export const selectUsername = (state: AuthState): string =>
  state.session?.username ?? '';
