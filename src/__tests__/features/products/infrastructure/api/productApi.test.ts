/**
 * TDD: RED — Tests para ProductApi.
 *
 * WHAT: Valida que ProductApi realice las llamadas HTTP correctas a los 8 endpoints
 *       de productos y valide las respuestas con Zod.
 * WHY: ProductApi encapsula Axios + Zod. Los tests verifican URLs, método HTTP,
 *      payload, y validación de respuesta sin depender de un backend real.
 * BENEFITS: Cobertura de integración HTTP → Zod → DTO sin servidor real.
 */
import { AxiosInstance } from 'axios';
import { ProductApi } from '@features/products/infrastructure/api/productApi';
import { ApiException } from '@core/http/apiException';

describe('ProductApi', () => {
  let mockClient: jest.Mocked<AxiosInstance>;
  let api: ProductApi;

  const validProductResponse = {
    id: 1,
    sku: 'PROD-001',
    name: 'Detergente Premium',
    minPrice: 25.5,
    active: true,
  };

  const validPageResponse = {
    content: [validProductResponse],
    totalPages: 1,
    totalElements: 1,
    number: 0,
    size: 10,
  };

  const validRequest = {
    sku: 'PROD-002',
    name: 'Lavandina',
    minPrice: 15.0,
  };

  beforeEach(() => {
    mockClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
      },
      defaults: { headers: { common: {} } },
    } as unknown as jest.Mocked<AxiosInstance>;

    api = new ProductApi(mockClient);
  });

  // ──── getAllActive() ────

  describe('getAllActive()', () => {
    it('llama GET /api/v1/products con page y size', async () => {
      mockClient.get.mockResolvedValueOnce({ data: validPageResponse });

      const result = await api.getAllActive(0, 10);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/products?page=0&size=10',
      );
      expect(result.content).toHaveLength(1);
      expect(result.content[0].id).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('valida respuesta con Zod y lanza si es inválida', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: { invalid: true },
      });

      await expect(api.getAllActive(0, 10)).rejects.toThrow();
    });
  });

  // ──── getAll() ────

  describe('getAll()', () => {
    it('llama GET /api/v1/products/all con page y size', async () => {
      mockClient.get.mockResolvedValueOnce({ data: validPageResponse });

      const result = await api.getAll(1, 20);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/products/all?page=1&size=20',
      );
      expect(result.content).toHaveLength(1);
    });

    it('valida respuesta con Zod y lanza si es inválida', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: { content: 'not-an-array' },
      });

      await expect(api.getAll(0, 10)).rejects.toThrow();
    });
  });

  // ──── getById() ────

  describe('getById()', () => {
    it('llama GET /api/v1/products/{id}', async () => {
      mockClient.get.mockResolvedValueOnce({ data: validProductResponse });

      const result = await api.getById(1);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/products/1');
      expect(result.id).toBe(1);
      expect(result.sku).toBe('PROD-001');
    });

    it('valida respuesta con Zod y lanza si es inválida', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: { id: 1, sku: 'X' },
      });

      await expect(api.getById(1)).rejects.toThrow();
    });
  });

  // ──── getBySku() ────

  describe('getBySku()', () => {
    it('llama GET /api/v1/products/sku/{sku}', async () => {
      mockClient.get.mockResolvedValueOnce({ data: validProductResponse });

      const result = await api.getBySku('PROD-001');

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/products/sku/PROD-001',
      );
      expect(result.sku).toBe('PROD-001');
    });

    it('valida respuesta con Zod y lanza si es inválida', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: { id: 1 },
      });

      await expect(api.getBySku('PROD-001')).rejects.toThrow();
    });
  });

  // ──── create() ────

  describe('create()', () => {
    it('llama POST /api/v1/products con body y valida respuesta', async () => {
      mockClient.post.mockResolvedValueOnce({ data: validProductResponse });

      const result = await api.create(validRequest);

      expect(mockClient.post).toHaveBeenCalledTimes(1);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/products',
        validRequest,
      );
      expect(result.id).toBe(1);
    });

    it('valida request con Zod y no llama HTTP si SKU es inválido', async () => {
      await expect(
        api.create({ ...validRequest, sku: 'prod-bad' }),
      ).rejects.toThrow();
      expect(mockClient.post).not.toHaveBeenCalled();
    });

    it('valida request con Zod y no llama HTTP si name está vacío', async () => {
      await expect(
        api.create({ ...validRequest, name: '' }),
      ).rejects.toThrow();
      expect(mockClient.post).not.toHaveBeenCalled();
    });

    it('valida request con Zod y no llama HTTP si minPrice es negativo', async () => {
      await expect(
        api.create({ ...validRequest, minPrice: -1 }),
      ).rejects.toThrow();
      expect(mockClient.post).not.toHaveBeenCalled();
    });
  });

  // ──── update() ────

  describe('update()', () => {
    it('llama PUT /api/v1/products/{id} con body y valida respuesta', async () => {
      mockClient.put.mockResolvedValueOnce({ data: validProductResponse });

      const result = await api.update(1, validRequest);

      expect(mockClient.put).toHaveBeenCalledTimes(1);
      expect(mockClient.put).toHaveBeenCalledWith(
        '/api/v1/products/1',
        validRequest,
      );
      expect(result.sku).toBe('PROD-001');
    });

    it('valida request con Zod antes de enviar', async () => {
      await expect(
        api.update(1, { ...validRequest, sku: 'bad' }),
      ).rejects.toThrow();
      expect(mockClient.put).not.toHaveBeenCalled();
    });
  });

  // ──── delete() ────

  describe('delete()', () => {
    it('llama DELETE /api/v1/products/{id} y espera 204', async () => {
      mockClient.delete.mockResolvedValueOnce({ data: '' });

      await api.delete(1);

      expect(mockClient.delete).toHaveBeenCalledTimes(1);
      expect(mockClient.delete).toHaveBeenCalledWith('/api/v1/products/1');
    });
  });

  // ──── reactivate() ────

  describe('reactivate()', () => {
    it('llama PATCH /api/v1/products/{id}/reactivate y espera 204', async () => {
      mockClient.patch.mockResolvedValueOnce({ data: '' });

      await api.reactivate(1);

      expect(mockClient.patch).toHaveBeenCalledTimes(1);
      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/v1/products/1/reactivate',
      );
    });
  });

  // ──── Propagación de errores ────

  describe('propagación de errores', () => {
    it('propaga ApiException del interceptor (error 409 — conflicto)', async () => {
      const conflictError = new ApiException('SKU duplicado', 409);
      mockClient.post.mockRejectedValueOnce(conflictError);

      await expect(api.create(validRequest)).rejects.toThrow('SKU duplicado');
    });

    it('propaga NetworkException del interceptor', async () => {
      const networkError = new ApiException(
        'Error de conexión. Verificá tu internet.',
        0,
      );
      mockClient.get.mockRejectedValueOnce(networkError);

      await expect(api.getAllActive(0, 10)).rejects.toThrow(
        'Error de conexión',
      );
    });

    it('propaga NotFoundException (404) en getById', async () => {
      const notFoundError = new ApiException('Producto no encontrado', 404);
      mockClient.get.mockRejectedValueOnce(notFoundError);

      await expect(api.getById(999)).rejects.toThrow(
        'Producto no encontrado',
      );
    });
  });
});
