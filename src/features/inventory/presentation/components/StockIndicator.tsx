/**
 * StockIndicator — Barra de progreso coloreada con nivel de stock.
 *
 * WHAT: Componente puramente presentacional que renderiza una barra de progreso
 *       horizontal coloreada según el ratio current/max: rojo (crítico, <50%),
 *       amarillo (bajo, 50-99%), verde (normal, >=100%). Muestra texto de estado.
 * WHY: Consistencia visual en toda la feature de inventario. La lógica de color
 *      es determinista y pura — fácil de testear sin mocks.
 * BENEFITS: Reusable en InventoryDetailScreen y futuras pantallas. Sin dependencias
 *           externas (solo React Native + theme colors).
 *
 * TDD: GREEN — implementación mínima para pasar los tests de StockIndicator.test.tsx
 * PR 3.5a — 3.5a.3
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';

// ──── Props ────

interface StockIndicatorProps {
  /** Stock actual del producto. */
  current: number;
  /** Nivel mínimo del stock (típicamente 0). */
  min: number;
  /** Umbral de stock (minStockThreshold). */
  max: number;
}

// ──── Types ────

type StockLevel = 'normal' | 'low' | 'critical';

interface StockLevelInfo {
  level: StockLevel;
  color: string;
  label: string;
}

// ──── Helpers ────

/**
 * WHAT: Determina el color y etiqueta según el ratio current/max.
 * WHY: Función pura — sin side effects, fácil de testear indirectamente.
 *      Separada del componente para claridad y testeabilidad.
 *
 * Thresholds:
 * - ratio < 0.5    → crítico (rojo, #C62828), stock alarmantemente bajo
 * - 0.5 ≤ ratio < 1 → bajo (amarillo, #F57F17), stock por debajo del umbral
 * - ratio ≥ 1      → normal (verde, #2E7D32), stock suficiente
 */
function getStockLevelInfo(current: number, max: number): StockLevelInfo {
  if (max <= 0) {
    return {
      level: 'critical',
      color: colors.stockCritical,
      label: 'N/A',
    };
  }

  const ratio = current / max;

  if (ratio >= 1) {
    return { level: 'normal', color: colors.stockNormal, label: 'Normal' };
  }

  if (ratio >= 0.5) {
    return { level: 'low', color: colors.stockLow, label: 'Bajo' };
  }

  return { level: 'critical', color: colors.stockCritical, label: 'Crítico' };
}

// ──── Component ────

/**
 * WHAT: Barra de progreso coloreada con texto de estado de stock.
 *
 * Variantes:
 * - Rojo (#C62828): current < 50% de max — crítico. Texto "Crítico — X de Y".
 * - Amarillo (#F57F17): 50% ≤ current < 100% de max — bajo. Texto "Bajo — X de Y".
 * - Verde (#2E7D32): current ≥ max — normal. Texto "Normal — X unidades".
 *
 * La barra fill se acota entre 0% y 100% del ancho del track.
 */
export function StockIndicator({
  current,
  min: _min,
  max,
}: StockIndicatorProps) {
  const { color, label, level } = useMemo(
    () => getStockLevelInfo(current, max),
    [current, max],
  );

  // Safe division — evita NaN e Infinity cuando max ≤ 0.
  const safeMax = max > 0 ? max : 1;
  const fillFraction = Math.min(current / safeMax, 1);
  const fillPercent = `${fillFraction * 100}%`;

  const statusText =
    level === 'normal'
      ? `Normal — ${current} unidades`
      : `${label} — ${current} de ${max}`;

  return (
    <View testID="stock-indicator" style={styles.container}>
      {/* Barra de progreso */}
      <View style={styles.barTrack}>
        <View
          testID="stock-indicator-fill"
          style={[
            styles.barFill,
            { width: fillPercent as `${number}%`, backgroundColor: color },
          ]}
        />
      </View>

      {/* Texto de estado */}
      <Text style={[styles.statusText, { color }]}>{statusText}</Text>
    </View>
  );
}

// ──── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  barTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
