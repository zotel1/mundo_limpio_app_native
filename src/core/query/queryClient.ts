/**
 * QueryClient — Cliente centralizado de TanStack Query v5.
 *
 * WHAT: Una instancia única de QueryClient con defaults consistentes
 *       para todas las features de la app.
 * WHY: Centralizar staleTime, gcTime y retry strategy evita repetir
 *      configuración en cada useQuery/useMutation. Reemplaza la capa
 *      de caché manual con Drift + TTL que existía en Flutter.
 * BENEFITS: Comportamiento consistente, fácil de tunear por feature
 *           cuando se necesita un staleTime diferente. Caché automático,
 *           revalidación en background, sin lógica manual de TTL.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de queryClient.test.ts.
 */
import { QueryClient } from '@tanstack/react-query';
import { appConfig } from '@core/config/appConfig';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // WHAT: 5 minutos de staleTime base (productos, batches, bulk products).
      //       Features con datos más dinámicos (inventory, sales) sobrescriben
      //       este valor en sus useQuery individuales.
      staleTime: appConfig.query.staleTimes.products,

      // WHAT: 30 minutos de garbage collection.
      //       Datos sin uso por 30 minutos se eliminan de la caché.
      gcTime: appConfig.query.gcTime,

      // WHAT: 3 reintentos con backoff exponencial para queries.
      retry: appConfig.query.retry,

      // WHAT: Función de backoff exponencial (1s, 2s, 4s, 8s, cap en 30s).
      retryDelay: appConfig.query.retryDelay,

      // WHAT: En mobile no hay evento "window focus" como en web.
      //       Usamos staleTime + invalidación manual en su lugar.
      refetchOnWindowFocus: false,
    },
    mutations: {
      // WHAT: No reintentar mutations automáticamente.
      //       Offline mutations se manejan con cola MMKV
      //       (inventory adjustments, sales drafts).
      retry: 0,
    },
  },
});
