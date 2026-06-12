/**
 * Spacing — Design tokens de espaciado y border radius.
 *
 * WHAT: Escala de espaciado basada en app_spacing.dart del proyecto Flutter
 *       original. Múltiplos de 4 (baseline grid de Material Design).
 *       Incluye también la escala de border radius.
 * WHY: Ritmo visual consistente en toda la app. Sin magic numbers en los
 *      componentes (margins, paddings, gaps).
 * BENEFITS: Single source of truth. Si se ajusta el ritmo visual, se actualiza
 *           en un solo archivo. Baseline grid de 4px asegura alineación perfecta.
 *
 * TDD: GREEN — implementación mínima para pasar los tests definidos en RED.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999, // Círculo/oval perfecto
} as const;
