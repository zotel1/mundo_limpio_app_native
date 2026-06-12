/**
 * WHAT: Tests TDD para ProductsListScreen — pantalla principal de listado de productos.
 * WHY: Validar renderizado condicional (loading/empty/error/data), búsqueda local,
 *      paginación, pull-to-refresh, navegación a detalle y formulario,
 *      y flujo de eliminación con confirmación (spec R6).
 * BENEFITS: Cobertura completa de la pantalla más importante de Products.
 *
 * TDD: RED → GREEN — tests escritos antes de la implementación.
 *
 * PR 2.7 — T026
 *
 * Mock strategy:
 * - jest.mock useProducts → control total de datos y funciones
 * - jest.mock @react-navigation/native → capturar llamadas a navigate
 * - jest.spyOn(Alert, 'alert') en beforeEach → verificar confirmación de delete
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { Alert } from 'react-native';

// ──── Types ───────────────────────────────────────────────────────────

import type { Product } from '@features/products/domain';

// ──── Mock Data ───────────────────────────────────────────────────────

const mockProduct1: Product = {
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
  active: true,
};

const mockProduct3: Product = {
  id: 3,
  sku: 'JABO-001',
  name: 'Jabón Líquido',
  minPrice: 120.0,
  active: true,
};

const mockProducts = [mockProduct1, mockProduct2, mockProduct3];

// ──── Mock Navigation ─────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

// ──── Mock useProducts — valores controlados por test ──────────────────

const mockRefetch = jest.fn();
const mockFetchNextPage = jest.fn();
const mockSetSearchQuery = jest.fn();
const mockOpenDeleteDialog = jest.fn();
const mockCloseDeleteDialog = jest.fn();
const mockDeleteProduct = jest.fn();

interface MockUseProductsReturn {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  refetch: jest.Mock;
  fetchNextPage: jest.Mock;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  searchQuery: string;
  setSearchQuery: jest.Mock;
  openDeleteDialog: jest.Mock;
  closeDeleteDialog: jest.Mock;
  deleteProduct: jest.Mock;
  isDeleteDialogOpen: boolean;
  productToDelete: Product | null;
  selectedProduct?: Product;
  isLoadingDetail?: boolean;
  createProduct?: jest.Mock;
  updateProduct?: jest.Mock;
  reactivateProduct?: jest.Mock;
  formMode?: 'create' | 'edit';
  editingProductId?: number | null;
  setFormMode?: jest.Mock;
  resetFormMode?: jest.Mock;
}

function createMockUseProducts(
  overrides: Partial<MockUseProductsReturn> = {},
): MockUseProductsReturn {
  return {
    products: mockProducts,
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: mockRefetch,
    fetchNextPage: mockFetchNextPage,
    hasNextPage: true,
    isFetchingNextPage: false,
    searchQuery: '',
    setSearchQuery: mockSetSearchQuery,
    openDeleteDialog: mockOpenDeleteDialog,
    closeDeleteDialog: mockCloseDeleteDialog,
    deleteProduct: mockDeleteProduct,
    isDeleteDialogOpen: false,
    productToDelete: null,
    ...overrides,
  };
}

jest.mock(
  '@features/products/presentation/hooks/useProducts',
  () => ({
    useProducts: jest.fn(),
  }),
);

// ──── Import (dynamic — after mocks) ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useProducts } = require(
  '@features/products/presentation/hooks/useProducts',
) as { useProducts: jest.Mock };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ProductsListScreen } = require(
  '@features/products/presentation/screens/ProductsListScreen',
) as { ProductsListScreen: React.ComponentType };

// ──── Helpers ─────────────────────────────────────────────────────────

function setupUseProducts(overrides: Partial<MockUseProductsReturn> = {}) {
  useProducts.mockReturnValue(createMockUseProducts(overrides));
}

function renderScreen() {
  return render(<ProductsListScreen />);
}

// ──── Suite ───────────────────────────────────────────────────────────

describe('ProductsListScreen — pantalla de listado de productos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupUseProducts();
    // Spy on Alert.alert — must be in beforeEach because config
    // restoreMocks:true restores spies automatically before each test.
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  // ═══════════════════════════════════════════════════════════════
  // RENDERIZADO
  // ═══════════════════════════════════════════════════════════════

  it('renderiza BrandedAppBar con título "Productos"', () => {
    renderScreen();

    expect(screen.getByText('Productos')).toBeOnTheScreen();
  });

  it('renderiza la SearchBar', () => {
    renderScreen();

    expect(
      screen.getByPlaceholderText('Buscar por nombre o SKU...'),
    ).toBeOnTheScreen();
  });

  it('renderiza FlatList con productos', () => {
    renderScreen();

    expect(screen.getByText('Cloro Concentrado')).toBeOnTheScreen();
    expect(screen.getByText('Detergente Industrial')).toBeOnTheScreen();
    expect(screen.getByText('Jabón Líquido')).toBeOnTheScreen();
  });

  it('renderiza FAB con texto "+" para crear producto', () => {
    renderScreen();

    expect(screen.getByText('+')).toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // ESTADOS
  // ═══════════════════════════════════════════════════════════════

  it('muestra LoadingIndicator cuando isLoading=true', () => {
    setupUseProducts({ isLoading: true, products: [] });

    renderScreen();

    expect(screen.getByTestId('loading-indicator')).toBeOnTheScreen();
  });

  it('NO muestra productos cuando isLoading=true (carga inicial)', () => {
    setupUseProducts({ isLoading: true, products: [] });

    renderScreen();

    expect(screen.getByTestId('loading-indicator')).toBeOnTheScreen();
    expect(screen.queryByText('Cloro Concentrado')).not.toBeOnTheScreen();
  });

  it('muestra mensaje "No se encontraron productos" cuando la lista está vacía', () => {
    setupUseProducts({ isLoading: false, products: [] });

    renderScreen();

    expect(screen.getByText('No se encontraron productos')).toBeOnTheScreen();
  });

  it('NO muestra "No se encontraron productos" mientras isLoading=true', () => {
    setupUseProducts({ isLoading: true, products: [] });

    renderScreen();

    expect(
      screen.queryByText('No se encontraron productos'),
    ).not.toBeOnTheScreen();
  });

  it('muestra ErrorBanner con botón Reintentar cuando isError=true', () => {
    setupUseProducts({
      isError: true,
      error: new Error('Error de conexión'),
      products: [],
    });

    renderScreen();

    expect(screen.getByText('Reintentar')).toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // BÚSQUEDA
  // ═══════════════════════════════════════════════════════════════

  it('filtra productos por nombre cuando searchQuery está activo', () => {
    // Simular que el usuario escribió "Cloro" → el hook retorna searchQuery "cloro"
    setupUseProducts({ searchQuery: 'cloro' });

    renderScreen();

    // Solo Cloro Concentrado contiene "cloro" en su nombre
    expect(screen.getByText('Cloro Concentrado')).toBeOnTheScreen();
    expect(screen.queryByText('Detergente Industrial')).not.toBeOnTheScreen();
    expect(screen.queryByText('Jabón Líquido')).not.toBeOnTheScreen();
  });

  it('filtra productos por SKU cuando searchQuery está activo', () => {
    setupUseProducts({ searchQuery: 'dete' });

    renderScreen();

    // Solo Detergente Industrial tiene SKU que contiene "dete"
    expect(screen.getByText('Detergente Industrial')).toBeOnTheScreen();
    expect(screen.queryByText('Cloro Concentrado')).not.toBeOnTheScreen();
    expect(screen.queryByText('Jabón Líquido')).not.toBeOnTheScreen();
  });

  it('llama a setSearchQuery al cambiar el texto de búsqueda (debounce)', () => {
    jest.useFakeTimers();
    renderScreen();

    const input = screen.getByPlaceholderText('Buscar por nombre o SKU...');
    fireEvent.changeText(input, 'Cloro');

    // Debounce 300ms — SearchBar no llama onChangeText antes de 300ms
    expect(mockSetSearchQuery).not.toHaveBeenCalled();

    // Avanzar 300ms
    jest.advanceTimersByTime(300);
    expect(mockSetSearchQuery).toHaveBeenCalledWith('Cloro');

    jest.useRealTimers();
  });

  // ═══════════════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════

  it('navega a ProductDetail al presionar un producto', () => {
    renderScreen();

    fireEvent.press(screen.getByText('Cloro Concentrado'));

    expect(mockNavigate).toHaveBeenCalledWith({
      name: 'ProductDetail',
      params: { productId: 1 },
    });
  });

  it('navega a ProductForm al presionar el FAB', () => {
    renderScreen();

    fireEvent.press(screen.getByText('+'));

    expect(mockNavigate).toHaveBeenCalledWith({
      name: 'ProductForm',
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════════════

  it('abre diálogo de eliminación al hacer long press sobre un producto', () => {
    renderScreen();

    fireEvent(screen.getByText('Cloro Concentrado'), 'longPress');

    expect(mockOpenDeleteDialog).toHaveBeenCalledWith(mockProduct1);
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('llama a deleteProduct al confirmar la eliminación en Alert', () => {
    // Espiar Alert.alert para capturar y ejecutar el botón "Eliminar"
    const alertSpy = jest.spyOn(Alert, 'alert');
    alertSpy.mockImplementation((_title, _message, buttons) => {
      const eliminarBtn = buttons?.find(
        (b: any) => b.text === 'Eliminar',
      );
      if (eliminarBtn?.onPress) eliminarBtn.onPress();
    });

    renderScreen();

    fireEvent(screen.getByText('Cloro Concentrado'), 'longPress');

    expect(mockDeleteProduct).toHaveBeenCalledWith(1);

    alertSpy.mockRestore();
  });

  it('llama a closeDeleteDialog al cancelar la eliminación en Alert', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    alertSpy.mockImplementation((_title, _message, buttons) => {
      const cancelarBtn = buttons?.find(
        (b: any) => b.text === 'Cancelar',
      );
      if (cancelarBtn?.onPress) cancelarBtn.onPress();
    });

    renderScreen();

    fireEvent(screen.getByText('Cloro Concentrado'), 'longPress');

    expect(mockCloseDeleteDialog).toHaveBeenCalled();
    expect(mockDeleteProduct).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  // ═══════════════════════════════════════════════════════════════
  // PAGINACIÓN
  // ═══════════════════════════════════════════════════════════════

  it('llama a fetchNextPage al llegar al final de la lista (onEndReached)', () => {
    renderScreen();

    const flatList = screen.getByTestId('products-flatlist');
    fireEvent(flatList, 'onEndReached');

    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('muestra LoadingIndicator en el footer cuando isFetchingNextPage=true', () => {
    setupUseProducts({ isFetchingNextPage: true });

    renderScreen();

    const footerLoader = screen.getByTestId('loading-indicator');
    expect(footerLoader).toBeOnTheScreen();
  });

  // ═══════════════════════════════════════════════════════════════
  // PULL TO REFRESH
  // ═══════════════════════════════════════════════════════════════

  it('llama a refetch al hacer pull-to-refresh', () => {
    renderScreen();

    const flatList = screen.getByTestId('products-flatlist');
    fireEvent(flatList, 'refresh');

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('FlatList muestra refreshing=true cuando isFetching=true', () => {
    setupUseProducts({ isFetching: true });

    renderScreen();

    const flatList = screen.getByTestId('products-flatlist');
    expect(flatList.props.refreshing).toBe(true);
  });
});
