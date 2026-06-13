/**
 * TDD: RED — Tests para Zod DTOs de inventory.
 *
 * WHAT: Valida que los schemas Zod rechacen datos inválidos y acepten datos
 *       correctos según los contratos del backend.
 * WHY: Zod atrapa errores en runtime si el backend cambia el schema. Los tests
 *      validan que los schemas están correctamente definidos.
 * BENEFITS: Validación runtime, tipos TypeScript inferidos, mensajes claros.
 */
import {
  InventoryResponseSchema,
  AdjustmentRequestSchema,
} from '@features/inventory/infrastructure/api/dtos';

// ──── InventoryResponseSchema ────

describe('InventoryResponseSchema', () => {
  const validResponse = {
    productId: 5,
    productName: 'Detergente Industrial',
    currentStock: 25,
    minStockThreshold: 10,
  };

  it('acepta respuesta completa y válida', () => {
    const result = InventoryResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe(5);
      expect(result.data.productName).toBe('Detergente Industrial');
      expect(result.data.currentStock).toBe(25);
      expect(result.data.minStockThreshold).toBe(10);
    }
  });

  it('acepta currentStock 0 (producto agotado)', () => {
    const result = InventoryResponseSchema.safeParse({
      ...validResponse,
      currentStock: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentStock).toBe(0);
    }
  });

  it('acepta minStockThreshold 0 (sin umbral)', () => {
    const result = InventoryResponseSchema.safeParse({
      ...validResponse,
      minStockThreshold: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minStockThreshold).toBe(0);
    }
  });

  it('rechaza respuesta sin productId', () => {
    const { productId: _, ...noProductId } = validResponse;
    const result = InventoryResponseSchema.safeParse(noProductId);
    expect(result.success).toBe(false);
  });

  it('rechaza respuesta sin productName', () => {
    const { productName: _, ...noName } = validResponse;
    const result = InventoryResponseSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it('rechaza respuesta sin currentStock', () => {
    const { currentStock: _, ...noStock } = validResponse;
    const result = InventoryResponseSchema.safeParse(noStock);
    expect(result.success).toBe(false);
  });

  it('rechaza respuesta sin minStockThreshold', () => {
    const { minStockThreshold: _, ...noThreshold } = validResponse;
    const result = InventoryResponseSchema.safeParse(noThreshold);
    expect(result.success).toBe(false);
  });

  it('rechaza productId que no es número', () => {
    const result = InventoryResponseSchema.safeParse({
      ...validResponse,
      productId: 'cinco',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza currentStock que no es número', () => {
    const result = InventoryResponseSchema.safeParse({
      ...validResponse,
      currentStock: 'veinticinco',
    });
    expect(result.success).toBe(false);
  });
});

// ──── AdjustmentRequestSchema ────

describe('AdjustmentRequestSchema', () => {
  const validAdjustment = {
    type: 'ADJUSTMENT',
    quantity: 10,
    reason: 'Reposición de stock por conteo manual',
  };

  it('acepta un adjustment válido', () => {
    const result = AdjustmentRequestSchema.safeParse(validAdjustment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('ADJUSTMENT');
      expect(result.data.quantity).toBe(10);
      expect(result.data.reason).toBe('Reposición de stock por conteo manual');
    }
  });

  it('acepta quantity negativo (decremento)', () => {
    const result = AdjustmentRequestSchema.safeParse({
      ...validAdjustment,
      quantity: -5,
      type: 'BREAKAGE',
      reason: 'Rotura de envase durante almacenamiento',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(-5);
      expect(result.data.type).toBe('BREAKAGE');
    }
  });

  it('acepta otros tipos de ajuste (RETURN, QUALITY_LOSS)', () => {
    const types = ['RETURN', 'QUALITY_LOSS'];
    for (const type of types) {
      const result = AdjustmentRequestSchema.safeParse({
        ...validAdjustment,
        type,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(type);
      }
    }
  });

  it('rechaza type vacío', () => {
    const result = AdjustmentRequestSchema.safeParse({
      ...validAdjustment,
      type: '',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza reason vacía', () => {
    const result = AdjustmentRequestSchema.safeParse({
      ...validAdjustment,
      reason: '',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza ajuste sin quantity', () => {
    const { quantity: _, ...noQuantity } = validAdjustment;
    const result = AdjustmentRequestSchema.safeParse(noQuantity);
    expect(result.success).toBe(false);
  });

  it('rechaza ajuste sin type', () => {
    const { type: _, ...noType } = validAdjustment;
    const result = AdjustmentRequestSchema.safeParse(noType);
    expect(result.success).toBe(false);
  });

  it('rechaza ajuste sin reason', () => {
    const { reason: _, ...noReason } = validAdjustment;
    const result = AdjustmentRequestSchema.safeParse(noReason);
    expect(result.success).toBe(false);
  });

  it('rechaza quantity que no es número', () => {
    const result = AdjustmentRequestSchema.safeParse({
      ...validAdjustment,
      quantity: 'diez',
    });
    expect(result.success).toBe(false);
  });
});
