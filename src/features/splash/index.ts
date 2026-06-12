/**
 * Splash feature — barril raíz.
 *
 * WHAT: Re-exporta todos los símbolos públicos de la feature splash.
 * WHY: Punto de entrada único para consumidores externos (App.tsx,
 *      composition root, otras features).
 */
export { SplashScreen, type SplashScreenDeps } from './presentation';
export { SplashRepositoryAdapter } from './infrastructure';
export type { SplashRepository, SplashState, SplashStatus } from './domain';
