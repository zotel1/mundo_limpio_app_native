/**
 * WHAT: Barrel file que re-exporta las pantallas de products/presentation.
 * WHY: Single entry point — los consumidores importan de
 *      '@features/products/presentation/screens' sin importar archivos individuales.
 * BENEFITS: Refactors internos sin romper imports. API pública estable.
 *
 * PR 2.7 — Screens barrel.
 */
export { ProductsListScreen } from './ProductsListScreen';
