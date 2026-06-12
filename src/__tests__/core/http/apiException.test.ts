/**
 * TDD: RED — Tests para la jerarquía de excepciones HTTP.
 *
 * WHAT: Define el comportamiento esperado de ApiException.fromStatus(),
 *       ApiException.fromAxiosError(), y getErrorMessage() antes de implementar.
 * WHY: TDD estricto: los tests guían el diseño de la API de errores.
 * BENEFITS: Cobertura total de códigos de estado HTTP, edge cases de red,
 *           y mensajes de error en español.
 */
import {
  ApiException,
  AuthException,
  NotFoundException,
  ConflictException,
  ServerException,
  NetworkException,
  UnknownApiException,
  getErrorMessage,
} from '@core/http/apiException';

// ──── fromStatus factory ────

describe('ApiException.fromStatus', () => {
  it('retorna AuthException para código 401', () => {
    const ex = ApiException.fromStatus(401);
    expect(ex).toBeInstanceOf(AuthException);
  });

  it('retorna AuthException para código 403', () => {
    const ex = ApiException.fromStatus(403);
    expect(ex).toBeInstanceOf(AuthException);
  });

  it('retorna NotFoundException para código 404', () => {
    const ex = ApiException.fromStatus(404);
    expect(ex).toBeInstanceOf(NotFoundException);
  });

  it('retorna ConflictException para código 409', () => {
    const ex = ApiException.fromStatus(409);
    expect(ex).toBeInstanceOf(ConflictException);
  });

  it('retorna ServerException para código 500', () => {
    const ex = ApiException.fromStatus(500);
    expect(ex).toBeInstanceOf(ServerException);
  });

  it('retorna ServerException para código 502', () => {
    const ex = ApiException.fromStatus(502);
    expect(ex).toBeInstanceOf(ServerException);
  });

  it('retorna ServerException para cualquier 5xx (ej: 503)', () => {
    const ex = ApiException.fromStatus(503);
    expect(ex).toBeInstanceOf(ServerException);
  });

  it('retorna NetworkException para código 0 (sin statusCode)', () => {
    const ex = ApiException.fromStatus(0);
    expect(ex).toBeInstanceOf(NetworkException);
  });

  it('retorna UnknownApiException para código no mapeado (ej: 418)', () => {
    const ex = ApiException.fromStatus(418);
    expect(ex).toBeInstanceOf(UnknownApiException);
  });

  it('retorna UnknownApiException para código 200 (éxito no es error HTTP, pero si alguien lo fuerza)', () => {
    const ex = ApiException.fromStatus(200, 'Algo raro pasó');
    expect(ex).toBeInstanceOf(UnknownApiException);
  });

  // ──── Mensajes por defecto en español ────

  it('AuthException tiene mensaje por defecto en español', () => {
    const ex = ApiException.fromStatus(401);
    expect(ex.message).toBe('No autorizado');
  });

  it('NotFoundException tiene mensaje por defecto en español', () => {
    const ex = ApiException.fromStatus(404);
    expect(ex.message).toBe('Recurso no encontrado');
  });

  it('ConflictException tiene mensaje por defecto en español', () => {
    const ex = ApiException.fromStatus(409);
    expect(ex.message).toBe('El recurso ya existe');
  });

  it('ServerException tiene mensaje por defecto en español', () => {
    const ex = ApiException.fromStatus(500);
    expect(ex.message).toBe('Error del servidor');
  });

  it('NetworkException tiene mensaje por defecto en español', () => {
    const ex = ApiException.fromStatus(0);
    expect(ex.message).toBe('Error de conexión. Verificá tu internet.');
  });

  it('UnknownApiException tiene mensaje por defecto en español', () => {
    const ex = ApiException.fromStatus(418);
    expect(ex.message).toBe('Error inesperado');
  });

  // ──── Mensaje personalizado pisa el default ────

  it('permite mensaje personalizado en fromStatus', () => {
    const ex = ApiException.fromStatus(404, 'Producto XYZ no encontrado');
    expect(ex.message).toBe('Producto XYZ no encontrado');
  });

  // ──── StatusCode se preserva ────

  it('preserva el statusCode original', () => {
    const ex = ApiException.fromStatus(404);
    expect(ex.statusCode).toBe(404);
  });

  it('NetworkException tiene statusCode 0', () => {
    const ex = ApiException.fromStatus(0);
    expect(ex.statusCode).toBe(0);
  });
});

// ──── fromAxiosError factory ────

