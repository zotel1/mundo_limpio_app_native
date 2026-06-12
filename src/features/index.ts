/**
 * Composition Root — Instancias de repositorios, servicios y adaptadores.
 *
 * WHAT: Punto central donde se crean y conectan todas las dependencias concretas
 *       (repositorios, adaptadores, servicios) siguiendo el patrón de inyección
 *       de dependencias manual.
 * WHY: La Composition Root es el ÚNICO lugar donde se instancian clases concretas.
 *      El resto de la app depende de interfaces (ports), no de implementaciones.
 *      Esto permite cambiar implementaciones sin tocar la lógica de negocio.
 * BENEFITS: Desacoplamiento total. Testeable (inyectar mocks en tests).
 *           Un solo lugar para entender cómo se conecta toda la app.
 *
 * USO (Fase 1+): Cada feature expone una factory `create{Feature}Module()` que
 * recibe las dependencias de core (apiClient, tokenStorage, etc.) y retorna
 * sus repositorios/adaptadores listos para usar.
 *
 * Ejemplo (Fase 1):
 *   import {createAuthModule} from '@features/auth';
 *   import {apiClient} from '@core/http';
 *   import {tokenStorage} from '@core/storage/tokenStorage';
 *
 *   const authModule = createAuthModule({apiClient, tokenStorage});
 *   export const {authRepository} = authModule;
 *
 * PR 2.9 — Composition Root para productos: createProductsModule.
 */

import { ProductApi } from '@features/products/infrastructure/api';
import { ProductRepositoryAdapter } from '@features/products/infrastructure/adapters';
import type { ProductRepository } from '@features/products/domain';
import { createApiClient } from '@core/http';

// ═══════════════════════════════════════════════════════════════
// Products Module
// ═══════════════════════════════════════════════════════════════

/**
 * WHAT: Contrato del módulo de productos — dependencias listas para usar.
 */
export interface ProductsModule {
  productRepository: ProductRepository;
}

/**
 * WHAT: Factory que crea e inyecta todas las dependencias de products.
 * WHY: Centraliza la creación de ProductApi + ProductRepositoryAdapter.
 *      Las screens que usen useProducts pueden obtener productRepository
 *      de esta factory en lugar de instanciar dependencias inline.
 * BENEFITS: Single source of truth para la cadena de dependencias de products.
 *           Fácil de reemplazar en tests: mockear createProductsModule.
 *
 * Uso:
 *   const { productRepository } = createProductsModule();
 *   const hook = useProducts({ productRepository });
 */
export function createProductsModule(): ProductsModule {
  const client = createApiClient();
  const productApi = new ProductApi(client);
  const productRepository = new ProductRepositoryAdapter(productApi);

  return { productRepository };
}
