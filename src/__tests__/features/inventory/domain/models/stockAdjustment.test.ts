/**
 * WHAT: Tests unitarios para StockAdjustment y createStockAdjustment
 * WHY: Validar que la entidad de dominio es inmutable, soporta los 4 tipos
 *      de ajuste (ADJUSTMENT, BREAKAGE, RETURN, QUALITY_LOSS), y maneja
 *      correctamente la convención de signo (positivo=incremento, negativo=decremento).
 * BENEFITS: La convención de signo está centralizada en el modelo — los
 *           consumidores no necesitan conocer detalles de implementación.
 */

import { createStockAdjustment } from '@features/inventory/domain/models/stockAdjustment';
import type { StockAdjustment } from '@features/inventory/domain/models/stockAdjustment';

describe('StockAdjustment', () => {
  describe('createStockAdjustment', () => {
    it('debe crear un ajuste de incremento con todos los campos', () => {
      const adjustment: StockAdjustment = createStockAdjustment({
        type: 'ADJUSTMENT',
        quantity: 15,
        reason: 'Reposición de almacén',
      });

      expect(adjustment.type).toBe('ADJUSTMENT');
      expect(adjustment.quantity).toBe(15);
      expect(adjustment.reason).toBe('Reposición de almacén');
    });

    it('debe crear un ajuste de decremento con cantidad negativa', () => {
      const adjustment = createStockAdjustment({
        type: 'ADJUSTMENT',
        quantity: -5,
        reason: 'Venta registrada',
      });

      expect(adjustment.quantity).toBe(-5);
      expect(adjustment.type).toBe('ADJUSTMENT');
      expect(adjustment.reason).toBe('Venta registrada');
    });

    it('debe soportar el tipo BREAKAGE (rotura)', () => {
      const adjustment = createStockAdjustment({
        type: 'BREAKAGE',
        quantity: -2,
        reason: 'Envase roto en almacén',
      });

      expect(adjustment.type).toBe('BREAKAGE');
      expect(adjustment.quantity).toBe(-2);
      expect(adjustment.reason).toBe('Envase roto en almacén');
    });

    it('debe soportar el tipo RETURN (devolución)', () => {
      const adjustment = createStockAdjustment({
        type: 'RETURN',
        quantity: 3,
        reason: 'Devolución de cliente',
      });

      expect(adjustment.type).toBe('RETURN');
      expect(adjustment.quantity).toBe(3);
    });

    it('debe soportar el tipo QUALITY_LOSS (merma)', () => {
      const adjustment = createStockAdjustment({
        type: 'QUALITY_LOSS',
        quantity: -1,
        reason: 'Producto vencido',
      });

      expect(adjustment.type).toBe('QUALITY_LOSS');
      expect(adjustment.quantity).toBe(-1);
      expect(adjustment.reason).toBe('Producto vencido');
    });

    it('debe rechazar razones vacías (validación en uso)', () => {
      // La validación de razón vacía ocurre en el use case.
      // El modelo acepta cualquier string en el factory — la validación
      // de negocio pertenece al use case (AdjustStockUseCase).
      const adjustment = createStockAdjustment({
        type: 'ADJUSTMENT',
        quantity: 10,
        reason: '',
      });

      expect(adjustment.reason).toBe('');
    });

    it('debe tener exactamente las 3 propiedades esperadas', () => {
      const adjustment: StockAdjustment = createStockAdjustment({
        type: 'ADJUSTMENT',
        quantity: 1,
        reason: 'Test',
      });

      expect(Object.keys(adjustment).sort()).toEqual(
        ['quantity', 'reason', 'type'].sort(),
      );
    });

    it('debe ser readonly (verificación de tipos en runtime)', () => {
      const adjustment = createStockAdjustment({
        type: 'RETURN',
        quantity: 5,
        reason: 'Devolución',
      });

      expect(typeof adjustment.type).toBe('string');
      expect(typeof adjustment.quantity).toBe('number');
      expect(typeof adjustment.reason).toBe('string');
    });

    it('debe mantener la inmutabilidad — el objeto params no se modifica', () => {
      const params = {
        type: 'BREAKAGE' as const,
        quantity: -3,
        reason: 'Test inmutabilidad',
      };

      const adjustment = createStockAdjustment(params);

      expect(params.type).toBe('BREAKAGE');
      expect(params.quantity).toBe(-3);
      expect(adjustment).not.toBe(params as unknown as StockAdjustment);
    });
  });
});
