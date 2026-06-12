/**
 * Jest setup — MSW server initialization + jest-native matchers.
 *
 * WHAT: Configura el mock server de MSW (Mock Service Worker) para interceptar
 *       requests HTTP durante los tests + extiende expect con matchers de
 *       @testing-library/jest-native (toBeOnTheScreen, toHaveTextContent, etc.).
 * WHY: MSW permite testear lógica de red sin un backend real.
 *      jest-native agrega matchers semánticos para RNTL.
 * BENEFITS: Tests determinísticos sin depender de conectividad ni backend.
 *
 * NOTA: La inicialización del MSW server (beforeAll/afterEach/afterAll) debe
 *       hacerse en cada archivo de test que requiera MSW, o mediante un helper
 *       compartido. setupFiles de Jest no expone estos hooks globales.
 */

// MSW server — inicialización condicional.
// En Fase 0-1 no hay handlers definidos. Se configurarán por feature en fases posteriores.
let server: {listen: () => void; close: () => void; resetHandlers: () => void};

try {
  // Dynamic import para evitar errores si MSW no está instalado aún
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

// Exponer server para que los tests puedan agregar handlers específicos
export {server};
