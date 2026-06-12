/**
 * WHAT: Tests para la configuración del QueryClient de TanStack Query v5.
 * WHY: TDD RED — validar que el QueryClient global tenga defaults correctos
 *      (staleTime, gcTime, retry) antes de implementar. Un solo cliente
 *      centralizado evita repetir configuración en cada useQuery/useMutation.
 * BENEFITS: Comportamiento consistente en todas las features. Fácil tunear
 *           por feature cuando se necesita un staleTime diferente.
 *
 * TDD: RED — el archivo src/core/query/queryClient.ts NO existe aún.
 */
import { QueryClient } from '@tanstack/react-query';
import { queryClient } from '@core/query/queryClient';

describe('queryClient — Instancia y tipo', () => {
  test('queryClient existe y es una instancia de QueryClient', () => {
    // WHY: Garantiza que la exportación es un QueryClient real,
    //      no un stub ni undefined. Necesario para que QueryClientProvider
    //      funcione correctamente en App.tsx.
    expect(queryClient).toBeDefined();
    expect(queryClient).toBeInstanceOf(QueryClient);
  });
});

describe('queryClient — Defaults de queries', () => {
  test('staleTime por defecto debe ser 5 minutos (300000ms)', () => {
    // WHY: 5 minutos es el valor base para datos que no cambian frecuentemente
    //      (productos, bulk products, batches). Igual TTL que Drift en Flutter.
    const staleTime = queryClient.getDefaultOptions().queries?.staleTime;
    expect(staleTime).toBe(300000);
  });

  test('gcTime debe ser 30 minutos (1800000ms)', () => {
    // WHY: 30 minutos de garbage collection — los datos en caché se eliminan
    //      después de este tiempo sin uso. Suficiente para mantener datos
    //      entre navegaciones sin consumir memoria indefinidamente.
    const gcTime = queryClient.getDefaultOptions().queries?.gcTime;
    expect(gcTime).toBe(1800000);
  });

  test('retry debe estar configurado en 3 reintentos', () => {
    // WHY: 3 reintentos con backoff exponencial es suficiente para manejar
    //      cortes de red temporales sin sobrecargar el backend.
    const retry = queryClient.getDefaultOptions().queries?.retry;
    expect(retry).toBe(3);
  });

  test('refetchOnWindowFocus debe ser false', () => {
    // WHY: En mobile no hay "window focus" como en web.
    //      Refetch innecesario cada vez que el usuario vuelve a la app.
    //      En su lugar usamos staleTime + invalidación manual.
    const refetchOnWindowFocus =
      queryClient.getDefaultOptions().queries?.refetchOnWindowFocus;
    expect(refetchOnWindowFocus).toBe(false);
  });

  test('retryDelay debe ser la función de backoff exponencial de appConfig', () => {
    // WHY: La función de backoff se toma de appConfig para tener un solo
    //      lugar de configuración. Verificamos que es una función.
    const retryDelay = queryClient.getDefaultOptions().queries?.retryDelay;
    expect(typeof retryDelay).toBe('function');
  });
});

describe('queryClient — Defaults de mutations', () => {
  test('retry en mutations debe ser 0', () => {
    // WHY: No reintentar mutations automáticamente.
    //      Las mutations que fallan por conexión se manejan con
    //      cola offline via MMKV (inventory sync, sales drafts).
    //      Reintentar mutations podría duplicar ventas/ajustes.
    const retry = queryClient.getDefaultOptions().mutations?.retry;
    expect(retry).toBe(0);
  });
});
