/**
 * TDD: RED — Tests para OfflineQueue<T>.
 *
 * WHAT: Define el comportamiento esperado de una cola genérica persistente
 *       sobre IKeyValueStorage: FIFO, serialización JSON, operaciones peek,
 *       clear y concurrencia de tipos.
 * WHY: TDD estricto: los tests guían el diseño de la abstracción antes
 *      de implementarla. OfflineQueue será usada en Fase 4 (Sales) y por
 *      el SyncService para encolar ajustes de inventario offline.
 * BENEFITS: Cobertura completa del contrato FIFO. Mock de IKeyValueStorage
 *           en memoria evita dependencia de MMKV nativo en Jest.
 */

import { OfflineQueue } from '@core/storage/OfflineQueue';
import type { IKeyValueStorage } from '@core/storage/IKeyValueStorage';

// ──── In-Memory Mock de IKeyValueStorage ────

function createInMemoryStorage(): IKeyValueStorage {
  const store = new Map<string, string>();

  return {
    getString: (key: string) => store.get(key),
    setString: (key: string, value: string) => {
      store.set(key, value);
    },
    getNumber: () => undefined,
    setNumber: () => {},
    getBoolean: () => undefined,
    setBoolean: () => {},
    getObject: <T>(key: string): T | undefined => {
      const raw = store.get(key);
      return raw !== undefined ? (JSON.parse(raw) as T) : undefined;
    },
    setObject: <T>(key: string, value: T) => {
      store.set(key, JSON.stringify(value));
    },
    delete: (key: string) => {
      store.delete(key);
    },
    getAllKeys: () => Array.from(store.keys()),
    clearAll: () => {
      store.clear();
    },
  };
}

// ──── OfflineQueue Tests ────

