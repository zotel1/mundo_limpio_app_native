import type { ProductRepository } from '../ports/productRepository';
import type { Product } from '../models/product';

// WHAT: Caso de uso — Buscar un producto por su SKU exacto
// WHY: Centraliza la validación del SKU (no puede estar vacío).
//      Usado internamente en create/update para validar unicidad.
// BENEFITS: Testeable con mock del repositorio. Validación en dominio.
export class GetProductBySkuUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(sku: string): Promise<Product> {
    if (!sku || sku.trim() === '') {
      throw new Error('El SKU es requerido');
    }

    return this.productRepository.getBySku(sku);
  }
}
