/**
 * WHAT: Tests unitarios para CreateProductUseCase
 * WHY: Validar reglas de negocio: SKU regex /^[A-Z0-9-]+$/, name no vacio,
 *      minPrice > 0, delegacion a repo.create.
 * BENEFITS: Testeable sin HTTP — validaciones de dominio puras.
 */

import { CreateProductUseCase } from '@features/products/domain/usecases/createProductUseCase';
import type { ProductRepository } from '@features/products/domain/ports/productRepository';
import { createProduct } from '@features/products/domain/models/product';
import type { Product } from '@features/products/domain/models/product';
import type { ProductFormData } from '@features/products/domain/models/productFormData';

describe('CreateProductUseCase', () => {
  const createdProduct: Product = createProduct({
    id: 10,
    sku: 'PROD-010',
    name: 'Nuevo Producto',
    minPrice: 250,
    active: true,
  });

  const validData: ProductFormData = {
    sku: 'PROD-010',
    name: 'Nuevo Producto',
    minPrice: 250,
  };

  const createMockRepo = (): jest.Mocked<ProductRepository> => ({
    getAllActive: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    getBySku: jest.fn(),
    create: jest.fn().mockResolvedValue(createdProduct),
    update: jest.fn(),
    delete: jest.fn(),
    reactivate: jest.fn(),
  });

  // --- Happy path ---

  it('execute con datos validos debe delegar a repo.create y retornar producto', async () => {
    const mockRepo = createMockRepo();
    const useCase = new CreateProductUseCase(mockRepo);

    const result = await useCase.execute(validData);

    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    expect(mockRepo.create).toHaveBeenCalledWith(validData);
    expect(result).toEqual(createdProduct);
  });

  // --- SKU validation ---

  it('execute con SKU vacio debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new CreateProductUseCase(mockRepo);

    await expect(useCase.execute({ ...validData, sku: '' })).rejects.toThrow(
      'El SKU debe contener solo mayusculas, numeros y guiones (ej: PROD-001)',
    );

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('execute con SKU en minusculas debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new CreateProductUseCase(mockRepo);

    await expect(useCase.execute({ ...validData, sku: 'prod-001' })).rejects.toThrow(
      'El SKU debe contener solo mayusculas, numeros y guiones (ej: PROD-001)',
    );

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('execute con SKU con caracteres especiales debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new CreateProductUseCase(mockRepo);

    await expect(useCase.execute({ ...validData, sku: 'PROD@001' })).rejects.toThrow(
      'El SKU debe contener solo mayusculas, numeros y guiones (ej: PROD-001)',
    );

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('execute con SKU valido con guiones y numeros debe aceptarlo', async () => {
    const mockRepo = createMockRepo();
    const useCase = new CreateProductUseCase(mockRepo);

    const result = await useCase.execute({ ...validData, sku: 'ABC-123-XYZ' });

    expect(mockRepo.create).toHaveBeenCalledWith({ ...validData, sku: 'ABC-123-XYZ' });
    expect(result).toEqual(createdProduct);
  });

  // --- Name validation ---

  it('execute con name vacio debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new CreateProductUseCase(mockRepo);

    await expect(useCase.execute({ ...validData, name: '' })).rejects.toThrow(
      'El nombre del producto es requerido',
    );

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('execute con name de solo espacios debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new CreateProductUseCase(mockRepo);

    await expect(useCase.execute({ ...validData, name: '   ' })).rejects.toThrow(
      'El nombre del producto es requerido',
    );

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  // --- minPrice validation ---

  it('execute con minPrice 0 debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new CreateProductUseCase(mockRepo);

    await expect(useCase.execute({ ...validData, minPrice: 0 })).rejects.toThrow(
      'El precio minimo debe ser mayor a 0',
    );

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('execute con minPrice negativo debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new CreateProductUseCase(mockRepo);

    await expect(useCase.execute({ ...validData, minPrice: -100 })).rejects.toThrow(
      'El precio minimo debe ser mayor a 0',
    );

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it('execute debe propagar errores del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.create.mockRejectedValue(new Error('SKU duplicado'));
    const useCase = new CreateProductUseCase(mockRepo);

    await expect(useCase.execute(validData)).rejects.toThrow('SKU duplicado');

    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });
});
