/**
 * TDD: RED — Tests para mappers de inventory (DTO ↔ Domain).
 *
 * WHAT: Valida que las funciones puras mapInventoryResponseToDomain y
 *       mapDomainToAdjustmentRequest transformen correctamente los DTOs
 *       Zod en entidades de dominio y viceversa.
 * WHY: Los mappers son la capa de traducción entre infrastructure (DTOs con
 *      validación Zod) y domain (entidades puras). Si el backend cambia un
 *      campo, solo se actualiza el mapper.
 * BENEFITS: Funciones puras, sin side effects, 100% testeables sin mocks.
 *           Mismo patrón que los mappers de auth y products.
 */
import { mapInventoryResponseToDomain } from '@features/inventory/infrastructure/api/mappers';
import { mapDomainToAdjustmentRequest } from '@features/inventory/infrastructure/api/mappers';
import { createStockAdjustment } from '@features/inventory/domain';
import type { InventoryResponseDto, AdjustmentRequestDto } from '@features/inventory/infrastructure/api/dtos';
import type { Inventory, StockAdjustment } from '@features/inventory/domain';

describe('mapInventoryResponseToDomain', () => {
  const validDto: InventoryResponseDto = {
    productId: 5,
    productName: 'Detergente Industrial',
    currentStock: 25,
    minStockThreshold: 10,
  };

  it('mapea un DTO válido a entidad Inventory con todos los campos', () => {
    const result: Inventory = mapInventoryResponseToDomain(validDto);

    expect(result.productId).toBe(5);
    expect(result.productName).toBe('Detergente Industrial');
    expect(result.currentStock).toBe(25);
    expect(result.minStockThreshold).toBe(10);
  });

  it('mapea correctamente stock=0 (producto agotado)', () => {
    const dto: InventoryResponseDto = {
      productId: 8,
      productName: 'Agotado',
      currentStock: 0,
      minStockThreshold: 5,
    };

    const result = mapInventoryResponseToDomain(dto);

    expect(result.currentStock).toBe(0);
    expect(result.productId).toBe(8);
    expect(result.minStockThreshold).toBe(5);
  });

  it('mapea correctamente stock negativo (caso borde)', () => {
    const dto: InventoryResponseDto = {
      productId: 99,
      productName: 'Backend Corrupto',
      currentStock: -3,
      minStockThreshold: 10,
    };

    const result = mapInventoryResponseToDomain(dto);

    expect(result.currentStock).toBe(-3);
    expect(result.productName).toBe('Backend Corrupto');
  });

  it('mapea correctamente umbrales y stocks grandes (sin overflow)', () => {
    const dto: InventoryResponseDto = {
      productId: 9999,
      productName: 'Alta Demanda',
      currentStock: 50000,
      minStockThreshold: 25000,
    };

    const result = mapInventoryResponseToDomain(dto);

    expect(result.currentStock).toBe(50000);
    expect(result.minStockThreshold).toBe(25000);
    expect(result.productId).toBe(9999);
  });

  it('preserva productName vacío sin transformarlo', () => {
    const dto: InventoryResponseDto = {
      productId: 1,
      productName: '',
      currentStock: 10,
      minStockThreshold: 5,
    };

    const result = mapInventoryResponseToDomain(dto);

    expect(result.productName).toBe('');
  });

  it('retorna un objeto distinto (inmutabilidad)', () => {
    const dto: InventoryResponseDto = {
      productId: 42,
      productName: 'TEST',
      currentStock: 100,
      minStockThreshold: 50,
    };

    const result = mapInventoryResponseToDomain(dto);

    // El resultado no es la misma referencia que el DTO
    expect(result).not.toBe(dto as unknown as Inventory);
  });
});

describe('mapDomainToAdjustmentRequest', () => {
  it('mapea un StockAdjustment válido a AdjustmentRequestDto', () => {
    const adjustment: StockAdjustment = createStockAdjustment({
      type: 'ADJUSTMENT',
      quantity: 10,
      reason: 'Reposición de stock por conteo manual',
    });

    const result: AdjustmentRequestDto = mapDomainToAdjustmentRequest(adjustment);

    expect(result.type).toBe('ADJUSTMENT');
    expect(result.quantity).toBe(10);
    expect(result.reason).toBe('Reposición de stock por conteo manual');
  });

  it('mapea correctamente quantity negativo (decremento)', () => {
    const adjustment: StockAdjustment = createStockAdjustment({
      type: 'BREAKAGE',
      quantity: -5,
      reason: 'Rotura de envase',
    });

    const result = mapDomainToAdjustmentRequest(adjustment);

    expect(result.quantity).toBe(-5);
    expect(result.type).toBe('BREAKAGE');
    expect(result.reason).toBe('Rotura de envase');
  });

  it('soporta tipo RETURN con quantity positivo', () => {
    const adjustment: StockAdjustment = createStockAdjustment({
      type: 'RETURN',
      quantity: 3,
      reason: 'Devolución de cliente',
    });

    const result = mapDomainToAdjustmentRequest(adjustment);

    expect(result.type).toBe('RETURN');
    expect(result.quantity).toBe(3);
  });

  it('soporta tipo QUALITY_LOSS con quantity negativo', () => {
    const adjustment: StockAdjustment = createStockAdjustment({
      type: 'QUALITY_LOSS',
      quantity: -2,
      reason: 'Producto vencido',
    });

    const result = mapDomainToAdjustmentRequest(adjustment);

    expect(result.type).toBe('QUALITY_LOSS');
    expect(result.quantity).toBe(-2);
  });

  it('mapea correctamente quantity=0', () => {
    const adjustment: StockAdjustment = createStockAdjustment({
      type: 'ADJUSTMENT',
      quantity: 0,
      reason: 'Ajuste administrativo nulo',
    });

    const result = mapDomainToAdjustmentRequest(adjustment);

    expect(result.quantity).toBe(0);
  });

  it('preserva razón larga sin truncar', () => {
    const longReason = 'Ajuste manual por diferencia detectada en auditoría trimestral del almacén central, verificado por el supervisor de turno y aprobado por gerencia de operaciones';
    const adjustment: StockAdjustment = createStockAdjustment({
      type: 'ADJUSTMENT',
      quantity: 1,
      reason: longReason,
    });

    const result = mapDomainToAdjustmentRequest(adjustment);

    expect(result.reason).toBe(longReason);
  });
});
