/**
 * WHAT: Tests unitarios para GetProductsUseCase
 * WHY: Validar reglas de dominio: page >= 0, delegacion correcta a getAllActive,
 *      propagacion de errores del repositorio.
 * BENEFITS: El use case es testeable sin HTTP ni UI — mock puro del puerto.
 */

import { GetProductsUseCase } from '@features/products/domain/usecases/getProductsUseCase';
import type { ProductRepository } from '@features/products/domain/ports/productRepository';
import { createProduct } from '@features/products/domain/models/product';
import type { Product } from '@features/products/domain/models/product';

describe('GetProductsUseCase', () => {
  const mockProducts: Product[] = [
    createProduct({ id: 1, sku: 'PROD-001', name: 'Producto A', minPrice: 100, active: true }),
    createProduct({ id: 2, sku: 'PROD-002', name: 'Producto B', minPrice: 200, active: true }),
  ];

  const createMockRepo = (): jest.Mocked<ProductRepository> => ({
    getAllActive: jest.fn().mockResolvedValue(mockProducts),
    getAll: jest.fn(),
    getById: jest.fn(),
    getBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reactivate: jest.fn(),
  });

  // --- Happy path ---

  it('execute con page valida debe delegar a repo.getAllActive y retornar productos', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetProductsUseCase(mockRepo);

    const result = await useCase.execute(0, 10);

    expect(mockRepo.getAllActive).toHaveBeenCalledTimes(1);
    expect(mockRepo.getAllActive).toHaveBeenCalledWith(0, 10);
    expect(result).toEqual(mockProducts);
  });

  it('execute con page positiva debe funcionar correctamente', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetProductsUseCase(mockRepo);

    const result = await useCase.execute(3, 20);

    expect(mockRepo.getAllActive).toHaveBeenCalledWith(3, 20);
    expect(result).toEqual(mockProducts);
  });

  // --- Domain validation ---

  it('execute con page negativa debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetProductsUseCase(mockRepo);

    await expect(useCase.execute(-1, 10)).rejects.toThrow(
      'La página debe ser mayor o igual a 0',
    );

    expect(mockRepo.getAllActive).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it('execute debe propagar errores del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.getAllActive.mockRejectedValue(new Error('Error de red'));
    const useCase = new GetProductsUseCase(mockRepo);

    await expect(useCase.execute(0, 10)).rejects.toThrow('Error de red');

    expect(mockRepo.getAllActive).toHaveBeenCalledTimes(1);
  });

  // --- Edge: empty result ---

  it('execute con pagina sin resultados debe retornar array vacio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.getAllActive.mockResolvedValue([]);
    const useCase = new GetProductsUseCase(mockRepo);

    const result = await useCase.execute(5, 10);

    expect(result).toEqual([]);
  });
});
