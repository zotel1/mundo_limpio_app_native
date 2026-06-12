/**
 * WHAT: Barrel file que re-exporta todos los componentes compartidos de core.
 * WHY: Single entry point — los consumidores importan de '@core/components'
 *      en lugar de importar cada archivo individual.
 * BENEFITS: Refactors internos sin romper imports. API pública estable.
 */
export { BrandedAppBar } from './BrandedAppBar';
export { ErrorBanner } from './ErrorBanner';
export { LoadingIndicator } from './LoadingIndicator';
