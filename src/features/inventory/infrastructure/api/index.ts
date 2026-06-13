/**
 * Barrel — inventory/infrastructure/api.
 *
 * WHAT: Re-exporta InventoryApi y DTOs.
 * WHY: Single import para consumidores dentro de infrastructure/.
 * BENEFITS: API pública clara sin imports anidados profundos.
 */
export { InventoryApi } from './inventoryApi';
export * from './dtos';
export { mapInventoryResponseToDomain, mapDomainToAdjustmentRequest } from './mappers';
