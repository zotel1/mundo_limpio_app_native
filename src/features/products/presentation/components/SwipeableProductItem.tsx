/**
 * WHAT: Ítem de lista de producto con nombre, SKU, chevron y long press
 *       para eliminar. NO usa swipe porque react-native-gesture-handler no
 *       está instalado — onLongPress es el fallback.
 * WHY: Cada producto en ProductsListScreen se renderiza con este componente.
 *      Navegación al detalle vía onPress. Confirmación de eliminación vía
 *      onLongPress (spec R6: soft-delete con confirmación). Accesible para
 *      lectores de pantalla.
 * BENEFITS: Componente memoizable para FlashList. Sin dependencia de
 *           gesture-handler. Accesibilidad completa con accessibilityLabel
 *           y accessibilityHint.
 *
 * TDD: GREEN — implementación mínima para pasar los tests RED.
 * PR 2.6 — T025
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';
import type { Product } from '../../domain';

interface SwipeableProductItemProps {
  /** Producto a mostrar en la lista. */
  product: Product;
  /** Callback al presionar el ítem (navega al detalle). */
  onPress: () => void;
  /** Callback al hacer long press (abre confirmación de eliminar). */
  onDelete: () => void;
}

export function SwipeableProductItem({
  product,
  onPress,
  onDelete,
}: SwipeableProductItemProps) {
  const accessibilityLabel = `${product.name}, SKU ${product.sku}`;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDelete}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Mantener presionado para eliminar"
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Información del producto */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.sku}>{product.sku}</Text>
      </View>

      {/* Chevron derecho — navegación al detalle */}
      <Text style={styles.chevron}>▶</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceVariant,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sku: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  chevron: {
    fontSize: 14,
    color: colors.disabled,
  },
});
