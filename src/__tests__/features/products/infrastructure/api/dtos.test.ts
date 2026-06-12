/**
 * TDD: RED — Tests para Zod DTOs de products.
 *
 * WHAT: Valida que los schemas Zod rechacen datos inválidos y acepten datos
 *       correctos según los contratos del backend.
 * WHY: Zod atrapa errores en runtime si el backend cambia el schema. Los tests
 *      validan que los schemas están correctamente definidos.
 * BENEFITS: Validación runtime, tipos TypeScript inferidos, mensajes claros.
 */
import {
  ProductRequestSchema,
  ProductResponseSchema,
  ProductPageSchema,
} from '@features/products/infrastructure/api/dtos';

// ──── ProductRequestSchema ────

describe('ProductRequestSchema', () => {
  const validRequest = {
    sku: 'PROD-001',
    name: 'Detergente Premium',
    minPrice: 25.5,
  };

  it('acepta un request válido con SKU en mayúsculas, nombre y minPrice positivo', () => {
    const result = ProductRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sku).toBe('PROD-001');
      expect(result.data.name).toBe('Detergente Premium');
      expect(result.data.minPrice).toBe(25.5);
    }
  });

  it('rechaza SKU vacío', () => {
    const result = ProductRequestSchema.safeParse({
      ...validRequest,
      sku: '',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza SKU con letras minúsculas', () => {
    const result = ProductRequestSchema.safeParse({
      ...validRequest,
      sku: 'prod-001',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza SKU con caracteres especiales (no alfanuméricos ni guiones)', () => {
    const result = ProductRequestSchema.safeParse({
      ...validRequest,
      sku: 'PROD_001',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza SKU con espacios', () => {
    const result = ProductRequestSchema.safeParse({
      ...validRequest,
      sku: 'PROD 001',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza nombre vacío', () => {
    const result = ProductRequestSchema.safeParse({
      ...validRequest,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza minPrice cero', () => {
    const result = ProductRequestSchema.safeParse({
      ...validRequest,
      minPrice: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rechaza minPrice negativo', () => {
    const result = ProductRequestSchema.safeParse({
      ...validRequest,
      minPrice: -10,
    });
    expect(result.success).toBe(false);
  });

  it('rechaza objeto vacío', () => {
    const result = ProductRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ──── ProductResponseSchema ────

describe('ProductResponseSchema', () => {
  const validResponse = {
    id: 1,
    sku: 'PROD-001',
    name: 'Detergente Premium',
    minPrice: 25.5,
    active: true,
  };

  it('acepta una respuesta válida con todos los campos', () => {
    const result = ProductResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(1);
      expect(result.data.sku).toBe('PROD-001');
      expect(result.data.name).toBe('Detergente Premium');
      expect(result.data.minPrice).toBe(25.5);
      expect(result.data.active).toBe(true);
    }
  });

  it('acepta producto inactivo (active: false)', () => {
    const result = ProductResponseSchema.safeParse({
      ...validResponse,
      active: false,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza respuesta sin id', () => {
    const { id: _id, ...sinId } = validResponse;
    const result = ProductResponseSchema.safeParse(sinId);
    expect(result.success).toBe(false);
  });

  it('rechaza respuesta sin sku', () => {
    const { sku: _sku, ...sinSku } = validResponse;
    const result = ProductResponseSchema.safeParse(sinSku);
    expect(result.success).toBe(false);
  });

  it('rechaza respuesta sin name', () => {
    const { name: _name, ...sinName } = validResponse;
    const result = ProductResponseSchema.safeParse(sinName);
    expect(result.success).toBe(false);
  });

  it('rechaza respuesta sin minPrice', () => {
    const { minPrice: _mp, ...sinPrice } = validResponse;
    const result = ProductResponseSchema.safeParse(sinPrice);
    expect(result.success).toBe(false);
  });

  it('rechaza respuesta sin active', () => {
    const { active: _act, ...sinActive } = validResponse;
    const result = ProductResponseSchema.safeParse(sinActive);
    expect(result.success).toBe(false);
  });

  it('rechaza id no numérico', () => {
    const result = ProductResponseSchema.safeParse({
      ...validResponse,
      id: '1',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza active no booleano', () => {
    const result = ProductResponseSchema.safeParse({
      ...validResponse,
      active: 'true',
    });
    expect(result.success).toBe(false);
  });
});

// ──── ProductPageSchema ────

describe('ProductPageSchema', () => {
  const productItem = {
    id: 1,
    sku: 'PROD-001',
    name: 'Detergente Premium',
    minPrice: 25.5,
    active: true,
  };

  const validPage = {
    content: [productItem],
    totalPages: 5,
    totalElements: 50,
    number: 0,
    size: 10,
  };

  it('acepta una página válida con productos', () => {
    const result = ProductPageSchema.safeParse(validPage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toHaveLength(1);
      expect(result.data.totalPages).toBe(5);
      expect(result.data.totalElements).toBe(50);
      expect(result.data.number).toBe(0);
      expect(result.data.size).toBe(10);
    }
  });

  it('acepta página vacía con content []', () => {
    const result = ProductPageSchema.safeParse({
      ...validPage,
      content: [],
      totalElements: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toHaveLength(0);
    }
  });

  it('rechaza página sin content', () => {
    const { content: _c, ...sinContent } = validPage;
    const result = ProductPageSchema.safeParse(sinContent);
    expect(result.success).toBe(false);
  });

  it('rechaza página sin totalPages', () => {
    const { totalPages: _tp, ...sinTp } = validPage;
    const result = ProductPageSchema.safeParse(sinTp);
    expect(result.success).toBe(false);
  });

  it('rechaza página sin totalElements', () => {
    const { totalElements: _te, ...sinTe } = validPage;
    const result = ProductPageSchema.safeParse(sinTe);
    expect(result.success).toBe(false);
  });

  it('rechaza página sin number', () => {
    const { number: _n, ...sinNum } = validPage;
    const result = ProductPageSchema.safeParse(sinNum);
    expect(result.success).toBe(false);
  });

  it('rechaza página sin size', () => {
    const { size: _s, ...sinSize } = validPage;
    const result = ProductPageSchema.safeParse(sinSize);
    expect(result.success).toBe(false);
  });

  it('rechaza content con un item inválido (sin sku)', () => {
    const { sku: _sku, ...invalidItem } = productItem;
    const result = ProductPageSchema.safeParse({
      ...validPage,
      content: [invalidItem],
    });
    expect(result.success).toBe(false);
  });
});
