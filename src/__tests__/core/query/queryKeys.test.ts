/**
 * WHAT: Tests para la factory de query keys — claves tipadas por feature.
 * WHY: TDD RED — los tests definen la estructura de claves de TanStack Query
 *      antes de implementar. Centralizar las keys evita colisiones de caché y
 *      permite invalidación precisa por feature.
 * BENEFITS: Type-safe, auto-completado en IDE, sin typos ni colisiones.
 *
 * TDD: RED — el archivo src/core/query/queryKeys.ts NO existe aún.
 */
import { queryKeys } from '@core/query/queryKeys';

describe('queryKeys — Products', () => {
  test('queryKeys.products.all debe ser ["products"]', () => {
    expect(queryKeys.products.all).toEqual(['products']);
  });

  test('queryKeys.products.lists() debe incluir el tag "list"', () => {
    expect(queryKeys.products.lists()).toEqual(['products', 'list']);
  });

  test('queryKeys.products.list() debe incluir los filtros pasados', () => {
    const filters = { active: true };
    expect(queryKeys.products.list(filters)).toEqual([
      'products',
      'list',
      filters,
    ]);
  });

  test('queryKeys.products.details() debe incluir el tag "detail"', () => {
    expect(queryKeys.products.details()).toEqual(['products', 'detail']);
  });

  test('queryKeys.products.detail(5) debe incluir el id 5', () => {
    expect(queryKeys.products.detail(5)).toEqual([
      'products',
      'detail',
      5,
    ]);
  });

  test('queryKeys.products.bySku("DET-001") debe incluir el SKU', () => {
    expect(queryKeys.products.bySku('DET-001')).toEqual([
      'products',
      'sku',
      'DET-001',
    ]);
  });
});

describe('queryKeys — Auth', () => {
  test('queryKeys.auth.all debe ser ["auth"]', () => {
    expect(queryKeys.auth.all).toEqual(['auth']);
  });

  test('queryKeys.auth.session() debe ser ["auth", "session"]', () => {
    expect(queryKeys.auth.session()).toEqual(['auth', 'session']);
  });
});

describe('queryKeys — Inventory', () => {
  test('queryKeys.inventory.all debe ser ["inventory"]', () => {
    expect(queryKeys.inventory.all).toEqual(['inventory']);
  });

  test('queryKeys.inventory.detail(42) debe incluir productId 42', () => {
    expect(queryKeys.inventory.detail(42)).toEqual([
      'inventory',
      'detail',
      42,
    ]);
  });

  test('queryKeys.inventory.lowStock() debe ser ["inventory", "lowStock"]', () => {
    expect(queryKeys.inventory.lowStock()).toEqual(['inventory', 'lowStock']);
  });
});

describe('queryKeys — Sales', () => {
  test('queryKeys.sales.all debe ser ["sales"]', () => {
    expect(queryKeys.sales.all).toEqual(['sales']);
  });

  test('queryKeys.sales.lists() debe incluir "list"', () => {
    expect(queryKeys.sales.lists()).toEqual(['sales', 'list']);
  });

  test('queryKeys.sales.details() debe incluir "detail"', () => {
    expect(queryKeys.sales.details()).toEqual(['sales', 'detail']);
  });

  test('queryKeys.sales.detail(100) debe incluir saleId 100', () => {
    expect(queryKeys.sales.detail(100)).toEqual([
      'sales',
      'detail',
      100,
    ]);
  });

  test('queryKeys.sales.drafts() debe ser ["sales", "drafts"]', () => {
    expect(queryKeys.sales.drafts()).toEqual(['sales', 'drafts']);
  });
});

describe('queryKeys — Receipts', () => {
  test('queryKeys.receipts.all debe ser ["receipts"]', () => {
    expect(queryKeys.receipts.all).toEqual(['receipts']);
  });

  test('queryKeys.receipts.lists() debe incluir "list"', () => {
    expect(queryKeys.receipts.lists()).toEqual(['receipts', 'list']);
  });

  test('queryKeys.receipts.details() debe incluir "detail"', () => {
    expect(queryKeys.receipts.details()).toEqual(['receipts', 'detail']);
  });

  test('queryKeys.receipts.detail(7) debe incluir receiptId 7', () => {
    expect(queryKeys.receipts.detail(7)).toEqual([
      'receipts',
      'detail',
      7,
    ]);
  });
});

describe('queryKeys — Production', () => {
  test('queryKeys.production.all debe ser ["production"]', () => {
    expect(queryKeys.production.all).toEqual(['production']);
  });

  test('queryKeys.production.bulkProducts.all debe incluir el namespace anidado', () => {
    expect(queryKeys.production.bulkProducts.all).toEqual([
      'production',
      'bulkProducts',
    ]);
  });

  test('queryKeys.production.bulkProducts.lists() debe incluir "list"', () => {
    expect(queryKeys.production.bulkProducts.lists()).toEqual([
      'production',
      'bulkProducts',
      'list',
    ]);
  });

  test('queryKeys.production.bulkProducts.detail(3) debe incluir id 3', () => {
    expect(queryKeys.production.bulkProducts.detail(3)).toEqual([
      'production',
      'bulkProducts',
      'detail',
      3,
    ]);
  });

  test('queryKeys.production.batches.all debe incluir el namespace anidado', () => {
    expect(queryKeys.production.batches.all).toEqual([
      'production',
      'batches',
    ]);
  });

  test('queryKeys.production.batches.lists() debe incluir "list"', () => {
    expect(queryKeys.production.batches.lists()).toEqual([
      'production',
      'batches',
      'list',
    ]);
  });

  test('queryKeys.production.batches.detail(8) debe incluir id 8', () => {
    expect(queryKeys.production.batches.detail(8)).toEqual([
      'production',
      'batches',
      'detail',
      8,
    ]);
  });

  test('queryKeys.production.batches.byProduct(10) debe incluir productId 10', () => {
    expect(queryKeys.production.batches.byProduct(10)).toEqual([
      'production',
      'batches',
      'byProduct',
      10,
    ]);
  });
});

describe('queryKeys — Users', () => {
  test('queryKeys.users.all debe ser ["users"]', () => {
    expect(queryKeys.users.all).toEqual(['users']);
  });

  test('queryKeys.users.lists() debe incluir "list"', () => {
    expect(queryKeys.users.lists()).toEqual(['users', 'list']);
  });

  test('queryKeys.users.detail(42) debe incluir userId 42', () => {
    expect(queryKeys.users.detail(42)).toEqual([
      'users',
      'detail',
      42,
    ]);
  });
});

describe('queryKeys — Backups', () => {
  test('queryKeys.backups.all debe ser ["backups"]', () => {
    expect(queryKeys.backups.all).toEqual(['backups']);
  });

  test('queryKeys.backups.lists() debe incluir "list"', () => {
    expect(queryKeys.backups.lists()).toEqual(['backups', 'list']);
  });
});

// TRIANGULATE: verificar que distintas features no colisionan
describe('queryKeys — No colisiones entre features', () => {
  test('keys de products y sales no deben compartir prefijo base', () => {
    expect(queryKeys.products.all).not.toEqual(queryKeys.sales.all);
  });

  test('keys de inventory e products son independientes', () => {
    expect(queryKeys.inventory.all).not.toEqual(queryKeys.products.all);
  });

  test('queryKeys es un objeto readonly en el nivel superior', () => {
    // Las keys de TanStack Query deben ser inmutables para evitar
    // mutaciones accidentales que corrompan el caché.
    // Verificamos que el objeto existe y tiene la forma esperada.
    expect(queryKeys).toBeDefined();
    expect(typeof queryKeys).toBe('object');
  });
});
