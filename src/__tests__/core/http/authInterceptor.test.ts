/**
 * TDD: RED → GREEN → TRIANGULATE — Tests para el interceptor de autenticación
 * con refresh JWT y dedup de requests concurrentes.
 *
 * WHAT: Define el comportamiento esperado del authInterceptor: request interceptor
 *       (Authorization header), response interceptor (401 → refresh → retry),
 *       deduplicación, y fallback a login.
 * WHY: TDD estricto: el flujo de refresh JWT es el más crítico de la app.
 * BENEFITS: Cobertura del flujo JWT completo, edge cases de concurrencia.
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ITokenStorage } from '@core/storage/tokenStorage';

// ──── Mocks ────

const mockPost = jest.fn();
jest.mock('@core/http/apiClient', () => {
  const actual = jest.requireActual('@core/http/apiClient');
  return {
    ...actual,
    publicClient: {
      post: mockPost,
    },
  };
});

// ──── Helpers ────

function createMockTokenStorage(): ITokenStorage {
  let _accessToken: string | null = null;
  let _refreshToken: string | null = null;

  return {
    saveTokens: jest.fn(async (access: string, refresh: string) => {
      _accessToken = access;
      _refreshToken = refresh;
    }),
    readAccessToken: jest.fn(async () => _accessToken),
    readRefreshToken: jest.fn(async () => _refreshToken),
    hasTokens: jest.fn(
      async () => _accessToken !== null && _refreshToken !== null,
    ),
    clear: jest.fn(async () => {
      _accessToken = null;
      _refreshToken = null;
    }),
  };
}

/**
 * Crea una instancia fresca de Axios con adapter mock (sin HTTP real).
 */
function createFreshClient(): AxiosInstance {
  return axios.create({
    baseURL: 'https://test.example.com',
    adapter: (config) =>
      Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
  });
}

/**
 * Crea un objeto de config mínimo que satisface InternalAxiosRequestConfig.
 */
function makeConfig(
  overrides: Record<string, unknown> = {},
): InternalAxiosRequestConfig {
  return {
    headers: {
      common: {},
      delete: {},
      get: {},
      head: {},
      patch: {},
      post: {},
      put: {},
    },
    method: 'get',
    url: '/api/v1/protected/resource',
    ...overrides,
  } as unknown as InternalAxiosRequestConfig;
}

/**
 * Crea un error de Axios simulado con status 401.
 */
function createAxios401Error(overrides: Record<string, unknown> = {}) {
  const config = makeConfig(overrides);

  return {
    response: {
      status: 401,
      data: { message: 'Token expirado' },
      headers: {},
      config,
      statusText: 'Unauthorized',
    },
    config: { ...config },
    isAxiosError: true,
    toJSON: () => ({}),
  };
}

// ──── Dynamic import (RED → GREEN transition) ────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let attachAuthInterceptor: (...args: any[]) => void;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@core/http/authInterceptor');
  attachAuthInterceptor = mod.attachAuthInterceptor;
} catch {
  attachAuthInterceptor = () => {
    throw new Error('Módulo no implementado — TDD RED');
  };
}

// ──── Suite ────

