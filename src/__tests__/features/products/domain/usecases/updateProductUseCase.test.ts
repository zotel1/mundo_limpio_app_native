/**
 * WHAT: Tests unitarios para UpdateProductUseCase
 * WHY: Validar id > 0 + mismas reglas de Create (SKU, name, minPrice),
 *      delegacion a repo.update.
 * BENEFITS: Reutiliza las mismas validaciones de dominio que Create.
 */

import { UpdateProductUseCase } from '@features/products/domain/usecases/updateProductUseCase';
import type { ProductRepository } from '@features/products/domain/ports/productRepository';
import { createProduct } from '@features/products/domain/models/product';
import type { Product } from '@features/products/domain/models/product';
import type { ProductFormData } from '@features/products/domain/models/productFormData';

describe('UpdateProductUseCase', () => {
  const updatedProduct: Product = createProduct({
    id: 5,
    sku: 'PROD-005',
    name: 'Producto Actualizado',
    minPrice: 500,
    active: true,
  });

  const validData: ProductFormData = {
    sku: 'PROD-005',
    name: 'Producto Actualizado',
    minPrice: 500,
  };

  const createMockRepo = (): jest.Mocked<ProductRepository> => ({
    getAllActive: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    getBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue(updatedProduct),
    delete: jest.fn(),
    reactivate: jest.fn(),
  });

  // --- Happy path ---

  it('execute con id y datos validos debe delegar a repo.update y retornar producto', async () => {
    const mockRepo = createMockRepo();
    const useCase = new UpdateProductUseCase(mockRepo);

    const result = await useCase.execute(5, validData);

    expect(mockRepo.update).toHaveBeenCalledTimes(1);
    expect(mockRepo.update).toHaveBeenCalledWith(5, validData);
    expect(result).toEqual(updatedProduct);
  });

  // --- ID validation ---

  it('execute con id 0 debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new UpdateProductUseCase(mockRepo);

    await expect(useCase.execute(0, validData)).rejects.toThrow(
      'El ID del producto debe ser mayor a 0',
    );

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('execute con id negativo debe lanzar Error antes de llamar al repo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new UpdateProductUseCase(mockRepo);

    await expect(useCase.execute(-1, validData)).rejects.toThrow(
      'El ID del producto debe ser mayor a 0',
    );

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  // --- SKU validation (misma que Create) ---

  it('execute con SKU invalido debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new UpdateProductUseCase(mockRepo);

    await expect(useCase.execute(5, { ...validData, sku: 'prod-min' })).rejects.toThrow(
      'El SKU debe contener solo mayusculas, numeros y guiones (ej: PROD-001)',
    );

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  // --- Name validation ---

  it('execute con name vacio debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new UpdateProductUseCase(mockRepo);

    await expect(useCase.execute(5, { ...validData, name: '' })).rejects.toThrow(
      'El nombre del producto es requerido',
    );

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  // --- minPrice validation ---

  it('execute con minPrice 0 debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new UpdateProductUseCase(mockRepo);

    await expect(useCase.execute(5, { ...validData, minPrice: 0 })).rejects.toThrow(
      'El precio minimo debe ser mayor a 0',
    );

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it('execute debe propagar errores del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.update.mockRejectedValue(new Error('Producto no encontrado'));
    const useCase = new UpdateProductUseCase(mockRepo);

    await expect(useCase.execute(999, validData)).rejects.toThrow('Producto no encontrado');

    expect(mockRepo.update).toHaveBeenCalledTimes(1);
  });
});
