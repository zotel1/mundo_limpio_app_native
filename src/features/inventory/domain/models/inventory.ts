// WHAT: Entidad de dominio que representa el inventario de un producto
// WHY: Single source of truth para datos del inventario.
//      Capa domain: NO depende de React, RN, Axios, Zustand ni TanStack.
// BENEFITS: Tipo inmutable, serializable, fácil de mockear en tests

export interface Inventory {
  readonly productId: number;
  readonly productName: string;
  readonly currentStock: number;
  readonly minStockThreshold: number;
}

// WHAT: Factory para crear Inventory desde parámetros tipados
// WHY: Centraliza la lógica de creación — si el backend cambia un campo,
//      solo se actualiza este factory.
// BENEFITS: Validación implícita vía TypeScript. Un solo punto de construcción.
export function createInventory(params: {
  productId: number;
  productName: string;
  currentStock: number;
  minStockThreshold: number;
}): Inventory {
  return {
    productId: params.productId,
    productName: params.productName,
    currentStock: params.currentStock,
    minStockThreshold: params.minStockThreshold,
  };
}
