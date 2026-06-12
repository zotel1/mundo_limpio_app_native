/**
 * WHAT: Tests unitarios para la escala de espaciado y border radius (design tokens).
 * WHY: TDD RED — los tests definen el ritmo visual antes de implementar.
 *      Basado en app_spacing.dart del proyecto Flutter original.
 * BENEFITS: Ritmo visual consistente (múltiplos de 4). Sin magic numbers en componentes.
 *
 * TDD: RED — test escrito antes que la implementación.
 */
import { spacing, borderRadius } from '@core/theme/spacing';

describe('spacing — escala', () => {
  test('xs debe ser 4', () => {
    expect(spacing.xs).toBe(4);
  });

  test('sm debe ser 8', () => {
    expect(spacing.sm).toBe(8);
  });

  test('md debe ser 16', () => {
    expect(spacing.md).toBe(16);
  });

  test('lg debe ser 24', () => {
    expect(spacing.lg).toBe(24);
  });

  test('xl debe ser 32', () => {
    expect(spacing.xl).toBe(32);
  });

  test('xxl debe ser 48', () => {
    expect(spacing.xxl).toBe(48);
  });
});

describe('spacing — baseline grid (múltiplos de 4)', () => {
  test('todos los valores de spacing deben ser múltiplos de 4', () => {
    // WHY: Baseline grid de 4px — estándar Material Design.
    //      Garantiza ritmo visual consistente en toda la app.
    const values = Object.values(spacing) as number[];

    expect(values.length).toBeGreaterThan(0); // GATE: no es un objeto vacío

    for (const value of values) {
      expect(value % 4).toBe(0);
    }
  });
});

describe('borderRadius', () => {
  test('sm debe ser 4', () => {
    expect(borderRadius.sm).toBe(4);
  });

  test('md debe ser 8', () => {
    expect(borderRadius.md).toBe(8);
  });

  test('lg debe ser 12', () => {
    expect(borderRadius.lg).toBe(12);
  });

  test('xl debe ser 16', () => {
    expect(borderRadius.xl).toBe(16);
  });

  test('round debe ser 9999 (círculo/oval perfecto)', () => {
    expect(borderRadius.round).toBe(9999);
  });

  test('todos los valores de borderRadius (excepto round) deben ser múltiplos de 4', () => {
    const { round: _round, ...standard } = borderRadius;
    const values = Object.values(standard) as number[];

    expect(values.length).toBeGreaterThan(0); // GATE: no es un objeto vacío

    for (const value of values) {
      expect(value % 4).toBe(0);
    }
  });
});
