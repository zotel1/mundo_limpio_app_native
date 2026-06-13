/**
 * WHAT: Tests unitarios para GetInventoryUseCase
 * WHY: Validar validación de productId > 0, delegación al repositorio,
 *      y propagación de errores.
 * BENEFITS: Testeable sin HTTP — mock puro del puerto InventoryRepository.
 */

import { GetInventoryUseCase } from '@features/inventory/domain/usecases/getInventoryUseCase';
import type { InventoryRepository } from '@features/inventory/domain/ports/inventoryRepository';
import { createInventory } from '@features/inventory/domain/models/inventory';
import type { Inventory } from '@features/inventory/domain/models/inventory';

describe('GetInventoryUseCase', () => {
  const mockInventory: Inventory = createInventory({
    productId: 5,
    productName: 'Detergente',
    currentStock: 25,
    minStockThreshold: 10,
  });

  const createMockRepo = (): jest.Mocked<InventoryRepository> => ({
    getByProductId: jest.fn().mockResolvedValue(mockInventory),
    getLowStock: jest.fn(),
    adjustStock: jest.fn(),
  });

  // --- Happy path ---

  it('execute con productId válido debe delegar a repo.getByProductId', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetInventoryUseCase(mockRepo);

    const result = await useCase.execute(5);

    expect(mockRepo.getByProductId).toHaveBeenCalledTimes(1);
    expect(mockRepo.getByProductId).toHaveBeenCalledWith(5);
    expect(result).toEqual(mockInventory);
    expect(result.productId).toBe(5);
    expect(result.productName).toBe('Detergente');
  });

  it('execute debe retornar el Inventory exacto que devuelve el repo', async () => {
    const customInventory = createInventory({
      productId: 42,
      productName: 'Custom',
      currentStock: 0,
      minStockThreshold: 3,
    });
    const mockRepo = createMockRepo();
    mockRepo.getByProductId.mockResolvedValue(customInventory);
    const useCase = new GetInventoryUseCase(mockRepo);

    const result = await useCase.execute(42);

    expect(result).toBe(customInventory);
    expect(result.currentStock).toBe(0);
  });

  // --- Domain validation ---

  it('execute con productId 0 debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetInventoryUseCase(mockRepo);

    await expect(useCase.execute(0)).rejects.toThrow(
      'El productId debe ser mayor a 0',
    );

    expect(mockRepo.getByProductId).not.toHaveBeenCalled();
  });

  it('execute con productId negativo debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetInventoryUseCase(mockRepo);

    await expect(useCase.execute(-5)).rejects.toThrow(
      'El productId debe ser mayor a 0',
    );

    expect(mockRepo.getByProductId).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it('execute debe propagar errores del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.getByProductId.mockRejectedValue(new Error('Error de conexión'));
    const useCase = new GetInventoryUseCase(mockRepo);

    await expect(useCase.execute(5)).rejects.toThrow('Error de conexión');
    expect(mockRepo.getByProductId).toHaveBeenCalledTimes(1);
  });

  it('execute debe propagar errores tipados (NotFound) del repositorio', async () => {
    const mockRepo = createMockRepo();
    const notFoundError = new Error('Producto no encontrado');
    notFoundError.name = 'NotFoundException';
    mockRepo.getByProductId.mockRejectedValue(notFoundError);
    const useCase = new GetInventoryUseCase(mockRepo);

    await expect(useCase.execute(999)).rejects.toThrow('Producto no encontrado');
    expect(mockRepo.getByProductId).toHaveBeenCalledWith(999);
  });
});
