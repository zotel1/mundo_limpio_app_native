export { useInventoryStore, selectSelectedInventoryId, selectIsAdjustDialogOpen, selectAdjustDialogProductId } from './stores/inventoryStore';
export { useInventory } from './hooks/useInventory';
export type { UseInventoryReturn } from './hooks/useInventory';

// ──── Components ────
export { WarningBadge } from './components/WarningBadge';
export { StockIndicator } from './components/StockIndicator';
export { AdjustDialog, adjustFormSchema } from './components/AdjustDialog';
export type { AdjustFormData } from './components/AdjustDialog';

// ──── Screens ────
export { InventoryListScreen } from './screens/InventoryListScreen';
export { InventoryDetailScreen } from './screens/InventoryDetailScreen';
