/**
 * Barrel — core/http.
 *
 * WHAT: Re-exporta la fábrica de clientes HTTP y la jerarquía de excepciones.
 * WHY: Single import para los consumidores: `import { createApiClient, ApiException } from '@core/http'`.
 * BENEFITS: API pública clara, sin imports anidados.
 */
export { createApiClient, publicClient } from './apiClient';
export type { AxiosInstance } from 'axios';
export {
  ApiException,
  AuthException,
  NotFoundException,
  ConflictException,
  ServerException,
  NetworkException,
  UnknownApiException,
  getErrorMessage,
} from './apiException';
