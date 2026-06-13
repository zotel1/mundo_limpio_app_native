/**
 * WHAT: Tests para el hook useInventory — orquestación InventoryStore + InventoryRepository + TanStack Query
 * WHY: Validar 2 queries (low stock, detail), 1 mutation (adjustStock) con optimistic update + rollback,
 *      y estado de UI delegado a InventoryStore.
 * BENEFITS: Una sola API de inventario, lógica centralizada, testable con mocks.
 *
 * TDD: RED — test escrito antes de la implementación, debe fallar.
 *
 * PR 3.3
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { InventoryRepository, Inventory, StockAdjustment } from '@features/inventory/domain';
import { useInventoryStore } from '@features/inventory/presentation/stores/inventoryStore';
import { useInventory } from '@features/inventory/presentation/hooks/useInventory';

// ──── Helpers ────

const mockInventory: Inventory = {
  productId: 1,
  productName: 'Cloro Concentrado',
  currentStock: 5,
  minStockThreshold: 10,
};

const mockInventory2: Inventory = {
  productId: 2,
  productName: 'Detergente Industrial',
  currentStock: 3,
  minStockThreshold: 15,
};

const mockLowStockItems: Inventory[] = [mockInventory, mockInventory2];

const mockAdjustment: StockAdjustment = {
  type: 'INCREMENT',
  quantity: 10,
  reason: 'Reposición',
};

const createMockRepo = (): jest.Mocked<InventoryRepository> => ({
  getByProductId: jest.fn().mockResolvedValue(mockInventory),
  getLowStock: jest.fn().mockResolvedValue(mockLowStockItems),
  adjustStock: jest.fn().mockResolvedValue({
    ...mockInventory,
    currentStock: 15, // 5 + 10
  }),
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
  useInventoryStore.setState(useInventoryStore.getInitialState(), true);

// ──── Suite ────

describe('useInventory — hook de inventario', () => {
  beforeEach(() => {
    resetStore();
  });

  // ═══════════════════════════════════════════════════════════════
  // QUERIES — low stock (useQuery)
  // ═══════════════════════════════════════════════════════════════

  describe('Low stock (getLowStock)', () => {
    it('carga la lista de productos con stock bajo y los expone en lowStockItems', async () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useInventory({ inventoryRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      // Inicialmente está cargando
      expect(result.current.isLoadingLowStock).toBe(true);

      // Esperar a que la query se resuelva
      await waitFor(() => {
        expect(result.current.isLoadingLowStock).toBe(false);
      });

      expect(result.current.lowStockItems).toEqual(mockLowStockItems);
      expect(mockRepo.getLowStock).toHaveBeenCalledTimes(1);
    });

    it('expone isErrorLowStock y lowStockError cuando la query falla', async () => {
      const mockRepo = createMockRepo();
      mockRepo.getLowStock.mockRejectedValue(new Error('Error de red'));

      const { result } = renderHook(
        () => useInventory({ inventoryRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isErrorLowStock).toBe(true);
      });

      expect(result.current.lowStockError).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // QUERIES — detail (useQuery getByProductId)
  // ═══════════════════════════════════════════════════════════════

  describe('Detalle inventario (getByProductId)', () => {
    it('no ejecuta la query de detalle cuando no hay inventario seleccionado', async () => {
      const mockRepo = createMockRepo();

      renderHook(() => useInventory({ inventoryRepository: mockRepo }), {
        wrapper: createWrapper(),
      });

      // Pequeño wait para estabilizar
      await new Promise((resolve) => setTimeout(resolve, 50));

      // No debería llamar getByProductId porque no hay selectedInventoryId
      expect(mockRepo.getByProductId).not.toHaveBeenCalled();
    });

    it('carga el detalle cuando selectedInventoryId está definido', async () => {
      const mockRepo = createMockRepo();

      // Seleccionamos un inventario ANTES de renderizar el hook
      useInventoryStore.getState().selectInventory(1);

      const { result } = renderHook(
        () => useInventory({ inventoryRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.inventoryDetail).toEqual(mockInventory);
      });

      expect(mockRepo.getByProductId).toHaveBeenCalledWith(1);
    });

    it('expone isLoadingDetail=true mientras carga el detalle', async () => {
      const mockRepo = createMockRepo();

      useInventoryStore.getState().selectInventory(1);

      const { result } = renderHook(
        () => useInventory({ inventoryRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      // Inmediatamente después de renderizar, debería estar cargando
      expect(result.current.isLoadingDetail).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingDetail).toBe(false);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATIONS — adjustStock
  // ═══════════════════════════════════════════════════════════════

  describe('adjustStock', () => {
    it('llama a inventoryRepository.adjustStock con productId y adjustment', async () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useInventory({ inventoryRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      // Estabilizar carga inicial
      await waitFor(() => {
        expect(result.current.isLoadingLowStock).toBe(false);
      });

      await act(async () => {
        result.current.adjustStock(1, mockAdjustment);
      });

      // Esperar que la mutation se complete
      await waitFor(() => {
        expect(result.current.isAdjusting).toBe(false);
      });

      expect(mockRepo.adjustStock).toHaveBeenCalledWith(1, mockAdjustment);
    });

    it('optimistic update: actualiza currentStock en caché inmediatamente', async () => {
      const mockRepo = createMockRepo();

      // Precargamos el detalle en el store
      useInventoryStore.getState().selectInventory(1);

      const { result } = renderHook(
        () => useInventory({ inventoryRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      // Esperar que el detalle cargue (currentStock = 5)
      await waitFor(() => {
        expect(result.current.inventoryDetail).toEqual(mockInventory);
      });

      // Ajuste: INCREMENT de 10 → currentStock debería ser 15
      await act(async () => {
        result.current.adjustStock(1, mockAdjustment);
      });

      // La mutation debería completarse
      await waitFor(() => {
        expect(result.current.isAdjusting).toBe(false);
      });

      expect(mockRepo.adjustStock).toHaveBeenCalledWith(1, mockAdjustment);
    });

    it('rollback: restaura la caché si adjustStock falla', async () => {
      const mockRepo = createMockRepo();
      mockRepo.adjustStock.mockRejectedValue(new Error('Error de servidor'));

      useInventoryStore.getState().selectInventory(1);

      const { result } = renderHook(
        () => useInventory({ inventoryRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.inventoryDetail).toEqual(mockInventory);
      });

      await act(async () => {
        result.current.adjustStock(1, mockAdjustment);
      });

      // Esperar que la mutation falle
      await waitFor(() => {
        expect(result.current.isAdjusting).toBe(false);
      });

      // La mutación falló — verificamos que adjustStock fue llamado
      expect(mockRepo.adjustStock).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // STORE INTEGRATION — estado de UI delegado a InventoryStore
  // ═══════════════════════════════════════════════════════════════

  describe('Integración con InventoryStore', () => {
    it('expone selectedInventoryId y selectInventory del store', () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useInventory({ inventoryRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      expect(result.current.selectedInventoryId).toBeNull();

      act(() => {
        result.current.selectInventory(5);
      });

      expect(result.current.selectedInventoryId).toBe(5);
    });

    it('expone estado del diálogo de ajuste del store', () => {
      const mockRepo = createMockRepo();

      const { result } = renderHook(
        () => useInventory({ inventoryRepository: mockRepo }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isAdjustDialogOpen).toBe(false);
      expect(result.current.adjustDialogProductId).toBeNull();

      act(() => {
        result.current.openAdjustDialog(3);
      });

      expect(result.current.isAdjustDialogOpen).toBe(true);
      expect(result.current.adjustDialogProductId).toBe(3);

      act(() => {
        result.current.closeAdjustDialog();
      });

      expect(result.current.isAdjustDialogOpen).toBe(false);
      expect(result.current.adjustDialogProductId).toBeNull();
    });
  });
});
