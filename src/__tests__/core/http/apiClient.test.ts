/**
 * TDD: RED — Tests para la fábrica de clientes HTTP (Axios).
 *
 * WHAT: Define el comportamiento esperado de createApiClient() y publicClient
 *       antes de implementarlos.
 * WHY: TDD estricto: los tests guían el diseño de la configuración centralizada
 *       de Axios.
 * BENEFITS: Verifica que baseURL, timeout, headers, e interceptores se
 *           configuran correctamente desde el appConfig.
 */
import { createApiClient, publicClient } from '@core/http/apiClient';

// Mock de appConfig antes de importar el módulo bajo test
jest.mock('@core/config/appConfig', () => ({
  appConfig: {
    api: {
      baseUrl: 'https://mundo-limpio-backend.onrender.com',
      timeout: 30000,
    },
  },
}));

describe('createApiClient', () => {
  it('retorna una instancia de Axios', () => {
    const client = createApiClient();
    expect(client).toBeDefined();
    expect(typeof client.get).toBe('function');
    expect(typeof client.post).toBe('function');
    expect(typeof client.interceptors).toBeDefined();
  });

  it('tiene la baseURL del appConfig', () => {
    const client = createApiClient();
    expect(client.defaults.baseURL).toBe(
      'https://mundo-limpio-backend.onrender.com',
    );
  });

  it('tiene el timeout del appConfig', () => {
    const client = createApiClient();
    expect(client.defaults.timeout).toBe(30000);
  });

  it('tiene Content-Type application/json por defecto', () => {
    const client = createApiClient();
    const headers = client.defaults.headers.common as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('tiene Accept application/json por defecto', () => {
    const client = createApiClient();
    const headers = client.defaults.headers.common as Record<string, string>;
    expect(headers['Accept']).toBe('application/json');
  });

  it('crea instancias independientes (no comparten defaults)', () => {
    const client1 = createApiClient();
    const client2 = createApiClient();
    // Modificar defaults de una no afecta la otra
    client1.defaults.baseURL = 'https://test.example.com';
    expect(client2.defaults.baseURL).toBe(
      'https://mundo-limpio-backend.onrender.com',
    );
  });

  it('registra un response interceptor para errores', () => {
    const client = createApiClient();
    expect(
      client.interceptors.response.handlers!.length,
    ).toBeGreaterThan(0);
  });

  it('el interceptor de error convierte error 401 de Axios en ApiException', async () => {
    const client = createApiClient();

    // Construir un error de Axios simulado
    const axiosError = {
      response: {
        status: 401,
        data: { message: 'Token inválido' },
        headers: {},
        config: {},
        statusText: 'Unauthorized',
      },
      config: {},
      isAxiosError: true,
      toJSON: () => ({}),
    };

    // Obtener el handler de error del interceptor
    const errorInterceptor = client.interceptors.response.handlers![0]!;
    expect(errorInterceptor).toBeDefined();
    expect(errorInterceptor.rejected).toBeDefined();

    // Ejecutar el handler de error y verificar que convierte a ApiException
    try {
      await errorInterceptor.rejected!(axiosError);
      fail('Debería haber lanzado una ApiException');
    } catch (error: any) {
      expect(error.name).toBe('AuthException');
      expect(error.message).toBe('Token inválido');
      expect(error.statusCode).toBe(401);
    }
  });

  it('el interceptor de error convierte ECONNABORTED en NetworkException', async () => {
    const client = createApiClient();

    const axiosError = {
      code: 'ECONNABORTED',
      message: 'timeout of 30000ms exceeded',
      config: {},
      isAxiosError: true,
      toJSON: () => ({}),
    };

    const errorInterceptor = client.interceptors.response.handlers![0]!;

    try {
      await errorInterceptor.rejected!(axiosError);
      fail('Debería haber lanzado una NetworkException');
    } catch (error: any) {
      expect(error.name).toBe('NetworkException');
      expect(error.message).toBe(
        'La solicitud tardó demasiado. Intentá de nuevo.',
      );
      expect(error.statusCode).toBe(0);
    }
  });

  it('el interceptor de error convierte error de red sin response en NetworkException', async () => {
    const client = createApiClient();

    const axiosError = {
      message: 'Network Error',
      config: {},
      isAxiosError: true,
      toJSON: () => ({}),
    };

    const errorInterceptor = client.interceptors.response.handlers![0]!;

    try {
      await errorInterceptor.rejected!(axiosError);
      fail('Debería haber lanzado una NetworkException');
    } catch (error: any) {
      expect(error.name).toBe('NetworkException');
      expect(error.message).toBe('Error de conexión. Verificá tu internet.');
    }
  });
});

describe('publicClient', () => {
  it('está creado y es una instancia de Axios', () => {
    expect(publicClient).toBeDefined();
    expect(typeof publicClient.get).toBe('function');
    expect(typeof publicClient.post).toBe('function');
  });

  it('tiene la baseURL correcta', () => {
    expect(publicClient.defaults.baseURL).toBe(
      'https://mundo-limpio-backend.onrender.com',
    );
  });

  it('tiene el timeout correcto', () => {
    expect(publicClient.defaults.timeout).toBe(30000);
  });

  it('tiene headers por defecto', () => {
    const headers = publicClient.defaults.headers.common as Record<
      string,
      string
    >;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
  });
});
