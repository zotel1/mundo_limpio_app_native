/**
 * WHAT: Tests para el AuthStore (Zustand) — estado de autenticación
 * WHY: Validar la máquina de estados (loading/authenticated/unauthenticated),
 *      transiciones, selectores atómicos, y edge cases.
 * BENEFITS: Cobertura completa del estado global de auth. Los selectores
 *           evitan re-renders innecesarios.
 *
 * TDD: RED — test escrito antes que la implementación del store
 */

import {
  useAuthStore,
  selectIsLoading,
  selectIsAuthenticated,
  selectStatus,
  selectSession,
  selectError,
  selectRoles,
  selectUsername,
} from '@features/auth/presentation/stores/authStore';
import type { AuthSession } from '@features/auth/domain';

// Helper: crea una sesión de prueba
const mockSession: AuthSession = {
  userId: 42,
  username: 'operador_stock',
  email: 'op@mundolimpio.com',
  roles: ['STOCK_OPERATOR'],
};

// Helper: resetea el store antes de cada test
const resetStore = () => useAuthStore.getState().reset();

describe('AuthStore — máquina de estados', () => {
  beforeEach(() => {
    resetStore();
  });

  // ──── Estado inicial ────

  it('estado inicial: status "loading", session null, error null', () => {
    const state = useAuthStore.getState();

    expect(state.status).toBe('loading');
    expect(state.session).toBeNull();
    expect(state.error).toBeNull();
  });

  // ──── setLoading() ────

  it('setLoading() pone status "loading" y limpia error previo', () => {
    // Arrange: precondición con error existente
    useAuthStore.getState().setUnauthenticated('Error previo');

    // Act
    useAuthStore.getState().setLoading();

    // Assert
    const state = useAuthStore.getState();
    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('setLoading() no modifica session existente (transición autenticado→loading)', () => {
    // Arrange: autenticado previamente
    useAuthStore.getState().setAuthenticated(mockSession);

    // Act
    useAuthStore.getState().setLoading();

    // Assert: session se preserva (loading es transitorio, puede haber refresh)
    const state = useAuthStore.getState();
    expect(state.status).toBe('loading');
    expect(state.session).toEqual(mockSession);
  });

  // ──── setAuthenticated() ────

  it('setAuthenticated() pone status "authenticated" y guarda session', () => {
    useAuthStore.getState().setAuthenticated(mockSession);

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.session).toEqual(mockSession);
  });

  it('setAuthenticated() limpia error previo', () => {
    useAuthStore.getState().setUnauthenticated('Error de red');

    useAuthStore.getState().setAuthenticated(mockSession);

    const state = useAuthStore.getState();
    expect(state.error).toBeNull();
    expect(state.status).toBe('authenticated');
  });

  it('setAuthenticated() con session ADMIN actualiza roles correctamente', () => {
    const adminSession: AuthSession = {
      userId: 1,
      username: 'admin',
      email: 'admin@mundolimpio.com',
      roles: ['ADMIN'],
    };

    useAuthStore.getState().setAuthenticated(adminSession);

    const state = useAuthStore.getState();
    expect(state.session?.roles).toEqual(['ADMIN']);
    expect(state.session?.username).toBe('admin');
  });

  // ──── setUnauthenticated() ────

  it('setUnauthenticated() pone status "unauthenticated" y session null', () => {
    // Arrange: autenticado
    useAuthStore.getState().setAuthenticated(mockSession);

    // Act
    useAuthStore.getState().setUnauthenticated();

    // Assert
    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.session).toBeNull();
  });

  it('setUnauthenticated("mensaje") guarda el mensaje de error', () => {
    useAuthStore.getState().setUnauthenticated('Credenciales inválidas');

    const state = useAuthStore.getState();
    expect(state.error).toBe('Credenciales inválidas');
    expect(state.status).toBe('unauthenticated');
  });

  it('setUnauthenticated() sin argumento limpia error', () => {
    useAuthStore.getState().setUnauthenticated('Error previo');

    useAuthStore.getState().setUnauthenticated();

    const state = useAuthStore.getState();
    expect(state.error).toBeNull();
  });

  // ──── clearError() ────

  it('clearError() limpia error sin cambiar status ni session', () => {
    useAuthStore.getState().setAuthenticated(mockSession);
    // Simular error en operación autenticada
    useAuthStore.setState({ error: 'Error al guardar' });

    useAuthStore.getState().clearError();

    const state = useAuthStore.getState();
    expect(state.error).toBeNull();
    expect(state.status).toBe('authenticated');
    expect(state.session).toEqual(mockSession);
  });

  // ──── reset() ────

  it('reset() vuelve al estado inicial desde authenticated', () => {
    useAuthStore.getState().setAuthenticated(mockSession);

    useAuthStore.getState().reset();

    const state = useAuthStore.getState();
    expect(state.status).toBe('loading');
    expect(state.session).toBeNull();
    expect(state.error).toBeNull();
  });

  it('reset() vuelve al estado inicial desde unauthenticated con error', () => {
    useAuthStore.getState().setUnauthenticated('Sesión expirada');

    useAuthStore.getState().reset();

    const state = useAuthStore.getState();
    expect(state.status).toBe('loading');
    expect(state.session).toBeNull();
    expect(state.error).toBeNull();
  });

  // ──── Selectores atómicos ────

  it('selectIsLoading retorna true cuando status es "loading"', () => {
    const state = useAuthStore.getState();
    expect(selectIsLoading(state)).toBe(true);
  });

  it('selectIsLoading retorna false cuando status NO es "loading"', () => {
    useAuthStore.getState().setAuthenticated(mockSession);
    const state = useAuthStore.getState();

    expect(selectIsLoading(state)).toBe(false);
  });

  it('selectIsAuthenticated retorna true solo cuando status es "authenticated"', () => {
    useAuthStore.getState().setAuthenticated(mockSession);
    const state = useAuthStore.getState();

    expect(selectIsAuthenticated(state)).toBe(true);
    expect(selectStatus(state)).toBe('authenticated');
  });

  it('selectSession retorna la sesión guardada', () => {
    useAuthStore.getState().setAuthenticated(mockSession);
    const state = useAuthStore.getState();

    expect(selectSession(state)).toEqual(mockSession);
  });

  it('selectSession retorna null cuando no hay sesión', () => {
    const state = useAuthStore.getState();
    expect(selectSession(state)).toBeNull();
  });

  it('selectError retorna el mensaje de error', () => {
    useAuthStore.getState().setUnauthenticated('Error de conexión');

    const state = useAuthStore.getState();
    expect(selectError(state)).toBe('Error de conexión');
  });

  it('selectError retorna null cuando no hay error', () => {
    const state = useAuthStore.getState();
    expect(selectError(state)).toBeNull();
  });

  it('selectRoles retorna array vacío cuando no hay session', () => {
    const state = useAuthStore.getState();
    expect(selectRoles(state)).toEqual([]);
  });

  it('selectRoles retorna los roles de la sesión autenticada', () => {
    useAuthStore.getState().setAuthenticated(mockSession);
    const state = useAuthStore.getState();

    expect(selectRoles(state)).toEqual(['STOCK_OPERATOR']);
  });

  it('selectUsername retorna string vacío cuando no hay session', () => {
    const state = useAuthStore.getState();
    expect(selectUsername(state)).toBe('');
  });

  it('selectUsername retorna el username de la sesión', () => {
    useAuthStore.getState().setAuthenticated(mockSession);
    const state = useAuthStore.getState();

    expect(selectUsername(state)).toBe('operador_stock');
  });

  // ──── Transiciones compuestas ────

  it('flujo loading → authenticated → unauthenticated → loading → authenticated', () => {
    // loading (inicial) → authenticated
    useAuthStore.getState().setAuthenticated(mockSession);
    expect(useAuthStore.getState().status).toBe('authenticated');

    // authenticated → unauthenticated
    useAuthStore.getState().setUnauthenticated('Sesión expirada');
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().error).toBe('Sesión expirada');

    // unauthenticated → loading
    useAuthStore.getState().setLoading();
    expect(useAuthStore.getState().status).toBe('loading');
    expect(useAuthStore.getState().error).toBeNull();

    // loading → authenticated
    useAuthStore.getState().setAuthenticated(mockSession);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().session).toEqual(mockSession);
  });
});
