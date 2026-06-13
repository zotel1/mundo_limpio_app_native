/**
 * TDD: RED — Tests para ConnectivityService (NetInfo wrapper).
 *
 * WHAT: Tests que definen el contrato de ConnectivityService: detección
 *       online/offline vía NetInfo, listener pattern, y check manual.
 * WHY: TDD estricto: los tests guían el diseño de la abstracción sobre
 *      @react-native-community/netinfo antes de implementarla.
 * BENEFITS: Cobertura de estados online/offline, listeners, unsubscribe,
 *           y comportamiento optimista por defecto. Mock puro sin jest.fn()
 *           evita interferencia con resetMocks/restoreMocks del jest.config.
 */

import { ConnectivityService } from '@core/connectivity/ConnectivityService';

// ──── Mock de @react-native-community/netinfo ────
//
// Variables module-scoped para que los tests controlen el estado simulado.
// No usamos jest.fn() porque jest.config tiene resetMocks: true +
// restoreMocks: true, lo cual reiniciaría las implementaciones mock.
// En su lugar usamos funciones planas con cierres sobre variables mutables.

type MockNetInfoState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
};

let mockIsConnected = true;
let mockIsInternetReachable: boolean | null = true;
let netInfoSubscriber: ((state: MockNetInfoState) => void) | null = null;

jest.mock('@react-native-community/netinfo', () => ({
  fetch: () =>
    Promise.resolve({
      isConnected: mockIsConnected,
      isInternetReachable: mockIsInternetReachable,
    }),
  addEventListener: (callback: (state: MockNetInfoState) => void) => {
    netInfoSubscriber = callback;
    return () => {
      netInfoSubscriber = null;
    };
  },
}));

// ──── Suite de tests ────

describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(() => {
    mockIsConnected = true;
    mockIsInternetReachable = true;
    netInfoSubscriber = null;
    service = new ConnectivityService();
  });

  // ── 1. Initial state (optimista) ──

  describe('estado inicial (optimista)', () => {
    it('isOnline es true por defecto — asume online hasta que se pruebe lo contrario', () => {
      expect(service.isOnline).toBe(true);
    });

    it('cada instancia arranca con isOnline=true independientemente', () => {
      const service2 = new ConnectivityService();
      expect(service2.isOnline).toBe(true);
    });
  });

  // ── 2. initialize() ──

  describe('initialize()', () => {
    it('llama a NetInfo.fetch() y actualiza isOnline cuando está offline', async () => {
      mockIsConnected = false;
      mockIsInternetReachable = false;

      await service.initialize();

      expect(service.isOnline).toBe(false);
    });

    it('conserva isOnline=true cuando fetch retorna online', async () => {
      mockIsConnected = true;
      mockIsInternetReachable = true;

      await service.initialize();

      expect(service.isOnline).toBe(true);
    });

    it('registra un subscriber para detectar cambios futuros de conectividad', async () => {
      await service.initialize();

      expect(netInfoSubscriber).not.toBeNull();
    });
  });

  // ── 3. addListener — callback en cambio de estado ──

  describe('addListener() — notificación de cambios', () => {
    it('invoca el callback con false cuando NetInfo reporta offline', async () => {
      await service.initialize();
      const listener = jest.fn();
      service.addListener(listener);

      netInfoSubscriber!({ isConnected: false, isInternetReachable: false });

      expect(listener).toHaveBeenCalledWith(false);
    });

    it('invoca el callback con true cuando NetInfo reporta online', async () => {
      // Empezamos offline para que la transición sea visible
      mockIsConnected = false;
      mockIsInternetReachable = false;
      await service.initialize();

      const listener = jest.fn();
      service.addListener(listener);

      netInfoSubscriber!({ isConnected: true, isInternetReachable: true });

      expect(listener).toHaveBeenCalledWith(true);
    });

    it('no invoca el callback si isOnline no cambia (mismo estado)', async () => {
      await service.initialize(); // online
      const listener = jest.fn();
      service.addListener(listener);

      // Mismo estado online — no debería llamar al listener
      netInfoSubscriber!({ isConnected: true, isInternetReachable: true });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ── 4. addListener — unsubscribe ──

  describe('addListener() — unsubscribe', () => {
    it('retorna una función que al ejecutarla remueve el listener', async () => {
      await service.initialize();
      const listener = jest.fn();
      const unsubscribe = service.addListener(listener);

      unsubscribe();

      netInfoSubscriber!({ isConnected: false, isInternetReachable: false });

      expect(listener).not.toHaveBeenCalled();
    });

    it('solo remueve el listener específico, sin afectar a otros', async () => {
      await service.initialize();
      const listenerA = jest.fn();
      const listenerB = jest.fn();

      service.addListener(listenerA);
      const unsubB = service.addListener(listenerB);
      unsubB();

      netInfoSubscriber!({ isConnected: false, isInternetReachable: false });

      expect(listenerA).toHaveBeenCalledWith(false);
      expect(listenerB).not.toHaveBeenCalled();
    });

    it('llamar unsubscribe múltiples veces no lanza error', async () => {
      await service.initialize();
      const listener = jest.fn();
      const unsubscribe = service.addListener(listener);

      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  // ── 5. checkNow() ──

  describe('checkNow() — verificación forzada', () => {
    it('retorna true cuando hay conectividad completa', async () => {
      mockIsConnected = true;
      mockIsInternetReachable = true;

      const result = await service.checkNow();

      expect(result).toBe(true);
      expect(service.isOnline).toBe(true);
    });

    it('retorna false cuando isConnected es false', async () => {
      mockIsConnected = false;
      mockIsInternetReachable = null;

      const result = await service.checkNow();

      expect(result).toBe(false);
      expect(service.isOnline).toBe(false);
    });

    it('retorna false cuando isConnected=true pero isInternetReachable=false', async () => {
      mockIsConnected = true;
      mockIsInternetReachable = false;

      const result = await service.checkNow();

      expect(result).toBe(false);
      expect(service.isOnline).toBe(false);
    });

    it('transiciona correctamente de offline a online entre llamadas', async () => {
      // Offline
      mockIsConnected = false;
      mockIsInternetReachable = false;
      let result = await service.checkNow();
      expect(result).toBe(false);

      // Online
      mockIsConnected = true;
      mockIsInternetReachable = true;
      result = await service.checkNow();
      expect(result).toBe(true);
    });
  });

  // ── 6. Offline detection ──

  describe('detección offline vía subscriber', () => {
    it('isConnected=false → isOnline=false', async () => {
      await service.initialize();

      netInfoSubscriber!({ isConnected: false, isInternetReachable: null });

      expect(service.isOnline).toBe(false);
    });

    it('isConnected=true + isInternetReachable=null → isOnline=false (conservador)', async () => {
      await service.initialize();

      netInfoSubscriber!({ isConnected: true, isInternetReachable: null });

      expect(service.isOnline).toBe(false);
    });
  });

  // ── 7. Online detection ──

  describe('detección online vía subscriber', () => {
    it('isConnected=true + isInternetReachable=true → isOnline=true', async () => {
      // Empezamos offline para que la transición sea visible
      mockIsConnected = false;
      mockIsInternetReachable = false;
      await service.initialize();
      expect(service.isOnline).toBe(false);

      netInfoSubscriber!({ isConnected: true, isInternetReachable: true });

      expect(service.isOnline).toBe(true);
    });

    it('transición offline→online notifica a los listeners', async () => {
      mockIsConnected = false;
      mockIsInternetReachable = false;
      await service.initialize();

      const listener = jest.fn();
      service.addListener(listener);

      netInfoSubscriber!({ isConnected: true, isInternetReachable: true });

      expect(listener).toHaveBeenCalledWith(true);
    });
  });
});
