/**
 * WHAT: Tests para el ProductStore (Zustand) — estado de UI de productos
 * WHY: Validar selección de producto, búsqueda, diálogo de eliminación, modo formulario,
 *      selectores atómicos y reset entre tests.
 * BENEFITS: Cobertura completa del estado de UI de productos. Los selectores
 *           evitan re-renders innecesarios en listas y screens.
 *
 * TDD: RED — test escrito antes de la implementación del store
 *
 * PR 2.5 — T018
 */

import {
  useProductStore,
  selectSearchQuery,
  selectSelectedProductId,
  selectIsDeleteDialogOpen,
  selectProductToDelete,
  selectFormMode,
  selectEditingProductId,
} from '@features/products/presentation/stores/productStore';
import type { Product } from '@features/products/domain';

// Helper: producto mock para tests
const mockProduct: Product = {
  id: 1,
  sku: 'CLORO-001',
  name: 'Cloro Concentrado',
  minPrice: 250.5,
  active: true,
};

const mockProduct2: Product = {
  id: 2,
  sku: 'DETE-001',
  name: 'Detergente Industrial',
  minPrice: 180.0,
  active: false,
};

// Helper: estado inicial del store (se usa para reset)
const getInitialState = () => useProductStore.getInitialState();

describe('ProductStore — estado de UI de productos', () => {
  beforeEach(() => {
    useProductStore.setState(getInitialState(), true);
  });

  // ──── Estado inicial ────

  it('estado inicial: selectedProductId null, searchQuery "", dialogo cerrado, formMode create', () => {
    const state = useProductStore.getState();

    expect(state.selectedProductId).toBeNull();
    expect(state.searchQuery).toBe('');
    expect(state.isDeleteDialogOpen).toBe(false);
    expect(state.productToDelete).toBeNull();
    expect(state.formMode).toBe('create');
    expect(state.editingProductId).toBeNull();
  });

  // ──── selectProduct / clearSelection ────

  it('selectProduct(id) guarda el ID del producto seleccionado', () => {
    useProductStore.getState().selectProduct(42);

    const state = useProductStore.getState();
    expect(state.selectedProductId).toBe(42);
  });

  it('selectProduct(id) reemplaza el ID previo (solo un producto seleccionado a la vez)', () => {
    useProductStore.getState().selectProduct(10);
    useProductStore.getState().selectProduct(99);

    const state = useProductStore.getState();
    expect(state.selectedProductId).toBe(99);
  });

  it('clearSelection() pone selectedProductId en null', () => {
    useProductStore.getState().selectProduct(42);
    expect(useProductStore.getState().selectedProductId).toBe(42);

    useProductStore.getState().clearSelection();
    expect(useProductStore.getState().selectedProductId).toBeNull();
  });

  it('clearSelection() desde null es idempotente (no lanza error)', () => {
    useProductStore.getState().clearSelection();

    const state = useProductStore.getState();
    expect(state.selectedProductId).toBeNull();
  });

  // ──── setSearchQuery ────

  it('setSearchQuery("CLORO") actualiza el searchQuery', () => {
    useProductStore.getState().setSearchQuery('CLORO');

    const state = useProductStore.getState();
    expect(state.searchQuery).toBe('CLORO');
  });

  it('setSearchQuery("") permite búsqueda vacía (reset de búsqueda)', () => {
    useProductStore.getState().setSearchQuery('texto previo');

    useProductStore.getState().setSearchQuery('');

    const state = useProductStore.getState();
    expect(state.searchQuery).toBe('');
  });

  it('setSearchQuery reemplaza el valor anterior (no concatena)', () => {
    useProductStore.getState().setSearchQuery('CLORO');
    useProductStore.getState().setSearchQuery('DETE');

    const state = useProductStore.getState();
    expect(state.searchQuery).toBe('DETE');
  });

  // ──── openDeleteDialog / closeDeleteDialog ────

  it('openDeleteDialog(product) abre el diálogo y guarda el producto a eliminar', () => {
    useProductStore.getState().openDeleteDialog(mockProduct);

    const state = useProductStore.getState();
    expect(state.isDeleteDialogOpen).toBe(true);
    expect(state.productToDelete).toEqual(mockProduct);
  });

  it('closeDeleteDialog() cierra el diálogo pero mantiene productToDelete para referencias', () => {
    useProductStore.getState().openDeleteDialog(mockProduct);

    useProductStore.getState().closeDeleteDialog();

    const state = useProductStore.getState();
    expect(state.isDeleteDialogOpen).toBe(false);
    // El producto se mantiene para que la mutation pueda accederlo, se limpia tras success
    expect(state.productToDelete).toEqual(mockProduct);
  });

  it('openDeleteDialog con producto inactivo permite eliminar producto ya desactivado', () => {
    useProductStore.getState().openDeleteDialog(mockProduct2);

    const state = useProductStore.getState();
    expect(state.isDeleteDialogOpen).toBe(true);
    expect(state.productToDelete?.active).toBe(false);
    expect(state.productToDelete?.id).toBe(2);
  });

  it('closeDeleteDialog() sin haber abierto es idempotente', () => {
    useProductStore.getState().closeDeleteDialog();

    const state = useProductStore.getState();
    expect(state.isDeleteDialogOpen).toBe(false);
    expect(state.productToDelete).toBeNull();
  });

  // ──── setFormMode / resetFormMode ────

  it('setFormMode("create") pone formMode create y editingProductId null', () => {
    // Arrange: previamente en edit
    useProductStore.getState().setFormMode('edit', 7);

    // Act
    useProductStore.getState().setFormMode('create');

    // Assert
    const state = useProductStore.getState();
    expect(state.formMode).toBe('create');
    expect(state.editingProductId).toBeNull();
  });

  it('setFormMode("edit", 7) pone formMode edit y guarda el ID a editar', () => {
    useProductStore.getState().setFormMode('edit', 7);

    const state = useProductStore.getState();
    expect(state.formMode).toBe('edit');
    expect(state.editingProductId).toBe(7);
  });

  it('resetFormMode() vuelve a create con editingProductId null', () => {
    useProductStore.getState().setFormMode('edit', 7);

    useProductStore.getState().resetFormMode();

    const state = useProductStore.getState();
    expect(state.formMode).toBe('create');
    expect(state.editingProductId).toBeNull();
  });

  it('resetFormMode() desde create es idempotente', () => {
    useProductStore.getState().resetFormMode();

    const state = useProductStore.getState();
    expect(state.formMode).toBe('create');
    expect(state.editingProductId).toBeNull();
  });

  // ──── Selectores atómicos ────

  it('selectSearchQuery retorna el valor actual de searchQuery', () => {
    useProductStore.getState().setSearchQuery('DETERGENTE');

    const state = useProductStore.getState();
    expect(selectSearchQuery(state)).toBe('DETERGENTE');
  });

  it('selectSearchQuery retorna "" cuando no hay búsqueda', () => {
    const state = useProductStore.getState();
    expect(selectSearchQuery(state)).toBe('');
  });

  it('selectSelectedProductId retorna el ID seleccionado', () => {
    useProductStore.getState().selectProduct(15);

    const state = useProductStore.getState();
    expect(selectSelectedProductId(state)).toBe(15);
  });

  it('selectSelectedProductId retorna null cuando no hay selección', () => {
    const state = useProductStore.getState();
    expect(selectSelectedProductId(state)).toBeNull();
  });

  it('selectIsDeleteDialogOpen retorna true cuando el diálogo está abierto', () => {
    useProductStore.getState().openDeleteDialog(mockProduct);

    const state = useProductStore.getState();
    expect(selectIsDeleteDialogOpen(state)).toBe(true);
  });

  it('selectIsDeleteDialogOpen retorna false cuando el diálogo está cerrado', () => {
    const state = useProductStore.getState();
    expect(selectIsDeleteDialogOpen(state)).toBe(false);
  });

  it('selectProductToDelete retorna el producto a eliminar cuando el diálogo está abierto', () => {
    useProductStore.getState().openDeleteDialog(mockProduct);

    const state = useProductStore.getState();
    expect(selectProductToDelete(state)).toEqual(mockProduct);
  });

  it('selectProductToDelete retorna null cuando no hay diálogo abierto', () => {
    const state = useProductStore.getState();
    expect(selectProductToDelete(state)).toBeNull();
  });

  it('selectFormMode retorna "create" por defecto', () => {
    const state = useProductStore.getState();
    expect(selectFormMode(state)).toBe('create');
  });

  it('selectFormMode retorna "edit" después de setFormMode("edit", id)', () => {
    useProductStore.getState().setFormMode('edit', 7);

    const state = useProductStore.getState();
    expect(selectFormMode(state)).toBe('edit');
  });

  it('selectEditingProductId retorna null por defecto', () => {
    const state = useProductStore.getState();
    expect(selectEditingProductId(state)).toBeNull();
  });

  it('selectEditingProductId retorna el ID configurado en modo edit', () => {
    useProductStore.getState().setFormMode('edit', 99);

    const state = useProductStore.getState();
    expect(selectEditingProductId(state)).toBe(99);
  });

  // ──── Transiciones compuestas ────

  it('flujo: seleccionar producto → buscar → abrir diálogo → cerrar → limpiar selección', () => {
    // 1. Seleccionar producto
    useProductStore.getState().selectProduct(1);
    expect(useProductStore.getState().selectedProductId).toBe(1);

    // 2. Buscar (independiente de la selección)
    useProductStore.getState().setSearchQuery('CLORO');
    expect(useProductStore.getState().searchQuery).toBe('CLORO');

    // 3. Abrir diálogo de eliminación
    useProductStore.getState().openDeleteDialog(mockProduct);
    expect(useProductStore.getState().isDeleteDialogOpen).toBe(true);
    expect(useProductStore.getState().productToDelete).toEqual(mockProduct);

    // 4. Cerrar diálogo
    useProductStore.getState().closeDeleteDialog();
    expect(useProductStore.getState().isDeleteDialogOpen).toBe(false);

    // 5. Limpiar selección
    useProductStore.getState().clearSelection();
    expect(useProductStore.getState().selectedProductId).toBeNull();
  });

  it('flujo: abrir form en modo edit → cancelar → abrir en create', () => {
    // Form en modo edición
    useProductStore.getState().setFormMode('edit', 3);
    expect(useProductStore.getState().formMode).toBe('edit');
    expect(useProductStore.getState().editingProductId).toBe(3);

    // Cancelar → vuelve a create
    useProductStore.getState().resetFormMode();
    expect(useProductStore.getState().formMode).toBe('create');
    expect(useProductStore.getState().editingProductId).toBeNull();

    // Abrir form en create
    useProductStore.getState().setFormMode('create');
    expect(useProductStore.getState().formMode).toBe('create');
    expect(useProductStore.getState().editingProductId).toBeNull();
  });

  it('setFormMode("edit", id) seguido de setFormMode("edit", otroId) actualiza el ID', () => {
    useProductStore.getState().setFormMode('edit', 5);
    expect(useProductStore.getState().editingProductId).toBe(5);

    useProductStore.getState().setFormMode('edit', 10);
    expect(useProductStore.getState().editingProductId).toBe(10);
    expect(useProductStore.getState().formMode).toBe('edit');
  });
});
