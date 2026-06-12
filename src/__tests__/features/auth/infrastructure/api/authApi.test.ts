/**
 * TDD: RED — Tests para AuthApi.
 *
 * WHAT: Valida que AuthApi realice las llamadas HTTP correctas a los endpoints
 *       de autenticación y valide las respuestas con Zod.
 * WHY: AuthApi encapsula Axios + Zod. Los tests verifican URLs, método HTTP,
 *      payload, y validación de respuesta sin depender de un backend real.
 * BENEFITS: Cobertura de integración HTTP → Zod → DTO sin servidor real.
 */
import { AxiosInstance } from 'axios';
import { AuthApi } from '@features/auth/infrastructure/api/authApi';

// Mockeamos la respuesta del interceptor (ApiException) para tests de error
import { ApiException } from '@core/http/apiException';

describe('AuthApi', () => {
  // Mock del cliente Axios
  let mockClient: jest.Mocked<AxiosInstance>;
  let authApi: AuthApi;

  const validAuthResponse = {
    accessToken: 'eyJhbGciOiJIUzI1NiJ9.aaa',
    refreshToken: 'eyJhbGciOiJIUzI1NiJ9.bbb',
    roles: ['STOCK_OPERATOR'],
    username: 'operador_stock',
    email: 'op@mundolimpio.com',
    userId: 42,
  };

  beforeEach(() => {
    mockClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
      },
      defaults: { headers: { common: {} } },
    } as unknown as jest.Mocked<AxiosInstance>;

    authApi = new AuthApi(mockClient);
  });

  describe('login()', () => {
    it('llama POST /api/v1/auth/login con body correcto', async () => {
      mockClient.post.mockResolvedValueOnce({ data: validAuthResponse });

      const result = await authApi.login({
        email: 'test@mundolimpio.com',
        password: 'SecurePass1',
      });

      expect(mockClient.post).toHaveBeenCalledTimes(1);
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        email: 'test@mundolimpio.com',
        password: 'SecurePass1',
      });
      expect(result.accessToken).toBe('eyJhbGciOiJIUzI1NiJ9.aaa');
      expect(result.userId).toBe(42);
    });

    it('valida respuesta con Zod y lanza si es inválida', async () => {
      // Respuesta del backend sin accessToken — debería fallar validación Zod
      mockClient.post.mockResolvedValueOnce({
        data: {
          // falta accessToken
          refreshToken: 'bbb',
          roles: [],
          username: 'x',
        },
      });

      await expect(
        authApi.login({
          email: 'test@mundolimpio.com',
          password: 'SecurePass1',
        }),
      ).rejects.toThrow();
    });

    it('valida el request con Zod y lanza si email es inválido', async () => {
      await expect(
        authApi.login({
          email: 'no-es-email',
          password: 'SecurePass1',
        }),
      ).rejects.toThrow();
      // No debe llamar al cliente HTTP
      expect(mockClient.post).not.toHaveBeenCalled();
    });
  });

  describe('register()', () => {
    it('llama POST /api/v1/auth/register con body correcto', async () => {
      mockClient.post.mockResolvedValueOnce({ data: validAuthResponse });

      const result = await authApi.register({
        email: 'nuevo@mundolimpio.com',
        password: 'SecurePass1',
      });

      expect(mockClient.post).toHaveBeenCalledTimes(1);
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/auth/register', {
        email: 'nuevo@mundolimpio.com',
        password: 'SecurePass1',
      });
      expect(result.username).toBe('operador_stock');
    });

    it('valida password con Zod (mínimo 6 caracteres)', async () => {
      await expect(
        authApi.register({
          email: 'test@mundolimpio.com',
          password: 'Ab1', // muy corto
        }),
      ).rejects.toThrow();
      expect(mockClient.post).not.toHaveBeenCalled();
    });
  });

  describe('refresh()', () => {
    it('llama POST /api/v1/auth/refresh con refreshToken', async () => {
      mockClient.post.mockResolvedValueOnce({ data: validAuthResponse });

      const result = await authApi.refresh('mi-refresh-token');

      expect(mockClient.post).toHaveBeenCalledTimes(1);
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {
        refreshToken: 'mi-refresh-token',
      });
      expect(result.accessToken).toBe('eyJhbGciOiJIUzI1NiJ9.aaa');
    });

    it('rechaza refreshToken vacío con Zod', async () => {
      await expect(authApi.refresh('')).rejects.toThrow();
      expect(mockClient.post).not.toHaveBeenCalled();
    });
  });

  describe('propagación de errores', () => {
    it('propaga ApiException del interceptor (error 401)', async () => {
      const authError = new ApiException('Credenciales inválidas', 401);
      mockClient.post.mockRejectedValueOnce(authError);

      await expect(
        authApi.login({
          email: 'test@mundolimpio.com',
          password: 'wrong',
        }),
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('propaga NetworkException del interceptor', async () => {
      const networkError = new ApiException(
        'Error de conexión. Verificá tu internet.',
        0,
      );
      mockClient.post.mockRejectedValueOnce(networkError);

      await expect(
        authApi.login({
          email: 'test@mundolimpio.com',
          password: 'SecurePass1',
        }),
      ).rejects.toThrow('Error de conexión');
    });
  });
});
