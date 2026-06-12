/**
 * TDD: RED — Tests para Zod DTOs de auth.
 *
 * WHAT: Valida que los schemas Zod rechacen datos inválidos y acepten datos
 *       correctos según los contratos del backend.
 * WHY: Zod atrapa errores en runtime si el backend cambia el schema. Los tests
 *      validan que los schemas están correctamente definidos.
 * BENEFITS: Validación runtime, tipos TypeScript inferidos, mensajes claros.
 */
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  RefreshRequestSchema,
  AuthResponseSchema,
} from '@features/auth/infrastructure/api/dtos';

describe('LoginRequestSchema', () => {
  it('rechaza email sin @', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'sin-arroba',
      password: 'SecurePass1',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza password vacío', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'test@mundolimpio.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('acepta credenciales válidas', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'test@mundolimpio.com',
      password: 'SecurePass1',
    });
    expect(result.success).toBe(true);
  });
});

describe('RegisterRequestSchema', () => {
  it('rechaza password menor a 6 caracteres', () => {
    const result = RegisterRequestSchema.safeParse({
      email: 'test@mundolimpio.com',
      password: 'Ab1',
    });
    expect(result.success).toBe(false);
  });

  it('acepta registro con datos válidos', () => {
    const result = RegisterRequestSchema.safeParse({
      email: 'test@mundolimpio.com',
      password: 'SecurePass1',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza email inválido en registro', () => {
    const result = RegisterRequestSchema.safeParse({
      email: 'no-es-email',
      password: 'SecurePass1',
    });
    expect(result.success).toBe(false);
  });
});

describe('RefreshRequestSchema', () => {
  it('rechaza refreshToken vacío', () => {
    const result = RefreshRequestSchema.safeParse({ refreshToken: '' });
    expect(result.success).toBe(false);
  });

  it('acepta refreshToken válido', () => {
    const result = RefreshRequestSchema.safeParse({
      refreshToken: 'eyJhbGciOiJIUzI1NiJ9.xxx',
    });
    expect(result.success).toBe(true);
  });
});

describe('AuthResponseSchema', () => {
  const validResponse = {
    accessToken: 'eyJhbGciOiJIUzI1NiJ9.xxx',
    refreshToken: 'eyJhbGciOiJIUzI1NiJ9.yyy',
    roles: ['STOCK_OPERATOR'],
    username: 'operador_stock',
    email: 'op@mundolimpio.com',
    userId: 42,
  };

  it('acepta respuesta completa', () => {
    const result = AuthResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe(42);
      expect(result.data.username).toBe('operador_stock');
    }
  });

  it('acepta respuesta sin userId (nullable)', () => {
    const result = AuthResponseSchema.safeParse({
      ...validResponse,
      userId: null,
    });
    expect(result.success).toBe(true);
  });

  it('acepta respuesta sin email (nullable)', () => {
    const result = AuthResponseSchema.safeParse({
      ...validResponse,
      email: null,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza respuesta sin accessToken', () => {
    const { accessToken: _at, ...sinAccessToken } = validResponse;
    const result = AuthResponseSchema.safeParse(sinAccessToken);
    expect(result.success).toBe(false);
  });

  it('rechaza respuesta sin refreshToken', () => {
    const { refreshToken: _rt, ...sinRefreshToken } = validResponse;
    const result = AuthResponseSchema.safeParse(sinRefreshToken);
    expect(result.success).toBe(false);
  });

  it('rechaza respuesta sin roles', () => {
    const { roles: _r, ...sinRoles } = validResponse;
    const result = AuthResponseSchema.safeParse(sinRoles);
    expect(result.success).toBe(false);
  });

  it('rechaza respuesta sin username', () => {
    const { username: _un, ...sinUsername } = validResponse;
    const result = AuthResponseSchema.safeParse(sinUsername);
    expect(result.success).toBe(false);
  });

  it('rechaza userId negativo', () => {
    const result = AuthResponseSchema.safeParse({
      ...validResponse,
      userId: -1,
    });
    expect(result.success).toBe(false);
  });
});
