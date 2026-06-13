/**
 * TDD: RED — Tests para IKeyValueStorage y MMKVStorage.
 *
 * WHAT: Define el contrato de IKeyValueStorage y verifica que MMKVStorage
 *       lo implementa correctamente usando un mock de MMKV nativo.
 * WHY: TDD estricto: los tests guían el diseño de la interfaz genérica de
 *      key-value storage antes de implementarla. Mockear MMKV evita
 *      dependencia de módulo nativo en Jest.
 * BENEFITS: Cobertura completa del contrato: strings, numbers, booleans,
 *           objetos JSON, delete, getAllKeys, clearAll.
 */

import { MMKVStorage } from '@core/storage/MMKVStorage';
import type { IKeyValueStorage } from '@core/storage/IKeyValueStorage';

// ──── Mock de react-native-mmkv ────
//
// Usamos una clase real en lugar de jest.fn() encadenados porque el mock de
// constructor requiere que los métodos sean propiedades reales del objeto
// retornado, no funciones mockeadas que Jest podría no resolver correctamente
// en ciertos entornos (ESM interop, transformIgnorePatterns).

const mmkvStore = new Map<string, string | number | boolean>();

class MockMMKV {
  getString(key: string): string | undefined {
    const val = mmkvStore.get(key);
    return typeof val === 'string' ? val : undefined;
  }

  set(key: string, value: string | number | boolean): void {
    mmkvStore.set(key, value);
  }

  getNumber(key: string): number | undefined {
    const val = mmkvStore.get(key);
    return typeof val === 'number' ? val : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const val = mmkvStore.get(key);
    return typeof val === 'boolean' ? val : undefined;
  }

  remove(key: string): void {
    mmkvStore.delete(key);
  }

  getAllKeys(): string[] {
    return Array.from(mmkvStore.keys());
  }

  clearAll(): void {
    mmkvStore.clear();
  }
}

jest.mock('react-native-mmkv', () => ({
  __esModule: true,
  createMMKV: () => new MockMMKV(),
}));

// ──── IKeyValueStorage — verificación de interfaz ────

describe('IKeyValueStorage (interfaz)', () => {
  it('puede ser implementada por un objeto literal que cumpla el contrato', () => {
    const storage: IKeyValueStorage = {
      getString: () => undefined,
      setString: () => {},
      getNumber: () => undefined,
      setNumber: () => {},
      getBoolean: () => undefined,
      setBoolean: () => {},
      getObject: () => undefined,
      setObject: () => {},
      delete: () => {},
      getAllKeys: () => [],
      clearAll: () => {},
    };

    expect(typeof storage.getString).toBe('function');
    expect(typeof storage.setString).toBe('function');
    expect(typeof storage.getNumber).toBe('function');
    expect(typeof storage.setNumber).toBe('function');
    expect(typeof storage.getBoolean).toBe('function');
    expect(typeof storage.setBoolean).toBe('function');
    expect(typeof storage.getObject).toBe('function');
    expect(typeof storage.setObject).toBe('function');
    expect(typeof storage.delete).toBe('function');
    expect(typeof storage.getAllKeys).toBe('function');
    expect(typeof storage.clearAll).toBe('function');
  });
});

// ──── MMKVStorage — operaciones CRUD ────

