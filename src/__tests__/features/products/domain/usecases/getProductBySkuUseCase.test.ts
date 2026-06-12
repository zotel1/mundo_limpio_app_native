/**
 * WHAT: Tests unitarios para GetProductBySkuUseCase
 * WHY: Validar que el SKU no este vacio, delegacion correcta a getBySku,
 *      y propagacion de errores del repositorio.
 * BENEFITS: El use case es testeable sin HTTP — mock puro del puerto.
 */

import { GetProductBySkuUseCase } from '@features/products/domain/usecases/getProductBySkuUseCase';
import type { ProductRepository } from '@features/products/domain/ports/productRepository';
import { createProduct } from '@features/products/domain/models/product';
import type { Product } from '@features/products/domain/models/product';

describe('GetProductBySkuUseCase', () => {
  const mockProduct: Product = createProduct({
    id: 1,
    sku: 'SKU-001',
    name: 'Producto A',
    minPrice: 150,
    active: true,
  });

  const createMockRepo = (): jest.Mocked<ProductRepository> => ({
    getAllActive: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    getBySku: jest.fn().mockResolvedValue(mockProduct),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reactivate: jest.fn(),
  });

  // --- Happy path ---

  it('execute con SKU valido debe delegar a repo.getBySku y retornar producto', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetProductBySkuUseCase(mockRepo);

    const result = await useCase.execute('SKU-001');

    expect(mockRepo.getBySku).toHaveBeenCalledTimes(1);
    expect(mockRepo.getBySku).toHaveBeenCalledWith('SKU-001');
    expect(result).toEqual(mockProduct);
  });

  // --- Domain validation ---

  it('execute con SKU vacio debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetProductBySkuUseCase(mockRepo);

    await expect(useCase.execute('')).rejects.toThrow(
      'El SKU es requerido',
    );

    expect(mockRepo.getBySku).not.toHaveBeenCalled();
  });

  it('execute con SKU de solo espacios debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetProductBySkuUseCase(mockRepo);

    await expect(useCase.execute('   ')).rejects.toThrow(
      'El SKU es requerido',
    );

    expect(mockRepo.getBySku).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it('execute debe propagar errores del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.getBySku.mockRejectedValue(new Error('SKU no encontrado'));
    const useCase = new GetProductBySkuUseCase(mockRepo);

    await expect(useCase.execute('SKU-999')).rejects.toThrow('SKU no encontrado');

    expect(mockRepo.getBySku).toHaveBeenCalledTimes(1);
  });
});
