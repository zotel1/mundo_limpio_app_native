/**
 * WHAT: Barrel file que re-exporta los componentes de products/presentation.
 * WHY: Single entry point — los consumidores importan de
 *      '@features/products/presentation/components' sin importar archivos individuales.
 * BENEFITS: Refactors internos sin romper imports. API pública estable.
 *
 * PR 2.6 — Components barrel.
 */
export { SearchBar } from './SearchBar';
export { SwipeableProductItem } from './SwipeableProductItem';
