/**
 * apiClient — Fábrica de instancias Axios preconfiguradas.
 *
 * WHAT: Crea instancias de Axios con baseURL, timeouts, headers, e interceptores
 *       desde el appConfig centralizado. Equivalente al `api_client.dart` del Flutter.
 * WHY: Una sola configuración de Axios para toda la app evita duplicación.
 *      El auth interceptor se inyecta externamente para mantener separación
 *      de responsabilidades.
 * BENEFITS: No se repite la configuración en cada feature. Fácil de testear
 *           (MSW intercepta a nivel red, no necesita mockear Axios).
 *           El interceptor de errores transforma automáticamente errores de
 *           Axios en ApiException tipadas.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de apiClient.test.ts.
 */
import axios, { AxiosInstance, CreateAxiosDefaults } from 'axios';
import { appConfig } from '@core/config/appConfig';
import { ApiException } from './apiException';

/**
 * Opciones de creación del cliente HTTP.
 */
type CreateClientOptions = {
  /**
   * Si true, se agrega el auth interceptor para adjuntar tokens JWT.
   * Se implementa en PR 1.3 cuando exista TokenStorage.
   */
  withAuth?: boolean;
};

/**
 * Crea una instancia de Axios preconfigurada para consumir el backend.
 *
 * @param options - Opciones de configuración. withAuth se implementa en PR 1.3.
 * @returns Instancia de Axios lista para usar.
 */
export function createApiClient(
  _options: CreateClientOptions = {},
): AxiosInstance {
  const config: CreateAxiosDefaults = {
    baseURL: appConfig.api.baseUrl,
    timeout: appConfig.api.timeout,
    headers: {
      common: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  };

  const client = axios.create(config);

  /**
   * Response interceptor — transforma errores de Axios en ApiException.
   *
   * WHAT: Captura cualquier error HTTP o de red y lo convierte en una
   *       ApiException tipada usando ApiException.fromAxiosError().
   * WHY: Las capas superiores (stores, hooks) no deben conocer Axios.
   *      Reciben ApiException con tipos discriminados para switch exhaustivo.
   */
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      throw ApiException.fromAxiosError(error);
    },
  );

  /**
   * Auth interceptor — se agrega en PR 1.3 cuando exista TokenStorage.
   * Adjuntará Authorization: Bearer <token> a cada request.
   * Implementará refresh dedup con cola de promesas.
   */

  return client;
}

/**
 * Instancia pública sin auth interceptor.
 *
 * WHAT: Cliente Axios preconfigurado para endpoints que no requieren
 *       autenticación (login, register, health check).
 * WHY: Evita que requests anónimos disparen el refresh interceptor
 *      innecesariamente.
 */
export const publicClient = createApiClient({ withAuth: false });