describe('attachAuthInterceptor', () => {
  let client: AxiosInstance;
  let tokenStorage: ITokenStorage;
  let onAuthFailure: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    client = createFreshClient();
    tokenStorage = createMockTokenStorage();
    onAuthFailure = jest.fn();
  });

  // ── Request Interceptor ──

  describe('request interceptor', () => {
    it('agrega header Authorization con el access token', async () => {
      await tokenStorage.saveTokens('access-token-123', 'refresh-token-456');

      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const reqHandler = client.interceptors.request.handlers![0]!;
      const config = makeConfig({ url: '/api/test' });

      const result = await reqHandler.fulfilled!(config);

      expect(result.headers?.Authorization).toBe('Bearer access-token-123');
    });

    it('no agrega header Authorization si no hay token', async () => {
      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const reqHandler = client.interceptors.request.handlers![0]!;
      const config = makeConfig({ url: '/api/test' });

      const result = await reqHandler.fulfilled!(config);

      expect(result.headers?.Authorization).toBeUndefined();
    });

    it('el request interceptor se registra correctamente', () => {
      attachAuthInterceptor(client, tokenStorage, onAuthFailure);
      expect(client.interceptors.request.handlers!.length).toBe(1);
    });
  });

  // ── Response Interceptor ──

  describe('response interceptor', () => {
    it('se registra correctamente', () => {
      attachAuthInterceptor(client, tokenStorage, onAuthFailure);
      expect(client.interceptors.response.handlers!.length).toBe(1);
    });

    it('pasa exitosamente las responses no-401', async () => {
      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockResponse: any = { status: 200, data: { ok: true }, config: {} };

      const result = await resHandler.fulfilled!(mockResponse);
      expect(result).toBe(mockResponse);
    });
  });

  // ── 401 → Refresh Flow ──

  describe('refresh flow ante 401', () => {
    it('dispara el refresh cuando hay refresh token', async () => {
      await tokenStorage.saveTokens('expired-access', 'valid-refresh');

      mockPost.mockResolvedValue({
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      });

      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;
      const axiosError = createAxios401Error({
        url: '/api/v1/protected/resource',
      });

      await resHandler.rejected!(axiosError);

      expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/refresh', {
        refreshToken: 'valid-refresh',
      });

      expect(tokenStorage.saveTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token',
      );
    });

    it('sin refresh token → limpiar storage y llamar onAuthFailure', async () => {
      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;
      const axiosError = createAxios401Error();

      try {
        await resHandler.rejected!(axiosError);
        fail('Debería haber rechazado con AuthException');
      } catch (error: unknown) {
        const ex = error as Record<string, unknown>;
        expect(ex.name).toBe('AuthException');
        expect(ex.message).toContain('Sesión expirada');
        expect(tokenStorage.clear).toHaveBeenCalled();
        expect(onAuthFailure).toHaveBeenCalled();
      }
    });

    it('refresh fallido → rechaza y limpia storage', async () => {
      await tokenStorage.saveTokens('expired-access', 'invalid-refresh');

      mockPost.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Refresh token inválido' },
        },
      });

      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;
      const axiosError = createAxios401Error();

      try {
        await resHandler.rejected!(axiosError);
        fail('Debería haber rechazado');
      } catch {
        expect(tokenStorage.clear).toHaveBeenCalled();
        expect(onAuthFailure).toHaveBeenCalled();
      }
    });
  });

  // ── Deduplicación de requests concurrentes ──

  describe('dedup de requests concurrentes con 401', () => {
    it('solo hace un refresh cuando múltiples requests reciben 401', async () => {
      await tokenStorage.saveTokens('expired-access', 'valid-refresh');

      // Mock: el refresh tarda un poco
      let resolveRefresh!: (value: unknown) => void;
      const refreshPromise = new Promise<unknown>((resolve) => {
        resolveRefresh = resolve;
      });
      mockPost.mockReturnValue(refreshPromise);

      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;

      const error1 = createAxios401Error({ url: '/api/v1/products' });
      const promise1 = resHandler.rejected!(error1);

      const error2 = createAxios401Error({ url: '/api/v1/inventory' });
      const promise2 = resHandler.rejected!(error2);

      resolveRefresh({
        data: {
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        },
      });

      await Promise.all([promise1, promise2]);

      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('todas las requests encoladas se resuelven con el nuevo token', async () => {
      await tokenStorage.saveTokens('expired', 'valid-refresh');

      mockPost.mockResolvedValue({
        data: {
          accessToken: 'fresh-access',
          refreshToken: 'fresh-refresh',
        },
      });

      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;

      const p1 = resHandler.rejected!(
        createAxios401Error({ url: '/api/v1/a' }),
      );
      const p2 = resHandler.rejected!(
        createAxios401Error({ url: '/api/v1/b' }),
      );
      const p3 = resHandler.rejected!(
        createAxios401Error({ url: '/api/v1/c' }),
      );

      await expect(Promise.all([p1, p2, p3])).resolves.toBeDefined();
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });

  // ── Prevención de loops ──

  describe('prevención de loops de refresh', () => {
    it('no reintenta requests a /auth/refresh (evita loop infinito)', async () => {
      await tokenStorage.saveTokens('expired', 'valid-refresh');

      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;
      const axiosError = createAxios401Error({
        url: '/api/v1/auth/refresh',
      });

      try {
        await resHandler.rejected!(axiosError);
        fail('Debería rechazar directamente sin intentar refresh');
      } catch (error: unknown) {
        expect(mockPost).not.toHaveBeenCalled();
        expect(error).toBeDefined();
      }
    });

    it('no reintenta requests que ya tienen el flag _retry', async () => {
      await tokenStorage.saveTokens('expired', 'valid-refresh');

      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;
      const axiosError = createAxios401Error({ url: '/api/v1/test' });
      (axiosError.config as Record<string, unknown>)._retry = true;

      try {
        await resHandler.rejected!(axiosError);
        fail('Debería rechazar sin reintentar');
      } catch (error: unknown) {
        expect(mockPost).not.toHaveBeenCalled();
        expect(error).toBeDefined();
      }
    });
  });

  // ── onAuthFailure callback ──

  describe('onAuthFailure callback', () => {
    it('se llama cuando el refresh falla', async () => {
      await tokenStorage.saveTokens('expired', 'bad-refresh');

      mockPost.mockRejectedValue(new Error('Network error'));

      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;

      try {
        await resHandler.rejected!(createAxios401Error());
      } catch {
        // Esperado
      }

      expect(onAuthFailure).toHaveBeenCalledTimes(1);
    });

    it('se llama cuando no hay refresh token', async () => {
      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;

      try {
        await resHandler.rejected!(createAxios401Error());
      } catch {
        // Esperado
      }

      expect(onAuthFailure).toHaveBeenCalledTimes(1);
    });

    it('no se llama si la response no es 401', async () => {
      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;
      const not401Error = {
        response: {
          status: 500,
          data: {},
          headers: {},
          config: {},
          statusText: 'Error',
        },
        config: makeConfig({ url: '/test' }),
        isAxiosError: true,
        toJSON: () => ({}),
      };

      try {
        await resHandler.rejected!(not401Error);
      } catch {
        // Esperado
      }

      expect(onAuthFailure).not.toHaveBeenCalled();
    });
  });

  // ── Casos borde ──

  describe('casos borde', () => {
    it('el interceptor no interfiere con requests exitosos', async () => {
      attachAuthInterceptor(client, tokenStorage, onAuthFailure);
      const resHandler = client.interceptors.response.handlers![0]!;

      const successResponse = {
        status: 200,
        data: { items: [1, 2, 3] },
        config: {},
        headers: {},
        statusText: 'OK',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await resHandler.fulfilled!(successResponse as any);
      expect(result).toBe(successResponse);
    });

    it('requests no-401 pero con error se rechazan sin refresh', async () => {
      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Error interno' },
          headers: {},
          config: {},
          statusText: 'Internal Server Error',
        },
        config: makeConfig({ url: '/test' }),
        isAxiosError: true,
        toJSON: () => ({}),
      };

      try {
        await resHandler.rejected!(serverError);
        fail('Debería rechazar');
      } catch {
        expect(mockPost).not.toHaveBeenCalled();
        expect(tokenStorage.clear).not.toHaveBeenCalled();
        expect(onAuthFailure).not.toHaveBeenCalled();
      }
    });

    it('el request original reintentado usa el NUEVO access token', async () => {
      await tokenStorage.saveTokens('old-access', 'valid-refresh');

      mockPost.mockResolvedValue({
        data: {
          accessToken: 'brand-new-token',
          refreshToken: 'brand-new-refresh',
        },
      });

      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;
      const axiosError = createAxios401Error({ url: '/api/v1/test' });

      await resHandler.rejected!(axiosError);

      expect(tokenStorage.saveTokens).toHaveBeenCalledWith(
        'brand-new-token',
        'brand-new-refresh',
      );
    });

    it('setea _retry flag en el request original para evitar reintentos anidados', async () => {
      await tokenStorage.saveTokens('old-access', 'valid-refresh');

      mockPost.mockResolvedValue({
        data: {
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        },
      });

      attachAuthInterceptor(client, tokenStorage, onAuthFailure);

      const resHandler = client.interceptors.response.handlers![0]!;
      const axiosError = createAxios401Error({ url: '/api/v1/test' });

      expect(
        (axiosError.config as Record<string, unknown>)._retry,
      ).toBeUndefined();

      try {
        await resHandler.rejected!(axiosError);
      } catch {
        // Puede lanzar o resolver
      }

      expect((axiosError.config as Record<string, unknown>)._retry).toBe(true);
    });
  });
});
