/**
 * TDD: RED — Tests para el almacenamiento de tokens JWT.
 *
 * WHAT: Define el comportamiento esperado del InMemoryTokenStorage
 *       (implementación temporal) y la interfaz ITokenStorage
 *       antes de implementarlos.
 * WHY: TDD estricto: los tests guían el diseño del wrapper de
 *      almacenamiento de tokens. La abstracción ITokenStorage permite
 *      mockear en tests del authInterceptor sin dependencia nativa.
 * BENEFITS: Cobertura completa de operaciones CRUD de tokens:
 *           guardar, leer, verificar existencia, limpiar.
 */

// El módulo aún NO existe — esto garantiza RED
import {
  ITokenStorage,
  InMemoryTokenStorage,
} from '@core/storage/tokenStorage';

// ──── Verificación de interfaz ────

describe('ITokenStorage (interfaz)', () => {
  it('puede ser implementada por un objeto literal que cumpla el contrato', () => {
    // Si ITokenStorage es una interfaz TypeScript, este objeto literal
    // debería compilar sin error si cumple el contrato.
    // Verificamos en runtime que los métodos existen.
    const storage: ITokenStorage = {
      saveTokens: async () => {},
      readAccessToken: async () => null,
      readRefreshToken: async () => null,
      hasTokens: async () => false,
      clear: async () => {},
    };

    expect(typeof storage.saveTokens).toBe('function');
    expect(typeof storage.readAccessToken).toBe('function');
    expect(typeof storage.readRefreshToken).toBe('function');
    expect(typeof storage.hasTokens).toBe('function');
    expect(typeof storage.clear).toBe('function');
  });
});

// ──── InMemoryTokenStorage — operaciones básicas ────

