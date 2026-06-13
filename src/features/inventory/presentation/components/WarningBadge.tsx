/**
 * WarningBadge — Badge de nivel de stock con color semántico.
 *
 * WHAT: Componente puramente presentacional que renderiza un badge circular
 *       coloreado según el nivel de stock: rojo (crítico, <5), amarillo (bajo, 5-19),
 *       verde (normal, >=20). Muestra el conteo de stock.
 * WHY: Consistencia visual en toda la feature de inventario. La lógica de color
 *      es determinista y pura — fácil de testear sin mocks.
 * BENEFITS: Reusable en InventoryListScreen y futuras pantallas. Sin dependencias
 *           externas (solo React Native + theme colors).
 *
 * TDD: GREEN — implementación mínima para pasar los tests de WarningBadge.test.tsx
 * PR 3.4 — 3.4.3
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';

// ──── Props ────

interface WarningBadgeProps {
  /** Nivel de stock actual del producto. */
  stock: number;
}

// ──── Helpers ────

/**
 * WHAT: Determina el color del badge según el nivel de stock.
 * WHY: Función pura — sin side effects, fácil de testear indirectamente.
 *      Separada del componente para claridad.
 */
function getBadgeColor(stock: number): string {
  if (stock < 5) return colors.stockCritical; // Rojo — crítico
  if (stock < 20) return colors.stockLow; // Amarillo — bajo
  return colors.stockNormal; // Verde — normal
}

// ──── Component ────

/**
 * WHAT: Badge circular con color semántico de stock.
 *
 * Variantes:
 * - Rojo (#C62828): stock < 5 — crítico
 * - Amarillo (#F57F17): 5 <= stock < 20 — bajo
 * - Verde (#2E7D32): stock >= 20 — normal
 */
export function WarningBadge({ stock }: WarningBadgeProps) {
  const backgroundColor = useMemo(() => getBadgeColor(stock), [stock]);

  return (
    <View
      testID="warning-badge"
      style={[styles.badge, { backgroundColor }]}
    >
      <Text style={styles.count}>{stock}</Text>
    </View>
  );
}

// ──── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  count: {
    ...typography.button,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textOnPrimary,
  },
});
