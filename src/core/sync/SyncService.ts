/**
 * SyncService — Drenado de cola offline al reconectar.
 *
 * WHAT: Singleton que escucha eventos de conectividad (ConnectivityService)
 *       y drena la OfflineQueue llamando a InventoryRepository.adjustStock()
 *       para cada item pendiente. Implementa backoff exponencial en fallos
 *       de red y manejo de conflictos (409). Expone drain() público para
 *       disparo manual (pull-to-refresh).
 * WHY: La cola offline existe para no perder ajustes cuando el dispositivo
 *      está offline. Pero alguien tiene que procesarlos cuando vuelve la
 *      conexión. Este servicio es ese "alguien" — vive fuera del ciclo
 *      React, escucha eventos de red y sincroniza automáticamente.
 * BENEFITS: Desacoplado de la UI — funciona en background. Backoff evita
 *           saturar el backend. Singleton garantiza una sola sincronización
 *           activa a la vez. Eventos permiten que la UI muestre toasts y
 *           badges sin acoplarse a la lógica de drenado.
 *
 * TDD: GREEN — implementación mínima para pasar SyncService.test.ts.
 */

import { ConnectivityService } from '@core/connectivity/ConnectivityService';
import type { OfflineQueue } from '@core/storage/OfflineQueue';
import type { InventoryRepository } from '@features/inventory/domain/ports/inventoryRepository';
import type { StockAdjustment } from '@features/inventory/domain';
import {
  ConflictException,
  NetworkException,
  ServerException,
} from '@core/http/apiException';

// ──── Tipos públicos ────

/**
 * WHAT: Forma mínima de un ajuste encolado que incluye el productId
 *       necesario para llamar a InventoryRepository.adjustStock().
 * WHY: StockAdjustment no incluye productId (el domain lo recibe como
 *      parámetro separado). La cola offline necesita el productId para
 *      saber a qué producto aplicar el ajuste cuando se sincroniza.
 */
export interface SyncableAdjustment {
  productId: number;
  type: string;
  quantity: number;
  reason: string;
}

/**
 * WHAT: Tipos de eventos que emite SyncService durante el drenado.
 * WHY: Permite a la UI reaccionar (toasts, badges) sin acoplarse a la
 *      lógica interna de sincronización.
 */
export type SyncEvent =
  | 'sync:start'
  | 'sync:complete'
  | 'sync:error'
  | 'sync:conflict';

export type SyncEventListener = (event: SyncEvent) => void;

// ──── Constantes ────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

// ──── Singleton ────

export class SyncService {
  private static instance: SyncService | null = null;

  private readonly connectivity: ConnectivityService;
  private readonly queue: OfflineQueue<SyncableAdjustment>;
  private readonly repository: InventoryRepository;
  private readonly listeners: Map<SyncEvent, Set<SyncEventListener>> = new Map();
  private draining = false;
  private unsubscribeFromConnectivity: (() => void) | null = null;

  // ── Constructor (privado — singleton) ──

  private constructor(
    connectivity: ConnectivityService,
    queue: OfflineQueue<SyncableAdjustment>,
    repository: InventoryRepository,
  ) {
    this.connectivity = connectivity;
    this.queue = queue;
    this.repository = repository;
  }