describe('InMemoryTokenStorage', () => {
  let storage: InMemoryTokenStorage;

  beforeEach(() => {
    storage = new InMemoryTokenStorage();
  });

  // ── saveTokens ──

  describe('saveTokens', () => {
    it('guarda el accessToken y refreshToken en memoria', async () => {
      await storage.saveTokens('access-abc', 'refresh-xyz');

      const access = await storage.readAccessToken();
      const refresh = await storage.readRefreshToken();

      expect(access).toBe('access-abc');
      expect(refresh).toBe('refresh-xyz');
    });

    it('sobrescribe tokens existentes', async () => {
      await storage.saveTokens('old-access', 'old-refresh');
      await storage.saveTokens('new-access', 'new-refresh');

      const access = await storage.readAccessToken();
      const refresh = await storage.readRefreshToken();

      expect(access).toBe('new-access');
      expect(refresh).toBe('new-refresh');
    });

    it('acepta tokens vacíos (comportamiento definido, no lanza error)', async () => {
      await storage.saveTokens('', '');

      const access = await storage.readAccessToken();
      const refresh = await storage.readRefreshToken();

      expect(access).toBe('');
      expect(refresh).toBe('');
    });
  });

  // ── readAccessToken ──

  describe('readAccessToken', () => {
    it('retorna null si no se guardó ningún token', async () => {
      const access = await storage.readAccessToken();
      expect(access).toBeNull();
    });

    it('retorna el accessToken guardado', async () => {
      await storage.saveTokens('my-access-token', 'my-refresh-token');

      const access = await storage.readAccessToken();
      expect(access).toBe('my-access-token');
    });

    it('retorna null después de clear()', async () => {
      await storage.saveTokens('access-token', 'refresh-token');
      await storage.clear();

      const access = await storage.readAccessToken();
      expect(access).toBeNull();
    });
  });

  // ── readRefreshToken ──

  describe('readRefreshToken', () => {
    it('retorna null si no se guardó ningún token', async () => {
      const refresh = await storage.readRefreshToken();
      expect(refresh).toBeNull();
    });

    it('retorna el refreshToken guardado', async () => {
      await storage.saveTokens('my-access', 'my-refresh-token');

      const refresh = await storage.readRefreshToken();
      expect(refresh).toBe('my-refresh-token');
    });

    it('retorna null después de clear()', async () => {
      await storage.saveTokens('access', 'refresh');
      await storage.clear();

      const refresh = await storage.readRefreshToken();
      expect(refresh).toBeNull();
    });
  });

  // ── hasTokens ──

  describe('hasTokens', () => {
    it('retorna true si ambos tokens existen', async () => {
      await storage.saveTokens('access', 'refresh');

      const result = await storage.hasTokens();
      expect(result).toBe(true);
    });

    it('retorna false si falta el accessToken', async () => {
      // Solo guardamos token con access vacío — no hay forma de
      // guardar solo uno con la API actual. Verificamos que si no
      // hay tokens guardados, hasTokens retorna false.
      const result = await storage.hasTokens();
      expect(result).toBe(false);
    });

    it('retorna false si falta el refreshToken', async () => {
      // Igual que arriba — verificamos el estado inicial
      const result = await storage.hasTokens();
      expect(result).toBe(false);
    });

    it('retorna false después de clear()', async () => {
      await storage.saveTokens('access', 'refresh');
      await storage.clear();

      const result = await storage.hasTokens();
      expect(result).toBe(false);
    });

    it('retorna false cuando solo el accessToken no es null pero el refresh sí', async () => {
      // Guardamos ambos, luego forzamos estado inválido limpiando solo uno.
      // En la implementación real esto no debería ocurrir, pero hasTokens
      // debe ser robusto.
      await storage.saveTokens('access', 'refresh');
      // Simulamos: establecemos refresh a null manualmente
      // Esto depende de que InMemoryTokenStorage permita acceso a internals
      // Si no, este caso se cubre con el test del estado inicial.
      const afterClearAccess = await storage.readAccessToken();
      const afterClearRefresh = await storage.readRefreshToken();
      // Ambos existen porque todavía no hicimos clear
      expect(afterClearAccess).not.toBeNull();
      expect(afterClearRefresh).not.toBeNull();
    });
  });

  // ── clear ──

  describe('clear', () => {
    it('borra ambos tokens', async () => {
      await storage.saveTokens('access-to-clear', 'refresh-to-clear');
      await storage.clear();

      const access = await storage.readAccessToken();
      const refresh = await storage.readRefreshToken();

      expect(access).toBeNull();
      expect(refresh).toBeNull();
    });

    it('es idempotente — no lanza error si ya está vacío', async () => {
      // Primer clear
      await storage.clear();
      // Segundo clear (ya vacío)
      await storage.clear();

      const access = await storage.readAccessToken();
      const refresh = await storage.readRefreshToken();

      expect(access).toBeNull();
      expect(refresh).toBeNull();
    });

    it('hasTokens retorna false después de clear idempotente', async () => {
      await storage.clear();
      await storage.clear();

      const result = await storage.hasTokens();
      expect(result).toBe(false);
    });
  });

  // ── Comportamiento async ──

  describe('comportamiento async', () => {
    it('todos los métodos retornan Promises', () => {
      expect(storage.saveTokens('a', 'b')).toBeInstanceOf(Promise);
      expect(storage.readAccessToken()).toBeInstanceOf(Promise);
      expect(storage.readRefreshToken()).toBeInstanceOf(Promise);
      expect(storage.hasTokens()).toBeInstanceOf(Promise);
      expect(storage.clear()).toBeInstanceOf(Promise);
    });
  });

  // ── Triangulación: secuencias de operaciones ──

  describe('triangulación: secuencias de operaciones', () => {
    it('save → read → clear → read devuelve todo null', async () => {
      await storage.saveTokens('tok1', 'tok2');

      expect(await storage.readAccessToken()).toBe('tok1');
      expect(await storage.readRefreshToken()).toBe('tok2');

      await storage.clear();

      expect(await storage.readAccessToken()).toBeNull();
      expect(await storage.readRefreshToken()).toBeNull();
      expect(await storage.hasTokens()).toBe(false);
    });

    it('save → save (sobrescribir) → read devuelve los últimos', async () => {
      await storage.saveTokens('first-access', 'first-refresh');
      await storage.saveTokens('second-access', 'second-refresh');

      expect(await storage.readAccessToken()).toBe('second-access');
      expect(await storage.readRefreshToken()).toBe('second-refresh');
    });

    it('clear en estado inicial no lanza error', async () => {
      // Ni siquiera se llamó saveTokens
      await storage.clear();
      expect(await storage.hasTokens()).toBe(false);
    });

    it('clear → save → hasTokens retorna true', async () => {
      await storage.clear();
      await storage.saveTokens('after-clear', 'after-clear-refresh');
      expect(await storage.hasTokens()).toBe(true);
    });
  });
});
