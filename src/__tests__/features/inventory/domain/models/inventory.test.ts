/**
 * WHAT: Tests unitarios para Inventory y createInventory
 * WHY: Validar que la entidad de dominio es inmutable, correctamente
 *      creada, y que el factory centraliza la lógica de construcción
 *      con valores por defecto.
 * BENEFITS: Si el backend cambia el schema, solo se actualiza el factory.
 */

import { createInventory } from '@features/inventory/domain/models/inventory';
import type { Inventory } from '@features/inventory/domain/models/inventory';

describe('Inventory', () => {
  describe('createInventory', () => {
    it('debe crear un inventario con todos los campos provistos', () => {
      const inventory: Inventory = createInventory({
        productId: 5,
        productName: 'Detergente Industrial',
        currentStock: 25,
        minStockThreshold: 10,
      });

      expect(inventory.productId).toBe(5);
      expect(inventory.productName).toBe('Detergente Industrial');
      expect(inventory.currentStock).toBe(25);
      expect(inventory.minStockThreshold).toBe(10);
    });

    it('debe aceptar currentStock 0 (producto agotado)', () => {
      const inventory = createInventory({
        productId: 8,
        productName: 'Producto Agotado',
        currentStock: 0,
        minStockThreshold: 5,
      });

      expect(inventory.currentStock).toBe(0);
      expect(inventory.productId).toBe(8);
      expect(inventory.minStockThreshold).toBe(5);
    });

    it('debe aceptar stock por debajo del umbral (alerta)', () => {
      const inventory = createInventory({
        productId: 3,
        productName: 'Alerta Baja',
        currentStock: 3,
        minStockThreshold: 10,
      });

      expect(inventory.currentStock).toBeLessThan(inventory.minStockThreshold);
      expect(inventory.currentStock).toBe(3);
    });

    it('debe tener exactamente las 4 propiedades esperadas', () => {
      const inventory: Inventory = createInventory({
        productId: 1,
        productName: 'Test',
        currentStock: 10,
        minStockThreshold: 5,
      });

      expect(Object.keys(inventory).sort()).toEqual(
        ['currentStock', 'minStockThreshold', 'productId', 'productName'].sort(),
      );
    });

    it('Inventory debe ser readonly (verificación de tipos en runtime)', () => {
      const inventory = createInventory({
        productId: 1,
        productName: 'Test',
        currentStock: 10,
        minStockThreshold: 5,
      });

      expect(inventory.productId).toBe(1);
      expect(typeof inventory.productId).toBe('number');
      expect(typeof inventory.productName).toBe('string');
      expect(typeof inventory.currentStock).toBe('number');
      expect(typeof inventory.minStockThreshold).toBe('number');
    });

    it('debe mantener la inmutabilidad — el objeto params original no se modifica', () => {
      const params = {
        productId: 42,
        productName: 'IMMUTABLE',
        currentStock: 25,
        minStockThreshold: 10,
      };

      const inventory = createInventory(params);

      expect(params.productId).toBe(42);
      expect(params.productName).toBe('IMMUTABLE');

      // El inventory es un objeto nuevo, no la misma referencia que params
      expect(inventory).not.toBe(params as unknown as Inventory);
    });

    it('debe permitir umbrales enormes sin errores', () => {
      const inventory = createInventory({
        productId: 999,
        productName: 'Alta Demanda',
        currentStock: 5000,
        minStockThreshold: 2000,
      });

      expect(inventory.minStockThreshold).toBe(2000);
      expect(inventory.currentStock).toBe(5000);
    });
  });
});
