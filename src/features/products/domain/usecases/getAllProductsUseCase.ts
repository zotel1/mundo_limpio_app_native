import type { ProductRepository } from '../ports/productRepository';
import type { Product } from '../models/product';

// WHAT: Caso de uso — Obtener TODOS los productos (activos e inactivos) paginados
// WHY: Vista administrativa (ADMIN/STOCK_MANAGER) que necesita ver productos
//      eliminados para poder reactivarlos.
// BENEFITS: Validación de paginación centralizada. Distinto de GetProductsUseCase
//           que solo retorna activos para el operador normal.
export class GetAllProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(page: number, size: number): Promise<Product[]> {
    if (page < 0) {
      throw new Error('La página debe ser mayor o igual a 0');
    }

    return this.productRepository.getAll(page, size);
  }
}
