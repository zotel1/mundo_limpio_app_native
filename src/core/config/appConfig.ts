/**
 * AppConfig — Configuración centralizada de la aplicación.
 *
 * WHAT: Un solo lugar de verdad para toda la configuración: URLs del backend,
 *       timeouts HTTP, staleTimes de TanStack Query por tipo de dato, paginación.
 * WHY: Evita hardcodeo disperso en la app. Facilita cambiar entre entornos
 *      (dev / staging / prod) vía variables de entorno (react-native-config).
 * BENEFITS: Single source of truth. El appConfig se puede mockear en tests.
 *           Compatible con react-native-config (process.env).
 *
 * TDD: GREEN — implementación mínima para pasar los tests definidos en RED.
 */
export const appConfig = {
  api: {
    /**
     * URL base del backend Spring Boot.
     * Entorno: producción (default), reemplazable vía process.env.BASE_URL.
     */
    baseUrl: process.env.BASE_URL || 'https://mundo-limpio-backend.onrender.com',

    /**
     * URL del health check de Spring Boot Actuator.
     * Usado por SplashScreen para verificar conectividad.
     */
    healthUrl:
      process.env.HEALTH_URL ||
      'https://mundo-limpio-backend.onrender.com/actuator/health',

    /**
     * Timeout HTTP global (30 segundos por defecto).
     * Aplica a todas las requests de Axios.
     */
    timeout: parseInt(process.env.HTTP_TIMEOUT || '30000', 10),
  },

  query: {
    /**
     * Tiempos de stale por tipo de dato (staleTime de TanStack Query).
     * Controla cuánto tiempo los datos se consideran frescos antes de
     * refetch automático. Mismos valores que el TTL de Drift en Flutter.
     */
    staleTimes: {
      products: 5 * 60 * 1000, // 5 minutos
      batches: 5 * 60 * 1000, // 5 minutos
      inventory: 2 * 60 * 1000, // 2 minutos (stock cambia seguido)
      sales: 1 * 60 * 1000, // 1 minuto
      receipts: 2 * 60 * 1000, // 2 minutos
      users: 10 * 60 * 1000, // 10 minutos (roles no cambian tan seguido)
      backups: 10 * 60 * 1000, // 10 minutos
      bulkProducts: 5 * 60 * 1000, // 5 minutos
      productionBatches: 5 * 60 * 1000, // 5 minutos
    },

    /**
     * Garbage collection time: 30 minutos.
     * Datos en caché se eliminan después de este tiempo sin uso.
     */
    gcTime: 30 * 60 * 1000,

    /**
     * Cantidad de reintentos ante fallos de red (3).
     */
    retry: 3,

    /**
     * Backoff exponencial para reintentos.
     * Fórmula: Math.min(1000 * 2^attempt, 30000)
     * - attempt 0 → 1s  (inmediato)
     * - attempt 1 → 2s  (primer reintento)
     * - attempt 2 → 4s
     * - attempt 3 → 8s
     * - cap en 30s
     */
    retryDelay: (attempt: number): number =>
      Math.min(1000 * 2 ** attempt, 30000),
  },

  pagination: {
    /**
     * Tamaño de página por defecto para listados paginados (20 items).
     */
    defaultPageSize: parseInt(process.env.PAGE_SIZE || '20', 10),
  },
} as const;
