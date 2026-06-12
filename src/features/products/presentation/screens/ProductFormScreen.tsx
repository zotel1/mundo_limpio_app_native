/**
 * WHAT: Pantalla de formulario para crear o editar productos.
 *       Soporta modo crear (nuevo producto) y modo editar (producto existente).
 *       Usa React Hook Form + Zod (ProductRequestSchema) para validación.
 * WHY: Centraliza la lógica de formulario de producto en una sola pantalla.
 *      El operador crea productos desde el FAB en ProductsListScreen y
 *      edita desde ProductDetailScreen. RHF + Zod proveen validación tipada.
 * BENEFITS: Validación client-side inmediata, pre-carga de datos en modo
 *           editar, estados visuales (loading, error, success).
 *
 * TDD: GREEN — implementación mínima para pasar ProductFormScreen.test.tsx.
 * PR 2.9 — T032
 *
 * TODO(PR-2.9): Inyectar productRepository vía composition root.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from '@core/navigation/types';
import { BrandedAppBar } from '@core/components/BrandedAppBar';
import { LoadingIndicator } from '@core/components/LoadingIndicator';
import { ErrorBanner } from '@core/components/ErrorBanner';
import { useProducts } from '../hooks/useProducts';
import { useProductStore } from '../stores/productStore';
import { ProductRequestSchema } from '../../infrastructure/api/dtos';

import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';

// ──── Types ───────────────────────────────────────────────────────────

type ProductFormRouteProp = RouteProp<RootStackParamList, 'ProductForm'>;

type ProductFormData = {
  sku: string;
  name: string;
  minPrice: number;
};

// ──── Component ───────────────────────────────────────────────────────

/**
 * WHAT: Pantalla ProductFormScreen — formulario crear/editar producto.
 *
 * Estados:
 * - Create (sin productId): título "Nuevo Producto", campos vacíos,
 *   submit → createProduct.
 * - Edit (con productId): título "Editar Producto", loading mientras
 *   fetch, pre-carga de datos, submit → updateProduct.
 *
 * Validación:
 * - SKU: requerido, solo mayúsculas/números/guiones (ProductRequestSchema).
 * - Nombre: requerido.
 * - Precio Mínimo: requerido, positivo.
 *
 * Submit:
 * - Botón deshabilitado mientras mutation está pendiente.
 * - Loading overlay durante submit.
 * - Error banner si la mutation falla.
 * - Navega atrás (goBack) al éxito.
 */
export function ProductFormScreen() {
  const route = useRoute<ProductFormRouteProp>();
  const navigation = useNavigation();
  const { productId } = route.params;
  const isEditMode = productId !== undefined;

  // ──── Store: seleccionar producto en modo editar ──────────────────
  const store = useProductStore();
  const setFormModeRef = React.useRef(store.setFormMode);
  const resetFormModeRef = React.useRef(store.resetFormMode);
  setFormModeRef.current = store.setFormMode;
  resetFormModeRef.current = store.resetFormMode;

  useEffect(() => {
    if (productId !== undefined) {
      setFormModeRef.current('edit', productId);
    }
    return () => {
      resetFormModeRef.current();
    };
  }, [productId]);

  // ──── Hook: orquesta queries y mutations ──────────────────────────
  const {
    selectedProduct,
    isLoadingDetail,
    createProduct,
    updateProduct,
  } = useProducts({
    // TODO(PR-2.9): Inyectar productRepository vía composition root.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    productRepository: null as any,
  });

  // ──── Form State ────────────────────────────────────────────────────

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductRequestSchema),
    defaultValues: {
      sku: '',
      name: '',
      minPrice: 0,
    },
    mode: 'onBlur',
  });

  const [mutationError, setMutationError] = React.useState<string | null>(null);

  // ──── Pre-carga de datos en modo editar ─────────────────────────────

  useEffect(() => {
    if (isEditMode && selectedProduct && !isLoadingDetail) {
      reset({
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        minPrice: selectedProduct.minPrice,
      });
    }
  }, [isEditMode, selectedProduct, isLoadingDetail, reset]);

  // ──── Submit handler ─────────────────────────────────────────────────

  const onSubmit = useCallback(
    (data: ProductFormData) => {
      setMutationError(null);

      if (isEditMode && productId !== undefined) {
        updateProduct({ id: productId, data });
        // En modo editar, el hook useProducts maneja onSuccess/onError
        // Navegamos atrás inmediatamente (optimistic) — si falla, el rollback ocurre
        // Usamos setTimeout para asegurar que la mutation se procese
        setTimeout(() => {
          navigation.goBack();
        }, 100);
      } else {
        createProduct(data);
        // En modo crear, navegamos atrás (el hook invalida la lista en onSuccess)
        setTimeout(() => {
          navigation.goBack();
        }, 100);
      }
    },
    [isEditMode, productId, createProduct, updateProduct, navigation],
  );

  // ──── Loading state (edit mode fetch) ───────────────────────────────

  if (isEditMode && isLoadingDetail) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BrandedAppBar
          title={isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
        />
        <LoadingIndicator message="Cargando producto..." />
      </SafeAreaView>
    );
  }

  // ──── Render ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandedAppBar
        title={isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error banner */}
          {mutationError && (
            <ErrorBanner
              message={mutationError}
              onDismiss={() => setMutationError(null)}
            />
          )}

          {/* SKU */}
          <Text style={styles.label}>SKU</Text>
          <Controller
            control={control}
            name="sku"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.sku && styles.inputError]}
                placeholder="Ej: DETERGENTE-500ML-001"
                autoCapitalize="characters"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={(text) => onChange(text.toUpperCase())}
                value={value}
                editable={!isSubmitting}
              />
            )}
          />
          {errors.sku ? (
            <Text style={styles.fieldError}>{errors.sku.message}</Text>
          ) : (
            <Text style={styles.helperText}>
              Solo mayúsculas, números y guiones
            </Text>
          )}

          {/* Nombre */}
          <Text style={styles.label}>Nombre</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Nombre del producto"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                editable={!isSubmitting}
              />
            )}
          />
          {errors.name && (
            <Text style={styles.fieldError}>{errors.name.message}</Text>
          )}

          {/* Precio Mínimo */}
          <Text style={styles.label}>Precio Mínimo</Text>
          <Controller
            control={control}
            name="minPrice"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.minPrice && styles.inputError]}
                placeholder="0.00"
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={(text) => {
                  // Permitir punto decimal y vacío temporal (para typing intermedio)
                  const parsed = text === '' ? 0 : parseFloat(text);
                  onChange(isNaN(parsed) ? 0 : parsed);
                }}
                value={value === 0 ? '' : String(value)}
                editable={!isSubmitting}
              />
            )}
          />
          {errors.minPrice && (
            <Text style={styles.fieldError}>{errors.minPrice.message}</Text>
          )}

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            accessibilityRole="button"
          >
            {isSubmitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator
                  color={colors.textOnPrimary}
                  size="small"
                  accessibilityLabel="Cargando..."
                />
                <Text style={styles.buttonText}>Guardando...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ──── Estilos ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    ...typography.error,
    marginTop: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
