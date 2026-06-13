/**
 * MMKVStorage — Adaptador de IKeyValueStorage sobre react-native-mmkv.
 *
 * WHAT: Implementación concreta de IKeyValueStorage que delega en MMKV
 *       (Memory-Mapped Key-Value storage) para persistencia nativa rápida.
 * WHY: MMKV es ~30x más rápido que AsyncStorage y soporta tipos nativos
 *      (string, number, boolean) sin serialización. getObject/setObject
 *      usan JSON para objetos complejos.
 * BENEFITS: Interfaz síncrona — no requiere await. Tipado fuerte con
 *           getNumber/getBoolean/getObject<T>. MMKV maneja la codificación
 *           nativa automáticamente. createMMKV() evita múltiples instancias
 *           del engine nativo por ID.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de MMKVStorage.test.ts.
 */
import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import type { IKeyValueStorage } from './IKeyValueStorage';

export class MMKVStorage implements IKeyValueStorage {
  private readonly storage: MMKV;

  constructor(instance?: MMKV) {
    this.storage = instance ?? createMMKV();
  }

  // ── Strings ──

  getString(key: string): string | undefined {
    return this.storage.getString(key);
  }

  setString(key: string, value: string): void {
    this.storage.set(key, value);
  }

  // ── Numbers ──

  getNumber(key: string): number | undefined {
    return this.storage.getNumber(key);
  }

  setNumber(key: string, value: number): void {
    this.storage.set(key, value);
  }

  // ── Booleans ──

  getBoolean(key: string): boolean | undefined {
    return this.storage.getBoolean(key);
  }

  setBoolean(key: string, value: boolean): void {
    this.storage.set(key, value);
  }

  // ── Objects (JSON roundtrip) ──

  getObject<T>(key: string): T | undefined {
    const raw = this.storage.getString(key);
    if (raw === undefined) return undefined;
    return JSON.parse(raw) as T;
  }

  setObject<T>(key: string, value: T): void {
    this.storage.set(key, JSON.stringify(value));
  }

  // ── Delete / Keys / Clear ──
  //
  // MMKV nativo usa `remove(key)` en lugar de `delete(key)`.
  // La interfaz IKeyValueStorage usa `delete` para mantener un naming
  // más idiomático para TypeScript. El adapter traduce.

  delete(key: string): void {
    this.storage.remove(key);
  }

  getAllKeys(): string[] {
    return this.storage.getAllKeys();
  }

  clearAll(): void {
    this.storage.clearAll();
  }
}
