/**
 * Composition Root — Instancias de repositorios, servicios y adaptadores.
 *
 * WHAT: Punto central donde se crean y conectan todas las dependencias concretas
 *       (repositorios, adaptadores, servicios) siguiendo el patrón de inyección
 *       de dependencias manual.
 * WHY: La Composition Root es el ÚNICO lugar donde se instancian clases concretas.
 *      El resto de la app depende de interfaces (ports), no de implementaciones.
 *      Esto permite cambiar implementaciones sin tocar la lógica de negocio.
 * BENEFITS: Desacoplamiento total. Testeable (inyectar mocks en tests).
 *           Un solo lugar para entender cómo se conecta toda la app.
 *
 * USO (Fase 1+): Cada feature expone una factory `create{Feature}Module()` que
 * recibe las dependencias de core (apiClient, tokenStorage, etc.) y retorna
 * sus repositorios/adaptadores listos para usar.
 *
 * Ejemplo (Fase 1):
 *   import {createAuthModule} from '@features/auth';
 *   import {apiClient} from '@core/http/apiClient';
 *   import {tokenStorage} from '@core/storage/tokenStorage';
 *
 *   const authModule = createAuthModule({apiClient, tokenStorage});
 *   export const {authRepository} = authModule;
 *
 * Fase 0 — Scaffold: archivo vacío. Se completa en Fase 1.
 */
export {};
