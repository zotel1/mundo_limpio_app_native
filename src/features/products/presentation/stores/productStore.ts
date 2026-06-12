/**
 * ProductStore — Estado de UI de productos con Zustand.
 *
 * WHAT: Store Zustand para el estado de UI de la feature products.
 *       Maneja selección de producto, búsqueda, diálogo de eliminación,
 *       y modo de formulario (create/edit). NO guarda datos del servidor —
 *       esos viven en el caché de TanStack Query.
 * WHY: Zustand maneja estado de UI (searchQuery, formMode, dialogo) fuera
 *      del árbol de React, sin Provider wrapper. Las screens se suscriben
 *      selectivamente para evitar re-renders.
 * BENEFITS: Sin Provider wrapper, selectores atómicos para evitar
 *           re-renders innecesarios, fácil de resetear en tests.
 *
 * Store holds ONLY UI state — server data lives in TanStack Query cache.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de productStore.test.ts
 * PR 2.5 — T019
 */

import { create } from 'zustand';
import type { Product } from '../../domain';

// ──── Tipos ────

/**
 * WHAT: Modo del formulario de producto: crear nuevo o editar existente.
 */
export type FormMode = 'create' | 'edit';

/**
 * WHAT: Contrato del estado y acciones del store de productos.
 */
interface ProductState {
  // ──── Estado ────
  /** ID del producto actualmente seleccionado (para navegación a detalle). */
  selectedProductId: number | null;
  /** Texto de búsqueda ingresado por el usuario (filtrado client-side). */
  searchQuery: string;
  /** Si el diálogo de confirmación de eliminación está abierto. */
  isDeleteDialogOpen: boolean;
  /** Producto que el usuario quiere eliminar (se muestra en el diálogo). */
  productToDelete: Product | null;
  /** Modo actual del formulario: crear o editar. */
  formMode: FormMode;
  /** ID del producto que se está editando (null en modo create). */
  editingProductId: number | null;
  /** Si el admin/stock_manager quiere ver TODOS los productos (incluyendo inactivos). */
  showAll: boolean;

  // ──── Actions ────
  selectProduct: (id: number) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  openDeleteDialog: (product: Product) => void;
  closeDeleteDialog: () => void;
  setFormMode: (mode: FormMode, productId?: number) => void;
  resetFormMode: () => void;
  toggleShowAll: () => void;
}

// ──── Estado inicial ────

const initialState = {
  selectedProductId: null as number | null,
  searchQuery: '',
  isDeleteDialogOpen: false,
  productToDelete: null as Product | null,
  formMode: 'create' as FormMode,
  editingProductId: null as number | null,
  showAll: false,
};

// ──── Store ────

/**
 * WHAT: Hook Zustand para el estado global de UI de productos.
 * Uso: `const searchQuery = useProductStore(s => s.searchQuery);`
 *       Solo se re-renderiza si `searchQuery` cambió.
 */
export const useProductStore = create<ProductState>((set) => ({
  ...initialState,

  /**
   * WHAT: Selecciona un producto por ID para ver su detalle.
   * WHY: El ID se usa para navegar a ProductDetailScreen y para
   *      fetch el detalle vía TanStack Query (useQuery con queryKey detail(id)).
   * BENEFITS: Desacopla la selección del fetch — el hook reacciona al ID.
   */
  selectProduct: (id: number) =>
    set({ selectedProductId: id }),

  /**
   * WHAT: Limpia la selección actual.
   * WHY: Útil al volver de la pantalla de detalle o al refrescar la lista.
   * BENEFITS: Idempotente — no lanza error si ya era null.
   */
  clearSelection: () =>
    set({ selectedProductId: null }),

  /**
   * WHAT: Actualiza el texto de búsqueda local.
   * WHY: El hook useProducts filtra la lista client-side vía useMemo
   *      cada vez que searchQuery cambia.
   * BENEFITS: Búsqueda instantánea sin llamadas al backend.
   */
  setSearchQuery: (query: string) =>
    set({ searchQuery: query }),

  /**
   * WHAT: Abre el diálogo de confirmación para eliminar un producto.
   * WHY: Guarda el producto completo para mostrar nombre/SKU en el diálogo
   *      y para pasarlo a la mutation de delete.
   * BENEFITS: El diálogo no necesita props — obtiene datos del store.
   */
  openDeleteDialog: (product: Product) =>
    set({
      isDeleteDialogOpen: true,
      productToDelete: product,
    }),

  /**
   * WHAT: Cierra el diálogo de eliminación sin limpiar productToDelete.
   * WHY: Mantiene productToDelete para que la mutation de delete pueda
   *      acceder al producto durante el optimistic update.
   * BENEFITS: El diálogo se cierra instantáneamente (optimistic UI).
   */
  closeDeleteDialog: () =>
    set({ isDeleteDialogOpen: false }),

  /**
   * WHAT: Configura el modo del formulario (create/edit).
   * WHY: En modo 'create' no hay ID de edición. En modo 'edit' se guarda
   *      el productId para precargar datos en el formulario vía TanStack Query.
   * BENEFITS: Un solo action para ambos modos. El hook useProducts reacciona
   *           a editingProductId para fetch el producto a editar.
   */
  setFormMode: (mode: FormMode, productId?: number) =>
    set({
      formMode: mode,
      editingProductId: mode === 'edit' ? (productId ?? null) : null,
    }),

  /**
   * WHAT: Resetea el modo formulario a su estado inicial (create).
   * WHY: Se llama al salir del formulario sin guardar (cancelar) o tras
   *      submit exitoso.
   * BENEFITS: Idempotente — no lanza error si ya estaba en create.
   */
  resetFormMode: () =>
    set({
      formMode: 'create',
      editingProductId: null,
    }),

  /**
   * WHAT: Alterna entre mostrar solo productos activos y todos (incluyendo inactivos).
   * WHY: Spec R1: admin/stock_manager deben poder ver productos inactivos.
   *      El hook useProducts usa este flag para elegir entre getAllActive y getAll.
   * BENEFITS: Toggle simple. El backend protege /all con roles — si un operador
   *           sin permisos fuerza el toggle, recibirá 403 que el ErrorBanner muestra.
   */
  toggleShowAll: () =>
    set((state) => ({ showAll: !state.showAll })),
}));

// ──── Selectores atómicos ────

/**
 * WHAT: Selectores que evitan re-renders innecesarios.
 * WHY: Zustand re-renderiza solo si el slice seleccionado cambió.
 *      Sin estos selectores, cualquier cambio en el store re-renderiza
 *      todos los componentes suscritos.
 * BENEFITS: Performance — solo se re-renderiza lo necesario.
 * Uso: `const isOpen = useProductStore(selectIsDeleteDialogOpen);`
 */

export const selectSearchQuery = (state: ProductState): string =>
  state.searchQuery;

export const selectSelectedProductId = (state: ProductState): number | null =>
  state.selectedProductId;

export const selectIsDeleteDialogOpen = (state: ProductState): boolean =>
  state.isDeleteDialogOpen;

export const selectProductToDelete = (state: ProductState): Product | null =>
  state.productToDelete;

export const selectFormMode = (state: ProductState): FormMode =>
  state.formMode;

export const selectEditingProductId = (state: ProductState): number | null =>
  state.editingProductId;

export const selectShowAll = (state: ProductState): boolean =>
  state.showAll;
