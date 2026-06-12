/**
 * WHAT: Tests unitarios para appConfig — configuración centralizada de la aplicación.
 * WHY: TDD RED — los tests definen el contrato de configuración antes de implementar.
 *      Un solo lugar de verdad para URLs, timeouts, staleTimes y paginación.
 * BENEFITS: Cobertura desde el día 1, confianza en la configuración base de la app.
 *           Sin hardcodeo disperso, fácil cambiar entre entornos.
 *
 * TDD: RED — test escrito antes que la implementación.
 */
import { appConfig } from '@core/config/appConfig';

describe('appConfig — api', () => {
  test('baseUrl debe tener el valor por defecto correcto', () => {
    // Arrange & Act: la constante se importa directamente
    // Assert: valor por defecto apunta al backend de producción
    expect(appConfig.api.baseUrl).toBe('https://mundo-limpio-backend.onrender.com');
  });

  test('healthUrl debe apuntar al endpoint de health de Spring Boot Actuator', () => {
    expect(appConfig.api.healthUrl).toBe(
      'https://mundo-limpio-backend.onrender.com/actuator/health',
    );
  });

  test('timeout HTTP debe ser 30000ms (30s) por defecto', () => {
    expect(appConfig.api.timeout).toBe(30000);
  });
});

describe('appConfig — query (TanStack Query)', () => {
  test('staleTimes.products debe ser 5 minutos en milisegundos (300000)', () => {
    // WHY: 5 minutos — los productos no cambian tan seguido.
    //       Igual TTL que Drift en Flutter.
    expect(appConfig.query.staleTimes.products).toBe(300000);
  });

  test('staleTimes.batches debe ser 5 minutos en milisegundos (300000)', () => {
    expect(appConfig.query.staleTimes.batches).toBe(300000);
  });

  test('staleTimes.inventory debe ser 2 minutos en milisegundos (120000)', () => {
    // WHY: 2 minutos — el stock puede cambiar seguido con ventas.
    expect(appConfig.query.staleTimes.inventory).toBe(120000);
  });

  test('staleTimes.sales debe ser 1 minuto en milisegundos (60000)', () => {
    expect(appConfig.query.staleTimes.sales).toBe(60000);
  });

  test('staleTimes.receipts debe ser 2 minutos en milisegundos (120000)', () => {
    expect(appConfig.query.staleTimes.receipts).toBe(120000);
  });

  test('staleTimes.users debe ser 10 minutos en milisegundos (600000)', () => {
    // WHY: 10 minutos — los roles y usuarios no cambian frecuentemente.
    expect(appConfig.query.staleTimes.users).toBe(600000);
  });

  test('staleTimes.backups debe ser 10 minutos en milisegundos (600000)', () => {
    expect(appConfig.query.staleTimes.backups).toBe(600000);
  });

  test('staleTimes.bulkProducts debe ser 5 minutos en milisegundos (300000)', () => {
    expect(appConfig.query.staleTimes.bulkProducts).toBe(300000);
  });

  test('staleTimes.productionBatches debe ser 5 minutos en milisegundos (300000)', () => {
    expect(appConfig.query.staleTimes.productionBatches).toBe(300000);
  });

  test('gcTime debe ser 30 minutos en milisegundos (1800000)', () => {
    expect(appConfig.query.gcTime).toBe(1800000);
  });

  test('retry debe tener 3 reintentos configurados', () => {
    expect(appConfig.query.retry).toBe(3);
  });

  // TRIANGULATE: retryDelay tiene lógica de backoff exponencial.
  // Se requieren múltiples casos de prueba para forzar el comportamiento real.
  describe('retryDelay — backoff exponencial con cap en 30s', () => {
    test('attempt 0 debe devolver 1000ms (2^0 * 1000ms = 1s)', () => {
      expect(appConfig.query.retryDelay(0)).toBe(1000);
    });

    test('attempt 1 debe devolver 2000ms (primer reintento: 2s)', () => {
      expect(appConfig.query.retryDelay(1)).toBe(2000);
    });

    test('attempt 2 debe devolver 4000ms (segundo reintento: 4s)', () => {
      expect(appConfig.query.retryDelay(2)).toBe(4000);
    });

    test('attempt 3 debe devolver 8000ms (tercer reintento: 8s)', () => {
      expect(appConfig.query.retryDelay(3)).toBe(8000);
    });

    test('attempt 5 debe estar capeado a 30000ms máximo', () => {
      // 2^5 * 1000 = 32000 > 30000 → debe devolver 30000
      expect(appConfig.query.retryDelay(5)).toBe(30000);
    });
  });
});

describe('appConfig — pagination', () => {
  test('defaultPageSize debe ser 20 por defecto', () => {
    expect(appConfig.pagination.defaultPageSize).toBe(20);
  });
});
