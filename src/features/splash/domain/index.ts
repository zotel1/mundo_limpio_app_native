/**
 * Splash domain — modelos y puertos de la feature splash.
 *
 * WHAT: Capa de dominio pura: tipos, interfaces, y modelos.
 *       Sin dependencias de frameworks (React Native, Axios, etc.).
 * WHY: Clean Architecture — el dominio define contratos abstractos
 *      que la infraestructura implementa.
 */
export type { SplashState, SplashStatus } from './models/splashState';
export type { SplashRepository } from './ports/splashRepository';
