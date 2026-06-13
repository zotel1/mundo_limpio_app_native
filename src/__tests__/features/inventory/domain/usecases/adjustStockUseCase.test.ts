/**
 * WHAT: Tests unitarios para AdjustStockUseCase
 * WHY: Validar: productId > 0, quantity !== 0, reason no vacío,
 *      delegación al repositorio, y propagación de errores.
 * BENEFITS: Testeable sin HTTP — mock puro del puerto InventoryRepository.
 */

import { AdjustStockUseCase } from '@features/inventory/domain/usecases/adjustStockUseCase';
import type { InventoryRepository } from '@features/inventory/domain/ports/inventoryRepository';
import { createInventory } from '@features/inventory/domain/models/inventory';
import { createStockAdjustment } from '@features/inventory/domain/models/stockAdjustment';
import type { Inventory } from '@features/inventory/domain/models/inventory';
import type { StockAdjustment } from '@features/inventory/domain/models/stockAdjustment';

describe('AdjustStockUseCase', () => {
  const updatedInventory: Inventory = createInventory({
    productId: 5,
    productName: 'Detergente',
    currentStock: 30,
    minStockThreshold: 10,
  });

  const createMockRepo = (): jest.Mocked<InventoryRepository> => ({
    getByProductId: jest.fn(),
    getLowStock: jest.fn(),
    adjustStock: jest.fn().mockResolvedValue(updatedInventory),
  });

  const validAdjustment: StockAdjustment = createStockAdjustment({
    type: 'ADJUSTMENT',
    quantity: 5,
    reason: 'Reposición de almacén',
  });

  // --- Happy path ---

  it('execute con params válidos debe delegar a repo.adjustStock', async () => {
    const mockRepo = createMockRepo();
    const useCase = new AdjustStockUseCase(mockRepo);

    const result = await useCase.execute(5, validAdjustment);

    expect(mockRepo.adjustStock).toHaveBeenCalledTimes(1);
    expect(mockRepo.adjustStock).toHaveBeenCalledWith(5, validAdjustment);
    expect(result).toEqual(updatedInventory);
    expect(result.currentStock).toBe(30);
  });

  it('execute debe soportar decremento con cantidad negativa', async () => {
    const mockRepo = createMockRepo();
    const decreasedInventory = createInventory({
      productId: 5,
      productName: 'Detergente',
      currentStock: 20,
      minStockThreshold: 10,
    });
    mockRepo.adjustStock.mockResolvedValue(decreasedInventory);
    const useCase = new AdjustStockUseCase(mockRepo);

    const decrement = createStockAdjustment({
      type: 'BREAKAGE',
      quantity: -5,
      reason: 'Rotura de envase',
    });

    const result = await useCase.execute(5, decrement);

    expect(mockRepo.adjustStock).toHaveBeenCalledWith(5, decrement);
    expect(result.currentStock).toBe(20);
    expect(result.productId).toBe(5);
  });

  it('execute debe soportar todos los tipos de ajuste', async () => {
    const mockRepo = createMockRepo();
    const useCase = new AdjustStockUseCase(mockRepo);

    const returnAdjustment = createStockAdjustment({
      type: 'RETURN',
      quantity: 3,
      reason: 'Devolución cliente',
    });

    await useCase.execute(5, returnAdjustment);
    expect(mockRepo.adjustStock).toHaveBeenCalledWith(5, returnAdjustment);

    const qualityAdjustment = createStockAdjustment({
      type: 'QUALITY_LOSS',
      quantity: -2,
      reason: 'Producto vencido',
    });

    await useCase.execute(5, qualityAdjustment);
    expect(mockRepo.adjustStock).toHaveBeenCalledWith(5, qualityAdjustment);
  });

  // --- Domain validation ---

  it('execute con productId 0 debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new AdjustStockUseCase(mockRepo);

    await expect(useCase.execute(0, validAdjustment)).rejects.toThrow(
      'El productId debe ser mayor a 0',
    );

    expect(mockRepo.adjustStock).not.toHaveBeenCalled();
  });

  it('execute con productId negativo debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new AdjustStockUseCase(mockRepo);

    await expect(useCase.execute(-3, validAdjustment)).rejects.toThrow(
      'El productId debe ser mayor a 0',
    );

    expect(mockRepo.adjustStock).not.toHaveBeenCalled();
  });

  it('execute con quantity = 0 debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new AdjustStockUseCase(mockRepo);

    const zeroAdjustment = createStockAdjustment({
      type: 'ADJUSTMENT',
      quantity: 0,
      reason: 'Intento inválido',
    });

    await expect(useCase.execute(5, zeroAdjustment)).rejects.toThrow(
      'La cantidad no puede ser 0',
    );

    expect(mockRepo.adjustStock).not.toHaveBeenCalled();
  });

  it('execute con reason vacía debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new AdjustStockUseCase(mockRepo);

    const emptyReasonAdjustment = createStockAdjustment({
      type: 'ADJUSTMENT',
      quantity: 10,
      reason: '',
    });

    await expect(useCase.execute(5, emptyReasonAdjustment)).rejects.toThrow(
      'La razón es obligatoria',
    );

    expect(mockRepo.adjustStock).not.toHaveBeenCalled();
  });

  it('execute con reason de solo espacios debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new AdjustStockUseCase(mockRepo);

    const whitespaceAdjustment = createStockAdjustment({
      type: 'ADJUSTMENT',
      quantity: 10,
      reason: '   ',
    });

    await expect(useCase.execute(5, whitespaceAdjustment)).rejects.toThrow(
      'La razón es obligatoria',
    );

    expect(mockRepo.adjustStock).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it('execute debe propagar errores del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.adjustStock.mockRejectedValue(new Error('Error de servidor'));
    const useCase = new AdjustStockUseCase(mockRepo);

    await expect(useCase.execute(5, validAdjustment)).rejects.toThrow(
      'Error de servidor',
    );

    expect(mockRepo.adjustStock).toHaveBeenCalledTimes(1);
  });

  it('execute debe propagar errores de conflicto (409)', async () => {
    const mockRepo = createMockRepo();
    const conflictError = new Error('Modificación concurrente');
    conflictError.name = 'ConflictException';
    mockRepo.adjustStock.mockRejectedValue(conflictError);
    const useCase = new AdjustStockUseCase(mockRepo);

    await expect(useCase.execute(5, validAdjustment)).rejects.toThrow(
      'Modificación concurrente',
    );
  });

  it('execute debe propagar errores de validación del backend (400)', async () => {
    const mockRepo = createMockRepo();
    const validationError = new Error('Stock insuficiente');
    validationError.name = 'ValidationException';
    mockRepo.adjustStock.mockRejectedValue(validationError);
    const useCase = new AdjustStockUseCase(mockRepo);

    await expect(useCase.execute(5, validAdjustment)).rejects.toThrow(
      'Stock insuficiente',
    );
  });
});
