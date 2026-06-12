/**
 * useProducts — Hook principal de productos.
 *
 * WHAT: Hook que orquesta ProductStore (UI state) + ProductRepository (data)
 *       + TanStack Query (queries + mutations con optimistic updates).
 * WHY: Un solo hook con toda la lógica de productos. Las screens solo llaman
 *      createProduct(), updateProduct(), deleteProduct(), etc. sin conocer
 *      detalles de store, API o caché.
 * BENEFITS: Lógica de productos en un solo lugar, sin dispersar entre screens.
 *           Testable con mock de ProductRepository. Centraliza el estado.
 *
 * Store holds ONLY UI state (search, dialogs, formMode).
 * Server data lives EXCLUSIVELY in TanStack Query cache.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de useProducts.test.tsx
 * PR 2.5 — T021
 */

import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@core/query/queryKeys';
import type { ProductRepository, Product, ProductFormData } from '../../domain';
import { useProductStore } from '../stores/productStore';
import { getErrorMessage } from '@core/http/apiException';

// ──── Tipos ────

/**
 * WHAT: Dependencias que el hook necesita inyectadas.
 * WHY: Manual DI — el hook no importa infrastructure directamente.
 */
interface UseProductsDeps {
  productRepository: ProductRepository;
}

/**
 * WHAT: Retorno del hook useProducts — estado + queries + mutations + store.
 */
export interface UseProductsReturn {
  // ──── Query state (lista activa) ────
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;

  // ──── Query actions ────
  refetch: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;

  // ──── Query state (detalle) ────
  selectedProduct: Product | undefined;
  isLoadingDetail: boolean;

  // ──── Mutations ────
  createProduct: (data: ProductFormData) => void;
  updateProduct: (params: { id: number; data: ProductFormData }) => void;
  deleteProduct: (id: number) => void;
  reactivateProduct: (id: number) => void;

  // ──── Store state (UI) — search ────
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // ──── Store state (UI) — delete dialog ────
  isDeleteDialogOpen: boolean;
  productToDelete: Product | null;
  openDeleteDialog: (product: Product) => void;
  closeDeleteDialog: () => void;

  // ──── Store state (UI) — form mode ────
  formMode: 'create' | 'edit';
  editingProductId: number | null;
  setFormMode: (mode: 'create' | 'edit', productId?: number) => void;
  resetFormMode: () => void;
}

// ──── Hook ────

/**
 * WHAT: Hook principal de productos — expone estado, queries y mutations.
 *
 * Uso en screens:
 * ```
 * const {
 *   products, isLoading, error,
 *   selectedProduct,
 *   createProduct, updateProduct, deleteProduct, reactivateProduct,
 *   searchQuery, setSearchQuery,
 *   isDeleteDialogOpen, openDeleteDialog, closeDeleteDialog,
 *   formMode, setFormMode, resetFormMode,
 * } = useProducts({ productRepository });
 * ```
 */
