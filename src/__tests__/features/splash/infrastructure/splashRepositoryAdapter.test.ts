/**
 * TDD: RED — Tests para SplashRepositoryAdapter.
 *
 * WHAT: Valida que el adapter implemente correctamente el puerto SplashRepository,
 *       haciendo health check HTTP contra GET /actuator/health.
 * WHY: El adapter encapsula Axios (publicClient) para verificar que el backend
 *      está despierto antes de que el usuario inicie sesión.
 * BENEFITS: Testea el comportamiento real (200 → true, error → false)
 *           sin depender de un backend real. Mock de Axios → comportamiento puro.
 *
 * TDD: RED → al importar de un módulo inexistente, Jest falla con
 * "Cannot find module" — esto ES el comportamiento esperado en fase RED.
 */

import { AxiosInstance } from 'axios';

// ════ RED: importa de un archivo que NO EXISTE aún ════
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SplashRepositoryAdapter } from '@features/splash/infrastructure/adapters/splashRepositoryAdapter';

describe('SplashRepositoryAdapter — health check HTTP', () => {
  let mockClient: jest.Mocked<AxiosInstance>;
  let adapter: SplashRepositoryAdapter;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
      },
      defaults: { headers: { common: {} } },
    } as unknown as jest.Mocked<AxiosInstance>;

    adapter = new SplashRepositoryAdapter(mockClient);
  });

  describe('wakeBackend()', () => {
    /**
     * TEST 1: Debe retornar true cuando el backend responde 200.
     * Escenario: Spring Boot actuator health UP.
     */
    it('retorna true cuando GET /actuator/health responde 200', async () => {
      // Arrange — backend responde UP
      mockClient.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'UP' },
      });

      // Act
      const result = await adapter.wakeBackend();

      // Assert
      expect(result).toBe(true);
      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(mockClient.get).toHaveBeenCalledWith('/actuator/health');
    });

    /**
     * TEST 2: Debe retornar false cuando el backend responde error (no 200).
     * Escenario: backend caído o en mantenimiento.
     */
    it('retorna false cuando GET /actuator/health devuelve 503', async () => {
      // Arrange — backend responde DOWN
      mockClient.get.mockResolvedValueOnce({
        status: 503,
        data: { status: 'DOWN' },
      });

      // Act
      const result = await adapter.wakeBackend();

      // Assert
      expect(result).toBe(false);
      expect(mockClient.get).toHaveBeenCalledTimes(1);
    });

    /**
     * TEST 3 (triangulación): Debe retornar false cuando hay error de red.
     * Escenario: sin conectividad — Axios lanza NetworkError.
     */
    it('retorna false cuando hay error de red (NetworkError)', async () => {
      // Arrange — error de red
      mockClient.get.mockRejectedValueOnce(new Error('Network Error'));

      // Act
      const result = await adapter.wakeBackend();

      // Assert
      expect(result).toBe(false);
      // NO debe lanzar la excepción — la atrapa y retorna false
    });

    /**
     * TEST 4 (triangulación): Debe retornar false cuando hay timeout.
     * Escenario: backend responde muy lento, Axios lanza ECONNABORTED.
     */
    it('retorna false cuando hay timeout', async () => {
      // Arrange — timeout
      mockClient.get.mockRejectedValueOnce(new Error('timeout of 5000ms exceeded'));

      // Act
      const result = await adapter.wakeBackend();

      // Assert
      expect(result).toBe(false);
    });

    /**
     * TEST 5 (triangulación): Debe retornar false con respuesta 401.
     * Escenario: el endpoint no espera auth, pero si por alguna razón
     * devuelve 401, no debe colapsar.
     */
    it('retorna false cuando el status NO es 200 (ej. 401)', async () => {
      // Arrange — backend responde 401
      mockClient.get.mockResolvedValueOnce({
        status: 401,
        data: {},
      });

      // Act
      const result = await adapter.wakeBackend();

      // Assert
      expect(result).toBe(false);
    });
  });
});
