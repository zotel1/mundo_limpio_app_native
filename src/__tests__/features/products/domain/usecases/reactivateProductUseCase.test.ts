/**
 * WHAT: Tests unitarios para ReactivateProductUseCase
 * WHY: Validar id > 0, delegacion a repo.reactivate (soft-delete inverso),
 *      y propagacion de errores.
 * BENEFITS: Testeable sin HTTP — mock puro del puerto.
 */

import { ReactivateProductUseCase } from '@features/products/domain/usecases/reactivateProductUseCase';
import type { ProductRepository } from '@features/products/domain/ports/productRepository';

describe('ReactivateProductUseCase', () => {
  const createMockRepo = (): jest.Mocked<ProductRepository> => ({
    getAllActive: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    getBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reactivate: jest.fn().mockResolvedValue(undefined),
  });

  // --- Happy path ---

  it('execute con id valido debe delegar a repo.reactivate', async () => {
    const mockRepo = createMockRepo();
    const useCase = new ReactivateProductUseCase(mockRepo);

    await useCase.execute(42);

    expect(mockRepo.reactivate).toHaveBeenCalledTimes(1);
    expect(mockRepo.reactivate).toHaveBeenCalledWith(42);
  });

  // --- Domain validation: id <= 0 ---

  it('execute con id 0 debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new ReactivateProductUseCase(mockRepo);

    await expect(useCase.execute(0)).rejects.toThrow(
      'El ID del producto debe ser mayor a 0',
    );

    expect(mockRepo.reactivate).not.toHaveBeenCalled();
  });

  it('execute con id negativo debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new ReactivateProductUseCase(mockRepo);

    await expect(useCase.execute(-7)).rejects.toThrow(
      'El ID del producto debe ser mayor a 0',
    );

    expect(mockRepo.reactivate).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it('execute debe propagar errores del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.reactivate.mockRejectedValue(new Error('Producto no encontrado'));
    const useCase = new ReactivateProductUseCase(mockRepo);

    await expect(useCase.execute(999)).rejects.toThrow('Producto no encontrado');

    expect(mockRepo.reactivate).toHaveBeenCalledTimes(1);
  });

  // --- Edge: void return value ---

  it('execute exitoso no debe retornar valor', async () => {
    const mockRepo = createMockRepo();
    const useCase = new ReactivateProductUseCase(mockRepo);

    const result = await useCase.execute(1);

    expect(result).toBeUndefined();
  });
});
