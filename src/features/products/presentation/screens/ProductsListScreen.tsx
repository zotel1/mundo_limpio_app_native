/**
 * WHAT: Pantalla principal de listado de productos con búsqueda local,
 *       paginación, pull-to-refresh y flujo de eliminación.
 * WHY: Punto de entrada del operador al catálogo de productos. Integra
 *      SearchBar para filtrado client-side (spec R2), SwipeableProductItem
 *      para cada fila, y FlatList con paginación y refresh.
 *      El flujo de eliminación usa onLongPress + Alert.alert (spec R6).
 * BENEFITS: Una sola pantalla concentra: listado, búsqueda, eliminación,
 *           navegación a detalle/formulario. Sin dependencia de FlashList
 *           (usa FlatList nativo). Sin gesture-handler (usa onLongPress).
 *
 * TDD: GREEN — implementación mínima para pasar los tests RED.
 * PR 2.7 — T028
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@core/navigation/types';

import { BrandedAppBar } from '@core/components/BrandedAppBar';
import { LoadingIndicator } from '@core/components/LoadingIndicator';
import { ErrorBanner } from '@core/components/ErrorBanner';
import { SearchBar } from '../components/SearchBar';
import { SwipeableProductItem } from '../components/SwipeableProductItem';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../../domain';

import { createApiClient } from '@core/http';
import { ProductApi } from '@features/products/infrastructure/api';
import { ProductRepositoryAdapter } from '@features/products/infrastructure/adapters';

import { useAuthStore } from '@features/auth/presentation/stores/authStore';

import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';

// ──── Navigation Type ─────────────────────────────────────────────────

type ProductsListNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProductsList'
>;

// ──── Constants ───────────────────────────────────────────────────────

const ITEM_HEIGHT = 64;
const SEPARATOR_HEIGHT = StyleSheet.hairlineWidth;

/**
 * WHAT: Renderiza un item de la lista usando SwipeableProductItem.
 * WHY: Extraído como función estable para evitar re-creación en cada render
 *      del FlatList. Usa useCallback para estabilidad de referencia.
 */

// ──── Component ───────────────────────────────────────────────────────

/**
 * WHAT: Pantalla ProductsListScreen — listado principal de productos.
 *
 * Estados:
 * - Loading: LoadingIndicator mientras carga la data inicial.
 * - Empty: "No se encontraron productos" centrado si la lista está vacía.
 * - Error: ErrorBanner con botón Reintentar si la query falló.
 * - Data: FlatList con los productos filtrados.
 *
 * Flujo de eliminación:
 * - Long press sobre un item → openDeleteDialog(product) → Alert.alert
 * - Confirmar → deleteProduct(product.id)
 * - Cancelar → closeDeleteDialog()
 */
