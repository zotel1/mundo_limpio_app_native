/**
 * Barrel — core/connectivity.
 *
 * WHAT: Re-exporta ConnectivityService para que los consumidores puedan
 *       importar desde un solo punto: `import { ConnectivityService } from '@core/connectivity'`.
 * WHY: API pública clara. Si en el futuro se agregan más servicios de
 *      conectividad (NetworkQuality, BandwidthMonitor), todos salen del mismo barrel.
 * BENEFITS: Sin imports anidados. Refactor interno no rompe consumidores.
 */
export { ConnectivityService } from './ConnectivityService';
