/**
 * Presentation — Capa de UI y estado para products.
 *
 * WHAT: Componentes React Native, stores (Zustand), hooks, y pantallas
 *       para la feature de productos.
 * WHY: Separar UI de la lógica de negocio permite testear la UI de forma aislada
 *      y cambiar el framework de UI sin reescribir el dominio.
 * BENEFITS: Componentes enfocados en renderizado. Lógica de negocio delegada a
 *           use cases. Estado manejado por stores con contratos claros.
 *
 * REGLA: presentation/ NO importa directamente de infrastructure/.
 *        Usa hooks/stores que reciben repositorios por DI.
 *        La conexión se hace en la Composition Root (features/index.ts).
 */

// Stores — Zustand (estado de UI de productos)
export {
  useProductStore,
  selectSearchQuery,
  selectSelectedProductId,
  selectIsDeleteDialogOpen,
  selectProductToDelete,
  selectFormMode,
  selectEditingProductId,
} from './stores';
export type { FormMode } from './stores';

// Hooks — TanStack Query + Store (orquestación de productos)
export { useProducts } from './hooks';
export type { UseProductsReturn } from './hooks';

// Components — Piezas de UI reutilizables (SearchBar, SwipeableProductItem)
export { SearchBar, SwipeableProductItem } from './components';
