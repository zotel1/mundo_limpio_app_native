/**
 * TDD: RED — Tests for SyncService (offline queue drain + backoff).
 *
 * WHAT: Tests that define the contract of SyncService: singleton pattern,
 *       drain on reconnect, exponential backoff on failure, conflict skip,
 *       event emission, and empty queue no-op.
 * WHY: TDD estricto: los tests guían el diseño del servicio de sincronización
 *      antes de implementarlo. Verifican comportamiento contra spec R16-R18.
 * BENEFITS: Cobertura de todos los escenarios de sync: éxito, conflicto,
 *           reintentos con backoff, cola vacía, y eventos observables.
 */

import { SyncService } from '@core/sync/SyncService';
import type { SyncableAdjustment, SyncEvent, SyncEventListener } from '@core/sync/SyncService';
import { ConnectivityService } from '@core/connectivity/ConnectivityService';
import { NetworkException, ConflictException } from '@core/http/apiException';

// ──── Helpers para crear datos de prueba ────

const mockInventory = {
  productId: 1,
  productName: 'Laptop',
  currentStock: 10,
  minStockThreshold: 5,
};

const mockQueueItem: SyncableAdjustment = {
  productId: 1,
  type: 'INCREMENT',
  quantity: 5,
  reason: 'Reposición',
};

const mockQueueItem2: SyncableAdjustment = {
  productId: 2,
  type: 'DECREMENT',
  quantity: 3,
  reason: 'Venta',
};

// ──── Mock de ConnectivityService ────
//
// Capturamos el callback que SyncService registra via addListener()
// para simular eventos online/offline en los tests.
let capturedListener: ((isOnline: boolean) => void) | null = null;
let mockIsOnline = false;

// Usamos una función plana (no jest.fn()) porque jest.config.js tiene
// resetMocks: true + restoreMocks: true, lo cual reiniciaría cualquier
// implementación de jest.fn() en el module factory. Mismo patrón que
// ConnectivityService.test.ts.
jest.mock('@core/connectivity/ConnectivityService', () => ({
  ConnectivityService: function MockConnectivityService() {
    return {
      isOnline: mockIsOnline,
      addListener: (cb: (isOnline: boolean) => void) => {
        capturedListener = cb;
        return () => {
          capturedListener = null;
        };
      },
    };
  },
}));

// ──── Mocks de OfflineQueue e InventoryRepository ────

function createMockQueue(items: SyncableAdjustment[] = []) {
  let queueItems = [...items];
  return {
    enqueue: jest.fn((item: SyncableAdjustment) => {
      queueItems.push(item);
    }),
    dequeue: jest.fn(() => queueItems.shift()),
    peek: jest.fn(() => (queueItems.length > 0 ? queueItems[0] : undefined)),
    size: jest.fn(() => queueItems.length),
    peekAll: jest.fn(() => [...queueItems]),
    removeFirst: jest.fn(() => {
      queueItems.shift();
    }),
    clear: jest.fn(() => {
      queueItems = [];
    }),
  };
}

function createMockRepository() {
  return {
    getByProductId: jest.fn(),
    getLowStock: jest.fn(),
    adjustStock: jest.fn(),
  };
}

// ──── Suite ────

