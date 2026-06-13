/**
 * InventoryStore — Estado de UI de inventario con Zustand.
 *
 * WHAT: Store Zustand para el estado de UI de la feature inventory.
 *       Maneja selección de inventario y diálogo de ajuste de stock.
 *       NO guarda datos del servidor — esos viven en el caché de TanStack Query.
 * WHY: Zustand maneja estado de UI (selectedInventoryId, diálogo de ajuste)
 *      fuera del árbol de React, sin Provider wrapper. Las screens se suscriben
 *      selectivamente para evitar re-renders.
 * BENEFITS: Sin Provider wrapper, selectores atómicos para evitar
 *           re-renders innecesarios, fácil de resetear en tests.
 *
 * Store holds ONLY UI state — server data lives in TanStack Query cache.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de inventoryStore.test.ts
 * PR 3.3
 */

import { create } from 'zustand';

// ──── Tipos ────

/**
 * WHAT: Contrato del estado y acciones del store de inventario.
 */
interface InventoryState {
  // ──── Estado ────
  /** ID del inventario actualmente seleccionado (para navegación a detalle). */
  selectedInventoryId: number | null;
  /** Si el diálogo de ajuste de stock está abierto. */
  isAdjustDialogOpen: boolean;
  /** ID del producto cuyo stock se está ajustando (null si diálogo cerrado). */
  adjustDialogProductId: number | null;

  // ──── Actions ────
  selectInventory: (id: number) => void;
  openAdjustDialog: (productId: number) => void;
  closeAdjustDialog: () => void;
  reset: () => void;
}

// ──── Estado inicial ────

const initialState = {
  selectedInventoryId: null as number | null,
  isAdjustDialogOpen: false,
  adjustDialogProductId: null as number | null,
};

// ──── Store ────

/**
 * WHAT: Hook Zustand para el estado global de UI de inventario.
 * Uso: `const selectedId = useInventoryStore(s => s.selectedInventoryId);`
 *       Solo se re-renderiza si `selectedInventoryId` cambió.
 */
export const useInventoryStore = create<InventoryState>((set) => ({
  ...initialState,

  /**
   * WHAT: Selecciona un inventario por ID para ver su detalle.
   * WHY: El ID se usa para navegar a InventoryDetailScreen y para
   *      fetch el detalle vía TanStack Query (useQuery con queryKey detail(id)).
   * BENEFITS: Desacopla la selección del fetch — el hook reacciona al ID.
   */
  selectInventory: (id: number) =>
    set({ selectedInventoryId: id }),

  /**
   * WHAT: Abre el diálogo de ajuste de stock para un producto.
   * WHY: Guarda el productId para que el diálogo sepa qué producto ajustar.
   *      El hook useInventory reacciona a adjustDialogProductId.
   * BENEFITS: El diálogo no necesita props — obtiene el productId del store.
   */
  openAdjustDialog: (productId: number) =>
    set({
      isAdjustDialogOpen: true,
      adjustDialogProductId: productId,
    }),

  /**
   * WHAT: Cierra el diálogo de ajuste y limpia el productId.
   * WHY: Tras confirmar o cancelar el ajuste, el diálogo debe cerrarse
   *      y su estado limpiarse para el próximo uso.
   * BENEFITS: Idempotente — no lanza error si ya estaba cerrado.
   */
  closeAdjustDialog: () =>
    set({
      isAdjustDialogOpen: false,
      adjustDialogProductId: null,
    }),

  /**
   * WHAT: Resetea el store a su estado inicial.
   * WHY: Se usa al salir de la pantalla de detalle o al refrescar
   *      para garantizar estado limpio.
   * BENEFITS: Idempotente — no lanza error si ya estaba en estado inicial.
   */
  reset: () => set({ ...initialState }),
}));

// ──── Selectores atómicos ────

/**
 * WHAT: Selectores que evitan re-renders innecesarios.
 * WHY: Zustand re-renderiza solo si el slice seleccionado cambió.
 *      Sin estos selectores, cualquier cambio en el store re-renderiza
 *      todos los componentes suscritos.
 * BENEFITS: Performance — solo se re-renderiza lo necesario.
 * Uso: `const isOpen = useInventoryStore(selectIsAdjustDialogOpen);`
 */

export const selectSelectedInventoryId = (state: InventoryState): number | null =>
  state.selectedInventoryId;

export const selectIsAdjustDialogOpen = (state: InventoryState): boolean =>
  state.isAdjustDialogOpen;

export const selectAdjustDialogProductId = (state: InventoryState): number | null =>
  state.adjustDialogProductId;
