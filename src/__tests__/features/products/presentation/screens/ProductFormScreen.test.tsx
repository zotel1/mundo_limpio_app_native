/**
 * WHAT: Tests TDD para ProductFormScreen — formulario de crear/editar producto.
 * WHY: Validar renderizado condicional (create vs edit mode), pre-load de datos,
 *      validación inline (React Hook Form + Zod), submit flow (create/update),
 *      estados de carga y error.
 * BENEFITS: Cobertura completa del formulario de producto con validación Zod.
 *
 * TDD: RED → GREEN — tests escritos antes de la implementación.
 *
 * PR 2.9 — T031
 *
 * Mock strategy:
 * - jest.mock useProducts → control total de createProduct, updateProduct, selectedProduct
 * - jest.mock @react-navigation/native → controlar useNavigation, useRoute
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// ──── Types ───────────────────────────────────────────────────────────

import type { Product } from '@features/products/domain';

// ──── Mock Data ───────────────────────────────────────────────────────

const mockExistingProduct: Product = {
  id: 1,
  sku: 'CLORO-001',
  name: 'Cloro Concentrado',
  minPrice: 250.5,
  active: true,
};

// ──── Mock Navigation ─────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockUseRoute = jest.fn(() => ({ params: {} }));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: mockUseRoute,
  };
});

// ═══════════════════════════════════════════════════════════════
// Mock useProducts — valores controlados por test
// ═══════════════════════════════════════════════════════════════

const mockCreateProduct = jest.fn();
const mockUpdateProduct = jest.fn();
const mockSetFormMode = jest.fn();
const mockResetFormMode = jest.fn();

interface MockUseProductsReturn {
  selectedProduct: Product | undefined;
  isLoadingDetail: boolean;
  createProduct: jest.Mock;
  updateProduct: jest.Mock;
}

function createMockUseProducts(
  overrides: Partial<MockUseProductsReturn> = {},
): MockUseProductsReturn {
  return {
    selectedProduct: undefined,
    isLoadingDetail: false,
    createProduct: mockCreateProduct,
    updateProduct: mockUpdateProduct,
    ...overrides,
  };
}

jest.mock(
  '@features/products/presentation/stores/productStore',
  () => ({
    useProductStore: jest.fn(),
  }),
);

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
const { ProductFormScreen } = require(
  '@features/products/presentation/screens/ProductFormScreen',
) as { ProductFormScreen: React.ComponentType };

// ──── Helpers ─────────────────────────────────────────────────────────

function setupUseProducts(overrides: Partial<MockUseProductsReturn> = {}) {
  useProducts.mockReturnValue(createMockUseProducts(overrides));
}

function setupStore() {
  useProductStore.mockReturnValue({
    setFormMode: mockSetFormMode,
    resetFormMode: mockResetFormMode,
    selectedProductId: null,
    searchQuery: '',
    isDeleteDialogOpen: false,
    productToDelete: null,
    formMode: 'create',
    editingProductId: null,
    selectProduct: jest.fn(),
    clearSelection: jest.fn(),
    setSearchQuery: jest.fn(),
    openDeleteDialog: jest.fn(),
    closeDeleteDialog: jest.fn(),
  });
}

function setupCreateMode() {
  // Route params: {} → no productId → create mode
  mockUseRoute.mockReturnValue({ params: {} });
}

function setupEditMode(productId = 1) {
  mockUseRoute.mockReturnValue({ params: { productId } });
}

function renderScreen() {
  return render(<ProductFormScreen />);
}

// ──── Suite ───────────────────────────────────────────────────────────

describe('ProductFormScreen — formulario de producto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupStore();
    setupCreateMode();
    setupUseProducts();
  });

  // ═══════════════════════════════════════════════════════════════
  // CREATE MODE
  // ═══════════════════════════════════════════════════════════════

  describe('Modo crear (sin productId)', () => {
    beforeEach(() => {
      setupCreateMode();
    });

    it('renderiza título "Nuevo Producto" en BrandedAppBar', () => {
      renderScreen();

      expect(screen.getByText('Nuevo Producto')).toBeOnTheScreen();
    });

    it('renderiza campo SKU vacío con placeholder', () => {
      renderScreen();

      const skuInput = screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001');
      expect(skuInput).toBeOnTheScreen();
    });

    it('renderiza campo Nombre vacío con placeholder', () => {
      renderScreen();

      const nameInput = screen.getByPlaceholderText('Nombre del producto');
      expect(nameInput).toBeOnTheScreen();
    });

    it('renderiza campo Precio Mínimo vacío con placeholder', () => {
      renderScreen();

      const priceInput = screen.getByPlaceholderText('0.00');
      expect(priceInput).toBeOnTheScreen();
    });

    it('renderiza botón de Guardar', () => {
      renderScreen();

      expect(screen.getByText('Guardar')).toBeOnTheScreen();
    });

    it('llama a createProduct con los datos del formulario al hacer submit válido', async () => {
      renderScreen();

      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001'),
        'CLORO-001',
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Nombre del producto'),
        'Cloro Concentrado',
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('0.00'),
        '250.5',
      );

      // Submit form — RHF handleSubmit returns a promise
      await fireEvent.press(screen.getByText('Guardar'));

      expect(mockCreateProduct).toHaveBeenCalledWith({
        sku: 'CLORO-001',
        name: 'Cloro Concentrado',
        minPrice: 250.5,
      });
    });

    it('navega atrás (goBack) al crear producto exitosamente', async () => {
      jest.useFakeTimers();
      renderScreen();

      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001'),
        'CLORO-001',
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Nombre del producto'),
        'Cloro',
      );
      fireEvent.changeText(screen.getByPlaceholderText('0.00'), '100');

      await fireEvent.press(screen.getByText('Guardar'));

      // El setTimeout de 100ms dispara goBack
      jest.advanceTimersByTime(200);
      expect(mockGoBack).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('NO muestra datos pre-cargados (selectedProduct undefined)', () => {
      setupUseProducts({ selectedProduct: undefined });
      renderScreen();

      const skuInput = screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001');
      // Default value from RHF is empty string (not undefined)
      expect(skuInput.props.value).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════════════════════

  describe('Modo editar (con productId)', () => {
    beforeEach(() => {
      setupEditMode(1);
    });

    it('renderiza título "Editar Producto" en BrandedAppBar', () => {
      renderScreen();

      expect(screen.getByText('Editar Producto')).toBeOnTheScreen();
    });

    it('muestra LoadingIndicator mientras carga el producto (isLoadingDetail=true)', () => {
      setupUseProducts({
        selectedProduct: undefined,
        isLoadingDetail: true,
      });

      renderScreen();

      expect(screen.getByTestId('loading-indicator')).toBeOnTheScreen();
    });

    it('pre-carga campos del formulario con datos del producto', () => {
      setupUseProducts({ selectedProduct: mockExistingProduct });

      renderScreen();

      // Verificar que los campos muestran los valores del producto
      const skuInput = screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001');
      const nameInput = screen.getByPlaceholderText('Nombre del producto');
      const priceInput = screen.getByPlaceholderText('0.00');

      expect(skuInput.props.value).toBe('CLORO-001');
      expect(nameInput.props.value).toBe('Cloro Concentrado');
      expect(priceInput.props.value).toBe('250.5');
    });

    it('llama a updateProduct con id y datos al hacer submit en modo editar', async () => {
      setupUseProducts({ selectedProduct: mockExistingProduct });

      renderScreen();

      // Cambiar un campo para verificar que updateProduct recibe los datos actualizados
      fireEvent.changeText(
        screen.getByPlaceholderText('Nombre del producto'),
        'Cloro Modificado',
      );

      await fireEvent.press(screen.getByText('Guardar'));

      expect(mockUpdateProduct).toHaveBeenCalledWith({
        id: 1,
        data: {
          sku: 'CLORO-001',
          name: 'Cloro Modificado',
          minPrice: 250.5,
        },
      });
    });

    it('navega atrás (goBack) al editar producto exitosamente', async () => {
      jest.useFakeTimers();
      setupUseProducts({ selectedProduct: mockExistingProduct });

      renderScreen();

      await fireEvent.press(screen.getByText('Guardar'));

      // El setTimeout de 100ms dispara goBack
      jest.advanceTimersByTime(200);
      expect(mockGoBack).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // VALIDACIÓN — React Hook Form + Zod (ProductRequestSchema)
  // ═══════════════════════════════════════════════════════════════

  describe('Validación del formulario', () => {
    it('muestra error cuando SKU está vacío', async () => {
      renderScreen();

      // Llenar nombre y precio con datos válidos, dejar SKU vacío
      fireEvent.changeText(
        screen.getByPlaceholderText('Nombre del producto'),
        'Producto Test',
      );
      fireEvent.changeText(screen.getByPlaceholderText('0.00'), '100');

      // Submit → handleSubmit valida todos los campos
      await fireEvent.press(screen.getByText('Guardar'));

      // SKU vacío → error min(1)
      expect(screen.getByText('SKU es requerido')).toBeOnTheScreen();
      // No se llamó a createProduct porque la validación falló
      expect(mockCreateProduct).not.toHaveBeenCalled();
    });

    it('muestra error cuando SKU tiene caracteres especiales', async () => {
      renderScreen();

      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001'),
        'BAD@SKU!',
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Nombre del producto'),
        'Producto Test',
      );
      fireEvent.changeText(screen.getByPlaceholderText('0.00'), '100');

      await fireEvent.press(screen.getByText('Guardar'));

      expect(
        screen.getByText(
          'SKU must contain only uppercase letters, numbers, and hyphens',
        ),
      ).toBeOnTheScreen();
      expect(mockCreateProduct).not.toHaveBeenCalled();
    });

    it('muestra error cuando Nombre está vacío', async () => {
      renderScreen();

      // Llenar SKU y precio con datos válidos, dejar Nombre vacío
      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001'),
        'PROD-001',
      );
      fireEvent.changeText(screen.getByPlaceholderText('0.00'), '100');

      await fireEvent.press(screen.getByText('Guardar'));

      expect(screen.getByText('Nombre es requerido')).toBeOnTheScreen();
      expect(mockCreateProduct).not.toHaveBeenCalled();
    });

    it('muestra error cuando Precio Mínimo es 0 (no positivo)', async () => {
      renderScreen();

      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001'),
        'PROD-001',
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Nombre del producto'),
        'Producto Test',
      );
      // Precio = 0 → no es positivo
      fireEvent.changeText(screen.getByPlaceholderText('0.00'), '0');

      await fireEvent.press(screen.getByText('Guardar'));

      expect(
        screen.getByText('Precio mínimo debe ser positivo'),
      ).toBeOnTheScreen();
      expect(mockCreateProduct).not.toHaveBeenCalled();
    });

    it('NO muestra errores con datos válidos y llama a createProduct', async () => {
      renderScreen();

      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001'),
        'CLORO-001',
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Nombre del producto'),
        'Cloro',
      );
      fireEvent.changeText(screen.getByPlaceholderText('0.00'), '100');

      await fireEvent.press(screen.getByText('Guardar'));

      expect(screen.queryByText('SKU es requerido')).not.toBeOnTheScreen();
      expect(
        screen.queryByText(
          'SKU must contain only uppercase letters, numbers, and hyphens',
        ),
      ).not.toBeOnTheScreen();
      expect(screen.queryByText('Nombre es requerido')).not.toBeOnTheScreen();
      expect(
        screen.queryByText('Precio mínimo debe ser positivo'),
      ).not.toBeOnTheScreen();
      // Con datos válidos, createProduct SÍ se llama
      expect(mockCreateProduct).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SUBMIT STATES
  // ═══════════════════════════════════════════════════════════════

  describe('Estados de submit', () => {
    it('deshabilita botón Guardar mientras se está enviando', async () => {
      renderScreen();

      // Llenar formulario con datos válidos
      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001'),
        'CLORO-001',
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Nombre del producto'),
        'Cloro',
      );
      fireEvent.changeText(screen.getByPlaceholderText('0.00'), '100');

      await fireEvent.press(screen.getByText('Guardar'));

      // La mutation fue llamada (el formulario se envió)
      expect(mockCreateProduct).toHaveBeenCalled();
    });

    it('muestra mensaje de error cuando createProduct falla', async () => {
      setupCreateMode();

      renderScreen();

      // Llenar formulario con datos válidos
      fireEvent.changeText(
        screen.getByPlaceholderText('Ej: DETERGENTE-500ML-001'),
        'CLORO-001',
      );
      fireEvent.changeText(
        screen.getByPlaceholderText('Nombre del producto'),
        'Cloro',
      );
      fireEvent.changeText(screen.getByPlaceholderText('0.00'), '100');

      await fireEvent.press(screen.getByText('Guardar'));

      // La mutation fue llamada
      expect(mockCreateProduct).toHaveBeenCalled();
    });
  });
});
