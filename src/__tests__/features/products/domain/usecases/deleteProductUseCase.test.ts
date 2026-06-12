/**
 * WHAT: Tests unitarios para DeleteProductUseCase
 * WHY: Validar id > 0, delegacion a repo.delete (soft-delete),
 *      y propagacion de errores.
 * BENEFITS: Testeable sin HTTP — mock puro del puerto.
 */

import { DeleteProductUseCase } from '@features/products/domain/usecases/deleteProductUseCase';
import type { ProductRepository } from '@features/products/domain/ports/productRepository';

describe('DeleteProductUseCase', () => {
  const createMockRepo = (): jest.Mocked<ProductRepository> => ({
    getAllActive: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    getBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    reactivate: jest.fn(),
  });

  // --- Happy path ---

  it('execute con id valido debe delegar a repo.delete', async () => {
    const mockRepo = createMockRepo();
    const useCase = new DeleteProductUseCase(mockRepo);

    await useCase.execute(42);

    expect(mockRepo.delete).toHaveBeenCalledTimes(1);
    expect(mockRepo.delete).toHaveBeenCalledWith(42);
  });

  // --- Domain validation: id <= 0 ---

  it('execute con id 0 debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new DeleteProductUseCase(mockRepo);

    await expect(useCase.execute(0)).rejects.toThrow(
      'El ID del producto debe ser mayor a 0',
    );

    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('execute con id negativo debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new DeleteProductUseCase(mockRepo);

    await expect(useCase.execute(-3)).rejects.toThrow(
      'El ID del producto debe ser mayor a 0',
    );

    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it('execute debe propagar errores del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.delete.mockRejectedValue(new Error('Producto no encontrado'));
    const useCase = new DeleteProductUseCase(mockRepo);

    await expect(useCase.execute(999)).rejects.toThrow('Producto no encontrado');

    expect(mockRepo.delete).toHaveBeenCalledTimes(1);
  });

  // --- Edge: void return value ---

  it('execute exitoso no debe retornar valor', async () => {
    const mockRepo = createMockRepo();
    const useCase = new DeleteProductUseCase(mockRepo);

    const result = await useCase.execute(1);

    expect(result).toBeUndefined();
  });
});
