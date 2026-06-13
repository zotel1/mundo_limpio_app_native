/**
 * IKeyValueStorage — Puerto genérico de almacenamiento clave-valor.
 *
 * WHAT: Interfaz que define el contrato para cualquier implementación de
 *       almacenamiento clave-valor síncrono (MMKV, AsyncStorage, in-memory).
 * WHY: Abstracción sobre el motor de storage concreto. Permite cambiar
 *      MMKV → otra lib sin tocar consumidores. Facilita testing con mocks.
 * BENEFITS: Desacopla features del storage nativo. Single source of truth
 *           para operaciones de persistencia local. OfflineQueue, stores
 *           y servicios solo dependen de esta interfaz, nunca de MMKV.
 */
export interface IKeyValueStorage {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  getNumber(key: string): number | undefined;
  setNumber(key: string, value: number): void;
  getBoolean(key: string): boolean | undefined;
  setBoolean(key: string, value: boolean): void;
  getObject<T>(key: string): T | undefined;
  setObject<T>(key: string, value: T): void;
  delete(key: string): void;
  getAllKeys(): string[];
  clearAll(): void;
}
