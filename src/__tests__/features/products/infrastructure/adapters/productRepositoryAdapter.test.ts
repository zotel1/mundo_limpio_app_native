/**
 * TDD: RED — Tests para ProductRepositoryAdapter.
 *
 * WHAT: Valida que ProductRepositoryAdapter implemente correctamente
 *       el puerto ProductRepository usando ProductApi (mock) y los mappers reales.
 * WHY: El adapter es el único punto donde la API HTTP se conecta con el dominio.
 *      Debe delegar correctamente a ProductApi y mapear DTOs ↔ Domain.
 * BENEFITS: Tests de integración entre API mock + mappers reales.
 *           Cobertura completa de los 8 métodos del puerto.
 */
import { ProductRepositoryAdapter } from '@features/products/infrastructure/adapters/productRepositoryAdapter';
import type { ProductApi } from '@features/products/infrastructure/api/productApi';
import type { ProductResponseDto, ProductPageDto } from '@features/products/infrastructure/api/dtos';
import { ApiException } from '@core/http/apiException';

// Create a mock ProductApi using jest.Mocked
function createMockProductApi(): jest.Mocked<ProductApi> {
  return {
    getAllActive: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    getBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reactivate: jest.fn(),
  } as unknown as jest.Mocked<ProductApi>;
}

