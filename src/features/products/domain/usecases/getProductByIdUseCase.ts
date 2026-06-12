import type { ProductRepository } from '../ports/productRepository';
import type { Product } from '../models/product';

// WHAT: Caso de uso — Obtener un producto por su ID
// WHY: Validar que el ID sea positivo antes de delegar al repositorio.
//      Usado en pantallas de detalle y edición.
// BENEFITS: Evita llamadas innecesarias al backend con IDs inválidos.
export class GetProductByIdUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: number): Promise<Product> {
    if (id <= 0) {
      throw new Error('El ID del producto debe ser mayor a 0');
    }

    return this.productRepository.getById(id);
  }
}
