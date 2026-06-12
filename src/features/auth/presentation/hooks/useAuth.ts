/**
 * useAuth — Hook principal de autenticación.
 *
 * WHAT: Hook que orquesta AuthStore (UI state) + AuthRepository (data)
 *       + TanStack Query (mutations) para login/register/logout/checkAuth.
 * WHY: Un solo hook con toda la lógica de autenticación.
 *      Las screens solo llaman login(), register(), logout()
 *      sin conocer detalles de store o API.
 * BENEFITS: Lógica de auth en un solo lugar, sin dispersar entre screens.
 *           Testable con mock de AuthRepository. Centraliza el estado.
 *
 * TDD: GREEN — implementación mínima para pasar los tests
 */

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AuthRepository, LoginRequest, RegisterRequest } from '../../domain';
import { useAuthStore } from '../stores/authStore';
import { getErrorMessage } from '@core/http/apiException';

// ──── Tipos ────

/**
 * WHAT: Dependencias que el hook necesita inyectadas.
 */
interface UseAuthDeps {
  authRepository: AuthRepository;
}

// ──── Hook ────

/**
 * WHAT: Hook principal de autenticación — expone estado y acciones.
 *
 * Uso en screens:
 * ```
 * const { login, register, logout, status, error } = useAuth({ authRepository });
 * ```
 */
export function useAuth({ authRepository }: UseAuthDeps) {
  const store = useAuthStore();

  // ──── Login Mutation ────

  /**
   * WHAT: Mutation de login con TanStack Query.
   * WHY: TanStack Query maneja loading/error/success states automáticamente.
   *      onMutate → setea loading. onSuccess → authenticated. onError → unauthenticated.
   */
  const loginMutation = useMutation({
    mutationFn: (request: LoginRequest) => authRepository.login(request),
    onMutate: () => store.setLoading(),
    onSuccess: (session) => store.setAuthenticated(session),
    onError: (error) => store.setUnauthenticated(getErrorMessage(error)),
  });

  // ──── Register Mutation ────

  /**
   * WHAT: Mutation de registro.
   * WHY: R2.1 — Registro exitoso NO autentica automáticamente.
   *      El usuario debe iniciar sesión después del registro.
   */
  const registerMutation = useMutation({
    mutationFn: (request: RegisterRequest) => authRepository.register(request),
    onMutate: () => store.setLoading(),
    onSuccess: () => {
      // R2.1: Registro exitoso → NO autentica, redirige a login
      store.setUnauthenticated();
    },
    onError: (error) => store.setUnauthenticated(getErrorMessage(error)),
  });

  // ──── Logout ────

  /**
   * WHAT: Cierra sesión — limpia store y storage.
   * WHY: El finally asegura que el store se resetea incluso si el
   *      repository.logout() falla (ej: error de red al limpiar tokens).
   * BENEFITS: Garantiza que el usuario queda deslogueado localmente siempre.
   */
  const logout = useCallback(async () => {
    try {
      store.setLoading();
      await authRepository.logout();
    } catch {
      // Error al comunicar con el backend — ignoramos,
      // el store se resetea en el finally igual.
    } finally {
      store.reset();
    }
  }, [authRepository, store]);

  // ──── Check Auth ────

  /**
   * WHAT: Verifica autenticación al iniciar la app.
   * WHY: Determina si hay tokens guardados para decidir si mostrar
   *      login o home. La restauración completa de sesión (con /auth/me)
   *      se implementará en un PR futuro.
   */
  const checkAuth = useCallback(async () => {
    try {
      store.setLoading();
      const isLoggedIn = await authRepository.isLoggedIn();
      if (isLoggedIn) {
        // Si hay tokens pero no hay sesión en store (primer load),
        // se necesita un refresh/restore para obtener los datos del usuario.
        // Esto se maneja en el authInterceptor automáticamente o
        // se implementará con restoreSession en PR futuro.
        store.setUnauthenticated(); // Temporal hasta implementar restoreSession
      } else {
        store.setUnauthenticated();
      }
    } catch {
      store.setUnauthenticated('Error al verificar la sesión');
    }
  }, [authRepository, store]);

  // ──── Return ────

  return {
    // Estado
    status: store.status,
    session: store.session,
    error: store.error,
    isLoading: loginMutation.isPending || registerMutation.isPending,

    // Acciones
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    checkAuth,
    clearError: store.clearError,
  };
}
