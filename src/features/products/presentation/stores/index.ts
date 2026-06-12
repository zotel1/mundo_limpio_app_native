/**
 * Stores — Barrel de stores Zustand para la feature products.
 */

export {
  useProductStore,
  selectSearchQuery,
  selectSelectedProductId,
  selectIsDeleteDialogOpen,
  selectProductToDelete,
  selectFormMode,
  selectEditingProductId,
  selectShowAll,
} from './productStore';
export type { FormMode } from './productStore';
