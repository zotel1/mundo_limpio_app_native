/**
 * WHAT: Barrel file que re-exporta las pantallas de products/presentation.
 * WHY: Single entry point — los consumidores importan de
 *      '@features/products/presentation/screens' sin importar archivos individuales.
 * BENEFITS: Refactors internos sin romper imports. API pública estable.
 *
 * PR 2.7 — Screens barrel.
 * PR 2.8 — Added ProductDetailScreen export.
 * PR 2.9 — Added ProductFormScreen export.
 */
export { ProductsListScreen } from './ProductsListScreen';
export { ProductDetailScreen } from './ProductDetailScreen';
export { ProductFormScreen } from './ProductFormScreen';
