/**
 * WHAT: Tests TDD para ProductDetailScreen — vista de detalle de producto.
 * WHY: Validar renderizado de campos (ID, SKU, nombre, precio mínimo, estado),
 *      acciones (editar, eliminar, reactivar), estados (loading, error),
 *      y navegación (back, edit).
 * BENEFITS: Cobertura completa de la pantalla de detalle individual de producto.
 *
 * TDD: RED → GREEN — tests escritos antes de la implementación.
 *
 * PR 2.8 — T029
 *
 * Mock strategy:
 * - jest.mock useProducts → control total de selectedProduct, isLoadingDetail,
 *   deleteProduct, reactivateProduct
 * - jest.mock useProductStore → mock selectProduct (el screen llama selectProduct al montar)
 * - jest.mock @react-navigation/native → controlar useNavigation, useRoute
 * - jest.spyOn(Alert, 'alert') en beforeEach → verificar confirmación de delete
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { Alert } from 'react-native';

// ──── Types ───────────────────────────────────────────────────────────

import type { Product } from '@features/products/domain';

// ──── Mock Data ───────────────────────────────────────────────────────

const mockActiveProduct: Product = {
  id: 1,
  sku: 'CLORO-001',
  name: 'Cloro Concentrado',
  minPrice: 250.5,
  active: true,
};

const mockInactiveProduct: Product = {
  id: 2,
  sku: 'DETE-002',
  name: 'Detergente Industrial',
  minPrice: 180.0,
  active: false,
};

// ──── Mock Navigation ─────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: { productId: 1 },
    }),
  };
});

// ──── Mock useProductStore ────────────────────────────────────────────

const mockSelectProduct = jest.fn();
const mockClearSelection = jest.fn();

jest.mock(
  '@features/products/presentation/stores/productStore',
  () => ({
    useProductStore: jest.fn(),
  }),
);

// ═══════════════════════════════════════════════════════════════
// Mock useProducts — valores controlados por test
// ═══════════════════════════════════════════════════════════════

const mockDeleteProduct = jest.fn();
const mockReactivateProduct = jest.fn();

interface MockUseProductsReturn {
  selectedProduct: Product | undefined;
  isLoadingDetail: boolean;
  isError: boolean;
  error: Error | null;
  deleteProduct: jest.Mock;
  reactivateProduct: jest.Mock;
  refetch: jest.Mock;
}

function createMockUseProducts(
  overrides: Partial<MockUseProductsReturn> = {},
): MockUseProductsReturn {
  return {
    selectedProduct: mockActiveProduct,
    isLoadingDetail: false,
    isError: false,
    error: null,
    deleteProduct: mockDeleteProduct,
    reactivateProduct: mockReactivateProduct,
    refetch: jest.fn(),
    ...overrides,
  };
}

jest.mock(
  '@features/products/presentation/hooks/useProducts',
  () => ({
    useProducts: jest.fn(),
  }),
);

// ──── Imports dinamicos (after mocks) ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useProducts } = require(
  '@features/products/presentation/hooks/useProducts',
) as { useProducts: jest.Mock };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useProductStore } = require(
  '@features/products/presentation/stores/productStore',
) as { useProductStore: jest.Mock };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ProductDetailScreen } = require(
  '@features/products/presentation/screens/ProductDetailScreen',
) as { ProductDetailScreen: React.ComponentType };

// ──── Helpers ─────────────────────────────────────────────────────────

function setupUseProducts(overrides: Partial<MockUseProductsReturn> = {}) {
  useProducts.mockReturnValue(createMockUseProducts(overrides));
}

function setupStore() {
  useProductStore.mockReturnValue({
    selectProduct: mockSelectProduct,
    clearSelection: mockClearSelection,
    selectedProductId: null,
    searchQuery: '',
    isDeleteDialogOpen: false,
    productToDelete: null,
    formMode: 'create',
    editingProductId: null,
    setSearchQuery: jest.fn(),
    openDeleteDialog: jest.fn(),
    closeDeleteDialog: jest.fn(),
    setFormMode: jest.fn(),
    resetFormMode: jest.fn(),
  });
}

function renderScreen() {
  return render(<ProductDetailScreen />);
}

// ──── Suite ───────────────────────────────────────────────────────────

describe('ProductDetailScreen — vista de detalle de producto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupStore();
    setupUseProducts();
    // Spy on Alert.alert — must be in beforeEach because config
    // restoreMocks:true restores spies automatically before each test.
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  // ═══════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════

  it('muestra LoadingIndicator mientras carga el detalle (isLoadingDetail=true)', () => {
    setupUseProducts({
      selectedProduct: undefined,
      isLoadingDetail: true,
    });

    renderScreen();

    expect(screen.getByTestId('loading-indicator')).toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT DISPLAY — todos los campos
  // ═══════════════════════════════════════════════════════════════

  it('muestra el ID del producto', () => {
    renderScreen();

    expect(screen.getByText('ID')).toBeOnTheScreen();
    expect(screen.getByText('1')).toBeOnTheScreen();
  });

  it('muestra el SKU del producto', () => {
    renderScreen();

    expect(screen.getByText('SKU')).toBeOnTheScreen();
    expect(screen.getByText('CLORO-001')).toBeOnTheScreen();
  });

  it('muestra el Nombre del producto', () => {
    renderScreen();

    expect(screen.getByText('Nombre')).toBeOnTheScreen();
    expect(screen.getByText('Cloro Concentrado')).toBeOnTheScreen();
  });

  it('muestra el Precio Mínimo formateado como moneda', () => {
    renderScreen();

    // $250.50 — formato currency con dos decimales
    expect(screen.getByText('$250.50')).toBeOnTheScreen();
  });

  it('muestra badge "Activo" en verde para producto activo', () => {
    renderScreen();

    expect(screen.getByText('Activo')).toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // ACTIVE PRODUCT — acciones disponibles
  // ═══════════════════════════════════════════════════════════════

  it('muestra botón de editar (lápiz) cuando el producto está activo', () => {
    renderScreen();

    expect(screen.getByText('✏️')).toBeOnTheScreen();
  });

  it('muestra botón de eliminar (basurero) cuando el producto está activo', () => {
    renderScreen();

    expect(screen.getByText('🗑️')).toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // INACTIVE PRODUCT — solo reactivar
  // ═══════════════════════════════════════════════════════════════

  it('muestra badge "Inactivo" en gris/rojo para producto inactivo', () => {
    setupUseProducts({ selectedProduct: mockInactiveProduct });

    renderScreen();

    expect(screen.getByText('Inactivo')).toBeOnTheScreen();
  });

  it('muestra botón de reactivar (refresh) cuando el producto está inactivo', () => {
    setupUseProducts({ selectedProduct: mockInactiveProduct });

    renderScreen();

    expect(screen.getByText('🔄')).toBeOnTheScreen();
  });

  it('NO muestra botón de eliminar cuando el producto está inactivo', () => {
    setupUseProducts({ selectedProduct: mockInactiveProduct });

    renderScreen();

    expect(screen.queryByText('🗑️')).not.toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // EDIT NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  it('navega a ProductForm con { productId } al presionar editar', () => {
    renderScreen();

    fireEvent.press(screen.getByText('✏️'));

    expect(mockNavigate).toHaveBeenCalledWith({
      name: 'ProductForm',
      params: { productId: 1 },
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DELETE — confirmación + cancelación
  // ═══════════════════════════════════════════════════════════════

  it('muestra Alert.alert al presionar eliminar', () => {
    renderScreen();

    fireEvent.press(screen.getByText('🗑️'));

    expect(Alert.alert).toHaveBeenCalled();
  });

  it('llama a deleteProduct y navega atrás al confirmar eliminación en Alert', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    alertSpy.mockImplementation((_title, _message, buttons) => {
      const eliminarBtn = buttons?.find(
        (b: any) => b.text === 'Eliminar',
      );
      if (eliminarBtn?.onPress) eliminarBtn.onPress();
    });

    renderScreen();

    fireEvent.press(screen.getByText('🗑️'));

    expect(mockDeleteProduct).toHaveBeenCalledWith(1);
    expect(mockGoBack).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('NO llama a deleteProduct al cancelar la eliminación en Alert', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    alertSpy.mockImplementation((_title, _message, buttons) => {
      const cancelarBtn = buttons?.find(
        (b: any) => b.text === 'Cancelar',
      );
      if (cancelarBtn?.onPress) cancelarBtn.onPress();
    });

    renderScreen();

    fireEvent.press(screen.getByText('🗑️'));

    expect(mockDeleteProduct).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  // ═══════════════════════════════════════════════════════════════
  // REACTIVATE
  // ═══════════════════════════════════════════════════════════════

  it('llama a reactivateProduct al presionar el botón de reactivar', () => {
    setupUseProducts({ selectedProduct: mockInactiveProduct });

    renderScreen();

    fireEvent.press(screen.getByText('🔄'));

    // El screen usa productId de route params (1), no del producto mostrado (2)
    expect(mockReactivateProduct).toHaveBeenCalledWith(1);
  });

  // ═══════════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════════

  it('muestra ErrorBanner cuando hay error en el fetch del detalle', () => {
    setupUseProducts({
      selectedProduct: undefined,
      isLoadingDetail: false,
      isError: true,
      error: new Error('Producto no encontrado'),
    });

    renderScreen();

    expect(screen.getByText('Producto no encontrado')).toBeOnTheScreen();
  });

  it('muestra botón Reintentar en ErrorBanner', () => {
    setupUseProducts({
      selectedProduct: undefined,
      isLoadingDetail: false,
      isError: true,
      error: new Error('Error de conexión'),
    });

    renderScreen();

    expect(screen.getByText('Reintentar')).toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // BACK NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  it('renderiza BrandedAppBar con título "Detalle de Producto"', () => {
    renderScreen();

    expect(screen.getByText('Detalle de Producto')).toBeOnTheScreen();
  });
});
