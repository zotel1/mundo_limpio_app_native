/**
 * ConnectivityService — Monitoreo de conectividad online/offline.
 *
 * WHAT: Wrapper sobre @react-native-community/netinfo que expone un
 *       estado `isOnline` y un patrón listener para cambios de red.
 * WHY: Abstraer la API de NetInfo para que SyncService y otros consumidores
 *      no dependan directamente de una librería nativa específica.
 *      Centraliza la lógica online/offline en un solo lugar.
 * BENEFITS: Fácil de mockear en tests sin módulo nativo. Single source of
 *           truth para el estado de red. Listener pattern permite que
 *           múltiples servicios reaccionen a cambios de conectividad sin
 *           acoplarse entre sí. Comportamiento optimista (online por defecto)
 *           evita bloquear la app antes de la primera verificación.
 *
 * TDD: GREEN — implementación mínima para pasar ConnectivityService.test.ts.
 */

import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

// ──── Tipos ────

type ConnectivityListener = (isOnline: boolean) => void;

// ──── Helpers ────

/**
 * WHAT: Determina si hay conectividad real a partir del estado de NetInfo.
 * WHY: isInternetReachable puede ser null (desconocido). Política conservadora:
 *      solo consideramos online si isConnected=true Y isInternetReachable=true.
 *      Si no sabemos si hay internet (null), asumimos offline para no enviar
 *      datos a ciegas.
 * BENEFITS: Evita falsos positivos. SyncService no drena la cola offline si
 *           no hay certeza de conectividad.
 */
function resolveOnlineStatus(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable === true;
}

// ──── Servicio ────

export class ConnectivityService {
  /**
   * WHAT: Estado actual de conectividad. true = online (con internet alcanzable).
   * WHY: Expuesto como propiedad pública para lecturas síncronas sin async/await.
   *      Valor inicial true (optimista) para no bloquear la UI antes del primer fetch.
   */
  isOnline = true;

  private listeners: ConnectivityListener[] = [];
  private netInfoUnsubscribe: (() => void) | null = null;

  // ── initialize ──

  /**
   * WHAT: Inicializa el monitoreo de conectividad.
   * WHY: Hace un fetch inicial para obtener el estado real, luego se suscribe
   *      a cambios futuros vía NetInfo.addEventListener. Debe llamarse una vez
   *      al arrancar la app (antes de SyncService.init).
   * BENEFITS: Estado inicial correcto desde el primer momento. Suscripción
   *           continua para detectar cambios sin polling manual.
   */
  async initialize(): Promise<void> {
    const state = await NetInfo.fetch();
    this.applyState(state);

    this.netInfoUnsubscribe = NetInfo.addEventListener(
      (state: NetInfoState) => {
        this.applyState(state);
      },
    );
  }

  // ── addListener ──

  /**
   * WHAT: Suscribe un callback a cambios de conectividad.
   * WHY: Permite que servicios externos (SyncService, UI) reaccionen a
   *      transiciones online↔offline sin acoplarse a NetInfo.
   * BENEFITS: Múltiples suscriptores independientes. Retorna función de
   *           cleanup para evitar memory leaks (pasar a useEffect cleanup).
   *
   * @param callback — Se invoca con (isOnline: boolean) en cada cambio.
   * @returns Función unsubscribe — llamar para remover el listener.
   */
  addListener(callback: ConnectivityListener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // ── checkNow ──

  /**
   * WHAT: Verificación forzada de conectividad (bypass el listener pasivo).
   * WHY: Útil para pull-to-refresh, reintentos manuales, o antes de operaciones
   *      críticas donde no se puede esperar al próximo evento de NetInfo.
   * BENEFITS: Actualiza isOnline inmediatamente. No requiere esperar al
   *           listener de NetInfo si el usuario quiere forzar un chequeo.
   *
   * @returns true si hay conectividad real, false en caso contrario.
   */
  async checkNow(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.applyState(state);
    return this.isOnline;
  }

  // ── Internals ──

  /**
   * WHAT: Aplica un NetInfoState, actualizando isOnline y notificando listeners.
   * WHY: Centraliza la lógica de cambio de estado. Si el estado no cambió
   *      (mismo online/offline), no notifica — evita rerenders innecesarios.
   */
  private applyState(state: NetInfoState): void {
    const online = resolveOnlineStatus(state);
    if (online !== this.isOnline) {
      this.isOnline = online;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.isOnline));
  }
}