describe('MMKVStorage', () => {
  let storage: MMKVStorage;

  beforeEach(() => {
    mmkvStore.clear();
    storage = new MMKVStorage();
  });

  // ── setString / getString ──

  describe('setString / getString', () => {
    it('almacena y recupera un string', () => {
      storage.setString('key1', 'hello');
      expect(storage.getString('key1')).toBe('hello');
    });

    it('retorna undefined para una key no existente', () => {
      expect(storage.getString('nonexistent')).toBeUndefined();
    });

    it('sobrescribe un valor existente', () => {
      storage.setString('key1', 'first');
      storage.setString('key1', 'second');
      expect(storage.getString('key1')).toBe('second');
    });

    it('acepta string vacío', () => {
      storage.setString('empty', '');
      expect(storage.getString('empty')).toBe('');
    });
  });

  // ── setNumber / getNumber ──

  describe('setNumber / getNumber', () => {
    it('almacena y recupera un número positivo', () => {
      storage.setNumber('count', 42);
      expect(storage.getNumber('count')).toBe(42);
    });

    it('almacena y recupera cero', () => {
      storage.setNumber('zero', 0);
      expect(storage.getNumber('zero')).toBe(0);
    });

    it('almacena y recupera un número negativo', () => {
      storage.setNumber('neg', -10);
      expect(storage.getNumber('neg')).toBe(-10);
    });

    it('retorna undefined para key no numérica', () => {
      storage.setString('str', 'not-a-number');
      expect(storage.getNumber('str')).toBeUndefined();
    });
  });

  // ── setBoolean / getBoolean ──

  describe('setBoolean / getBoolean', () => {
    it('almacena y recupera true', () => {
      storage.setBoolean('flag', true);
      expect(storage.getBoolean('flag')).toBe(true);
    });

    it('almacena y recupera false', () => {
      storage.setBoolean('flag', false);
      expect(storage.getBoolean('flag')).toBe(false);
    });

    it('retorna undefined para key no booleana', () => {
      storage.setString('str', 'hello');
      expect(storage.getBoolean('str')).toBeUndefined();
    });
  });

  // ── setObject / getObject ──

  describe('setObject / getObject', () => {
    it('serializa y deserializa un objeto plano', () => {
      const obj = { name: 'Test', count: 5 };
      storage.setObject('obj', obj);
      const retrieved = storage.getObject<typeof obj>('obj');
      expect(retrieved).toEqual(obj);
    });

    it('maneja arrays', () => {
      const arr = [1, 2, { nested: true }];
      storage.setObject('arr', arr);
      expect(storage.getObject('arr')).toEqual(arr);
    });

    it('retorna undefined para key no existente', () => {
      expect(storage.getObject('nope')).toBeUndefined();
    });

    it('preserva la inmutabilidad — modificar el retornado no afecta el almacenado', () => {
      const obj = { x: 1 };
      storage.setObject('obj', obj);
      const retrieved = storage.getObject<typeof obj>('obj');
      if (retrieved) {
        retrieved.x = 999;
      }
      const reRetrieved = storage.getObject<typeof obj>('obj');
      expect(reRetrieved).toEqual({ x: 1 });
    });
  });

  // ── delete ──

  describe('delete', () => {
    it('elimina una key existente', () => {
      storage.setString('todelete', 'val');
      storage.delete('todelete');
      expect(storage.getString('todelete')).toBeUndefined();
    });

    it('no lanza error al eliminar key inexistente', () => {
      expect(() => storage.delete('nope')).not.toThrow();
    });
  });

  // ── getAllKeys ──

  describe('getAllKeys', () => {
    it('retorna array vacío cuando no hay keys', () => {
      expect(storage.getAllKeys()).toEqual([]);
    });

    it('retorna todas las keys almacenadas', () => {
      storage.setString('a', '1');
      storage.setNumber('b', 2);
      storage.setBoolean('c', true);
      const keys = storage.getAllKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('c');
    });
  });

  // ── clearAll ──

  describe('clearAll', () => {
    it('elimina todas las keys', () => {
      storage.setString('a', '1');
      storage.setString('b', '2');
      storage.clearAll();
      expect(storage.getAllKeys()).toEqual([]);
      expect(storage.getString('a')).toBeUndefined();
    });

    it('no lanza error si ya está vacío', () => {
      expect(() => storage.clearAll()).not.toThrow();
    });
  });

  // ── Triangulación: secuencias de operaciones ──

  describe('triangulación: secuencias', () => {
    it('setString → getString → delete → getString devuelve undefined', () => {
      storage.setString('seq', 'value');
      expect(storage.getString('seq')).toBe('value');
      storage.delete('seq');
      expect(storage.getString('seq')).toBeUndefined();
    });

    it('setObject → getObject → setObject (sobrescribir) → getObject refleja el nuevo', () => {
      storage.setObject('data', { v: 1 });
      expect(storage.getObject('data')).toEqual({ v: 1 });
      storage.setObject('data', { v: 2 });
      expect(storage.getObject('data')).toEqual({ v: 2 });
    });

    it('múltiples tipos coexisten sin interferir', () => {
      storage.setString('s', 'str');
      storage.setNumber('n', 100);
      storage.setBoolean('b', true);
      storage.setObject('o', { key: 'val' });

      expect(storage.getString('s')).toBe('str');
      expect(storage.getNumber('n')).toBe(100);
      expect(storage.getBoolean('b')).toBe(true);
      expect(storage.getObject('o')).toEqual({ key: 'val' });
      expect(storage.getAllKeys()).toHaveLength(4);
    });

    it('clearAll → set → getAllKeys solo contiene la nueva', () => {
      storage.setString('old', 'val');
      storage.clearAll();
      storage.setString('new', 'val');
      expect(storage.getAllKeys()).toEqual(['new']);
    });
  });
});
