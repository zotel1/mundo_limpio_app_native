/**
 * Barrel — inventory/infrastructure/adapters.
 *
 * WHAT: Re-exporta InventoryRepositoryAdapter.
 * WHY: Single import para consumidores dentro de infrastructure/ o presentation/.
 * BENEFITS: API pública clara sin imports anidados profundos.
 */
export { InventoryRepositoryAdapter } from './inventoryRepositoryAdapter';
