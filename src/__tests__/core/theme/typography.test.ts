/**
 * WHAT: Tests unitarios para los estilos de tipografía (design tokens).
 * WHY: TDD RED — los tests definen la jerarquía tipográfica antes de implementar.
 *      Basado en app_text_styles.dart del proyecto Flutter original.
 * BENEFITS: Consistencia tipográfica en toda la app. Sin estilos inline dispersos.
 *
 * TDD: RED — test escrito antes que la implementación.
 */
import { typography } from '@core/theme/typography';

describe('typography — encabezados', () => {
  test('h1 debe tener fontSize 28, fontWeight 700 y lineHeight 36', () => {
    // WHY: Encabezado principal — grande, negrita, jerarquía máxima.
    expect(typography.h1.fontSize).toBe(28);
    expect(typography.h1.fontWeight).toBe('700');
    expect(typography.h1.lineHeight).toBe(36);
  });

  test('h2 debe tener fontSize 22 y fontWeight 600', () => {
    expect(typography.h2.fontSize).toBe(22);
    expect(typography.h2.fontWeight).toBe('600');
    expect(typography.h2.lineHeight).toBe(28);
  });

  test('h3 debe tener fontSize 18 y fontWeight 600', () => {
    expect(typography.h3.fontSize).toBe(18);
    expect(typography.h3.fontWeight).toBe('600');
    expect(typography.h3.lineHeight).toBe(24);
  });
});

describe('typography — cuerpo', () => {
  test('body debe tener fontSize 16, fontWeight 400 y color #212121', () => {
    expect(typography.body.fontSize).toBe(16);
    expect(typography.body.fontWeight).toBe('400');
    expect(typography.body.color).toBe('#212121');
    expect(typography.body.lineHeight).toBe(24);
  });

  test('bodySmall debe tener fontSize 14 y color #757575 (textSecondary)', () => {
    expect(typography.bodySmall.fontSize).toBe(14);
    expect(typography.bodySmall.fontWeight).toBe('400');
    expect(typography.bodySmall.color).toBe('#757575');
    expect(typography.bodySmall.lineHeight).toBe(20);
  });

  test('caption debe tener fontSize 12 y color #9E9E9E', () => {
    expect(typography.caption.fontSize).toBe(12);
    expect(typography.caption.fontWeight).toBe('400');
    expect(typography.caption.color).toBe('#9E9E9E');
    expect(typography.caption.lineHeight).toBe(16);
  });
});

describe('typography — interactivos', () => {
  test('button debe tener fontSize 16, fontWeight 600 y color blanco', () => {
    expect(typography.button.fontSize).toBe(16);
    expect(typography.button.fontWeight).toBe('600');
    expect(typography.button.color).toBe('#FFFFFF');
    expect(typography.button.lineHeight).toBe(24);
  });

  test('label debe tener fontSize 14 y fontWeight 500', () => {
    expect(typography.label.fontSize).toBe(14);
    expect(typography.label.fontWeight).toBe('500');
    expect(typography.label.lineHeight).toBe(20);
    expect(typography.label.color).toBe('#212121');
  });
});

describe('typography — especiales', () => {
  test('price debe tener fontSize 20, fontWeight 700 y color verde (#2E7D32)', () => {
    // WHY: Precio en color verde — señal visual de valor positivo/confirmación.
    expect(typography.price.fontSize).toBe(20);
    expect(typography.price.fontWeight).toBe('700');
    expect(typography.price.color).toBe('#2E7D32');
    expect(typography.price.lineHeight).toBe(28);
  });

  test('error debe tener fontSize 14 y color #C62828 (rojo)', () => {
    expect(typography.error.fontSize).toBe(14);
    expect(typography.error.fontWeight).toBe('400');
    expect(typography.error.color).toBe('#C62828');
    expect(typography.error.lineHeight).toBe(20);
  });
});
