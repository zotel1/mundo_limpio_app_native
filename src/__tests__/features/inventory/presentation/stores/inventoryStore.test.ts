/**
 * WHAT: Tests para el InventoryStore (Zustand) — estado de UI de inventario
 * WHY: Validar selección de inventario, diálogo de ajuste, reset entre tests,
 *      y selectores atómicos para evitar re-renders.
 * BENEFITS: Cobertura completa del estado de UI de inventario. Los selectores
 *           evitan re-renders innecesarios en listas y screens.
 *
 * TDD: RED — test escrito antes de la implementación del store
 *
 * PR 3.3
 */

import {
  useInventoryStore,
  selectSelectedInventoryId,
  selectIsAdjustDialogOpen,
  selectAdjustDialogProductId,
} from '@features/inventory/presentation/stores/inventoryStore';

// Helper: estado inicial del store (se usa para reset)
const getInitialState = () => useInventoryStore.getInitialState();

describe('InventoryStore — estado de UI de inventario', () => {
  beforeEach(() => {
    useInventoryStore.setState(getInitialState(), true);
  });

  // ──── Estado inicial ────

  it('estado inicial: selectedInventoryId null, diálogo cerrado, adjustDialogProductId null', () => {
    const state = useInventoryStore.getState();

    expect(state.selectedInventoryId).toBeNull();
    expect(state.isAdjustDialogOpen).toBe(false);
    expect(state.adjustDialogProductId).toBeNull();
  });

  // ──── selectInventory ────

  it('selectInventory(id) guarda el ID del inventario seleccionado', () => {
    useInventoryStore.getState().selectInventory(42);

    const state = useInventoryStore.getState();
    expect(state.selectedInventoryId).toBe(42);
  });

  it('selectInventory(id) reemplaza el ID previo (un solo inventario seleccionado a la vez)', () => {
    useInventoryStore.getState().selectInventory(10);
    useInventoryStore.getState().selectInventory(99);

    const state = useInventoryStore.getState();
    expect(state.selectedInventoryId).toBe(99);
  });

  it('selectInventory con id=0 es válido (productId 0 puede existir en backend)', () => {
    useInventoryStore.getState().selectInventory(0);

    const state = useInventoryStore.getState();
    expect(state.selectedInventoryId).toBe(0);
  });

  // ──── openAdjustDialog / closeAdjustDialog ────

  it('openAdjustDialog(productId) abre el diálogo y guarda el productId', () => {
    useInventoryStore.getState().openAdjustDialog(5);

    const state = useInventoryStore.getState();
    expect(state.isAdjustDialogOpen).toBe(true);
    expect(state.adjustDialogProductId).toBe(5);
  });

  it('closeAdjustDialog() cierra el diálogo y limpia el productId', () => {
    useInventoryStore.getState().openAdjustDialog(7);

    useInventoryStore.getState().closeAdjustDialog();

    const state = useInventoryStore.getState();
    expect(state.isAdjustDialogOpen).toBe(false);
    expect(state.adjustDialogProductId).toBeNull();
  });

  it('closeAdjustDialog() sin haber abierto es idempotente (no lanza error)', () => {
    useInventoryStore.getState().closeAdjustDialog();

    const state = useInventoryStore.getState();
    expect(state.isAdjustDialogOpen).toBe(false);
    expect(state.adjustDialogProductId).toBeNull();
  });

  it('openAdjustDialog reemplaza el productId previo', () => {
    useInventoryStore.getState().openAdjustDialog(5);
    useInventoryStore.getState().openAdjustDialog(10);

    const state = useInventoryStore.getState();
    expect(state.adjustDialogProductId).toBe(10);
    expect(state.isAdjustDialogOpen).toBe(true);
  });

  // ──── reset ────

  it('reset() vuelve al estado inicial desde cualquier estado', () => {
    useInventoryStore.getState().selectInventory(42);
    useInventoryStore.getState().openAdjustDialog(7);

    useInventoryStore.getState().reset();

    const state = useInventoryStore.getState();
    expect(state.selectedInventoryId).toBeNull();
    expect(state.isAdjustDialogOpen).toBe(false);
    expect(state.adjustDialogProductId).toBeNull();
  });

  it('reset() desde estado inicial es idempotente', () => {
    useInventoryStore.getState().reset();

    const state = useInventoryStore.getState();
    expect(state.selectedInventoryId).toBeNull();
    expect(state.isAdjustDialogOpen).toBe(false);
    expect(state.adjustDialogProductId).toBeNull();
  });

  // ──── Selectores atómicos ────

  it('selectSelectedInventoryId retorna el ID seleccionado', () => {
    useInventoryStore.getState().selectInventory(15);

    const state = useInventoryStore.getState();
    expect(selectSelectedInventoryId(state)).toBe(15);
  });

  it('selectSelectedInventoryId retorna null cuando no hay selección', () => {
    const state = useInventoryStore.getState();
    expect(selectSelectedInventoryId(state)).toBeNull();
  });

  it('selectIsAdjustDialogOpen retorna true cuando el diálogo está abierto', () => {
    useInventoryStore.getState().openAdjustDialog(3);

    const state = useInventoryStore.getState();
    expect(selectIsAdjustDialogOpen(state)).toBe(true);
  });

  it('selectIsAdjustDialogOpen retorna false cuando el diálogo está cerrado', () => {
    const state = useInventoryStore.getState();
    expect(selectIsAdjustDialogOpen(state)).toBe(false);
  });

  it('selectAdjustDialogProductId retorna el productId cuando el diálogo está abierto', () => {
    useInventoryStore.getState().openAdjustDialog(8);

    const state = useInventoryStore.getState();
    expect(selectAdjustDialogProductId(state)).toBe(8);
  });

  it('selectAdjustDialogProductId retorna null cuando el diálogo está cerrado', () => {
    const state = useInventoryStore.getState();
    expect(selectAdjustDialogProductId(state)).toBeNull();
  });

  // ──── Transición compuesta ────

  it('flujo completo: seleccionar → abrir diálogo → cerrar → reset', () => {
    // 1. Seleccionar inventario
    useInventoryStore.getState().selectInventory(1);
    expect(useInventoryStore.getState().selectedInventoryId).toBe(1);

    // 2. Abrir diálogo de ajuste
    useInventoryStore.getState().openAdjustDialog(1);
    expect(useInventoryStore.getState().isAdjustDialogOpen).toBe(true);
    expect(useInventoryStore.getState().adjustDialogProductId).toBe(1);

    // 3. Cerrar diálogo
    useInventoryStore.getState().closeAdjustDialog();
    expect(useInventoryStore.getState().isAdjustDialogOpen).toBe(false);
    expect(useInventoryStore.getState().adjustDialogProductId).toBeNull();

    // 4. Reset
    useInventoryStore.getState().reset();
    expect(useInventoryStore.getState().selectedInventoryId).toBeNull();
  });
});
