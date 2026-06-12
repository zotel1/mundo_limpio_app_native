import type { ProductRepository } from '../ports/productRepository';
import type { Product } from '../models/product';

// WHAT: Caso de uso — Obtener productos activos paginados (vista normal del operador)
// WHY: Centraliza la validación de paginación y la delegación al repositorio.
//      La UI solo llama a execute() sin conocer detalles de HTTP o paginación.
// BENEFITS: Testeable con mock del repositorio. Validación en la capa de dominio.
export class GetProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(page: number, size: number): Promise<Product[]> {
    if (page < 0) {
      throw new Error('La página debe ser mayor o igual a 0');
    }

    return this.productRepository.getAllActive(page, size);
  }
}
