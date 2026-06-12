/**
 * WHAT: Test unitario para createProductsModule — Composition Root de products.
 * WHY: Verifica que la factory retorne un objeto con productRepository
 *      implementando la interfaz ProductRepository.
 * BENEFITS: Asegura que la cadena de dependencias se crea correctamente.
 *
 * TDD: GREEN — test escrito después de la implementación (factory trivial).
 *
 * PR 2.9 — T033
 */

// ═══════════════════════════════════════════════════════════════
// Mock dependencies — ProductApi + ProductRepositoryAdapter
// ═══════════════════════════════════════════════════════════════

// No necesitamos mocks exhaustivos — solo verificamos la estructura.
// La factory es puramente estructural: crea instancias y las retorna.

jest.mock('@features/products/infrastructure/api', () => ({
  ProductApi: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@features/products/infrastructure/adapters', () => ({
  ProductRepositoryAdapter: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@core/http', () => ({
  createApiClient: jest.fn(() => ({})),
}));

// ──── Import (después de los mocks) ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createProductsModule } = require('@features/index');

// ──── Suite ───────────────────────────────────────────────────

describe('createProductsModule — Composition Root de products', () => {
  it('retorna un objeto con productRepository', () => {
    const module = createProductsModule();

    expect(module).toBeDefined();
    expect(module).toHaveProperty('productRepository');
    expect(module.productRepository).toBeDefined();
  });

  it('retorna la misma estructura en llamadas sucesivas', () => {
    const module1 = createProductsModule();
    const module2 = createProductsModule();

    expect(module1).toHaveProperty('productRepository');
    expect(module2).toHaveProperty('productRepository');
  });
});
