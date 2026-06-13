/**
 * InventoryListScreen — Pantalla de productos con stock bajo.
 *
 * WHAT: Pantalla principal de inventario que muestra una FlatList de productos
 *       con stock bajo, cada uno con WarningBadge coloreado según nivel de stock.
 *       Pull-to-refresh dispara SyncService.drain() + refetch. Estados:
 *       loading (LoadingIndicator), empty ("No hay productos con stock bajo"),
 *       error (ErrorBanner con Reintentar).
 * WHY: Punto de entrada del operador al inventario. Renderiza productos con
 *      stock por debajo del umbral mínimo, facilitando la gestión de reposición.
 *      Pull-to-refresh como fallback manual de sincronización offline (R18).
 * BENEFITS: Una sola pantalla concentra listado, sync y navegación a detalle.
 *           Patrón idéntico a ProductsListScreen para consistencia del equipo.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de InventoryListScreen.test.tsx
 * PR 3.4 — 3.4.4
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@core/navigation/types';

import { BrandedAppBar } from '@core/components/BrandedAppBar';
import { LoadingIndicator } from '@core/components/LoadingIndicator';
import { ErrorBanner } from '@core/components/ErrorBanner';
import { WarningBadge } from '../components/WarningBadge';
import { useInventory } from '../hooks/useInventory';
import type { UseInventoryReturn } from '../hooks/useInventory';
import type { Inventory } from '../../domain';

import { createApiClient } from '@core/http';
import { InventoryApi } from '@features/inventory/infrastructure/api';
import { InventoryRepositoryAdapter } from '@features/inventory/infrastructure/adapters';
import { SyncService } from '@core/sync/SyncService';

import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';

// ──── Navigation Type ─────────────────────────────────────────────────

type InventoryListNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'InventoryList'
>;

// ──── Constants ───────────────────────────────────────────────────────

const ITEM_HEIGHT = 72;

// ──── Component ───────────────────────────────────────────────────────

/**
 * WHAT: Pantalla InventoryListScreen — listado de productos con stock bajo.
 *
 * Estados:
 * - Loading: LoadingIndicator mientras carga la data inicial.
 * - Empty: "No hay productos con stock bajo" si la lista está vacía.
 * - Error: ErrorBanner con botón Reintentar si la query falló.
 * - Data: FlatList con los productos, cada uno con WarningBadge.
 *
 * Pull-to-refresh: refetch + SyncService.drain() (sincronización manual R18).
 */
export function InventoryListScreen() {
  const navigation = useNavigation<InventoryListNavigationProp>();

  // ═══════════════════════════════════════════════════════════════
  // Composition root — instancia real del repositorio (mismo patrón que ProductsListScreen)
  // ═══════════════════════════════════════════════════════════════

  const inventoryRepository = useMemo(() => {
    const client = createApiClient();
    const api = new InventoryApi(client);
    return new InventoryRepositoryAdapter(api);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Hook — orquesta store, queries y mutations
  // ═══════════════════════════════════════════════════════════════

  const {
    lowStockItems,
    isLoadingLowStock,
    isErrorLowStock,
    lowStockError,
    refetchLowStock,
    selectInventory,
  }: UseInventoryReturn = useInventory({ inventoryRepository });

  // ═══════════════════════════════════════════════════════════════
  // Callbacks estables — useCallback para FlatList
  // ═══════════════════════════════════════════════════════════════

  /**
   * WHAT: Navega a InventoryDetailScreen con el productId del item presionado.
   * WHY: El productId se pasa como parámetro de ruta. La pantalla de detalle
   *      hace fetch del inventario completo vía TanStack Query (useInventory).
   *      Además, actualiza el store para que el hook cargue el detalle.
   */
  const handlePressItem = useCallback(
    (item: Inventory) => {
      selectInventory(item.productId);
      // React Navigation v7 strict types — same pattern as ProductsListScreen.
      (navigation.navigate as (options: {
        name: string;
        params?: object;
        merge?: boolean;
      }) => void)({
        name: 'InventoryDetail',
        params: { productId: item.productId },
      });
    },
    [navigation, selectInventory],
  );

  /**
   * WHAT: Pull-to-refresh: dispara drenado de cola offline (fire-and-forget)
   *       y refetch inmediato de datos del servidor.
   * WHY: R18 — sincronización manual como fallback si NetInfo no detectó
   *      reconexión. Drain es fire-and-forget para que el usuario vea
   *      datos frescos sin esperar a que termine la sincronización.
   *      SyncService es un singleton inicializado al arrancar la app.
   */
  const handleRefresh = useCallback(() => {
    try {
      // Acceder a la instancia singleton de SyncService.
      // En producción está inicializada al arrancar la app.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const syncInstance = (SyncService as Record<string, any>).instance;
      if (syncInstance?.drain) {
        syncInstance.drain(); // fire-and-forget — corre async en background
      }
    } catch {
      // SyncService no inicializado — ignorar
    }
    refetchLowStock();
  }, [refetchLowStock]);

  // ═══════════════════════════════════════════════════════════════
  // Render helpers — funciones puras que devuelven JSX condicional
  // ═══════════════════════════════════════════════════════════════

  /**
   * WHAT: Renderiza un item de la lista con nombre, stock y WarningBadge.
   * WHY: Extraído como función estable para evitar re-creación en cada render.
   */
  const renderItem = useCallback(
    ({ item }: { item: Inventory }) => (
      <Pressable
        style={styles.item}
        onPress={() => handlePressItem(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.productName}, stock ${item.currentStock}`}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.productName}
          </Text>
          <Text style={styles.itemStock}>
            Stock: {item.currentStock} / {item.minStockThreshold}
          </Text>
        </View>
        <WarningBadge stock={item.currentStock} />
      </Pressable>
    ),
    [handlePressItem],
  );

  const keyExtractor = useCallback(
    (item: Inventory) => item.productId.toString(),
    [],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  /**
   * WHAT: Estado vacío — se muestra cuando no hay productos con stock bajo.
   * WHY: UX clara: el usuario sabe que no hay acción requerida.
   */
  const renderEmpty = useCallback(() => {
    if (isLoadingLowStock) return null;
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No hay productos con stock bajo</Text>
      </View>
    );
  }, [isLoadingLowStock]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* AppBar corporativa */}
      <BrandedAppBar title="Inventario" />

      {/* Loading state — solo durante carga inicial */}
      {isLoadingLowStock && lowStockItems.length === 0 && (
        <View style={styles.centered}>
          <LoadingIndicator message="Cargando inventario..." />
        </View>
      )}

      {/* Error state */}
      {isErrorLowStock && !isLoadingLowStock && (
        <View style={styles.errorContainer}>
          <ErrorBanner
            message={lowStockError?.message || 'Error al cargar inventario'}
            onRetry={() => refetchLowStock()}
          />
        </View>
      )}

      {/* Inventory list — solo si no está en loading inicial y hay datos */}
      {!isLoadingLowStock && !isErrorLowStock && (
        <FlatList
          testID="inventory-flatlist"
          data={lowStockItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onRefresh={handleRefresh}
          refreshing={false}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            lowStockItems.length === 0 ? styles.centered : undefined
          }
          getItemLayout={(_data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
        />
      )}
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ITEM_HEIGHT,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  itemStock: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
