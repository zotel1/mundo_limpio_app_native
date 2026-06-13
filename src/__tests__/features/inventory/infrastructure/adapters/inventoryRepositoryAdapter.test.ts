/**
 * TDD: RED — Tests para InventoryRepositoryAdapter.
 *
 * WHAT: Valida que InventoryRepositoryAdapter implemente correctamente los 3
 *       métodos del puerto InventoryRepository usando InventoryApi + mappers.
 * WHY: El adapter es la implementación concreta del puerto InventoryRepository.
 *      Traduce llamadas HTTP (InventoryApi) + DTOs (Zod) a entidades de dominio
 *      puras usando los mappers.
 * BENEFITS: Test unitario con mock de InventoryApi — sin red real.
 *           Mismo patrón que AuthRepositoryAdapter y ProductRepositoryAdapter.
 */
import { InventoryApi } from '@features/inventory/infrastructure/api/inventoryApi';
import type { InventoryResponseDto } from '@features/inventory/infrastructure/api/dtos';
import { InventoryRepositoryAdapter } from '@features/inventory/infrastructure/adapters/inventoryRepositoryAdapter';
import type { Inventory } from '@features/inventory/domain';
import { createStockAdjustment } from '@features/inventory/domain';
import type { StockAdjustment } from '@features/inventory/domain';

