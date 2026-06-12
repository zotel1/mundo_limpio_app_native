/**
 * TDD: RED — Tests para los mappers DTO ↔ Domain de products.
 *
 * WHAT: Valida que los mappers conviertan correctamente entre DTOs de API
 *       (ProductResponseDto, ProductPageDto, ProductRequestDto) y modelos
 *       de dominio (Product, ProductFormData).
 * WHY: Los mappers son la capa de traducción entre infraestructura y dominio.
 *      Son funciones puras — sin side effects, sin dependencias externas.
 * BENEFITS: Si el backend cambia la forma de los datos, solo se actualizan
 *           los mappers. El dominio permanece intacto.
 */
import {
  mapProductResponseToDomain,
  mapDomainToProductRequest,
  mapProductPageToDomain,
} from '@features/products/infrastructure/api/mappers';
import type { ProductResponseDto, ProductPageDto } from '@features/products/infrastructure/api/dtos';

describe('Mappers — Products DTO ↔ Domain', () => {
  // ──── Fixtures ────

  const validResponseDto: ProductResponseDto = {
    id: 1,
    sku: 'DET-001',
    name: 'Detergente Premium 5L',
    minPrice: 150.5,
    active: true,
  };

  const inactiveResponseDto: ProductResponseDto = {
    id: 2,
    sku: 'LAV-002',
    name: 'Lavandina en Gel',
    minPrice: 85.0,
    active: false,
  };

  const formData = {
    sku: 'PROD-003',
    name: 'Jabón Líquido',
    minPrice: 45.75,
  };

  const validPageDto: ProductPageDto = {
    content: [validResponseDto, inactiveResponseDto],
    totalPages: 3,
    totalElements: 25,
    number: 0,
    size: 10,
  };

  const emptyPageDto: ProductPageDto = {
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 10,
  };

  // ──── mapProductResponseToDomain ────

  describe('mapProductResponseToDomain()', () => {
    it('convierte un ProductResponseDto válido a Product con todos los campos', () => {
      const product = mapProductResponseToDomain(validResponseDto);

      expect(product.id).toBe(1);
      expect(product.sku).toBe('DET-001');
      expect(product.name).toBe('Detergente Premium 5L');
      expect(product.minPrice).toBe(150.5);
      expect(product.active).toBe(true);
    });

    it('convierte un producto inactivo correctamente (active = false)', () => {
      const product = mapProductResponseToDomain(inactiveResponseDto);

      expect(product.id).toBe(2);
      expect(product.sku).toBe('LAV-002');
      expect(product.active).toBe(false);
    });

    it('preserva el tipo number para minPrice (incluyendo decimales)', () => {
      const dto: ProductResponseDto = {
        id: 3,
        sku: 'X',
        name: 'X',
        minPrice: 99.99,
        active: true,
      };

      const product = mapProductResponseToDomain(dto);

      expect(product.minPrice).toBe(99.99);
      expect(typeof product.minPrice).toBe('number');
    });

    it('maneja un DTO con id 0 (caso de borde)', () => {
      const dto: ProductResponseDto = {
        id: 0,
        sku: 'ZERO',
        name: 'Producto Cero',
        minPrice: 1,
        active: false,
      };

      const product = mapProductResponseToDomain(dto);

      expect(product.id).toBe(0);
      expect(product.sku).toBe('ZERO');
    });

    it('crea un objeto inmutable al intentar modificar (no modifica el DTO original)', () => {
      const dtoCopy = { ...validResponseDto, sku: 'ORIGINAL' };

      const product = mapProductResponseToDomain(dtoCopy);
      // Intentar mutar el resultado no debería afectar al DTO
      (product as { sku: string }).sku = 'MUTATED';

      expect(dtoCopy.sku).toBe('ORIGINAL');
    });
  });

  // ──── mapDomainToProductRequest ────

  describe('mapDomainToProductRequest()', () => {
    it('convierte ProductFormData a ProductRequestDto con todos los campos', () => {
      const dto = mapDomainToProductRequest(formData);

      expect(dto.sku).toBe('PROD-003');
      expect(dto.name).toBe('Jabón Líquido');
      expect(dto.minPrice).toBe(45.75);
    });

    it('convierte formData con minPrice entero', () => {
      const dto = mapDomainToProductRequest({
        sku: 'ABC-123',
        name: 'Cera',
        minPrice: 200,
      });

      expect(dto.sku).toBe('ABC-123');
      expect(dto.minPrice).toBe(200);
      expect(typeof dto.minPrice).toBe('number');
    });

    it('convierte formData con campos vacíos (la validación ocurre en otra capa)', () => {
      const dto = mapDomainToProductRequest({
        sku: '',
        name: '',
        minPrice: 0,
      });

      expect(dto.sku).toBe('');
      expect(dto.name).toBe('');
      expect(dto.minPrice).toBe(0);
    });

    it('no muta el formData original', () => {
      const original = { sku: 'ORIG', name: 'Original', minPrice: 10 };
      const dto = mapDomainToProductRequest(original);

      // Mutar el DTO no debe afectar el original
      dto.sku = 'CHANGED';

      expect(original.sku).toBe('ORIG');
    });
  });

  // ──── mapProductPageToDomain ────

  describe('mapProductPageToDomain()', () => {
    it('convierte un ProductPageDto con productos a estructura paginada de dominio', () => {
      const result = mapProductPageToDomain(validPageDto);

      expect(result.products).toHaveLength(2);
      expect(result.products[0]?.id).toBe(1);
      expect(result.products[0]?.sku).toBe('DET-001');
      expect(result.products[1]?.id).toBe(2);
      expect(result.products[1]?.active).toBe(false);
      expect(result.totalPages).toBe(3);
      expect(result.totalElements).toBe(25);
    });

    it('convierte una página vacía sin productos', () => {
      const result = mapProductPageToDomain(emptyPageDto);

      expect(result.products).toHaveLength(0);
      expect(result.totalPages).toBe(0);
      expect(result.totalElements).toBe(0);
    });

    it('convierte una página con un solo producto', () => {
      const singlePage: ProductPageDto = {
        content: [validResponseDto],
        totalPages: 1,
        totalElements: 1,
        number: 0,
        size: 10,
      };

      const result = mapProductPageToDomain(singlePage);

      expect(result.products).toHaveLength(1);
      expect(result.products[0]?.name).toBe('Detergente Premium 5L');
      expect(result.totalPages).toBe(1);
    });

    it('convierte cada producto del content a través del mapper de response', () => {
      // Verifica que cada producto en el content se mapee correctamente
      const page: ProductPageDto = {
        content: [
          { id: 10, sku: 'A', name: 'Producto A', minPrice: 10, active: true },
          { id: 20, sku: 'B', name: 'Producto B', minPrice: 20, active: false },
        ],
        totalPages: 1,
        totalElements: 2,
        number: 0,
        size: 10,
      };

      const result = mapProductPageToDomain(page);

      expect(result.products[0]?.id).toBe(10);
      expect(result.products[0]?.sku).toBe('A');
      expect(result.products[0]?.active).toBe(true);
      expect(result.products[1]?.id).toBe(20);
      expect(result.products[1]?.sku).toBe('B');
      expect(result.products[1]?.active).toBe(false);
    });
  });
});
