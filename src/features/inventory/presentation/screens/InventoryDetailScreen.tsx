/**
 * InventoryDetailScreen — Pantalla de detalle de inventario.
 *
 * WHAT: Pantalla que muestra el detalle de inventario de un producto:
 *       nombre, stock actual, StockIndicator coloreado, y botón Ajustar Stock
 *       (role-gated: solo ADMIN/STOCK_MANAGER). Estados: loading, error/404,
 *       data. Recibe `productId` vía route params de React Navigation.
 * WHY: Vista individual de inventario accesible desde InventoryListScreen.
 *      Centraliza la navegación a ajuste de stock según rol del usuario.
 * BENEFITS: Una sola pantalla concentra detalle, estado visual y role-gating.
 *           Patrón idéntico a ProductDetailScreen para consistencia del equipo.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de
 *      InventoryDetailScreen.test.tsx
 * PR 3.5a — 3.5a.4
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from '@core/navigation/types';
import { BrandedAppBar } from '@core/components/BrandedAppBar';
import { LoadingIndicator } from '@core/components/LoadingIndicator';
import { ErrorBanner } from '@core/components/ErrorBanner';
import { StockIndicator } from '../components/StockIndicator';
import { useInventory } from '../hooks/useInventory';
import type { UseInventoryReturn } from '../hooks/useInventory';

import { createApiClient } from '@core/http';
import { InventoryApi } from '@features/inventory/infrastructure/api';
import { InventoryRepositoryAdapter } from '@features/inventory/infrastructure/adapters';

import {
  useAuthStore,
  selectRoles,
} from '@features/auth/presentation/stores/authStore';

import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';

// ──── Route Type ──────────────────────────────────────────────────────

type InventoryDetailRouteProp = RouteProp<
  RootStackParamList,
  'InventoryDetail'
>;

// ──── Helpers ─────────────────────────────────────────────────────────

/**
 * WHAT: Helper para renderizar la card con la información del inventario.
 * WHY: Extraído a función local para legibilidad — separa la lógica
 *      de renderizado de la card del JSX principal de la pantalla.
 */
function InventoryInfoCard({
  productName,
  currentStock,
  minStockThreshold,
}: {
  productName: string;
  currentStock: number;
  minStockThreshold: number;
}) {
  return (
    <View style={styles.card} testID="inventory-info-card">
      <Text style={styles.productName}>{productName}</Text>

      <Text style={styles.stockLabel}>
        Stock actual: {currentStock} / {minStockThreshold}
      </Text>

      <StockIndicator
        current={currentStock}
        min={0}
        max={minStockThreshold}
      />
    </View>
  );
}

// ──── Screen ──────────────────────────────────────────────────────────

/**
 * WHAT: Pantalla InventoryDetailScreen — detalle completo del inventario.
 *
 * Estados:
 * - Loading: LoadingIndicator mientras isLoadingDetail=true.
 * - Error/404: "Producto no encontrado" con botón Volver a lista.
 * - Error genérico: ErrorBanner con mensaje y botón Reintentar.
 * - Data: Card con nombre, stock actual, StockIndicator, botón Ajustar Stock.
 *
 * Role gating:
 * - ADMIN / STOCK_MANAGER: botón "Ajustar Stock" visible.
 * - Otros roles: botón oculto (no renderizado, no solo disabled).
 *
 * Flujo de ajuste:
 * - Presionar "Ajustar Stock" → openAdjustDialog(productId) vía store.
 * - El AdjustDialog se renderiza como parte de InventoryDetailScreen (PR 3.5b).
 */
export function InventoryDetailScreen() {
  const route = useRoute<InventoryDetailRouteProp>();
  const navigation = useNavigation();
  const { productId } = route.params;

  // ──── Composition root — instancia real del repositorio ───────────
  const inventoryRepository = useMemo(() => {
    const client = createApiClient();
    const api = new InventoryApi(client);
    return new InventoryRepositoryAdapter(api);
  }, []);

  // ──── Hook: orquesta store, queries y mutations ──────────────────
  const {
    inventoryDetail,
    isLoadingDetail,
    isErrorDetail,
    detailError,
    selectInventory,
    openAdjustDialog,
  }: UseInventoryReturn = useInventory({ inventoryRepository });

  // ──── Seleccionar inventario al montar ───────────────────────────
  useEffect(() => {
    selectInventory(productId);
  }, [productId, selectInventory]);

  // ──── Role gating ────────────────────────────────────────────────
  const roles = useAuthStore(selectRoles);
  const canAdjust =
    roles.includes('ADMIN') || roles.includes('STOCK_MANAGER');

  // ──── Handlers ───────────────────────────────────────────────────

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAdjust = useCallback(() => {
    openAdjustDialog(productId);
  }, [openAdjustDialog, productId]);

  // ──── Render ─────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* AppBar corporativa — back button auto desde React Navigation stack */}
      <BrandedAppBar title="Detalle de Inventario" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Loading state */}
        {isLoadingDetail && (
          <View style={styles.centered}>
            <LoadingIndicator message="Cargando inventario..." />
          </View>
        )}

        {/* Error/404 state */}
        {isErrorDetail && !isLoadingDetail && (
          <View style={styles.errorContainer}>
            <ErrorBanner
              message={detailError?.message || 'Error al cargar el inventario'}
              onRetry={() => selectInventory(productId)}
            />
            {/* 404 specific: back button */}
            {detailError?.message?.includes('no encontrado') && (
              <Pressable
                style={styles.backButton}
                onPress={handleGoBack}
                accessibilityRole="button"
                accessibilityLabel="Volver a la lista"
              >
                <Text style={styles.backButtonText}>Volver a la lista</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Data state */}
        {inventoryDetail && !isLoadingDetail && (
          <>
            <InventoryInfoCard
              productName={inventoryDetail.productName}
              currentStock={inventoryDetail.currentStock}
              minStockThreshold={inventoryDetail.minStockThreshold}
            />

            {/* Acciones — role-gated */}
            <View style={styles.actions}>
              {canAdjust && (
                <Pressable
                  testID="adjust-stock-button"
                  style={styles.adjustButton}
                  onPress={handleAdjust}
                  accessibilityRole="button"
                  accessibilityLabel="Ajustar stock"
                >
                  <Text style={styles.adjustButtonText}>Ajustar Stock</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ──── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },

  // ── Card ────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stockLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  // ── Actions ─────────────────────────────────────────────────────
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  adjustButton: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    ...typography.button,
    fontSize: 16,
    color: colors.textOnPrimary,
  },

  // ── Error ───────────────────────────────────────────────────────
  errorContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