describe('OfflineQueue', () => {
  let storage: IKeyValueStorage;
  let queue: OfflineQueue<{ id: number; name: string }>;

  beforeEach(() => {
    storage = createInMemoryStorage();
    queue = new OfflineQueue(storage, 'test-queue');
  });

  // ── enqueue / size ──

  describe('enqueue', () => {
    it('agrega un item y aumenta el size', () => {
      queue.enqueue({ id: 1, name: 'Item 1' });
      expect(queue.size()).toBe(1);
    });

    it('agrega múltiples items en orden', () => {
      queue.enqueue({ id: 1, name: 'First' });
      queue.enqueue({ id: 2, name: 'Second' });
      queue.enqueue({ id: 3, name: 'Third' });
      expect(queue.size()).toBe(3);
    });

    it('persiste los items en el storage', () => {
      queue.enqueue({ id: 10, name: 'Persisted' });
      // Crear una nueva cola con el mismo storage y key debería ver el item
      const newQueue = new OfflineQueue(storage, 'test-queue');
      expect(newQueue.size()).toBe(1);
      expect(newQueue.peek()).toEqual({ id: 10, name: 'Persisted' });
    });
  });

  // ── dequeue (FIFO) ──

  describe('dequeue', () => {
    it('retorna y elimina el primer item (FIFO)', () => {
      queue.enqueue({ id: 1, name: 'First' });
      queue.enqueue({ id: 2, name: 'Second' });
      queue.enqueue({ id: 3, name: 'Third' });

      const first = queue.dequeue();
      expect(first).toEqual({ id: 1, name: 'First' });
      expect(queue.size()).toBe(2);
    });

    it('después de dequeue, peek retorna el nuevo primer elemento', () => {
      queue.enqueue({ id: 1, name: 'First' });
      queue.enqueue({ id: 2, name: 'Second' });

      queue.dequeue();
      expect(queue.peek()).toEqual({ id: 2, name: 'Second' });
    });

    it('retorna undefined si la cola está vacía', () => {
      expect(queue.dequeue()).toBeUndefined();
    });

    it('dequeue vacía completamente la cola despues de N llamadas', () => {
      queue.enqueue({ id: 1, name: 'A' });
      queue.enqueue({ id: 2, name: 'B' });

      queue.dequeue();
      queue.dequeue();

      expect(queue.size()).toBe(0);
      expect(queue.dequeue()).toBeUndefined();
    });
  });

  // ── peek / peekAll ──

  describe('peek', () => {
    it('retorna el primer item sin eliminarlo', () => {
      queue.enqueue({ id: 1, name: 'First' });
      queue.enqueue({ id: 2, name: 'Second' });

      const item = queue.peek();
      expect(item).toEqual({ id: 1, name: 'First' });
      expect(queue.size()).toBe(2); // no cambió
    });

    it('retorna undefined si la cola está vacía', () => {
      expect(queue.peek()).toBeUndefined();
    });
  });

  describe('peekAll', () => {
    it('retorna todos los items en orden', () => {
      queue.enqueue({ id: 1, name: 'A' });
      queue.enqueue({ id: 2, name: 'B' });
      queue.enqueue({ id: 3, name: 'C' });

      const all = queue.peekAll();
      expect(all).toHaveLength(3);
      expect(all[0]).toEqual({ id: 1, name: 'A' });
      expect(all[1]).toEqual({ id: 2, name: 'B' });
      expect(all[2]).toEqual({ id: 3, name: 'C' });
    });

    it('retorna array vacío si la cola está vacía', () => {
      expect(queue.peekAll()).toEqual([]);
    });

    it('retorna todos sin modificar la cola', () => {
      queue.enqueue({ id: 1, name: 'X' });
      const all = queue.peekAll();
      expect(all).toHaveLength(1);
      expect(queue.size()).toBe(1); // sin cambios
    });
  });

  // ── removeFirst ──

  describe('removeFirst', () => {
    it('elimina el primer elemento sin retornarlo', () => {
      queue.enqueue({ id: 1, name: 'A' });
      queue.enqueue({ id: 2, name: 'B' });

      queue.removeFirst();
      expect(queue.size()).toBe(1);
      expect(queue.peek()).toEqual({ id: 2, name: 'B' });
    });

    it('no lanza error en cola vacía', () => {
      expect(() => queue.removeFirst()).not.toThrow();
    });
  });

  // ── clear ──

  describe('clear', () => {
    it('elimina todos los items', () => {
      queue.enqueue({ id: 1, name: 'A' });
      queue.enqueue({ id: 2, name: 'B' });

      queue.clear();
      expect(queue.size()).toBe(0);
      expect(queue.peekAll()).toEqual([]);
    });

    it('no lanza error si la cola ya está vacía', () => {
      expect(() => queue.clear()).not.toThrow();
    });
  });

  // ── Triangulación: secuencias de operaciones ──

  describe('triangulación: secuencias', () => {
    it('enqueue → dequeue → enqueue → peekAll refleja estado correcto', () => {
      queue.enqueue({ id: 1, name: 'A' });
      queue.enqueue({ id: 2, name: 'B' });
      queue.dequeue(); // elimina A
      queue.enqueue({ id: 3, name: 'C' });

      expect(queue.peekAll()).toEqual([
        { id: 2, name: 'B' },
        { id: 3, name: 'C' },
      ]);
    });

    it('clear → enqueue restaura desde cero', () => {
      queue.enqueue({ id: 1, name: 'Old' });
      queue.clear();
      queue.enqueue({ id: 2, name: 'New' });

      expect(queue.size()).toBe(1);
      expect(queue.peek()).toEqual({ id: 2, name: 'New' });
    });

    it('múltiples queues con keys distintas no interfieren', () => {
      const queueA = new OfflineQueue(storage, 'queue-A');
      const queueB = new OfflineQueue(storage, 'queue-B');

      queueA.enqueue({ id: 1, name: 'A1' });
      queueB.enqueue({ id: 2, name: 'B1' });
      queueB.enqueue({ id: 3, name: 'B2' });

      expect(queueA.size()).toBe(1);
      expect(queueB.size()).toBe(2);
      expect(queueA.peek()).toEqual({ id: 1, name: 'A1' });
      expect(queueB.peek()).toEqual({ id: 2, name: 'B1' });
    });

    it('preserva tipos genéricos — queue de strings', () => {
      const stringQueue = new OfflineQueue<string>(storage, 'str-queue');
      stringQueue.enqueue('hello');
      stringQueue.enqueue('world');

      expect(stringQueue.peek()).toBe('hello');
      expect(stringQueue.dequeue()).toBe('hello');
      expect(stringQueue.peekAll()).toEqual(['world']);
    });

    it('removeFirst en cola vacía no afecta colas con datos', () => {
      queue.enqueue({ id: 1, name: 'X' });
      const emptyQueue = new OfflineQueue(storage, 'empty-queue');

      emptyQueue.removeFirst();
      expect(queue.size()).toBe(1); // la cola original sigue intacta
      expect(emptyQueue.size()).toBe(0);
    });
  });
});
