/**
 * AuthInterceptor — Interceptor de Axios para refresh JWT automático con dedup.
 *
 * WHAT: Agrega interceptores de request (Authorization header) y response
 *       (refresh JWT automático con cola de promesas) a una instancia de Axios.
 *       Equivalente al `auth_interceptor.dart` (QueuedInterceptor de Dio) del Flutter.
 * WHY: Cuando el access token expira (401), múltiples requests concurrentes
 *      dispararían múltiples refresh. El interceptor encola las requests y
 *      resuelve todas con un solo refresh.
 * BENEFITS: Una sola llamada al backend por expiración, requests encoladas
 *           resueltas en lote, UX transparente, fallback a login si falla.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de authInterceptor.test.ts.
 */

import { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ITokenStorage } from '@core/storage/tokenStorage';
import { AuthException } from './apiException';
import { publicClient } from './apiClient';

// ──── Tipos internos ────

/**
 * WHAT: Entrada de la cola de requests fallidas por 401 mientras se refresca el token.
 * Cada entrada contiene handlers para resolver o rechazar la promesa original.
 */
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: AuthException) => void;
}

// ──── Función pública ────

/**
 * WHAT: Agrega interceptor de refresh JWT con dedup a una instancia de Axios.
 *
 * Registra dos interceptores:
 * 1. Request: agrega el header `Authorization: Bearer <token>` a cada request.
 * 2. Response: detecta 401, refresca el token, y reintenta la request original.
 *    Si múltiples requests concurrentes reciben 401, solo se hace UN refresh.
 *
 * @param client - Instancia de Axios a la que se agregan los interceptores.
 * @param tokenStorage - Implementación de ITokenStorage para leer/guardar tokens.
 * @param onAuthFailure - Callback opcional llamado cuando el refresh falla o no
 *                        hay refresh token. Típicamente redirige al login.
 */
export function attachAuthInterceptor(
  client: AxiosInstance,
  tokenStorage: ITokenStorage,
  onAuthFailure?: () => void,
): void {
  let isRefreshing = false;
  let failedQueue: FailedRequest[] = [];

  /**
   * WHAT: Procesa la cola de requests pendientes.
   *
   * Si el refresh fue exitoso (error = null), resuelve todas las promesas
   * con el nuevo access token. Si falló, rechaza todas con el error.
   */
  const processQueue = (error: AuthException | null, token: string | null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    });
    failedQueue = [];
  };

  // ═════════════════════════════════════════════════════════
  // Request Interceptor — agrega Authorization header
  // ═════════════════════════════════════════════════════════

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await tokenStorage.readAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // ═════════════════════════════════════════════════════════
  // Response Interceptor — detecta 401 y refresca
  // ═════════════════════════════════════════════════════════

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Solo reintentar 401 que no sean el propio endpoint de refresh
      if (
        error.response?.status !== 401 ||
        originalRequest._retry ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      // Si ya se está refrescando, encolar esta request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Iniciar refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.readRefreshToken();

        if (!refreshToken) {
          // Sin refresh token → limpiar y redirigir
          await tokenStorage.clear();
          onAuthFailure?.();
          return Promise.reject(
            new AuthException(
              'Sesión expirada. Iniciá sesión nuevamente.',
              401,
            ),
          );
        }

        // Llamar al endpoint de refresh con el cliente público (sin auth)
        const response = await publicClient.post('/api/v1/auth/refresh', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Guardar nuevos tokens
        await tokenStorage.saveTokens(accessToken, newRefreshToken);

        // Resolver cola con el nuevo access token
        processQueue(null, accessToken);

        // Reintentar request original con el nuevo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return client(originalRequest);
      } catch (refreshError: unknown) {
        // Refresh falló → rechazar toda la cola
        const authError =
          refreshError instanceof AuthException
            ? refreshError
            : new AuthException('No se pudo renovar la sesión.', 401);

        processQueue(authError, null);

        await tokenStorage.clear();
        onAuthFailure?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
}
