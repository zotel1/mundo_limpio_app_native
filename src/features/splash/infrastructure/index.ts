/**
 * Splash infrastructure — implementaciones concretas de los puertos del dominio.
 *
 * WHAT: Adaptadores que implementan los contratos definidos en domain/ports/.
 *       Acá vive HTTP, storage, y cualquier dependencia externa.
 * WHY: Separación de responsabilidades — el dominio no sabe de Axios.
 */
export { SplashRepositoryAdapter } from './adapters/splashRepositoryAdapter';
