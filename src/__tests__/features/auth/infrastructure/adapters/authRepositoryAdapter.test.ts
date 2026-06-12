/**
 * TDD: RED — Tests para AuthRepositoryAdapter.
 *
 * WHAT: Valida que el adapter implemente correctamente el puerto AuthRepository
 *       orquestando AuthApi (HTTP) + TokenStorage (persistencia).
 * WHY: El adapter es el punto donde se acoplan HTTP y storage. Los tests
 *      verifican cada flujo: login, register, refresh, logout, isLoggedIn.
 * BENEFITS: Testea comportamiento sin backend real ni Keychain real.
 *           Mock de AuthApi + TokenStorage → comportamiento puro.
 */
import { AuthRepositoryAdapter } from '@features/auth/infrastructure/adapters/authRepositoryAdapter';
import { AuthApi } from '@features/auth/infrastructure/api/authApi';
import type { ITokenStorage } from '@core/storage/tokenStorage';
import type { AuthSession } from '@features/auth/domain/models/authSession';

describe('AuthRepositoryAdapter', () => {
  let mockAuthApi: jest.Mocked<AuthApi>;
  let mockTokenStorage: jest.Mocked<ITokenStorage>;
  let adapter: AuthRepositoryAdapter;

  const validAuthResponse = {
    accessToken: 'eyJhbGciOiJIUzI1NiJ9.aaa',
    refreshToken: 'eyJhbGciOiJIUzI1NiJ9.bbb',
    roles: ['STOCK_OPERATOR'],
    username: 'operador_stock',
    email: 'op@mundolimpio.com',
    userId: 42,
  };

  beforeEach(() => {
    mockAuthApi = {
      login: jest.fn(),
      register: jest.fn(),
      refresh: jest.fn(),
    } as unknown as jest.Mocked<AuthApi>;

    mockTokenStorage = {
      saveTokens: jest.fn().mockResolvedValue(undefined),
      readAccessToken: jest.fn().mockResolvedValue(null),
      readRefreshToken: jest.fn().mockResolvedValue(null),
      hasTokens: jest.fn().mockResolvedValue(false),
      clear: jest.fn().mockResolvedValue(undefined),
    };

    adapter = new AuthRepositoryAdapter(mockAuthApi, mockTokenStorage);
  });

  describe('login()', () => {
    it('guarda tokens en storage después de login exitoso', async () => {
      mockAuthApi.login.mockResolvedValueOnce(validAuthResponse);

      const result = await adapter.login({
        email: 'test@mundolimpio.com',
        password: 'SecurePass1',
      });

      // Debe llamar al API con las credenciales correctas
      expect(mockAuthApi.login).toHaveBeenCalledTimes(1);
      expect(mockAuthApi.login).toHaveBeenCalledWith({
        email: 'test@mundolimpio.com',
        password: 'SecurePass1',
      });

      // Debe guardar los tokens
      expect(mockTokenStorage.saveTokens).toHaveBeenCalledTimes(1);
      expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(
        'eyJhbGciOiJIUzI1NiJ9.aaa',
        'eyJhbGciOiJIUzI1NiJ9.bbb',
      );

      // Debe retornar AuthSession con los datos correctos
      expect(result.userId).toBe(42);
      expect(result.username).toBe('operador_stock');
      expect(result.email).toBe('op@mundolimpio.com');
      expect(result.roles).toEqual(['STOCK_OPERATOR']);
    });

    it('propaga error de authApi sin guardar tokens', async () => {
      const apiError = new Error('Credenciales inválidas');
      mockAuthApi.login.mockRejectedValueOnce(apiError);

      await expect(
        adapter.login({
          email: 'test@mundolimpio.com',
          password: 'wrong',
        }),
      ).rejects.toThrow('Credenciales inválidas');

      // NO debe guardar tokens si el login falla
      expect(mockTokenStorage.saveTokens).not.toHaveBeenCalled();
    });

    it('retorna AuthSession con userId=0 si la API no devuelve userId', async () => {
      mockAuthApi.login.mockResolvedValueOnce({
        ...validAuthResponse,
        userId: null,
        email: null,
      });

      const result = await adapter.login({
        email: 'test@mundolimpio.com',
        password: 'SecurePass1',
      });

      expect(result.userId).toBe(0);
      expect(result.email).toBeNull();
      expect(result.roles).toEqual(['STOCK_OPERATOR']);
    });
  });

  describe('register()', () => {
    it('NO guarda tokens después de registrar (R2.1)', async () => {
      // R2.1: El registro NO autentica automáticamente
      mockAuthApi.register.mockResolvedValueOnce(validAuthResponse);

      const result = await adapter.register({
        email: 'nuevo@mundolimpio.com',
        password: 'SecurePass1',
      });

      // Debe llamar al API
      expect(mockAuthApi.register).toHaveBeenCalledTimes(1);

      // NO debe guardar tokens (R2.1)
      expect(mockTokenStorage.saveTokens).not.toHaveBeenCalled();

      // Pero SÍ retorna la sesión para feedback en UI
      expect(result.username).toBe('operador_stock');
      expect(result.userId).toBe(42);
    });
  });

  describe('refreshToken()', () => {
    it('actualiza tokens guardados después del refresh', async () => {
      mockAuthApi.refresh.mockResolvedValueOnce({
        ...validAuthResponse,
        accessToken: 'nuevo-access-token',
        refreshToken: 'nuevo-refresh-token',
      });

      const result = await adapter.refreshToken('refresh-token-actual');

      expect(mockAuthApi.refresh).toHaveBeenCalledWith('refresh-token-actual');

      // Debe guardar los NUEVOS tokens
      expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(
        'nuevo-access-token',
        'nuevo-refresh-token',
      );

      // Retorna la sesión actualizada
      expect(result.username).toBe('operador_stock');
    });
  });

  describe('logout()', () => {
    it('limpia tokenStorage sin llamar al backend', async () => {
      await adapter.logout();

      // Solo limpia storage local
      expect(mockTokenStorage.clear).toHaveBeenCalledTimes(1);

      // NO llama a authApi (no hay endpoint de logout en el backend)
      expect(mockAuthApi.login).not.toHaveBeenCalled();
      expect(mockAuthApi.register).not.toHaveBeenCalled();
      expect(mockAuthApi.refresh).not.toHaveBeenCalled();
    });
  });

  describe('isLoggedIn()', () => {
    it('retorna true si tokenStorage tiene tokens', async () => {
      mockTokenStorage.hasTokens.mockResolvedValueOnce(true);

      const result = await adapter.isLoggedIn();

      expect(result).toBe(true);
      expect(mockTokenStorage.hasTokens).toHaveBeenCalledTimes(1);
    });

    it('retorna false si tokenStorage no tiene tokens', async () => {
      mockTokenStorage.hasTokens.mockResolvedValueOnce(false);

      const result = await adapter.isLoggedIn();

      expect(result).toBe(false);
    });
  });
});
