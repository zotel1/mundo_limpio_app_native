import type { InventoryRepository } from '../ports/inventoryRepository';
import type { Inventory } from '../models/inventory';
import type { StockAdjustment } from '../models/stockAdjustment';

// WHAT: Caso de uso — Ajustar stock de un producto
// WHY: Valida productId > 0, cantidad !== 0, razón no vacía antes de
//      delegar al repositorio. Centraliza la lógica de validación
//      de dominio (la UI no repite estas reglas).
// BENEFITS: Testeable con mock del repositorio. Validaciones en un
//           solo lugar. Errores con mensajes en español para el usuario.

export class AdjustStockUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(
    productId: number,
    adjustment: StockAdjustment,
  ): Promise<Inventory> {
    if (productId <= 0) {
      throw new Error('El productId debe ser mayor a 0');
    }

    if (adjustment.quantity === 0) {
      throw new Error('La cantidad no puede ser 0');
    }

    if (!adjustment.reason || adjustment.reason.trim().length === 0) {
      throw new Error('La razón es obligatoria');
    }

    return this.inventoryRepository.adjustStock(productId, adjustment);
  }
}
