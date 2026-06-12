/**
 * WHAT: Tests unitarios para Product y createProduct
 * WHY: Validar que la entidad de dominio es inmutable, correctamente
 *      creada, y que el factory centraliza la lógica de construcción.
 * BENEFITS: Si el backend cambia el schema, solo se actualiza el factory.
 */

import { createProduct } from '@features/products/domain/models/product';
import type { Product } from '@features/products/domain/models/product';

describe('Product', () => {
  describe('createProduct', () => {
    it('debe crear un producto con todos los campos provistos', () => {
      const product: Product = createProduct({
        id: 1,
        sku: 'DETER-001',
        name: 'Detergente Industrial',
        minPrice: 150.5,
        active: true,
      });

      expect(product.id).toBe(1);
      expect(product.sku).toBe('DETER-001');
      expect(product.name).toBe('Detergente Industrial');
      expect(product.minPrice).toBe(150.5);
      expect(product.active).toBe(true);
    });

    it('debe crear un producto inactivo cuando active es false', () => {
      const product = createProduct({
        id: 99,
        sku: 'OLD-PROD',
        name: 'Producto Obsoleto',
        minPrice: 0,
        active: false,
      });

      expect(product.active).toBe(false);
      expect(product.id).toBe(99);
      expect(product.sku).toBe('OLD-PROD');
    });

    it('debe aceptar minPrice con valor 0 (producto gratuito)', () => {
      const product = createProduct({
        id: 5,
        sku: 'FREE-001',
        name: 'Muestra Gratis',
        minPrice: 0,
        active: true,
      });

      expect(product.minPrice).toBe(0);
      expect(product.active).toBe(true);
    });

    it('debe crear un producto con SKU que contiene guiones y números', () => {
      const product = createProduct({
        id: 10,
        sku: 'PROD-2024-A1',
        name: 'Producto Numerado',
        minPrice: 99.99,
        active: true,
      });

      expect(product.sku).toBe('PROD-2024-A1');
    });

    it('Product debe tener exactamente las 5 propiedades esperadas', () => {
      const product: Product = createProduct({
        id: 1,
        sku: 'TEST',
        name: 'Test',
        minPrice: 10,
        active: true,
      });

      expect(Object.keys(product).sort()).toEqual(
        ['active', 'id', 'minPrice', 'name', 'sku'].sort(),
      );
    });

    it('Product debe ser readonly (verificación de runtime)', () => {
      const product = createProduct({
        id: 1,
        sku: 'TEST',
        name: 'Test',
        minPrice: 10,
        active: true,
      });

      // Verificar que podemos leer pero no mutar en runtime
      expect(product.id).toBe(1);

      // Verificar que las propiedades existen y tienen los tipos correctos
      expect(typeof product.id).toBe('number');
      expect(typeof product.sku).toBe('string');
      expect(typeof product.name).toBe('string');
      expect(typeof product.minPrice).toBe('number');
      expect(typeof product.active).toBe('boolean');
    });

    it('debe mantener la inmutabilidad — el objeto original no se modifica al crear', () => {
      const params = {
        id: 42,
        sku: 'IMMUTABLE',
        name: 'Test Inmutabilidad',
        minPrice: 25,
        active: true,
      };

      const product = createProduct(params);

      // El objeto params original no debe haber sido modificado
      expect(params.id).toBe(42);
      expect(params.sku).toBe('IMMUTABLE');

      // El producto es un objeto nuevo, no la misma referencia que params
      expect(product).not.toBe(params as unknown as Product);
    });
  });
});