describe('ProductRepositoryAdapter', () => {
  let mockApi: jest.Mocked<ProductApi>;
  let adapter: ProductRepositoryAdapter;

  // ──── Fixtures ────

  const productResponse: ProductResponseDto = {
    id: 1,
    sku: 'PROD-001',
    name: 'Detergente Premium',
    minPrice: 25.5,
    active: true,
  };

  const inactiveResponse: ProductResponseDto = {
    id: 2,
    sku: 'PROD-002',
    name: 'Producto Inactivo',
    minPrice: 10.0,
    active: false,
  };

  const pageResponse: ProductPageDto = {
    content: [productResponse, inactiveResponse],
    totalPages: 3,
    totalElements: 25,
    number: 0,
    size: 10,
  };

  const emptyPageResponse: ProductPageDto = {
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 10,
  };

  const formData = {
    sku: 'NEW-001',
    name: 'Nuevo Producto',
    minPrice: 99.99,
  };

  beforeEach(() => {
    mockApi = createMockProductApi();
    adapter = new ProductRepositoryAdapter(mockApi);
  });

  // ──── getAllActive() ────

  describe('getAllActive()', () => {
    it('llama productApi.getAllActive con page y size correctos', async () => {
      mockApi.getAllActive.mockResolvedValueOnce(pageResponse);

      const result = await adapter.getAllActive(2, 15);

      expect(mockApi.getAllActive).toHaveBeenCalledTimes(1);
      expect(mockApi.getAllActive).toHaveBeenCalledWith(2, 15);
      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe(1);
      expect(result[0]?.sku).toBe('PROD-001');
    });

    it('retorna array vacío cuando la página no tiene contenido', async () => {
      mockApi.getAllActive.mockResolvedValueOnce(emptyPageResponse);

      const result = await adapter.getAllActive(0, 10);

      expect(result).toHaveLength(0);
    });

    it('propaga errores lanzados por productApi.getAllActive', async () => {
      const error = new ApiException('Error del servidor', 500);
      mockApi.getAllActive.mockRejectedValueOnce(error);

      await expect(adapter.getAllActive(0, 10)).rejects.toThrow(
        'Error del servidor',
      );
    });
  });

  // ──── getAll() ────

  describe('getAll()', () => {
    it('llama productApi.getAll con page y size correctos', async () => {
      mockApi.getAll.mockResolvedValueOnce(pageResponse);

      const result = await adapter.getAll(1, 20);

      expect(mockApi.getAll).toHaveBeenCalledTimes(1);
      expect(mockApi.getAll).toHaveBeenCalledWith(1, 20);
      expect(result).toHaveLength(2);
    });

    it('incluye productos inactivos en el resultado', async () => {
      mockApi.getAll.mockResolvedValueOnce(pageResponse);

      const result = await adapter.getAll(0, 10);

      const inactives = result.filter((p) => !p.active);
      expect(inactives).toHaveLength(1);
      expect(inactives[0]?.id).toBe(2);
    });

    it('propaga errores de productApi.getAll', async () => {
      const error = new ApiException('No autorizado', 403);
      mockApi.getAll.mockRejectedValueOnce(error);

      await expect(adapter.getAll(0, 10)).rejects.toThrow('No autorizado');
    });
  });

  // ──── getById() ────

  describe('getById()', () => {
    it('llama productApi.getById con el id correcto y retorna Product mapeado', async () => {
      mockApi.getById.mockResolvedValueOnce(productResponse);

      const result = await adapter.getById(1);

      expect(mockApi.getById).toHaveBeenCalledTimes(1);
      expect(mockApi.getById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.sku).toBe('PROD-001');
      expect(result.name).toBe('Detergente Premium');
      expect(result.minPrice).toBe(25.5);
      expect(result.active).toBe(true);
    });

    it('retorna producto inactivo correctamente cuando active=false', async () => {
      mockApi.getById.mockResolvedValueOnce(inactiveResponse);

      const result = await adapter.getById(2);

      expect(result.active).toBe(false);
    });

    it('propaga NotFoundException de productApi.getById', async () => {
      const error = new ApiException('Producto no encontrado', 404);
      mockApi.getById.mockRejectedValueOnce(error);

      await expect(adapter.getById(999)).rejects.toThrow(
        'Producto no encontrado',
      );
    });
  });

  // ──── getBySku() ────

  describe('getBySku()', () => {
    it('llama productApi.getBySku con el sku correcto y retorna Product', async () => {
      mockApi.getBySku.mockResolvedValueOnce(productResponse);

      const result = await adapter.getBySku('PROD-001');

      expect(mockApi.getBySku).toHaveBeenCalledTimes(1);
      expect(mockApi.getBySku).toHaveBeenCalledWith('PROD-001');
      expect(result.sku).toBe('PROD-001');
    });

    it('propaga errores de productApi.getBySku', async () => {
      const error = new ApiException('SKU no encontrado', 404);
      mockApi.getBySku.mockRejectedValueOnce(error);

      await expect(adapter.getBySku('INVALID')).rejects.toThrow(
        'SKU no encontrado',
      );
    });
  });

  // ──── create() ────

  describe('create()', () => {
    it('convierte ProductFormData a ProductRequestDto y llama productApi.create', async () => {
      const createdResponse: ProductResponseDto = {
        id: 3,
        sku: 'NEW-001',
        name: 'Nuevo Producto',
        minPrice: 99.99,
        active: true,
      };
      mockApi.create.mockResolvedValueOnce(createdResponse);

      const result = await adapter.create(formData);

      expect(mockApi.create).toHaveBeenCalledTimes(1);
      expect(mockApi.create).toHaveBeenCalledWith({
        sku: 'NEW-001',
        name: 'Nuevo Producto',
        minPrice: 99.99,
      });
      expect(result.id).toBe(3);
      expect(result.sku).toBe('NEW-001');
      expect(result.active).toBe(true);
    });

    it('retorna el Product creado con los datos del backend', async () => {
      const backendResponse: ProductResponseDto = {
        id: 42,
        sku: 'NEW-001',
        name: 'Nuevo Producto',
        minPrice: 99.99,
        active: true,
      };
      mockApi.create.mockResolvedValueOnce(backendResponse);

      const result = await adapter.create(formData);

      expect(result.id).toBe(42);
    });

    it('propaga ConflictException (409) de productApi.create', async () => {
      const error = new ApiException('El SKU ya existe', 409);
      mockApi.create.mockRejectedValueOnce(error);

      await expect(adapter.create(formData)).rejects.toThrow(
        'El SKU ya existe',
      );
    });

    it('propaga ValidationException (400) de productApi.create', async () => {
      const error = new ApiException('Datos inválidos', 400);
      mockApi.create.mockRejectedValueOnce(error);

      await expect(adapter.create(formData)).rejects.toThrow(
        'Datos inválidos',
      );
    });
  });

  // ──── update() ────

  describe('update()', () => {
    it('convierte ProductFormData a ProductRequestDto y llama productApi.update con id', async () => {
      const updatedResponse: ProductResponseDto = {
        id: 1,
        sku: 'NEW-001',
        name: 'Nombre Editado',
        minPrice: 150.0,
        active: true,
      };
      mockApi.update.mockResolvedValueOnce(updatedResponse);

      const result = await adapter.update(1, formData);

      expect(mockApi.update).toHaveBeenCalledTimes(1);
      expect(mockApi.update).toHaveBeenCalledWith(1, {
        sku: 'NEW-001',
        name: 'Nuevo Producto',
        minPrice: 99.99,
      });
      expect(result.id).toBe(1);
      expect(result.name).toBe('Nombre Editado');
    });

    it('propaga NotFoundException (404) de productApi.update', async () => {
      const error = new ApiException('Producto no encontrado', 404);
      mockApi.update.mockRejectedValueOnce(error);

      await expect(adapter.update(999, formData)).rejects.toThrow(
        'Producto no encontrado',
      );
    });

    it('propaga ConflictException (409) si el nuevo SKU ya existe', async () => {
      const error = new ApiException('SKU duplicado', 409);
      mockApi.update.mockRejectedValueOnce(error);

      await expect(adapter.update(1, formData)).rejects.toThrow(
        'SKU duplicado',
      );
    });
  });

  // ──── delete() ────

  describe('delete()', () => {
    it('llama productApi.delete con el id correcto (soft-delete)', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      await adapter.delete(1);

      expect(mockApi.delete).toHaveBeenCalledTimes(1);
      expect(mockApi.delete).toHaveBeenCalledWith(1);
    });

    it('no retorna valor (void)', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const result = await adapter.delete(1);

      expect(result).toBeUndefined();
    });

    it('propaga errores de productApi.delete', async () => {
      const error = new ApiException('Producto no encontrado', 404);
      mockApi.delete.mockRejectedValueOnce(error);

      await expect(adapter.delete(999)).rejects.toThrow(
        'Producto no encontrado',
      );
    });
  });

  // ──── reactivate() ────

  describe('reactivate()', () => {
    it('llama productApi.reactivate con el id correcto', async () => {
      mockApi.reactivate.mockResolvedValueOnce(undefined);

      await adapter.reactivate(2);

      expect(mockApi.reactivate).toHaveBeenCalledTimes(1);
      expect(mockApi.reactivate).toHaveBeenCalledWith(2);
    });

    it('no retorna valor (void)', async () => {
      mockApi.reactivate.mockResolvedValueOnce(undefined);

      const result = await adapter.reactivate(2);

      expect(result).toBeUndefined();
    });

    it('propaga errores de productApi.reactivate', async () => {
      const error = new ApiException('Producto no encontrado', 404);
      mockApi.reactivate.mockRejectedValueOnce(error);

      await expect(adapter.reactivate(999)).rejects.toThrow(
        'Producto no encontrado',
      );
    });
  });

  // ──── Propagación genérica ────

  describe('propagación genérica de errores', () => {
    it('propaga NetworkException del interceptor en cualquier método', async () => {
      const networkError = new ApiException('Error de conexión', 0);
      mockApi.getById.mockRejectedValueOnce(networkError);

      await expect(adapter.getById(1)).rejects.toThrow('Error de conexión');
    });

    it('propaga ServerException (500) del backend', async () => {
      const serverError = new ApiException('Error interno', 500);
      mockApi.getAllActive.mockRejectedValueOnce(serverError);

      await expect(adapter.getAllActive(0, 10)).rejects.toThrow(
        'Error interno',
      );
    });

    it('no transforma el mensaje del error original', async () => {
      const exactMessage = 'Error exacto del servidor — no modificar';
      const error = new ApiException(exactMessage, 500);
      mockApi.create.mockRejectedValueOnce(error);

      await expect(adapter.create(formData)).rejects.toThrow(exactMessage);
    });
  });
});
