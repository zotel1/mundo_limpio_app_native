/**
 * useInventory — Hook principal de inventario.
 *
 * WHAT: Hook que orquesta InventoryStore (UI state) + InventoryRepository (data)
 *       + TanStack Query (queries + mutation con optimistic update).
 * WHY: Un solo hook con toda la lógica de inventario. Las screens solo llaman
 *      adjustStock(), selectInventory(), etc. sin conocer detalles de API o caché.
 * BENEFITS: Lógica de inventario en un solo lugar, sin dispersar entre screens.
 *           Testable con mock de InventoryRepository. Centraliza el estado.
 *
 * Store holds ONLY UI state (selectedInventoryId, adjust dialog).
 * Server data lives EXCLUSIVELY in TanStack Query cache.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de useInventory.test.tsx
 * PR 3.3
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@core/query/queryKeys';
import type {
  InventoryRepository,
  Inventory,
  StockAdjustment,
} from '../../domain';
import { useInventoryStore } from '../stores/inventoryStore';

// ──── Tipos ────

/**
 * WHAT: Dependencias que el hook necesita inyectadas.
 * WHY: Manual DI — el hook no importa infrastructure directamente.
 */
interface UseInventoryDeps {
  inventoryRepository: InventoryRepository;
}

/**
 * WHAT: Retorno del hook useInventory — estado + queries + mutation + store.
 */
export interface UseInventoryReturn {
  // ──── Query state (low stock) ────
  lowStockItems: Inventory[];
  isLoadingLowStock: boolean;
  isErrorLowStock: boolean;
  lowStockError: Error | null;
  refetchLowStock: () => void;

  // ──── Query state (detail) ────
  inventoryDetail: Inventory | undefined;
  isLoadingDetail: boolean;
  isErrorDetail: boolean;
  detailError: Error | null;

  // ──── Mutation — adjust stock ────
  adjustStock: (productId: number, adjustment: StockAdjustment) => void;
  isAdjusting: boolean;
  adjustError: Error | null;
  isAdjustError: boolean;

  // ──── Store state (UI) ────
  selectedInventoryId: number | null;
  selectInventory: (id: number) => void;
  isAdjustDialogOpen: boolean;
  adjustDialogProductId: number | null;
  openAdjustDialog: (productId: number) => void;
  closeAdjustDialog: () => void;
}

// ──── Hook ────

/**
 * WHAT: Hook principal de inventario — expone estado, queries y mutation.
 *
 * Uso en screens:
 * ```
 * const {
 *   lowStockItems,
 *   inventoryDetail,
 *   adjustStock, isAdjusting,
 *   selectedInventoryId, selectInventory,
 *   isAdjustDialogOpen, openAdjustDialog, closeAdjustDialog,
 * } = useInventory({ inventoryRepository });
 * ```
 */
export function useInventory({
  inventoryRepository,
}: UseInventoryDeps): UseInventoryReturn {
  const queryClient = useQueryClient();
  const store = useInventoryStore();

  // ═══════════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════════

  /**
   * WHAT: Query para obtener productos con stock bajo.
   * WHY: Se ejecuta al montar el hook. staleTime de 2 minutos
   *      evita refetches innecesarios en navegaciones rápidas.
   */
  const {
    data: lowStockItems = [],
    isLoading: isLoadingLowStock,
    isError: isErrorLowStock,
    error: lowStockError,
    refetch: refetchLowStock,
  } = useQuery({
    queryKey: queryKeys.inventory.lowStock(),
    queryFn: () => inventoryRepository.getLowStock(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  /**
   * WHAT: Query para obtener el detalle de inventario de un producto.
   * WHY: Solo se ejecuta cuando selectedInventoryId no es null (enabled).
   *      El hook reacciona al ID del store automáticamente.
   */
  const {
    data: inventoryDetail,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    error: detailError,
  } = useQuery({
    queryKey: queryKeys.inventory.detail(store.selectedInventoryId ?? 0),
    queryFn: () => {
      if (store.selectedInventoryId === null) {
        return Promise.reject(new Error('No inventory selected'));
      }
      return inventoryRepository.getByProductId(store.selectedInventoryId);
    },
    enabled: store.selectedInventoryId !== null,
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATIONS — Adjust stock
  // ═══════════════════════════════════════════════════════════════

  const adjustMutation = useMutation({
    mutationFn: ({
      productId,
      adjustment,
    }: {
      productId: number;
      adjustment: StockAdjustment;
    }) => inventoryRepository.adjustStock(productId, adjustment),

    onMutate: async ({ productId, adjustment }) => {
      // Cancelar queries en vuelo para evitar sobrescritura
      await queryClient.cancelQueries({
        queryKey: queryKeys.inventory.detail(productId),
      });

      // Snapshot del estado actual del caché de detalle
      const previousDetail = queryClient.getQueryData<Inventory>(
        queryKeys.inventory.detail(productId),
      );

      // Optimistic update: actualizar currentStock en caché inmediatamente
      if (previousDetail) {
        const signedQuantity =
          adjustment.type === 'DECREMENT'
            ? -adjustment.quantity
            : adjustment.quantity;

        queryClient.setQueryData<Inventory>(
          queryKeys.inventory.detail(productId),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              currentStock: old.currentStock + signedQuantity,
            };
          },
        );
      }

      return { previousDetail };
    },

    onError: (_err, { productId }, context) => {
      // Rollback: restaurar el snapshot del caché de detalle
      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.inventory.detail(productId),
          context.previousDetail,
        );
      }
    },

    onSettled: (_data, _error, { productId }) => {
      // Invalidar queries afectadas para refetch con datos reales del backend
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.lowStock(),
      });
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATION WRAPPER — callback estable con useCallback
  // ═══════════════════════════════════════════════════════════════

  const adjustStock = useCallback(
    (productId: number, adjustment: StockAdjustment) => {
      adjustMutation.mutate({ productId, adjustment });
    },
    [adjustMutation],
  );

  // ═══════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════

  return {
    // ──── Query state (low stock) ────
    lowStockItems,
    isLoadingLowStock,
    isErrorLowStock,
    lowStockError: (lowStockError as Error) ?? null,
    refetchLowStock: refetchLowStock as () => void,

    // ──── Query state (detail) ────
    inventoryDetail,
    isLoadingDetail,
    isErrorDetail,
    detailError: (detailError as Error) ?? null,

    // ──── Mutation ────
    adjustStock,
    isAdjusting: adjustMutation.isPending,
    adjustError: (adjustMutation.error as Error) ?? null,
    isAdjustError: adjustMutation.isError,

    // ──── Store state (UI) ────
    selectedInventoryId: store.selectedInventoryId,
    selectInventory: store.selectInventory,
    isAdjustDialogOpen: store.isAdjustDialogOpen,
    adjustDialogProductId: store.adjustDialogProductId,
    openAdjustDialog: store.openAdjustDialog,
    closeAdjustDialog: store.closeAdjustDialog,
  };
}
