/**
 * WHAT: Tests unitarios para los design tokens de colores.
 * WHY: TDD RED — los tests definen el contrato de paleta de colores antes de implementar.
 *      Consistencia visual con la app Flutter original (AppColors).
 * BENEFITS: Single source of truth para colores. Si cambia la identidad visual,
 *           se actualiza en un solo archivo.
 *
 * TDD: RED — test escrito antes que la implementación.
 */
import { colors } from '@core/theme/colors';

describe('colors — paleta principal', () => {
  test('primary debe ser #1A237E (navy)', () => {
    // WHY: Color primario de la identidad MundoLimpio, heredado de Flutter AppColors.primary
    expect(colors.primary).toBe('#1A237E');
  });

  test('primaryLight debe ser #534BAE (navy claro)', () => {
    expect(colors.primaryLight).toBe('#534BAE');
  });

  test('primaryDark debe ser #000051 (navy oscuro)', () => {
    expect(colors.primaryDark).toBe('#000051');
  });

  test('accent debe ser #FF6F00 (naranja)', () => {
    expect(colors.accent).toBe('#FF6F00');
  });
});

describe('colors — semánticos (estados)', () => {
  test('success debe ser #2E7D32 (verde)', () => {
    expect(colors.success).toBe('#2E7D32');
  });

  test('warning debe ser #F57F17 (amarillo oscuro)', () => {
    expect(colors.warning).toBe('#F57F17');
  });

  test('error debe ser #C62828 (rojo)', () => {
    expect(colors.error).toBe('#C62828');
  });

  test('errorLight debe ser #FFCDD2 (rojo claro)', () => {
    expect(colors.errorLight).toBe('#FFCDD2');
  });
});

describe('colors — superficie y fondo', () => {
  test('background debe ser #F5F5F5', () => {
    expect(colors.background).toBe('#F5F5F5');
  });

  test('surface debe ser #FFFFFF (blanco)', () => {
    expect(colors.surface).toBe('#FFFFFF');
  });

  test('surfaceVariant debe ser #E8EAF6', () => {
    expect(colors.surfaceVariant).toBe('#E8EAF6');
  });
});

describe('colors — texto', () => {
  test('textPrimary debe ser #212121', () => {
    expect(colors.textPrimary).toBe('#212121');
  });

  test('textSecondary debe ser #757575', () => {
    expect(colors.textSecondary).toBe('#757575');
  });

  test('textOnPrimary debe ser #FFFFFF (texto sobre fondo primary)', () => {
    expect(colors.textOnPrimary).toBe('#FFFFFF');
  });

  test('textOnError debe ser #FFFFFF (texto sobre fondo de error)', () => {
    expect(colors.textOnError).toBe('#FFFFFF');
  });
});

describe('colors — bordes y divisores', () => {
  test('border debe ser #E0E0E0', () => {
    expect(colors.border).toBe('#E0E0E0');
  });

  test('divider debe ser #BDBDBD', () => {
    expect(colors.divider).toBe('#BDBDBD');
  });
});

describe('colors — elementos deshabilitados', () => {
  test('disabled debe ser #9E9E9E', () => {
    expect(colors.disabled).toBe('#9E9E9E');
  });

  test('disabledBackground debe ser #E0E0E0', () => {
    expect(colors.disabledBackground).toBe('#E0E0E0');
  });
});

describe('colors — estados de stock (inventory)', () => {
  test('stockCritical debe ser #C62828 (rojo — currentStock <= minStock * 0.5)', () => {
    expect(colors.stockCritical).toBe('#C62828');
  });

  test('stockLow debe ser #F57F17 (naranja — currentStock <= minStock)', () => {
    expect(colors.stockLow).toBe('#F57F17');
  });

  test('stockNormal debe ser #2E7D32 (verde — stock suficiente)', () => {
    expect(colors.stockNormal).toBe('#2E7D32');
  });
});

describe('colors — estados de backup', () => {
  test('backupCompleted debe ser #2E7D32', () => {
    expect(colors.backupCompleted).toBe('#2E7D32');
  });

  test('backupFailed debe ser #C62828', () => {
    expect(colors.backupFailed).toBe('#C62828');
  });
});

describe('colors — OCR confidence', () => {
  test('ocrConfidenceLow debe ser #FFF3E0 (fondo naranja claro para confidence < 0.3)', () => {
    expect(colors.ocrConfidenceLow).toBe('#FFF3E0');
  });
});