export function ProductsListScreen() {
  const navigation = useNavigation<ProductsListNavigationProp>();

  // ═══════════════════════════════════════════════════════════════
  // Auth roles — toggle showAll solo visible para admin/stock_manager
  // Selector retorna boolean (primitivo) para evitar infinite loop
  // que causa selectRoles con ?? [] (nueva referencia en cada lectura).
  // ═══════════════════════════════════════════════════════════════
  const canToggleShowAll = useAuthStore((state) => {
    const roles = state.session?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('STOCK_MANAGER');
  });

  // ═══════════════════════════════════════════════════════════════
  // Composition root — instancia real del repositorio (Fix C1)
  // Mismo patrón que LoginScreen: crea dependencias inline.
  // ═══════════════════════════════════════════════════════════════
  const productRepository = React.useMemo(() => {
    const client = createApiClient();
    const api = new ProductApi(client);
    return new ProductRepositoryAdapter(api);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Hook — orquesta store, queries y mutations
  // ═══════════════════════════════════════════════════════════════
  const {
    products,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    searchQuery,
    setSearchQuery,
    showAll,
    toggleShowAll,
    openDeleteDialog,
    closeDeleteDialog,
    deleteProduct,
  } = useProducts({
    productRepository,
  });

  // ═══════════════════════════════════════════════════════════════
  // Búsqueda local — filtrado client-side por nombre y SKU
  // ═══════════════════════════════════════════════════════════════

  /**
   * WHAT: Filtra productos por nombre o SKU de forma case-insensitive.
   * WHY: Spec R2 requiere búsqueda local sin llamadas HTTP. useMemo evita
   *      re-filtrar en cada render — solo recalcula cuando products o
   *      searchQuery cambian.
   * BENEFITS: Búsqueda instantánea, cero tráfico de red por keystroke.
   */
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    const query = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query),
    );
  }, [products, searchQuery]);

  // ═══════════════════════════════════════════════════════════════
  // Callbacks estables — useCallback para FlatList
  // ═══════════════════════════════════════════════════════════════

  /**
   * WHAT: Navega a ProductDetailScreen con el ID del producto.
   * WHY: El ID se pasa como parámetro de ruta. La pantalla de detalle
   *      hace fetch del producto completo vía TanStack Query.
   */
  const handlePressItem = useCallback(
    (product: Product) => {
      // React Navigation v7 strict types — same pattern as HomeScreen.
      (navigation.navigate as (options: {
        name: string;
        params?: object;
        merge?: boolean;
      }) => void)({
        name: 'ProductDetail',
        params: { productId: product.id },
      });
    },
    [navigation],
  );

  /**
   * WHAT: Abre diálogo de confirmación para eliminar un producto.
   * WHY: Dos pasos: openDeleteDialog guarda el producto en el store,
   *      luego Alert.alert muestra la confirmación nativa.
   *      El usuario confirma → deleteProduct, cancela → closeDeleteDialog.
   */
  const handleDeleteItem = useCallback(
    (product: Product) => {
      openDeleteDialog(product);

      Alert.alert(
        '¿Eliminar producto?',
        `¿Estás seguro de eliminar "${product.name}"?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => closeDeleteDialog(),
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => deleteProduct(product.id),
          },
        ],
      );
    },
    [openDeleteDialog, closeDeleteDialog, deleteProduct],
  );

  /**
   * WHAT: Navega a ProductFormScreen en modo creación (sin params).
   * WHY: Sin productId → el formulario arranca vacío (modo create).
   */
  const handleFABPress = useCallback(() => {
    // React Navigation v7 tiene overloads estrictos — usamos cast para
    // rutas con params opcionales (mismo patrón que HomeScreen).
    (navigation.navigate as (options: {
      name: string;
      params?: object;
      merge?: boolean;
    }) => void)({ name: 'ProductForm' });
  }, [navigation]);

  /**
   * WHAT: Carga la siguiente página de productos al llegar al final de la lista.
   * WHY: Paginación infinita — el usuario scrollea y se cargan más productos
   *      automáticamente sin paginación explícita.
   */
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ═══════════════════════════════════════════════════════════════
  // Render helpers — funciones puras que devuelven JSX condicional
  // ═══════════════════════════════════════════════════════════════

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <SwipeableProductItem
        product={item}
        onPress={() => handlePressItem(item)}
        onDelete={() => handleDeleteItem(item)}
      />
    ),
    [handlePressItem, handleDeleteItem],
  );

  const keyExtractor = useCallback(
    (item: Product) => item.id.toString(),
    [],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <LoadingIndicator size="small" />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No se encontraron productos</Text>
      </View>
    );
  }, [isLoading]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* AppBar corporativa */}
      <BrandedAppBar title="Productos" />

      {/* Barra de búsqueda */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar por nombre o SKU..."
      />

      {/* Toggle showAll — solo visible para admin/stock_manager */}
      {canToggleShowAll && (
        <View style={styles.toggleContainer}>
          <Pressable
            style={[
              styles.toggleButton,
              showAll && styles.toggleButtonActive,
            ]}
            onPress={toggleShowAll}
            accessibilityRole="switch"
            accessibilityLabel={
              showAll ? 'Mostrando todos los productos' : 'Mostrando solo activos'
            }
            accessibilityState={{ checked: showAll }}
          >
            <Text
              style={[
                styles.toggleText,
                showAll && styles.toggleTextActive,
              ]}
            >
              {showAll ? 'Ver todos' : 'Solo activos'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Loading state — solo durante carga inicial */}
      {isLoading && products.length === 0 && (
        <View style={styles.centered}>
          <LoadingIndicator message="Cargando productos..." />
        </View>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <View style={styles.errorContainer}>
          <ErrorBanner
            message={error?.message || 'Error al cargar productos'}
            onRetry={() => refetch()}
          />
        </View>
      )}

      {/* Product list — solo si no está en loading inicial y hay datos */}
      {!isLoading && !isError && (
        <FlatList
          testID="products-flatlist"
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          onRefresh={refetch}
          refreshing={isFetching}
          ItemSeparatorComponent={renderSeparator}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            filteredProducts.length === 0 ? styles.centered : undefined
          }
          getItemLayout={(_data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
        />
      )}

      {/* FAB — crear producto */}
      <Pressable
        style={styles.fab}
        onPress={handleFABPress}
        accessibilityRole="button"
        accessibilityLabel="Crear producto"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// ──── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorContainer: {
    padding: spacing.md,
  },
  separator: {
    height: SEPARATOR_HEIGHT,
    backgroundColor: colors.border,
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  fabText: {
    fontSize: 28,
    color: colors.textOnPrimary,
    lineHeight: 30,
    fontWeight: '300',
  },

  // ── Toggle showAll ──────────────────────────────────────────────
  toggleContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.textOnPrimary,
  },
});
