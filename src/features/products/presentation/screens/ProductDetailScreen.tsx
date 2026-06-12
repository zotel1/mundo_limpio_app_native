/**
 * WHAT: Pantalla de detalle de producto con info completa y acciones
 *       (editar, eliminar, reactivar). Integra useProducts para fetch
 *       del detalle vía TanStack Query y mutations para delete/reactivate.
 * WHY: Vista individual de producto accesible desde ProductsListScreen.
 *      Centraliza el flujo de eliminación con confirmación Alert nativa
 *      y el flujo de reactivación con actualización automática del detalle.
 * BENEFITS: Toda la lógica de detalle en una pantalla. Estados visuales
 *           consistentes (loading, error, data). Acciones contextuales
 *           según estado activo/inactivo del producto.
 *
 * TDD: GREEN — implementación mínima para pasar los tests RED.
 * PR 2.8 — T030
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from '@core/navigation/types';
import { BrandedAppBar } from '@core/components/BrandedAppBar';
import { LoadingIndicator } from '@core/components/LoadingIndicator';
import { ErrorBanner } from '@core/components/ErrorBanner';
import { useProducts } from '../hooks/useProducts';
import { useProductStore } from '../stores/productStore';
import type { Product } from '../../domain';

import { createApiClient } from '@core/http';
import { ProductApi } from '@features/products/infrastructure/api';
import { ProductRepositoryAdapter } from '@features/products/infrastructure/adapters';

import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';

// ──── Route Type ──────────────────────────────────────────────────────

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

// ──── Helpers ─────────────────────────────────────────────────────────

/**
 * WHAT: Formatea un número como moneda con dos decimales.
 * WHY: Consistencia en toda la app — siempre $X.XX. Sin formateo inline
 *      disperso en cada pantalla.
 */
function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * WHAT: Renderiza el badge de estado del producto.
 * WHY: Verde = Activo, Rojo/Gris = Inactivo. Extraído a componente
 *      local para legibilidad y evitar duplicación de estilos.
 */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        active ? styles.badgeActive : styles.badgeInactive,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          active ? styles.badgeTextActive : styles.badgeTextInactive,
        ]}
      >
        {active ? 'Activo' : 'Inactivo'}
      </Text>
    </View>
  );
}

/**
 * WHAT: Renderiza una fila de label + valor para los campos del producto.
 * WHY: Patrón repetitivo — label en gris arriba, valor en negro abajo.
 *      Componente local evita duplicar JSX en cada campo.
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

/**
 * WHAT: Renderiza una tarjeta de información del producto con todos sus campos.
 * WHY: Encapsula el layout de la card de detalle. Recibe el producto
 *      tipado y renderiza ID, SKU, Nombre, Precio Mínimo y Estado.
 */
function ProductInfoCard({ product }: { product: Product }) {
  return (
    <View style={styles.card} testID="product-info-card">
      <InfoRow label="ID" value={product.id.toString()} />
      <InfoRow label="SKU" value={product.sku} />
      <InfoRow label="Nombre" value={product.name} />
      <View style={styles.infoRow}>
        <Text style={styles.label}>Precio Mínimo</Text>
        <Text style={styles.price}>{formatPrice(product.minPrice)}</Text>
      </View>
      <View style={styles.statusRow}>
        <Text style={styles.label}>Estado</Text>
        <StatusBadge active={product.active} />
      </View>
    </View>
  );
}

// ──── Screen ──────────────────────────────────────────────────────────

/**
 * WHAT: Pantalla ProductDetailScreen — detalle completo de un producto.
 *
 * Estados:
 * - Loading: LoadingIndicator mientras isLoadingDetail=true.
 * - Error: ErrorBanner con mensaje "Producto no encontrado" y botón Reintentar.
 * - Data: Card con ID, SKU, Nombre, Precio Mínimo, Estado + acciones.
 *
 * Acciones contextuales:
 * - Activo: editar (✏️) + eliminar (🗑️)
 * - Inactivo: reactivar (🔄), sin botón de eliminar
 *
 * Flujo de eliminación:
 * - Presionar 🗑️ → Alert.alert confirmación
 * - Confirmar → deleteProduct(id) + goBack()
 * - Cancelar → sin acción
 *
 * Flujo de reactivación:
 * - Presionar 🔄 → reactivateProduct(id)
 * - El hook invalida el detalle automáticamente (onSettled)
 */
