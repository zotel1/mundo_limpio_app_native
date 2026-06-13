import type { InventoryRepository } from '../ports/inventoryRepository';
import type { Inventory } from '../models/inventory';

// WHAT: Caso de uso — Obtener inventario de un producto por ID
// WHY: Valida que productId sea positivo antes de delegar al repositorio.
//      La UI solo llama a execute() sin conocer detalles de HTTP.
// BENEFITS: Testeable con mock del repositorio. Validación de dominio
//           centralizada — productId > 0 se valida en un solo lugar.

export class GetInventoryUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(productId: number): Promise<Inventory> {
    if (productId <= 0) {
      throw new Error('El productId debe ser mayor a 0');
    }

    return this.inventoryRepository.getByProductId(productId);
  }
}
