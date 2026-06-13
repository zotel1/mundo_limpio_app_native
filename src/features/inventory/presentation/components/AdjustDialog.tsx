/**
 * AdjustDialog — Modal de ajuste de stock.
 *
 * WHAT: Modal con React Hook Form + Zod para ajustar el stock de un producto.
 *       Campos: tipo (+/−), cantidad (>0), razón (requerido).
 *       Lee productId de InventoryStore, envía vía useInventory().adjustStock().
 *       Cierra al cancelar o al completar exitosamente el ajuste.
 * WHY: UI de ajuste de stock con validación client-side inmediata (Zod).
 *      Centraliza la lógica de ajuste sin props — usa el store como fuente de verdad.
 * BENEFITS: Validación tipada, feedback de errores inline, no necesita props.
 *           Solo se renderiza cuando isAdjustDialogOpen=true (vía Modal visible).
 *
 * TDD: GREEN — implementación mínima para pasar AdjustDialog.test.tsx
 * PR 3.5b — 3.5b.2
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useInventoryStore } from '../stores/inventoryStore';
import { selectIsAdjustDialogOpen, selectAdjustDialogProductId } from '../stores/inventoryStore';
import { useInventory } from '../hooks/useInventory';
import type { UseInventoryReturn } from '../hooks/useInventory';

import { createApiClient } from '@core/http';
import { InventoryApi } from '@features/inventory/infrastructure/api';
import { InventoryRepositoryAdapter } from '@features/inventory/infrastructure/adapters';

import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';

// ──── Schema ──────────────────────────────────────────────────────────

/**
 * WHAT: Esquema Zod para el formulario de ajuste de stock.
 * WHY: Validación tipada client-side. Exportado para testeo directo del schema.
 */
export const adjustFormSchema = z.object({
  type: z.enum(['+', '-']),
  quantity: z
    .number({ invalid_type_error: 'Ingresá un número válido' })
    .positive('La cantidad debe ser mayor a 0'),
  reason: z.string().min(1, 'La razón es obligatoria'),
});

export type AdjustFormData = z.infer<typeof adjustFormSchema>;

// ──── Helpers ─────────────────────────────────────────────────────────

/**
 * WHAT: Mapea el signo del formulario a tipo del dominio.
 * WHY: El formulario usa '+'/'-' para el usuario. El dominio usa 'INCREMENT'/'DECREMENT'.
 */
function mapSignToType(sign: '+' | '-'): 'INCREMENT' | 'DECREMENT' {
  return sign === '+' ? 'INCREMENT' : 'DECREMENT';
}

// ──── Component ───────────────────────────────────────────────────────

/**
 * WHAT: Dialogo modal para ajustar stock de un producto.
 *
 * Flujo:
 * 1. Abierto vía InventoryDetailScreen → openAdjustDialog(productId) en el store.
 * 2. Usuario selecciona tipo (+incremento / −decremento), ingresa cantidad y razón.
 * 3. Submit → Zod valida → adjustStock() → optimistic update.
 * 4. Éxito → closeAdjustDialog() y reset del form.
 * 5. Error → se muestra el mensaje del servidor (adjustError).
 * 6. Cancelar → closeAdjustDialog() y reset del form.
 *
 * No recibe props — obtiene productId del inventoryStore.
 */
