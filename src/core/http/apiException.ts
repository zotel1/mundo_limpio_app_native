/**
 * ApiException — Jerarquía de errores HTTP tipada.
 *
 * WHAT: Clase base y 6 subclases para representar todos los tipos de error
 *       que puede devolver el backend. Equivalente al `api_exception.dart` del Flutter.
 * WHY: Centraliza el manejo de errores HTTP en tipos TypeScript discriminados.
 *      Las capas superiores pueden hacer switch por tipo de error sin conocer Axios.
 * BENEFITS: Sin instanceof disperso en los consumidores, switch exhaustivo,
 *           mensajes de error en español, factories desde statusCode y AxiosError.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de apiException.test.ts.
 */

// ──── Clase base ────

export class ApiException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'ApiException';
    // Fix prototype chain para que instanceof funcione correctamente
    Object.setPrototypeOf(this, ApiException.prototype);
  }

  /**
   * Factory: crea la subclase correcta según el código de estado HTTP.
   * Permite a los consumidores hacer switch exhaustivo por tipo de excepción.
   */
  static fromStatus(statusCode: number, message?: string): ApiException {
    if (statusCode === 401 || statusCode === 403) {
      return new AuthException(message ?? 'No autorizado', statusCode);
    }
    if (statusCode === 404) {
      return new NotFoundException(
        message ?? 'Recurso no encontrado',
        statusCode,
      );
    }
    if (statusCode === 409) {
      return new ConflictException(
        message ?? 'El recurso ya existe',
        statusCode,
      );
    }
    if (statusCode >= 500) {
      return new ServerException(message ?? 'Error del servidor', statusCode);
    }
    if (statusCode === 0) {
      return new NetworkException(
        message ?? 'Error de conexión. Verificá tu internet.',
      );
    }
    return new UnknownApiException(message ?? 'Error inesperado', statusCode);
  }

  /**
   * Factory: convierte un error de Axios en la ApiException correspondiente.
   * Extrae statusCode y mensaje del response del backend cuando están disponibles.
   */
  static fromAxiosError(error: any): ApiException {
    // Error con respuesta del backend (4xx, 5xx, etc.)
    if (error?.response) {
      const status: number = error.response.status;
      const message: string | undefined =
        error.response.data?.message || error.response.data?.error;
      return ApiException.fromStatus(status, message);
    }

    // Timeout de Axios
    if (error?.code === 'ECONNABORTED') {
      return new NetworkException(
        'La solicitud tardó demasiado. Intentá de nuevo.',
      );
    }

    // Error de red (sin respuesta del servidor)
    return new NetworkException('Error de conexión. Verificá tu internet.');
  }
}

// ──── Subclases — 6 errores específicos ────

/**
 * AuthException — Error de autenticación/autorización (401, 403).
 */
export class AuthException extends ApiException {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
    this.name = 'AuthException';
    Object.setPrototypeOf(this, AuthException.prototype);
  }
}

/**
 * NotFoundException — Recurso no encontrado (404).
 */
export class NotFoundException extends ApiException {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
    this.name = 'NotFoundException';
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

/**
 * ConflictException — Conflicto de datos, ej. SKU duplicado (409).
 */
export class ConflictException extends ApiException {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
    this.name = 'ConflictException';
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}

/**
 * ServerException — Error del lado del servidor (5xx).
 */
export class ServerException extends ApiException {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
    this.name = 'ServerException';
    Object.setPrototypeOf(this, ServerException.prototype);
  }
}

/**
 * NetworkException — Error de conectividad (sin response, timeout).
 * Siempre tiene statusCode 0 porque no hubo respuesta HTTP.
 */
export class NetworkException extends ApiException {
  constructor(message: string) {
    super(message, 0);
    this.name = 'NetworkException';
    Object.setPrototypeOf(this, NetworkException.prototype);
  }
}

/**
 * UnknownApiException — Cualquier otro código HTTP no mapeado (ej. 418).
 */
export class UnknownApiException extends ApiException {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
    this.name = 'UnknownApiException';
    Object.setPrototypeOf(this, UnknownApiException.prototype);
  }
}

// ──── Helper ────

/**
 * getErrorMessage — Extrae un mensaje de error legible en español
 * desde cualquier tipo de error (ApiException, Error, unknown).
 *
 * WHAT: Función helper que normaliza el mensaje de error para mostrar al usuario.
 * WHY: Evita que la UI tenga que hacer type narrowing manual en cada catch.
 * BENEFITS: Una sola función para toda la app. Siempre retorna español.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message || 'Error inesperado. Intentalo de nuevo.';
  }
  return 'Error inesperado. Intentalo de nuevo.';
}