export function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation();
  const { productId } = route.params;

  // ──── Store: seleccionar producto para que el hook haga fetch ────
  const store = useProductStore();

  useEffect(() => {
    store.selectProduct(productId);
    return () => {
      store.clearSelection();
    };
  }, [productId, store]);

  // ──── Composition root — instancia real del repositorio (Fix C1) ──
  const productRepository = React.useMemo(() => {
    const client = createApiClient();
    const api = new ProductApi(client);
    return new ProductRepositoryAdapter(api);
  }, []);

  // ──── Hook: orquesta store, queries y mutations ──────────────────
  const {
    selectedProduct,
    isLoadingDetail,
    isError,
    error,
    deleteProduct,
    reactivateProduct,
    refetch,
  } = useProducts({
    productRepository,
  });

  // ──── Handlers ───────────────────────────────────────────────────

  /**
   * WHAT: Navega a ProductForm en modo edición con el ID del producto.
   * WHY: Pasar productId le dice al form que está editando, no creando.
   */
  const handleEdit = useCallback(() => {
    (navigation.navigate as (options: {
      name: string;
      params?: object;
      merge?: boolean;
    }) => void)({
      name: 'ProductForm',
      params: { productId },
    });
  }, [navigation, productId]);

  /**
   * WHAT: Abre diálogo de confirmación para eliminar el producto.
   * WHY: Dos botones: Eliminar (destructive) → deleteProduct + goBack,
   *      Cancelar → sin acción. Patrón consistente con ProductsListScreen.
   */
  const handleDelete = useCallback(() => {
    Alert.alert(
      '¿Eliminar producto?',
      '¿Estás seguro de eliminar este producto?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteProduct(productId);
            navigation.goBack();
          },
        },
      ],
    );
  }, [deleteProduct, navigation, productId]);

  /**
   * WHAT: Reactiva un producto inactivo.
   * WHY: La mutation onSettled invalida el detalle y la lista,
   *      por lo que selectedProduct se actualiza automáticamente.
   */
  const handleReactivate = useCallback(() => {
    reactivateProduct(productId);
  }, [reactivateProduct, productId]);

  // ──── Render helpers ─────────────────────────────────────────────

  /**
   * WHAT: Renderiza la sección de acciones contextuales.
   * WHY: Cambia según active: true → editar + eliminar,
   *      false → reactivar (sin eliminar).
   */
  const renderActions = useCallback(
    (product: Product) => {
      if (product.active) {
        return (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
              accessibilityRole="button"
              accessibilityLabel="Editar producto"
            >
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel="Eliminar producto"
            >
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.actionText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.reactivateButton]}
            onPress={handleReactivate}
            accessibilityRole="button"
            accessibilityLabel="Reactivar producto"
          >
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionText}>Reactivar</Text>
          </TouchableOpacity>
        </View>
      );
    },
    [handleEdit, handleDelete, handleReactivate],
  );

  // ──── Render ─────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* AppBar corporativa — back button auto desde React Navigation stack */}
      <BrandedAppBar title="Detalle de Producto" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Loading state */}
        {isLoadingDetail && (
          <View style={styles.centered}>
            <LoadingIndicator message="Cargando producto..." />
          </View>
        )}

        {/* Error state */}
        {isError && !isLoadingDetail && (
          <View style={styles.errorContainer}>
            <ErrorBanner
              message={error?.message || 'Error al cargar el producto'}
              onRetry={() => refetch()}
            />
          </View>
        )}

        {/* Data state */}
        {selectedProduct && !isLoadingDetail && (
          <>
            <ProductInfoCard product={selectedProduct} />
            {renderActions(selectedProduct)}
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

  // ── Info rows ───────────────────────────────────────────────────
  infoRow: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
  },
  price: {
    ...typography.price,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  // ── Badge ───────────────────────────────────────────────────────
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  badgeActive: {
    backgroundColor: colors.success,
  },
  badgeInactive: {
    backgroundColor: colors.disabledBackground,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: colors.textOnPrimary,
  },
  badgeTextInactive: {
    color: colors.disabled,
  },

  // ── Actions ─────────────────────────────────────────────────────
  actions: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  editButton: {
    backgroundColor: colors.primaryLight,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  reactivateButton: {
    backgroundColor: colors.success,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    ...typography.button,
    fontSize: 16,
  },

  // ── Error ───────────────────────────────────────────────────────
  errorContainer: {
    padding: spacing.md,
  },
});
