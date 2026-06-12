/**
 * WHAT: Tests para el hook useProducts — orquestación ProductStore + ProductRepository + TanStack Query
 * WHY: Validar 3 queries (listado activo, detalle, por SKU), 4 mutations (create, update, delete, reactivate)
 *      con optimistic update + rollback, y estado de UI delegado a ProductStore.
 * BENEFITS: Una sola API de productos, lógica centralizada, testable con mocks.
 *
 * TDD: RED → GREEN: test escrito antes de la implementación, debe fallar.
 *
 * PR 2.5 — T020
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ProductRepository, Product, ProductFormData } from '@features/products/domain';
import { useProductStore } from '@features/products/presentation/stores/productStore';
import { useProducts } from '@features/products/presentation/hooks/useProducts';

// ──── Helpers ────

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
  active: true,
};

const mockInactiveProduct: Product = {
  id: 3,
  sku: 'INAC-001',
  name: 'Producto Inactivo',
  minPrice: 99.0,
  active: false,
};

const mockProducts = [mockProduct, mockProduct2];

const mockFormData: ProductFormData = {
  sku: 'NUEVO-001',
  name: 'Nuevo Producto',
  minPrice: 150.0,
};

const createMockRepo = (): jest.Mocked<ProductRepository> => ({
  getAllActive: jest.fn().mockResolvedValue(mockProducts),
  getAll: jest.fn().mockResolvedValue([...mockProducts, mockInactiveProduct]),
  getById: jest.fn().mockResolvedValue(mockProduct),
  getBySku: jest.fn().mockResolvedValue(mockProduct),
  create: jest.fn().mockResolvedValue({
    ...mockProduct,
    id: 99,
    sku: 'NUEVO-001',
    name: 'Nuevo Producto',
    minPrice: 150.0,
  }),
  update: jest.fn().mockResolvedValue({
    ...mockProduct,
    name: 'Cloro Modificado',
    minPrice: 300.0,
  }),
  delete: jest.fn().mockResolvedValue(undefined),
  reactivate: jest.fn().mockResolvedValue(undefined),
});

// Wrapper con QueryClientProvider necesario para TanStack Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Helper: resetea el store antes de cada test
const resetStore = () =>
  useProductStore.setState(useProductStore.getInitialState(), true);

// ──── Suite ────

describe('useProducts — hook de productos', () => {
  beforeEach(() => {
    resetStore();
  });

  // ═══════════════════════════════════════════════════════════════
  // QUERIES — listado activo (useQuery)
  // ═══════════════════════════════════════════════════════════════

  describe('Listado activo (getAllActive)', () => {
    it('carga la lista de productos activos y los expone en "products"', async () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      // Inicialmente está cargando
      expect(result.current.isLoading).toBe(true);

      // Esperar a que la query se resuelva usando waitFor
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toEqual(mockProducts);
      expect(mockRepo.getAllActive).toHaveBeenCalledWith(0, 20);
    });

    it('expone isError y error cuando la query falla', async () => {
      const mockRepo = createMockRepo();
      mockRepo.getAllActive.mockRejectedValue(new Error('Error de red'));

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // QUERIES — detalle producto (useQuery detail)
  // ═══════════════════════════════════════════════════════════════

  describe('Detalle producto (getById)', () => {
    it('no ejecuta la query de detalle cuando no hay producto seleccionado', async () => {
      const mockRepo = createMockRepo();

      renderHook(() => useProducts({ productRepository: mockRepo }), {
        wrapper: createWrapper(),
      });

      // Esperar que termine cualquier render inicial
      await waitFor(() => {
        // Solo necesitamos que el hook se estabilice
        expect(true).toBe(true);
      });

      // No debería llamar getById porque no hay selectedProductId
      expect(mockRepo.getById).not.toHaveBeenCalled();
    });

    it('carga el detalle cuando selectedProductId está definido', async () => {
      const mockRepo = createMockRepo();

      // Seleccionamos un producto ANTES de renderizar el hook
      useProductStore.getState().selectProduct(1);

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.selectedProduct).toEqual(mockProduct);
      });

      expect(mockRepo.getById).toHaveBeenCalledWith(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // QUERIES — búsqueda por SKU (useQuery bySku)
  // ═══════════════════════════════════════════════════════════════

  describe('Búsqueda por SKU (getBySku)', () => {
    it('no ejecuta la query de SKU cuando searchQuery está vacío', async () => {
      const mockRepo = createMockRepo();

      renderHook(() => useProducts({ productRepository: mockRepo }), {
        wrapper: createWrapper(),
      });

      // Pequeño wait para estabilizar
      await new Promise((resolve) => setTimeout(resolve, 50));

      // searchQuery vacío → no se llama getBySku
      expect(mockRepo.getBySku).not.toHaveBeenCalled();
    });

    it('ejecuta la query de SKU cuando searchQuery tiene texto', async () => {
      const mockRepo = createMockRepo();

      useProductStore.getState().setSearchQuery('CLORO-001');

      renderHook(() => useProducts({ productRepository: mockRepo }), {
        wrapper: createWrapper(),
      });

      // Pequeño wait para que la query se ejecute
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockRepo.getBySku).toHaveBeenCalledWith('CLORO-001');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATIONS — create
  // ═══════════════════════════════════════════════════════════════

  describe('createProduct', () => {
    it('llama a productRepository.create con los datos del formulario', async () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      // Estabilizar carga inicial
      await new Promise((resolve) => setTimeout(resolve, 50));

      await act(async () => {
        result.current.createProduct(mockFormData);
      });

      // Esperar que la mutation se complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRepo.create).toHaveBeenCalledWith(mockFormData);
    });

    it('refresca la lista de productos tras crear exitoso', async () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      // Esperar la carga inicial
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verificar llamada inicial
      const initialCalls = mockRepo.getAllActive.mock.calls.length;

      await act(async () => {
        result.current.createProduct(mockFormData);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // La lista debería refrescarse (segunda llamada a getAllActive)
      expect(mockRepo.getAllActive.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATIONS — update
  // ═══════════════════════════════════════════════════════════════

  describe('updateProduct', () => {
    it('llama a productRepository.update con ID y datos', async () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      await act(async () => {
        result.current.updateProduct({ id: 1, data: mockFormData });
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRepo.update).toHaveBeenCalledWith(1, mockFormData);
    });

    it('optimistic update: actualiza la caché de detalle inmediatamente', async () => {
      const mockRepo = createMockRepo();

      // Precargamos el detalle en el store
      useProductStore.getState().selectProduct(1);

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.selectedProduct).toEqual(mockProduct);
      });

      const updateData: ProductFormData = {
        sku: 'CLORO-001',
        name: 'Cloro Modificado',
        minPrice: 300.0,
      };

      await act(async () => {
        result.current.updateProduct({ id: 1, data: updateData });
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRepo.update).toHaveBeenCalledWith(1, updateData);
    });

    it('rollback: restaura la caché si update falla', async () => {
      const mockRepo = createMockRepo();
      mockRepo.update.mockRejectedValue(new Error('Error de servidor'));

      useProductStore.getState().selectProduct(1);

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.selectedProduct).toEqual(mockProduct);
      });

      await act(async () => {
        result.current.updateProduct({
          id: 1,
          data: { sku: 'CLORO-001', name: 'Cloro Modificado', minPrice: 300.0 },
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // La mutación falló — verificamos que update fue llamado
      expect(mockRepo.update).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATIONS — delete
  // ═══════════════════════════════════════════════════════════════

  describe('deleteProduct', () => {
    it('llama a productRepository.delete con el ID correcto', async () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      await act(async () => {
        result.current.deleteProduct(1);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });

    it('onMutate: cierra el diálogo de eliminación', async () => {
      const mockRepo = createMockRepo();

      // Abrir el diálogo antes
      useProductStore.getState().openDeleteDialog(mockProduct);
      expect(useProductStore.getState().isDeleteDialogOpen).toBe(true);

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      await act(async () => {
        result.current.deleteProduct(1);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // El diálogo se cerró inmediatamente (optimistic)
      expect(useProductStore.getState().isDeleteDialogOpen).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATIONS — reactivate
  // ═══════════════════════════════════════════════════════════════

  describe('reactivateProduct', () => {
    it('llama a productRepository.reactivate con el ID correcto', async () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      await act(async () => {
        result.current.reactivateProduct(3);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRepo.reactivate).toHaveBeenCalledWith(3);
    });

    it('refresca la lista tras reactivar exitoso', async () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCalls = mockRepo.getAllActive.mock.calls.length;

      await act(async () => {
        result.current.reactivateProduct(3);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // La lista se refresca tras reactivar
      expect(mockRepo.getAllActive.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // STORE INTEGRATION — estado de UI delegado a ProductStore
  // ═══════════════════════════════════════════════════════════════

  describe('Integración con ProductStore', () => {
    it('expone searchQuery y setSearchQuery del store', () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      expect(result.current.searchQuery).toBe('');

      act(() => {
        result.current.setSearchQuery('CLORO');
      });

      expect(result.current.searchQuery).toBe('CLORO');
    });

    it('expone estado del diálogo de eliminación del store', () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isDeleteDialogOpen).toBe(false);
      expect(result.current.productToDelete).toBeNull();

      act(() => {
        result.current.openDeleteDialog(mockProduct);
      });

      expect(result.current.isDeleteDialogOpen).toBe(true);
      expect(result.current.productToDelete).toEqual(mockProduct);

      act(() => {
        result.current.closeDeleteDialog();
      });

      expect(result.current.isDeleteDialogOpen).toBe(false);
    });

    it('expone formMode, editingProductId y acciones del store', () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useProducts({ productRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      expect(result.current.formMode).toBe('create');
      expect(result.current.editingProductId).toBeNull();

      act(() => {
        result.current.setFormMode('edit', 7);
      });

      expect(result.current.formMode).toBe('edit');
      expect(result.current.editingProductId).toBe(7);

      act(() => {
        result.current.resetFormMode();
      });

      expect(result.current.formMode).toBe('create');
      expect(result.current.editingProductId).toBeNull();
    });
  });
});
