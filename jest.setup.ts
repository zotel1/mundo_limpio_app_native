/**
 * Jest setup — MSW server initialization.
 *
 * WHAT: Configura el mock server de MSW (Mock Service Worker) para interceptar
 *       requests HTTP durante los tests. También configura React Native Testing
 *       Library con matchers específicos de RN.
 * WHY: MSW permite testear lógica de red sin un backend real. RNTL matchers
 *      (toBeOnTheScreen, toHaveTextContent, etc.) mejoran la legibilidad de los tests.
 * BENEFITS: Tests determinísticos sin depender de conectividad ni backend.
 *
 * NOTA: Las factories y helpers de render (renderWithProviders) se implementarán
 *       en Fase 1 cuando existan los providers reales (QueryClient, Navigation, Theme).
 *       En Fase 0 solo configuramos el esqueleto.
 */
import '@testing-library/jest-native/extend-expect';

// MSW server — inicialización condicional.
// En Fase 0 no hay handlers definidos. Se configurarán por feature en fases posteriores.
// La referencia al server queda disponible para que cada __tests__/helpers/ lo importe.
let server: {listen: () => void; close: () => void; resetHandlers: () => void};

try {
  // Dynamic import para evitar errores si MSW no está instalado aún (Fase 0)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {setupServer} = require('msw/node');
  server = setupServer();
} catch {
  // MSW no disponible — los tests que requieran MSW fallarán explícitamente
  server = {
    listen: () => {},
    close: () => {},
    resetHandlers: () => {},
  };
}

// Inicializar MSW server antes de todos los tests
beforeAll(() => server.listen({onUnhandledRequest: 'warn'}));

// Resetear handlers entre tests para evitar contaminación entre suites
afterEach(() => server.resetHandlers());

// Cerrar server al finalizar
afterAll(() => server.close());

// Exponer server para que los tests puedan agregar handlers específicos
export {server};
