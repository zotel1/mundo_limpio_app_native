/**
 * Mappers DTO ↔ Domain — Traducción entre infrastructure y domain.
 *
 * WHAT: Funciones puras que transforman DTOs Zod (infrastructure) en entidades
 *       de dominio (domain) y viceversa. Sin side effects, sin estado.
 * WHY: La capa de infraestructura maneja DTOs con validación Zod. La capa de
 *      dominio maneja entidades puras con factories. Los mappers son el
 *      puente entre ambas representaciones.
 * BENEFITS: Si el backend cambia un campo, solo se actualiza el mapper.
 *           Si el dominio agrega validación, solo se actualiza el mapper.
 *           Funciones puras → 100% testeables sin mocks.
 *           Mismo patrón que auth y products.
 */
import type { InventoryResponseDto, AdjustmentRequestDto } from './dtos';
import type { Inventory, StockAdjustment } from '../../domain';
import { createInventory } from '../../domain';

/**
 * Convierte un DTO de respuesta del backend en una entidad Inventory de dominio.
 *
 * @param dto — DTO validado con Zod proveniente de InventoryApi
 * @returns Entidad Inventory inmutable creada con createInventory()
 */
export function mapInventoryResponseToDomain(
  dto: InventoryResponseDto,
): Inventory {
  return createInventory({
    productId: dto.productId,
    productName: dto.productName,
    currentStock: dto.currentStock,
    minStockThreshold: dto.minStockThreshold,
  });
}

/**
 * Convierte una entidad StockAdjustment de dominio en un DTO de request
 * para enviar al backend.
 *
 * @param adjustment — Entidad StockAdjustment del dominio
 * @returns DTO de request listo para enviar con InventoryApi.adjustStock()
 */
export function mapDomainToAdjustmentRequest(
  adjustment: StockAdjustment,
): AdjustmentRequestDto {
  return {
    type: adjustment.type,
    quantity: adjustment.quantity,
    reason: adjustment.reason,
  };
}
