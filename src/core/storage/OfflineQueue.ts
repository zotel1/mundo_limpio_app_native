/**
 * OfflineQueue<T> — Cola genérica persistente sobre IKeyValueStorage.
 *
 * WHAT: Cola FIFO genérica que serializa items como array JSON bajo una
 *       key del storage. Útil para encolar operaciones offline (ajustes
 *       de inventario, ventas) y drenarlas cuando haya conectividad.
 * WHY: Abstrae la persistencia de cola del motor de storage concreto.
 *      El SyncService (PR 3.7b) y el módulo de Sales (Fase 4) pueden
 *      reusar esta clase sin conocer los detalles de serialización.
 * BENEFITS: Genérica — cualquier tipo T serializable a JSON. Aislamiento
 *           por queueKey — múltiples colas coexisten sin interferir.
 *           Sin dependencias externas más allá de IKeyValueStorage.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de OfflineQueue.test.ts.
 */
import type { IKeyValueStorage } from './IKeyValueStorage';

export class OfflineQueue<T> {
  private readonly storage: IKeyValueStorage;
  private readonly queueKey: string;

  constructor(storage: IKeyValueStorage, queueKey: string) {
    this.storage = storage;
    this.queueKey = queueKey;
  }

  // ── Public API ──

  enqueue(item: T): void {
    const items = this.readAll();
    items.push(item);
    this.writeAll(items);
  }

  dequeue(): T | undefined {
    const items = this.readAll();
    if (items.length === 0) return undefined;
    const [first, ...rest] = items;
    this.writeAll(rest);
    return first;
  }

  peek(): T | undefined {
    const items = this.readAll();
    return items.length > 0 ? items[0] : undefined;
  }

  peekAll(): T[] {
    return this.readAll();
  }

  removeFirst(): void {
    const items = this.readAll();
    if (items.length === 0) return;
    const [, ...rest] = items;
    this.writeAll(rest);
  }

  size(): number {
    return this.readAll().length;
  }

  clear(): void {
    this.writeAll([]);
  }

  // ── Internal: serialization ──

  private readAll(): T[] {
    const raw = this.storage.getString(this.queueKey);
    if (raw === undefined) return [];
    return JSON.parse(raw) as T[];
  }

  private writeAll(items: T[]): void {
    this.storage.setString(this.queueKey, JSON.stringify(items));
  }
}
