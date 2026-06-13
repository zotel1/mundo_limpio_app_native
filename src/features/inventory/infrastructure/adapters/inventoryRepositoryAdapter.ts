/**
 * InventoryRepositoryAdapter — Implementación concreta del puerto InventoryRepository.
 *
 * WHAT: Adaptador que implementa InventoryRepository usando InventoryApi (HTTP)
 *       y mappers (DTO ↔ Domain). Es la capa de infrastructure que conecta
 *       el dominio con el backend real.
 * WHY: La arquitectura hexagonal requiere que domain/ defina el contrato
 *      (InventoryRepository) e infrastructure/ provea la implementación.
 *      Este adapter traduce llamadas HTTP + Zod al lenguaje del dominio.
 * BENEFITS: El dominio no conoce Axios, Zod ni HTTP. Si cambiamos de backend
 *           (REST → GraphQL, por ejemplo), solo cambia este adapter.
 *           Fácil de testear con mock de InventoryApi.
 */
import type { Inventory, StockAdjustment } from '../../domain';
import type { InventoryRepository } from '../../domain/ports/inventoryRepository';
import type { InventoryApi } from '../api/inventoryApi';
import { mapInventoryResponseToDomain } from '../api/mappers';
import { mapDomainToAdjustmentRequest } from '../api/mappers';

export class InventoryRepositoryAdapter implements InventoryRepository {
  constructor(private readonly api: InventoryApi) {}

  /**
   * Obtiene el inventario de un producto por su ID.
   * Delega en api.getByProductId() y mapea el DTO a entidad Inventory.
   */
  async getByProductId(productId: number): Promise<Inventory> {
    const dto = await this.api.getByProductId(productId);
    return mapInventoryResponseToDomain(dto);
  }

  /**
   * Obtiene todos los productos con stock por debajo del umbral mínimo.
   * Delega en api.getLowStock() y mapea cada DTO del array a entidad Inventory.
   */
  async getLowStock(): Promise<Inventory[]> {
    const dtos = await this.api.getLowStock();
    return dtos.map(mapInventoryResponseToDomain);
  }

  /**
   * Ajusta el stock de un producto (incremento o decremento).
   * Convierte StockAdjustment → DTO de request → llama api.adjustStock()
   * → mapea respuesta a entidad Inventory actualizada.
   */
  async adjustStock(
    productId: number,
    adjustment: StockAdjustment,
  ): Promise<Inventory> {
    const requestDto = mapDomainToAdjustmentRequest(adjustment);
    const responseDto = await this.api.adjustStock(productId, requestDto);
    return mapInventoryResponseToDomain(responseDto);
  }
}
