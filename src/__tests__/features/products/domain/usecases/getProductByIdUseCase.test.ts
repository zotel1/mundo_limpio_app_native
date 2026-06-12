/**
 * WHAT: Tests unitarios para GetProductByIdUseCase
 * WHY: Validar id > 0, delegacion a repo.getById, y propagacion de errores.
 * BENEFITS: Testeable sin HTTP — mock puro del puerto.
 */

import { GetProductByIdUseCase } from '@features/products/domain/usecases/getProductByIdUseCase';
import type { ProductRepository } from '@features/products/domain/ports/productRepository';
import { createProduct } from '@features/products/domain/models/product';
import type { Product } from '@features/products/domain/models/product';

describe('GetProductByIdUseCase', () => {
  const mockProduct: Product = createProduct({
    id: 42,
    sku: 'PROD-042',
    name: 'Producto 42',
    minPrice: 300,
    active: true,
  });

  const createMockRepo = (): jest.Mocked<ProductRepository> => ({
    getAllActive: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn().mockResolvedValue(mockProduct),
    getBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reactivate: jest.fn(),
  });

  // --- Happy path ---

  it('execute con id valido debe delegar a repo.getById y retornar producto', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetProductByIdUseCase(mockRepo);

    const result = await useCase.execute(42);

    expect(mockRepo.getById).toHaveBeenCalledTimes(1);
    expect(mockRepo.getById).toHaveBeenCalledWith(42);
    expect(result).toEqual(mockProduct);
  });

  // --- Domain validation: id <= 0 ---

  it('execute con id 0 debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetProductByIdUseCase(mockRepo);

    await expect(useCase.execute(0)).rejects.toThrow(
      'El ID del producto debe ser mayor a 0',
    );

    expect(mockRepo.getById).not.toHaveBeenCalled();
  });

  it('execute con id negativo debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetProductByIdUseCase(mockRepo);

    await expect(useCase.execute(-5)).rejects.toThrow(
      'El ID del producto debe ser mayor a 0',
    );

    expect(mockRepo.getById).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it('execute debe propagar errores del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.getById.mockRejectedValue(new Error('Producto no encontrado'));
    const useCase = new GetProductByIdUseCase(mockRepo);

    await expect(useCase.execute(999)).rejects.toThrow('Producto no encontrado');

    expect(mockRepo.getById).toHaveBeenCalledTimes(1);
  });
});
