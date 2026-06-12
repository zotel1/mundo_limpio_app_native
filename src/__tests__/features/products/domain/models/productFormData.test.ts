/**
 * WHAT: Tests unitarios para ProductFormData y createEmptyProductFormData
 * WHY: Validar que el value object de formulario es correctamente creado
 *      y que el factory produce un estado inicial consistente.
 * BENEFITS: Formulario siempre arranca con valores predecibles.
 */

import { createEmptyProductFormData } from '@features/products/domain/models/productFormData';
import type { ProductFormData } from '@features/products/domain/models/productFormData';

describe('ProductFormData', () => {
  describe('createEmptyProductFormData', () => {
    it('debe crear un ProductFormData con todos los campos vacíos o en cero', () => {
      const formData: ProductFormData = createEmptyProductFormData();

      expect(formData.sku).toBe('');
      expect(formData.name).toBe('');
      expect(formData.minPrice).toBe(0);
    });

    it('debe tener exactamente 3 propiedades: sku, name, minPrice', () => {
      const formData = createEmptyProductFormData();

      expect(Object.keys(formData).sort()).toEqual(
        ['minPrice', 'name', 'sku'].sort(),
      );
    });

    it('debe crear una instancia nueva en cada llamada', () => {
      const formData1 = createEmptyProductFormData();
      const formData2 = createEmptyProductFormData();

      // Mismos valores
      expect(formData1).toEqual(formData2);
      // Pero diferentes referencias
      expect(formData1).not.toBe(formData2);
    });

    it('los campos deben ser mutables (para formularios React)', () => {
      const formData = createEmptyProductFormData();

      // ProductFormData es mutable a diferencia de Product (es para forms)
      formData.sku = 'NEW-SKU';
      formData.name = 'Nuevo Nombre';
      formData.minPrice = 100;

      expect(formData.sku).toBe('NEW-SKU');
      expect(formData.name).toBe('Nuevo Nombre');
      expect(formData.minPrice).toBe(100);
    });

    it('debe tener los tipos correctos en cada campo', () => {
      const formData = createEmptyProductFormData();

      expect(typeof formData.sku).toBe('string');
      expect(typeof formData.name).toBe('string');
      expect(typeof formData.minPrice).toBe('number');
    });
  });
});
