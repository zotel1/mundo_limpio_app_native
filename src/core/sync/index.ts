/**
 * Barrel — core/sync.
 *
 * WHAT: Re-exporta SyncService y sus tipos para que los consumidores
 *       puedan importar desde un solo punto: `import { SyncService } from '@core/sync'`.
 * WHY: API pública clara. Los tipos SyncableAdjustment, SyncEvent y
 *      SyncEventListener son parte del contrato público.
 * BENEFITS: Sin imports anidados. Refactor interno no rompe consumidores.
 */
export {
  SyncService,
  type SyncableAdjustment,
  type SyncEvent,
  type SyncEventListener,
} from './SyncService';