describe('InventoryRepositoryAdapter', () => {
  let mockApi: jest.Mocked<InventoryApi>;
  let adapter: InventoryRepositoryAdapter;

  const validDto: InventoryResponseDto = {
    productId: 5,
    productName: 'Detergente Industrial',
    currentStock: 25,
    minStockThreshold: 10,
  };

  beforeEach(() => {
    mockApi = {
      getByProductId: jest.fn(),
      getLowStock: jest.fn(),
      adjustStock: jest.fn(),
    } as unknown as jest.Mocked<InventoryApi>;

    adapter = new InventoryRepositoryAdapter(mockApi);
  });

  // ──── getByProductId ────

  describe('getByProductId()', () => {
    it('llama api.getByProductId y mapea respuesta a Inventory del dominio', async () => {
      mockApi.getByProductId.mockResolvedValueOnce(validDto);

      const result: Inventory = await adapter.getByProductId(5);

      expect(mockApi.getByProductId).toHaveBeenCalledTimes(1);
      expect(mockApi.getByProductId).toHaveBeenCalledWith(5);
      expect(result.productId).toBe(5);
      expect(result.productName).toBe('Detergente Industrial');
      expect(result.currentStock).toBe(25);
      expect(result.minStockThreshold).toBe(10);
    });

    it('retorna Inventory con stock=0 cuando el DTO tiene currentStock=0', async () => {
      mockApi.getByProductId.mockResolvedValueOnce({
        ...validDto,
        productId: 8,
        productName: 'Agotado',
        currentStock: 0,
      });

      const result = await adapter.getByProductId(8);

      expect(result.currentStock).toBe(0);
      expect(result.productId).toBe(8);
    });

    it('propaga errores lanzados por api.getByProductId', async () => {
      const apiError = new Error('Network Error');
      mockApi.getByProductId.mockRejectedValueOnce(apiError);

      await expect(adapter.getByProductId(5)).rejects.toThrow('Network Error');
    });
  });

  // ──── getLowStock ────

  describe('getLowStock()', () => {
    it('llama api.getLowStock y mapea array de DTOs a Inventory[] del dominio', async () => {
      mockApi.getLowStock.mockResolvedValueOnce([
        validDto,
        {
          productId: 8,
          productName: 'Cloro Líquido',
          currentStock: 2,
          minStockThreshold: 15,
        },
      ]);

      const result: Inventory[] = await adapter.getLowStock();

      expect(mockApi.getLowStock).toHaveBeenCalledTimes(1);
      expect(mockApi.getLowStock).toHaveBeenCalledWith();
      expect(result).toHaveLength(2);
      expect(result[0]!.productId).toBe(5);
      expect(result[0]!.productName).toBe('Detergente Industrial');
      expect(result[1]!.productId).toBe(8);
      expect(result[1]!.currentStock).toBe(2);
      expect(result[1]!.minStockThreshold).toBe(15);
    });

    it('retorna array vacío cuando no hay productos con stock bajo', async () => {
      mockApi.getLowStock.mockResolvedValueOnce([]);

      const result = await adapter.getLowStock();

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('retorna array de Inventory con un solo elemento', async () => {
      const singleDto: InventoryResponseDto = {
        productId: 1,
        productName: 'Solo',
        currentStock: 3,
        minStockThreshold: 10,
      };
      mockApi.getLowStock.mockResolvedValueOnce([singleDto]);

      const result = await adapter.getLowStock();

      expect(result).toHaveLength(1);
      expect(result[0]!.productId).toBe(1);
      expect(result[0]!.productName).toBe('Solo');
      expect(result[0]!.currentStock).toBe(3);
      expect(result[0]!.minStockThreshold).toBe(10);
    });

    it('propaga errores lanzados por api.getLowStock', async () => {
      const apiError = new Error('Server Error');
      mockApi.getLowStock.mockRejectedValueOnce(apiError);

      await expect(adapter.getLowStock()).rejects.toThrow('Server Error');
    });
  });

  // ──── adjustStock ────

  describe('adjustStock()', () => {
    it('mapea StockAdjustment → DTO, llama api.adjustStock y mapea respuesta', async () => {
      const adjustment: StockAdjustment = createStockAdjustment({
        type: 'ADJUSTMENT',
        quantity: 10,
        reason: 'Reposición de stock por conteo manual',
      });

      mockApi.adjustStock.mockResolvedValueOnce({
        ...validDto,
        currentStock: 35, // stock actualizado después del ajuste
      });

      const result: Inventory = await adapter.adjustStock(5, adjustment);

      expect(mockApi.adjustStock).toHaveBeenCalledTimes(1);
      expect(mockApi.adjustStock).toHaveBeenCalledWith(5, {
        type: 'ADJUSTMENT',
        quantity: 10,
        reason: 'Reposición de stock por conteo manual',
      });
      expect(result.productId).toBe(5);
      expect(result.currentStock).toBe(35);
      expect(result.productName).toBe('Detergente Industrial');
    });

    it('maneja decremento (quantity negativo en StockAdjustment)', async () => {
      const adjustment: StockAdjustment = createStockAdjustment({
        type: 'BREAKAGE',
        quantity: -5,
        reason: 'Rotura de envase en almacén',
      });

      mockApi.adjustStock.mockResolvedValueOnce({
        ...validDto,
        currentStock: 20, // 25 - 5 = 20
      });

      const result = await adapter.adjustStock(5, adjustment);

      expect(mockApi.adjustStock).toHaveBeenCalledWith(5, {
        type: 'BREAKAGE',
        quantity: -5,
        reason: 'Rotura de envase en almacén',
      });
      expect(result.currentStock).toBe(20);
    });

    it('maneja tipo RETURN con quantity positivo', async () => {
      const adjustment: StockAdjustment = createStockAdjustment({
        type: 'RETURN',
        quantity: 3,
        reason: 'Devolución de cliente',
      });

      mockApi.adjustStock.mockResolvedValueOnce({
        ...validDto,
        currentStock: 28,
      });

      const result = await adapter.adjustStock(5, adjustment);

      expect(mockApi.adjustStock).toHaveBeenCalledWith(5, {
        type: 'RETURN',
        quantity: 3,
        reason: 'Devolución de cliente',
      });
      expect(result.currentStock).toBe(28);
    });

    it('maneja tipo QUALITY_LOSS con quantity negativo', async () => {
      const adjustment: StockAdjustment = createStockAdjustment({
        type: 'QUALITY_LOSS',
        quantity: -2,
        reason: 'Producto vencido en estantería B',
      });

      mockApi.adjustStock.mockResolvedValueOnce({
        ...validDto,
        currentStock: 23,
      });

      const result = await adapter.adjustStock(5, adjustment);

      expect(mockApi.adjustStock).toHaveBeenCalledWith(5, {
        type: 'QUALITY_LOSS',
        quantity: -2,
        reason: 'Producto vencido en estantería B',
      });
      expect(result.currentStock).toBe(23);
    });

    it('propaga errores lanzados por api.adjustStock', async () => {
      const adjustment: StockAdjustment = createStockAdjustment({
        type: 'ADJUSTMENT',
        quantity: 10,
        reason: 'Test error',
      });

      const apiError = new Error('Conflict');
      mockApi.adjustStock.mockRejectedValueOnce(apiError);

      await expect(adapter.adjustStock(5, adjustment)).rejects.toThrow('Conflict');
    });
  });
});