export function AdjustDialog() {
  // ──── Store — estado del diálogo ──────────────────────────────────
  const isAdjustDialogOpen = useInventoryStore(selectIsAdjustDialogOpen);
  const adjustDialogProductId = useInventoryStore(selectAdjustDialogProductId);
  const closeAdjustDialog = useInventoryStore((s) => s.closeAdjustDialog);

  // ──── Composition root — instancia real del repositorio ───────────
  const inventoryRepository = useMemo(() => {
    const client = createApiClient();
    const api = new InventoryApi(client);
    return new InventoryRepositoryAdapter(api);
  }, []);

  // ──── Hook — mutación adjustStock ─────────────────────────────────
  const {
    adjustStock,
    isAdjusting,
    adjustError,
  }: UseInventoryReturn = useInventory({ inventoryRepository });

  // ──── Form — RHF + Zod ────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustFormData>({
    resolver: zodResolver(adjustFormSchema),
    defaultValues: { type: '+', quantity: 0, reason: '' },
    mode: 'onBlur',
  });

  // ──── Submit handler ──────────────────────────────────────────────
  const onSubmit = useCallback(
    (data: AdjustFormData) => {
      if (adjustDialogProductId === null) return;

      adjustStock(adjustDialogProductId, {
        type: mapSignToType(data.type),
        quantity: data.quantity,
        reason: data.reason,
      });
    },
    [adjustDialogProductId, adjustStock],
  );

  // ──── Detect mutation completion ──────────────────────────────────
  // Cuando isAdjusting pasa de true a false:
  // - Si no hay error → éxito → cerrar diálogo y resetear form
  // - Si hay error → se muestra vía adjustError (no se cierra)
  const prevAdjustingRef = useRef(isAdjusting);

  useEffect(() => {
    const wasAdjusting = prevAdjustingRef.current;
    prevAdjustingRef.current = isAdjusting;

    if (wasAdjusting && !isAdjusting) {
      // Mutación completada
      if (!adjustError) {
        // Éxito — cerrar y limpiar
        closeAdjustDialog();
        reset();
      }
      // Si hay error, el componente ya lo muestra vía adjustError prop
    }
  }, [isAdjusting, adjustError, closeAdjustDialog, reset]);

  // ──── Cancel handler ──────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    closeAdjustDialog();
    reset();
  }, [closeAdjustDialog, reset]);

  // ──── Render ──────────────────────────────────────────────────────
  return (
    <Modal
      visible={isAdjustDialogOpen}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialogContainer}>
          {/* Header */}
          <Text style={styles.title}>Ajustar Stock</Text>

          {/* Error del servidor */}
          {adjustError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{adjustError.message}</Text>
            </View>
          )}

          {/* Tipo — toggle +/− */}
          <Text style={styles.label}>Tipo de ajuste</Text>
          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <View style={styles.typeRow}>
                <Pressable
                  style={[
                    styles.typeButton,
                    value === '+' && styles.typeButtonActive,
                  ]}
                  onPress={() => onChange('+')}
                  accessibilityRole="button"
                  accessibilityLabel="Incremento"
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      value === '+' && styles.typeButtonTextActive,
                    ]}
                  >
                    + Incremento
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeButton,
                    value === '-' && styles.typeButtonActive,
                  ]}
                  onPress={() => onChange('-')}
                  accessibilityRole="button"
                  accessibilityLabel="Decremento"
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      value === '-' && styles.typeButtonTextActive,
                    ]}
                  >
                    − Decremento
                  </Text>
                </Pressable>
              </View>
            )}
          />

          {/* Cantidad */}
          <Text style={styles.label}>Cantidad</Text>
          <Controller
            control={control}
            name="quantity"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError]}
                placeholder="Cantidad"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={(text) => {
                  const parsed = text === '' ? 0 : parseFloat(text);
                  onChange(isNaN(parsed) ? 0 : parsed);
                }}
                value={value === 0 ? '' : String(value)}
                editable={!isAdjusting}
                accessibilityLabel="Cantidad"
              />
            )}
          />
          {errors.quantity && (
            <Text style={styles.fieldError}>{errors.quantity.message}</Text>
          )}

          {/* Razón */}
          <Text style={styles.label}>Razón</Text>
          <Controller
            control={control}
            name="reason"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.reasonInput, errors.reason && styles.inputError]}
                placeholder="Razón del ajuste"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                editable={!isAdjusting}
                accessibilityLabel="Razón del ajuste"
              />
            )}
          />
          {errors.reason && (
            <Text style={styles.fieldError}>{errors.reason.message}</Text>
          )}

          {/* Botones */}
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isAdjusting}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.confirmButton, isAdjusting && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isAdjusting}
              accessibilityRole="button"
              accessibilityLabel="Confirmar ajuste"
            >
              <Text style={styles.confirmButtonText}>
                {isAdjusting ? 'Guardando...' : 'Confirmar'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ──── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialogContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  // ── Header ───────────────────────────────────────────────────────
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // ── Error banner ─────────────────────────────────────────────────
  errorBanner: {
    backgroundColor: '#FDECEA',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },

  // ── Labels ───────────────────────────────────────────────────────
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },

  // ── Type toggle ──────────────────────────────────────────────────
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  typeButtonTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },

  // ── Inputs ───────────────────────────────────────────────────────
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  reasonInput: {
    minHeight: 80,
  },
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    ...typography.error,
    marginTop: spacing.xs,
  },

  // ── Buttons ──────────────────────────────────────────────────────
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.accent,
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