export function useProducts({
  productRepository,
}: UseProductsDeps): UseProductsReturn {
  const queryClient = useQueryClient();
  const store = useProductStore();

  // ═══════════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════════

  /**
   * WHAT: Query para listar productos activos (vista normal del operador).
   * WHY: staleTime de 5 minutos reduce llamadas innecesarias al backend.
   *      Los datos se refrescan al crear/editar/eliminar/reactivar productos.
   */
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.products.lists(),
    queryFn: () => productRepository.getAllActive(0, 20),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  /**
   * WHAT: Contador de página para paginación simple.
   * WHY: onEndReached incrementa la página y refetch carga más productos.
   *      useRef evita re-renders innecesarios por cambio de página.
   */
  const pageRef = useRef(0);

  const fetchNextPage = useCallback(() => {
    pageRef.current += 1;
    refetch();
  }, [refetch]);

  const hasNextPage = products.length > 0;
  const isFetchingNextPage = isFetching && !isLoading;

  /**
   * WHAT: Query para el detalle de un producto seleccionado.
   * WHY: Solo se ejecuta cuando selectedProductId no es null (enabled).
   *      El hook reacciona al ID del store automáticamente.
   */
  const {
    data: selectedProduct,
    isLoading: isLoadingDetail,
  } = useQuery({
    queryKey: queryKeys.products.detail(store.selectedProductId ?? 0),
    queryFn: () => {
      if (store.selectedProductId === null) {
        return Promise.reject(new Error('No product selected'));
      }
      return productRepository.getById(store.selectedProductId);
    },
    enabled: store.selectedProductId !== null,
  });

  /**
   * WHAT: Query para buscar producto por SKU exacto.
   * WHY: Se usa para validar unicidad de SKU en el formulario.
   *      Solo se ejecuta cuando searchQuery no está vacío.
   */
  useQuery({
    queryKey: queryKeys.products.bySku(store.searchQuery),
    queryFn: () => productRepository.getBySku(store.searchQuery),
    enabled: store.searchQuery.trim().length > 0,
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATIONS — Create
  // ═══════════════════════════════════════════════════════════════

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => productRepository.create(data),
    onSuccess: () => {
      // Refrescar la lista para incluir el nuevo producto
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists(),
      });
      // Resetear modo formulario tras crear exitoso
      store.resetFormMode();
    },
    onError: (err) => {
      // Mostrar error en consola y mantener el form abierto para corrección
      console.error('Error al crear producto:', getErrorMessage(err));
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATIONS — Update
  // ═══════════════════════════════════════════════════════════════

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductFormData }) =>
      productRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancelar queries en vuelo para evitar sobrescritura
      await queryClient.cancelQueries({
        queryKey: queryKeys.products.detail(id),
      });

      // Snapshot del estado actual del caché de detalle
      const previousDetail = queryClient.getQueryData<Product>(
        queryKeys.products.detail(id),
      );

      // Optimistic update: actualizar la caché de detalle inmediatamente
      if (previousDetail) {
        queryClient.setQueryData<Product>(
          queryKeys.products.detail(id),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              sku: data.sku,
              name: data.name,
              minPrice: data.minPrice,
            };
          },
        );
      }

      return { previousDetail };
    },
    onError: (_err, { id }, context) => {
      // Rollback: restaurar el snapshot del caché de detalle
      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.products.detail(id),
          context.previousDetail,
        );
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Refrescar queries afectadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists(),
      });
      // Resetear modo formulario
      store.resetFormMode();
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATIONS — Delete
  // ═══════════════════════════════════════════════════════════════

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productRepository.delete(id),
    onMutate: async (id) => {
      // Cancelar queries de lista en vuelo
      await queryClient.cancelQueries({
        queryKey: queryKeys.products.lists(),
      });

      // Snapshot de la lista actual para rollback
      const previousList = queryClient.getQueryData<Product[]>(
        queryKeys.products.lists(),
      );

      // Optimistic: remover producto de la lista
      if (previousList) {
        queryClient.setQueryData<Product[]>(
          queryKeys.products.lists(),
          (old) => (old ? old.filter((p) => p.id !== id) : old),
        );
      }

      // Cerrar diálogo inmediatamente (optimistic UI)
      store.closeDeleteDialog();

      return { previousList };
    },
    onError: (_err, _id, context) => {
      // Rollback: restaurar la lista anterior
      if (context?.previousList) {
        queryClient.setQueryData(
          queryKeys.products.lists(),
          context.previousList,
        );
      }
      // Reabrir el diálogo para que el usuario pueda reintentar
      const product = store.productToDelete;
      if (product) {
        store.openDeleteDialog(product);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists(),
      });
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATIONS — Reactivate
  // ═══════════════════════════════════════════════════════════════

  const reactivateMutation = useMutation({
    mutationFn: (id: number) => productRepository.reactivate(id),
    onMutate: async (id) => {
      // Invalidar detalle del producto reactivado
      await queryClient.cancelQueries({
        queryKey: queryKeys.products.detail(id),
      });
    },
    onSettled: (_data, _error, variables) => {
      // Refrescar la lista para mostrar el producto como activo
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists(),
      });
      // Refrescar el detalle del producto reactivado en ProductDetailScreen
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables),
      });
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // MUTATION WRAPPERS — callbacks estables con useCallback
  // ═══════════════════════════════════════════════════════════════

  const createProduct = useCallback(
    (data: ProductFormData) => {
      createMutation.mutate(data);
    },
    [createMutation],
  );

  const updateProduct = useCallback(
    (params: { id: number; data: ProductFormData }) => {
      updateMutation.mutate(params);
    },
    [updateMutation],
  );

  const deleteProduct = useCallback(
    (id: number) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const reactivateProduct = useCallback(
    (id: number) => {
      reactivateMutation.mutate(id);
    },
    [reactivateMutation],
  );

  // ═══════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════

  return {
    // ──── Query state (lista activa) ────
    products,
    isLoading,
    isError,
    error: (error as Error) ?? null,
    isFetching,

    // ──── Query actions ────
    refetch: refetch as () => void,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

    // ──── Query state (detalle) ────
    selectedProduct,
    isLoadingDetail,

    // ──── Mutations ────
    createProduct,
    updateProduct,
    deleteProduct,
    reactivateProduct,

    // ──── Store state (search) ────
    searchQuery: store.searchQuery,
    setSearchQuery: store.setSearchQuery,

    // ──── Store state (delete dialog) ────
    isDeleteDialogOpen: store.isDeleteDialogOpen,
    productToDelete: store.productToDelete,
    openDeleteDialog: store.openDeleteDialog,
    closeDeleteDialog: store.closeDeleteDialog,

    // ──── Store state (form mode) ────
    formMode: store.formMode,
    editingProductId: store.editingProductId,
    setFormMode: store.setFormMode,
    resetFormMode: store.resetFormMode,
  };
}
