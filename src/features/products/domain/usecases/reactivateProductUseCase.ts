import type { ProductRepository } from '../ports/productRepository';

// WHAT: Caso de uso — Reactivar un producto previamente eliminado
// WHY: Validar que el ID sea positivo antes de delegar al repositorio.
//      Operación inversa al soft-delete. Solo disponible para admin.
// BENEFITS: Testeable sin HTTP. La validación de permisos (ADMIN/STOCK_MANAGER)
//           se maneja en el repositorio (infraestructure), no en el dominio.
export class ReactivateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: number): Promise<void> {
    if (id <= 0) {
      throw new Error('El ID del producto debe ser mayor a 0');
    }

    return this.productRepository.reactivate(id);
  }
}