  /**
   * WHAT: Obtiene la instancia singleton. La primera llamada crea la
   *       instancia con las dependencias inyectadas.
   * WHY: Garantiza una única sincronización activa en toda la app.
   *      La DI por constructor mantiene el servicio testeable.
   */
  static getInstance(
    connectivity: ConnectivityService,
    queue: OfflineQueue<SyncableAdjustment>,
    repository: InventoryRepository,
  ): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService(connectivity, queue, repository);
    }
    return SyncService.instance;
  }

  /**
   * WHAT: Resetea la instancia singleton. Solo para testing.
   * WHY: Permite que cada test arranque con una instancia limpia
   *      sin interferencia de tests anteriores.
   */
  static resetInstance(): void {
    SyncService.instance = null;
  }

  // ── init ──

  /**
   * WHAT: Inicializa el servicio registrando un listener en ConnectivityService.
   * WHY: Debe llamarse una vez al arrancar la app, después de
   *      ConnectivityService.initialize(). El callback reacciona a
   *      transiciones online/offline.
   * BENEFITS: Idempotente — llamar init() múltiples veces no registra
   *           listeners duplicados (cada llamada pisa la anterior).
   */
  init(): void {
    // Limpiar suscripción previa si existe (idempotencia)
    if (this.unsubscribeFromConnectivity) {
      this.unsubscribeFromConnectivity();
    }

    this.unsubscribeFromConnectivity = this.connectivity.addListener(
      (isOnline: boolean) => {
        if (isOnline) {
          this.drain();
        }
      },
    );
  }

  // ── drain ──

  /**
   * WHAT: Drena la cola offline procesando cada item en orden FIFO.
   * WHY: Es el método principal — llamado automáticamente al reconectar
   *      y manualmente desde pull-to-refresh. Procesa un item a la vez,
   *      aplicando backoff exponencial en fallos de red y saltando
   *      conflictos (409).
   * BENEFITS: Previene drenados concurrentes (guarda `draining`).
   *           Emite eventos para que la UI pueda reaccionar.
   */
  async drain(): Promise<void> {
    if (this.draining) return;

    this.draining = true;

    try {
      this.emit('sync:start');

      while (this.queue.size() > 0) {
        const item = this.queue.peek();
        if (!item) break;

        try {
          await this.processItemWithRetry(item);
          // Éxito: remover de la cola
          this.queue.dequeue();
        } catch (error) {
          if (error instanceof ConflictException) {
            // Conflicto: remover sin reintentar
            this.queue.dequeue();
            this.emit('sync:conflict');
          } else {
            // Error de red agotado o error desconocido
            this.emit('sync:error');
            // Romper el loop: no seguir procesando si hay error de red
            // (el backend probablemente sigue caído)
            break;
          }
        }
      }
    } finally {
      this.draining = false;
      this.emit('sync:complete');
    }
  }

  // ── Eventos ──

  /**
   * WHAT: Registra un listener para un tipo de evento de sincronización.
   * WHY: Permite que la UI y otros servicios reaccionen a eventos de sync
   *      (mostrar toasts, actualizar badges) sin acoplarse.
   *
   * @param event — Tipo de evento: 'sync:start' | 'sync:complete' | 'sync:error' | 'sync:conflict'
   * @param listener — Callback que recibe el tipo de evento
   */
  on(event: SyncEvent, listener: SyncEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * WHAT: Remueve un listener previamente registrado.
   * WHY: Evita memory leaks y permite limpiar suscripciones en tests.
   *
   * @param event — Tipo de evento
   * @param listener — El mismo callback registrado con on()
   */
  off(event: SyncEvent, listener: SyncEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  // ── Internals ──

  /**
   * WHAT: Procesa un item con hasta MAX_RETRIES reintentos usando
   *       backoff exponencial: delay = min(BASE_DELAY * 2^attempt, MAX_DELAY).
   * WHY: Los fallos de red pueden ser transitorios. El backoff evita
   *      saturar el backend y da tiempo a que se recupere.
   *
   * @throws ConflictException — se relanza para que drain() maneje el skip
   * @throws NetworkException | ServerException — si se agotan los reintentos
   */
  private async processItemWithRetry(item: SyncableAdjustment): Promise<void> {
    const adjustment: StockAdjustment = {
      type: item.type,
      quantity: item.quantity,
      reason: item.reason,
    };

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.repository.adjustStock(item.productId, adjustment);
        return; // éxito
      } catch (error) {
        // Conflicto: no reintentar, relanzar para que drain() lo maneje
        if (error instanceof ConflictException) {
          throw error;
        }

        // Error de red/servidor: reintentar si quedan intentos
        if (attempt < MAX_RETRIES) {
          const delay = Math.min(
            BASE_DELAY_MS * Math.pow(2, attempt),
            MAX_DELAY_MS,
          );
          await this.sleep(delay);
        } else {
          // Agotados los reintentos
          throw error;
        }
      }
    }
  }

  /**
   * WHAT: Promise que resuelve después de ms milisegundos.
   * WHY: Abstracción sobre setTimeout para backoff. Extraída a método
   *      para facilitar testing con fake timers.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * WHAT: Notifica a todos los listeners de un tipo de evento.
   * WHY: Centraliza la emisión. Los listeners son invocados
   *      sincrónicamente (sin await) — no bloquean el drenado.
   */
  private emit(event: SyncEvent): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(event));
    }
  }
}
