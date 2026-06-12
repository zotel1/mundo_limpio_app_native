import type { ProductRepository } from '../ports/productRepository';

// WHAT: Caso de uso — Eliminar un producto (soft-delete: marca active=false)
// WHY: Validar que el ID sea positivo antes de delegar al repositorio.
//      El repositorio se encarga de la lógica de soft-delete.
// BENEFITS: Testeable sin HTTP. Validación de ID en dominio evita
//           requests innecesarios con IDs inválidos.
export class DeleteProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: number): Promise<void> {
    if (id <= 0) {
      throw new Error('El ID del producto debe ser mayor a 0');
    }

    return this.productRepository.delete(id);
  }
}
