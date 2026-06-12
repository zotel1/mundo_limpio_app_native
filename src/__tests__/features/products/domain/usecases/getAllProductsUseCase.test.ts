/**
 * WHAT: Tests unitarios para GetAllProductsUseCase
 * WHY: Validar page >= 0, delegacion a repo.getAll (admin puede ver todos),
 *      y propagacion de errores del repositorio.
 * BENEFITS: Testeable sin HTTP — mock puro del puerto.
 */

import { GetAllProductsUseCase } from '@features/products/domain/usecases/getAllProductsUseCase';
import type { ProductRepository } from '@features/products/domain/ports/productRepository';
import { createProduct } from '@features/products/domain/models/product';
import type { Product } from '@features/products/domain/models/product';

describe('GetAllProductsUseCase', () => {
  const mockProducts: Product[] = [
    createProduct({ id: 1, sku: 'A-001', name: 'Activo', minPrice: 100, active: true }),
    createProduct({ id: 2, sku: 'A-002', name: 'Inactivo', minPrice: 50, active: false }),
  ];

  const createMockRepo = (): jest.Mocked<ProductRepository> => ({
    getAllActive: jest.fn(),
    getAll: jest.fn().mockResolvedValue(mockProducts),
    getById: jest.fn(),
    getBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reactivate: jest.fn(),
  });

  // --- Happy path ---

  it('execute con page valida debe delegar a repo.getAll y retornar productos', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetAllProductsUseCase(mockRepo);

    const result = await useCase.execute(0, 10);

    expect(mockRepo.getAll).toHaveBeenCalledTimes(1);
    expect(mockRepo.getAll).toHaveBeenCalledWith(0, 10);
    expect(result).toEqual(mockProducts);
    // Verifica que retorna productos inactivos tambien (admin)
    expect(result.length).toBe(2);
  });

  // --- Domain validation ---

  it('execute con page negativa debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new GetAllProductsUseCase(mockRepo);

    await expect(useCase.execute(-1, 10)).rejects.toThrow(
      'La página debe ser mayor o igual a 0',
    );

    expect(mockRepo.getAll).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it('execute debe propagar errores del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.getAll.mockRejectedValue(new Error('Error de servidor'));
    const useCase = new GetAllProductsUseCase(mockRepo);

    await expect(useCase.execute(0, 10)).rejects.toThrow('Error de servidor');

    expect(mockRepo.getAll).toHaveBeenCalledTimes(1);
  });

  // --- Edge: empty result ---

  it('execute debe permitir page 0 como valor valido', async () => {
    const mockRepo = createMockRepo();
    mockRepo.getAll.mockResolvedValue([]);
    const useCase = new GetAllProductsUseCase(mockRepo);

    const result = await useCase.execute(0, 10);

    expect(result).toEqual([]);
  });
});