describe('SyncService', () => {
  let mockQueue: ReturnType<typeof createMockQueue>;
  let mockRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    // Resetear el singleton entre tests
    (SyncService as any).resetInstance?.();

    capturedListener = null;
    mockIsOnline = false;

    mockQueue = createMockQueue();
    mockRepo = createMockRepository();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── 1. Singleton pattern ──

  describe('patrón singleton', () => {
    it('getInstance retorna la misma instancia en llamadas sucesivas', () => {
      const connectivity = new ConnectivityService();

      const instance1 = SyncService.getInstance(connectivity, mockQueue as any, mockRepo as any);
      const instance2 = SyncService.getInstance(connectivity, mockQueue as any, mockRepo as any);

      expect(instance1).toBe(instance2);
    });

    it('resetInstance permite crear una nueva instancia para testing', () => {
      const connectivity = new ConnectivityService();

      const instance1 = SyncService.getInstance(connectivity, mockQueue as any, mockRepo as any);

      (SyncService as any).resetInstance();

      const newQueue = createMockQueue();
      const newRepo = createMockRepository();
      const instance2 = SyncService.getInstance(connectivity, newQueue as any, newRepo as any);

      expect(instance1).not.toBe(instance2);
    });
  });

  // ── 2. Drain on reconnect — procesa cola FIFO ──

  describe('drenado al reconectar — FIFO', () => {
    it('drain procesa todos los items de la cola al recibir evento online', async () => {
      const connectivity = new ConnectivityService();

      // Cola con 2 items
      const queue = createMockQueue([mockQueueItem, mockQueueItem2]);
      mockRepo.adjustStock.mockResolvedValue(mockInventory);

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      // Simular reconexión
      capturedListener!(true);

      // Esperar a que el drenado async termine
      // El drain se dispara internamente, necesitamos esperar
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockRepo.adjustStock).toHaveBeenCalledTimes(2);
      expect(mockRepo.adjustStock).toHaveBeenNthCalledWith(1, 1, {
        type: 'INCREMENT',
        quantity: 5,
        reason: 'Reposición',
      });
      expect(mockRepo.adjustStock).toHaveBeenNthCalledWith(2, 2, {
        type: 'DECREMENT',
        quantity: 3,
        reason: 'Venta',
      });
      // Los items exitosos deben ser removidos de la cola
      expect(queue.size()).toBe(0);
    });

    it('no inicia drenado si el evento es offline (isOnline=false)', async () => {
      const connectivity = new ConnectivityService();

      const queue = createMockQueue([mockQueueItem]);
      mockRepo.adjustStock.mockResolvedValue(mockInventory);

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      // Evento offline — no debe drenar
      capturedListener!(false);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockRepo.adjustStock).not.toHaveBeenCalled();
    });
  });

  // ── 3. Exponential backoff ──

  describe('backoff exponencial en NetworkException', () => {
    beforeEach(() => {
      jest.useFakeTimers({ legacyFakeTimers: false });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('reintenta con delay creciente y eventualmente procesa el item tras éxito', async () => {
      const connectivity = new ConnectivityService();

      const queue = createMockQueue([mockQueueItem]);

      // Primer intento falla, segundo tiene éxito
      mockRepo.adjustStock
        .mockRejectedValueOnce(new (NetworkException)('Sin conexión'))
        .mockResolvedValueOnce(mockInventory);

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      // Disparamos drain directamente (más predecible que esperar evento online)
      const drainPromise = service.drain();

      // El primer intento falló inmediatamente. Ahora debe esperar 1000ms.
      // advanceTimersByTimeAsync avanza timers Y drena microtasks (promises).
      await jest.advanceTimersByTimeAsync(1100);

      // Ahora el retry debe haber ocurrido y debe haber tenido éxito
      await drainPromise;

      expect(mockRepo.adjustStock).toHaveBeenCalledTimes(2);
      expect(queue.size()).toBe(0);
    });

    it('abandona el item tras agotar reintentos (max 3), manteniéndolo en cola', async () => {
      const connectivity = new ConnectivityService();

      const queue = createMockQueue([mockQueueItem]);

      // Siempre falla con NetworkException
      mockRepo.adjustStock.mockRejectedValue(
        new (NetworkException)('Sin conexión'),
      );

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      const drainPromise = service.drain();

      // Primer intento + 3 reintentos = 4 llamadas totales
      // Retry 1: sleep(1000)
      await jest.advanceTimersByTimeAsync(1100);

      // Retry 2: sleep(2000)
      await jest.advanceTimersByTimeAsync(2100);

      // Retry 3: sleep(4000)
      await jest.advanceTimersByTimeAsync(4100);

      await drainPromise;

      // 1 inicial + 3 retries = 4 llamadas
      expect(mockRepo.adjustStock).toHaveBeenCalledTimes(4);
      // El item fallido se mantiene en la cola
      expect(queue.size()).toBe(1);
    });
  });

  // ── 4. Conflict handling (409) ──

  describe('manejo de ConflictException (409)', () => {
    it('saltea el item con conflicto y continúa procesando el siguiente', async () => {
      const connectivity = new ConnectivityService();

      const queue = createMockQueue([mockQueueItem, mockQueueItem2]);

      // Primer item lanza ConflictException, segundo tiene éxito
      mockRepo.adjustStock
        .mockRejectedValueOnce(new (ConflictException)('Conflicto', 409))
        .mockResolvedValueOnce(mockInventory);

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      await service.drain();

      // Se llamó para ambos items
      expect(mockRepo.adjustStock).toHaveBeenCalledTimes(2);
      // El item conflictivo fue removido (no reintentado)
      // El segundo item se procesó exitosamente
      expect(queue.size()).toBe(0);
    });

    it('no reintenta items con ConflictException', async () => {
      const connectivity = new ConnectivityService();

      const queue = createMockQueue([mockQueueItem]);

      mockRepo.adjustStock.mockRejectedValue(
        new (ConflictException)('Conflicto', 409),
      );

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      await service.drain();

      // Solo 1 llamado, sin reintentos
      expect(mockRepo.adjustStock).toHaveBeenCalledTimes(1);
    });
  });

  // ── 5. Event emission ──

  describe('emisión de eventos', () => {
    it('emite sync:start y sync:complete al drenar exitosamente', async () => {
      const connectivity = new ConnectivityService();

      const queue = createMockQueue([mockQueueItem]);
      mockRepo.adjustStock.mockResolvedValue(mockInventory);

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      const events: SyncEvent[] = [];
      const listener: SyncEventListener = (event) => {
        events.push(event);
      };
      service.on('sync:start', listener);
      service.on('sync:complete', listener);
      service.on('sync:error', listener);
      service.on('sync:conflict', listener);

      await service.drain();

      expect(events).toHaveLength(2);
      expect(events[0]).toBe('sync:start');
      expect(events[1]).toBe('sync:complete');
    });

    it('emite sync:conflict cuando un item genera ConflictException', async () => {
      const connectivity = new ConnectivityService();

      const queue = createMockQueue([mockQueueItem]);
      mockRepo.adjustStock.mockRejectedValue(
        new (ConflictException)('Conflicto', 409),
      );

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      const events: SyncEvent[] = [];
      service.on('sync:start', (e) => events.push(e));
      service.on('sync:conflict', (e) => events.push(e));
      service.on('sync:complete', (e) => events.push(e));

      await service.drain();

      expect(events).toContain('sync:start');
      expect(events).toContain('sync:conflict');
      expect(events).toContain('sync:complete');
    });

    it('emite sync:error cuando un item agota reintentos', async () => {
      jest.useFakeTimers({ legacyFakeTimers: false });

      const connectivity = new ConnectivityService();

      const queue = createMockQueue([mockQueueItem]);
      mockRepo.adjustStock.mockRejectedValue(
        new (NetworkException)('Sin conexión'),
      );

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      const events: SyncEvent[] = [];
      service.on('sync:start', (e) => events.push(e));
      service.on('sync:error', (e) => events.push(e));
      service.on('sync:complete', (e) => events.push(e));

      const drainPromise = service.drain();

      // Avanzar todos los reintentos
      for (let i = 0; i < 3; i++) {
        const delay = 1000 * Math.pow(2, i);
        await jest.advanceTimersByTimeAsync(delay + 100);
      }

      await drainPromise;

      expect(events).toContain('sync:start');
      expect(events).toContain('sync:error');
      expect(events).toContain('sync:complete');

      jest.useRealTimers();
    });

    it('off() remueve el listener y no recibe más eventos', async () => {
      const connectivity = new ConnectivityService();

      const queue = createMockQueue([mockQueueItem]);
      mockRepo.adjustStock.mockResolvedValue(mockInventory);

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      const events: SyncEvent[] = [];
      const listener: SyncEventListener = (e) => events.push(e);
      service.on('sync:start', listener);
      // Removemos el listener antes de drenar
      service.off('sync:start', listener);

      await service.drain();

      // El listener fue removido, no debe haber recibido sync:start
      expect(events).not.toContain('sync:start');
    });
  });

  // ── 6. Cola vacía — no-op ──

  describe('cola vacía', () => {
    it('drain sobre cola vacía no hace ninguna llamada al repositorio', async () => {
      const connectivity = new ConnectivityService();

      const queue = createMockQueue([]); // cola vacía
      mockRepo.adjustStock.mockResolvedValue(mockInventory);

      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      await service.drain();

      expect(mockRepo.adjustStock).not.toHaveBeenCalled();
    });

    it('drain sobre cola vacía igual emite sync:start y sync:complete', async () => {
      const connectivity = new ConnectivityService();

      const queue = createMockQueue([]);
      const service = SyncService.getInstance(connectivity, queue as any, mockRepo as any);
      service.init();

      const events: SyncEvent[] = [];
      service.on('sync:start', (e) => events.push(e));
      service.on('sync:complete', (e) => events.push(e));

      await service.drain();

      expect(events).toContain('sync:start');
      expect(events).toContain('sync:complete');
    });
  });
});
