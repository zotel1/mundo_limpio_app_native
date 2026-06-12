/**
 * Theme — Barrel de design tokens.
 *
 * WHAT: Re-exporta todos los design tokens del módulo theme.
 *       Importar desde '@core/theme' da acceso a colors, typography, spacing
 *       y borderRadius en un solo import.
 * WHY: API unificada — el consumidor no necesita saber la estructura interna
 *      de archivos del módulo theme.
 * BENEFITS: Facilidad de uso. Si se reorganizan los archivos internos, los
 *           imports de los consumidores no cambian.
 */
export { colors } from './colors';
export { typography } from './typography';
export { spacing, borderRadius } from './spacing';
