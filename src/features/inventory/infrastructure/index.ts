/**
 * Infrastructure — Capa de infraestructura de inventory (hexagonal architecture).
 *
 * WHAT: Barrel raíz de infrastructure/ que re-exporta api/ (InventoryApi, DTOs,
 *       mappers) y adapters/ (InventoryRepositoryAdapter).
 * WHY: Single import desde presentation/: solo necesita `@features/inventory/infrastructure`.
 * BENEFITS: API pública de infrastructure en un solo punto.
 *           Mismo patrón que auth y products.
 */
export { InventoryApi, mapInventoryResponseToDomain, mapDomainToAdjustmentRequest } from './api';
export type { InventoryResponseDto, AdjustmentRequestDto } from './api';
export { InventoryRepositoryAdapter } from './adapters';
