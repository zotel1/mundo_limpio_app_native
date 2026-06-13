/**
 * TDD: RED — Tests para InventoryApi.
 *
 * WHAT: Valida que InventoryApi realice las llamadas HTTP correctas a los
 *       endpoints de inventario y valide las respuestas con Zod.
 * WHY: InventoryApi encapsula Axios + Zod. Los tests verifican URLs, método
 *      HTTP, payload, y validación de respuesta sin depender de un backend real.
 * BENEFITS: Cobertura de integración HTTP → Zod → DTO sin servidor real.
 *           Mismo patrón que AuthApi de Fase 1.
 */
import { AxiosInstance } from 'axios';
import { InventoryApi } from '@features/inventory/infrastructure/api/inventoryApi';

describe('InventoryApi', () => {
  let mockClient: jest.Mocked<AxiosInstance>;
  let api: InventoryApi;

  const validInventoryResponse = {
    productId: 5,
    productName: 'Detergente Industrial',
    currentStock: 25,
    minStockThreshold: 10,
  };

  beforeEach(() => {
    mockClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
      },
      defaults: { headers: { common: {} } },
    } as unknown as jest.Mocked<AxiosInstance>;

    api = new InventoryApi(mockClient);
  });

  // ──── getByProductId ────

  describe('getByProductId()', () => {
    it('llama GET /api/v1/inventory/{productId} y parsea respuesta', async () => {
      mockClient.get.mockResolvedValueOnce({ data: validInventoryResponse });

      const result = await api.getByProductId(5);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/inventory/5');
      expect(result.productId).toBe(5);
      expect(result.productName).toBe('Detergente Industrial');
      expect(result.currentStock).toBe(25);
      expect(result.minStockThreshold).toBe(10);
    });

    it('lanza error de Zod si la respuesta no tiene productId', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          productName: 'Sin ID',
          currentStock: 10,
          minStockThreshold: 5,
        },
      });

      await expect(api.getByProductId(1)).rejects.toThrow();
    });

    it('lanza error de Zod si la respuesta tiene currentStock string', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          ...validInventoryResponse,
          currentStock: 'veinticinco',
        },
      });

      await expect(api.getByProductId(5)).rejects.toThrow();
    });

    it('propaga errores de Axios (error de red)', async () => {
      const networkError = new Error('Network Error');
      mockClient.get.mockRejectedValueOnce(networkError);

      await expect(api.getByProductId(5)).rejects.toThrow('Network Error');
    });
  });

  // ──── getLowStock ────

  describe('getLowStock()', () => {
    it('llama GET /api/v1/inventory/low-stock y parsea array de respuestas', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: [
          validInventoryResponse,
          {
            productId: 8,
            productName: 'Cloro Líquido',
            currentStock: 2,
            minStockThreshold: 15,
          },
        ],
      });

      const result = await api.getLowStock();

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/inventory/low-stock');
      expect(result).toHaveLength(2);
      expect(result[0]!.productId).toBe(5);
      expect(result[0]!.productName).toBe('Detergente Industrial');
      expect(result[1]!.productId).toBe(8);
      expect(result[1]!.currentStock).toBe(2);
    });

    it('accepta array vacío (sin productos con stock bajo)', async () => {
      mockClient.get.mockResolvedValueOnce({ data: [] });

      const result = await api.getLowStock();

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('lanza error de Zod si un elemento del array es inválido', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: [
          validInventoryResponse,
          {
            productId: 'ocho', // debería ser number
            productName: 'Inválido',
            currentStock: 2,
            minStockThreshold: 15,
          },
        ],
      });

      await expect(api.getLowStock()).rejects.toThrow();
    });

    it('lanza error de Zod si la respuesta no es un array', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: { not: 'an array' },
      });

      await expect(api.getLowStock()).rejects.toThrow();
    });

    it('propaga errores de Axios (error de red)', async () => {
      const networkError = new Error('Network Error');
      mockClient.get.mockRejectedValueOnce(networkError);

      await expect(api.getLowStock()).rejects.toThrow('Network Error');
    });
  });

  // ──── adjustStock ────

  describe('adjustStock()', () => {
    const validAdjustment = {
      type: 'ADJUSTMENT',
      quantity: 10,
      reason: 'Reposición de stock por conteo manual',
    };

    it('llama POST /api/v1/inventory/{productId}/adjust con body correcto', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: {
          ...validInventoryResponse,
          currentStock: 35, // stock actualizado después del ajuste
        },
      });

      const result = await api.adjustStock(5, validAdjustment);

      expect(mockClient.post).toHaveBeenCalledTimes(1);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/inventory/5/adjust',
        validAdjustment,
      );
      expect(result.productId).toBe(5);
      expect(result.currentStock).toBe(35);
    });

    it('valida request con Zod y lanza si type está vacío', async () => {
      await expect(
        api.adjustStock(5, {
          type: '',
          quantity: 10,
          reason: 'Reposición',
        }),
      ).rejects.toThrow();

      // No debe llamar al cliente HTTP si el request es inválido
      expect(mockClient.post).not.toHaveBeenCalled();
    });

    it('valida request con Zod y lanza si reason está vacía', async () => {
      await expect(
        api.adjustStock(5, {
          type: 'ADJUSTMENT',
          quantity: 10,
          reason: '',
        }),
      ).rejects.toThrow();

      expect(mockClient.post).not.toHaveBeenCalled();
    });

    it('acepta quantity negativo (decremento)', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: {
          ...validInventoryResponse,
          currentStock: 20, // 25 - 5 = 20
        },
      });

      const result = await api.adjustStock(5, {
        type: 'BREAKAGE',
        quantity: -5,
        reason: 'Rotura de envase',
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/inventory/5/adjust',
        {
          type: 'BREAKAGE',
          quantity: -5,
          reason: 'Rotura de envase',
        },
      );
      expect(result.currentStock).toBe(20);
    });

    it('lanza error de Zod si la respuesta no tiene minStockThreshold', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: {
          productId: 5,
          productName: 'Detergente',
          currentStock: 35,
          // falta minStockThreshold
        },
      });

      await expect(
        api.adjustStock(5, validAdjustment),
      ).rejects.toThrow();
    });

    it('propaga errores de Axios (error de red)', async () => {
      const networkError = new Error('Network Error');
      mockClient.post.mockRejectedValueOnce(networkError);

      await expect(
        api.adjustStock(5, validAdjustment),
      ).rejects.toThrow('Network Error');
    });
  });
});