describe('ApiException.fromAxiosError', () => {
  it('convierte error con response.status 401 en AuthException', () => {
    const axiosError = {
      response: {
        status: 401,
        data: {},
      },
    };
    const ex = ApiException.fromAxiosError(axiosError);
    expect(ex).toBeInstanceOf(AuthException);
    expect(ex.statusCode).toBe(401);
  });

  it('convierte error con response.status 404 en NotFoundException', () => {
    const axiosError = {
      response: {
        status: 404,
        data: {},
      },
    };
    const ex = ApiException.fromAxiosError(axiosError);
    expect(ex).toBeInstanceOf(NotFoundException);
  });

  it('convierte error con response.status 500 en ServerException', () => {
    const axiosError = {
      response: {
        status: 500,
        data: {},
      },
    };
    const ex = ApiException.fromAxiosError(axiosError);
    expect(ex).toBeInstanceOf(ServerException);
  });

  it('extrae mensaje del backend desde response.data.message', () => {
    const axiosError = {
      response: {
        status: 409,
        data: {
          message: 'El SKU YA-EXISTE ya está registrado',
        },
      },
    };
    const ex = ApiException.fromAxiosError(axiosError);
    expect(ex).toBeInstanceOf(ConflictException);
    expect(ex.message).toBe('El SKU YA-EXISTE ya está registrado');
  });

  it('extrae mensaje del backend desde response.data.error (fallback)', () => {
    const axiosError = {
      response: {
        status: 400,
        data: {
          error: 'Validation failed: name is required',
        },
      },
    };
    const ex = ApiException.fromAxiosError(axiosError);
    expect(ex.message).toBe('Validation failed: name is required');
  });

  it('usa mensaje por defecto si response.data no tiene message ni error', () => {
    const axiosError = {
      response: {
        status: 500,
        data: {},
      },
    };
    const ex = ApiException.fromAxiosError(axiosError);
    expect(ex.message).toBe('Error del servidor');
  });

  it('convierte error.code ECONNABORTED en NetworkException', () => {
    const axiosError = {
      code: 'ECONNABORTED',
      message: 'timeout of 30000ms exceeded',
    };
    const ex = ApiException.fromAxiosError(axiosError);
    expect(ex).toBeInstanceOf(NetworkException);
    expect(ex.message).toBe('La solicitud tardó demasiado. Intentá de nuevo.');
  });

  it('convierte error sin response (error de red) en NetworkException', () => {
    const axiosError = {
      message: 'Network Error',
      isAxiosError: true,
    };
    const ex = ApiException.fromAxiosError(axiosError);
    expect(ex).toBeInstanceOf(NetworkException);
    expect(ex.message).toBe('Error de conexión. Verificá tu internet.');
  });

  it('maneja error completamente undefined sin lanzar excepción', () => {
    const ex = ApiException.fromAxiosError(undefined);
    expect(ex).toBeInstanceOf(NetworkException);
    expect(ex.message).toBe('Error de conexión. Verificá tu internet.');
  });

  it('maneja error null sin lanzar excepción', () => {
    const ex = ApiException.fromAxiosError(null);
    expect(ex).toBeInstanceOf(NetworkException);
    expect(ex.message).toBe('Error de conexión. Verificá tu internet.');
  });
});

// ──── Jerarquía de nombres ────

describe('Jerarquía de clases', () => {
  it('AuthException tiene name "AuthException"', () => {
    const ex = new AuthException('No autorizado', 401);
    expect(ex.name).toBe('AuthException');
  });

  it('NotFoundException tiene name "NotFoundException"', () => {
    const ex = new NotFoundException('No encontrado', 404);
    expect(ex.name).toBe('NotFoundException');
  });

  it('ConflictException tiene name "ConflictException"', () => {
    const ex = new ConflictException('Conflicto', 409);
    expect(ex.name).toBe('ConflictException');
  });

  it('ServerException tiene name "ServerException"', () => {
    const ex = new ServerException('Error servidor', 500);
    expect(ex.name).toBe('ServerException');
  });

  it('NetworkException tiene name "NetworkException"', () => {
    const ex = new NetworkException('Sin conexión');
    expect(ex.name).toBe('NetworkException');
  });

  it('UnknownApiException tiene name "UnknownApiException"', () => {
    const ex = new UnknownApiException('Error', 418);
    expect(ex.name).toBe('UnknownApiException');
  });

  it('ApiException base tiene name "ApiException"', () => {
    const ex = new ApiException('Error genérico', 400);
    expect(ex.name).toBe('ApiException');
  });

  it('todas las subclases heredan de ApiException', () => {
    expect(new AuthException('x', 401)).toBeInstanceOf(ApiException);
    expect(new NotFoundException('x', 404)).toBeInstanceOf(ApiException);
    expect(new ConflictException('x', 409)).toBeInstanceOf(ApiException);
    expect(new ServerException('x', 500)).toBeInstanceOf(ApiException);
    expect(new NetworkException('x')).toBeInstanceOf(ApiException);
    expect(new UnknownApiException('x', 418)).toBeInstanceOf(ApiException);
  });

  it('todas las subclases heredan de Error', () => {
    expect(new AuthException('x', 401)).toBeInstanceOf(Error);
    expect(new NotFoundException('x', 404)).toBeInstanceOf(Error);
    expect(new NetworkException('x')).toBeInstanceOf(Error);
    expect(new ServerException('x', 500)).toBeInstanceOf(Error);
  });
});

// ──── getErrorMessage helper ────

describe('getErrorMessage', () => {
  it('extrae el mensaje de una ApiException', () => {
    const ex = new AuthException('Token expirado', 401);
    expect(getErrorMessage(ex)).toBe('Token expirado');
  });

  it('extrae el mensaje de un Error genérico', () => {
    const err = new Error('Algo falló en el parser');
    expect(getErrorMessage(err)).toBe('Algo falló en el parser');
  });

  it('usa fallback en español si Error no tiene mensaje', () => {
    const err = new Error();
    err.message = '';
    expect(getErrorMessage(err)).toBe('Error inesperado. Intentalo de nuevo.');
  });

  it('usa fallback en español para valores no-Error (string)', () => {
    expect(getErrorMessage('algo raro')).toBe(
      'Error inesperado. Intentalo de nuevo.',
    );
  });

  it('usa fallback en español para null', () => {
    expect(getErrorMessage(null)).toBe('Error inesperado. Intentalo de nuevo.');
  });

  it('usa fallback en español para undefined', () => {
    expect(getErrorMessage(undefined)).toBe(
      'Error inesperado. Intentalo de nuevo.',
    );
  });

  it('usa fallback en español para números', () => {
    expect(getErrorMessage(42)).toBe('Error inesperado. Intentalo de nuevo.');
  });
});
